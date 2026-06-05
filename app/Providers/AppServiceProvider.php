<?php

namespace App\Providers;

use App\Contracts\SmsSender;
use App\Models\Brand;
use App\Models\Category;
use App\Models\HomeSlider;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Post;
use App\Models\Product;
use App\Models\ShippingMethod;
use App\Models\UserAddress;
use App\Models\User;
use App\Observers\BrandObserver;
use App\Observers\CategoryObserver;
use App\Observers\HomeSliderObserver;
use App\Observers\PostObserver;
use App\Observers\ProductObserver;
use App\Observers\ShippingMethodObserver;
use App\Policies\OrderPolicy;
use App\Policies\PaymentPolicy;
use App\Policies\UserAddressPolicy;
use App\Services\Cache\ShopCacheService;
use App\Services\Settings\SettingsService;
use App\Filament\Support\CrudSuccessNotification;
use App\Services\Sms\KavenegarSmsSender;
use App\Services\Sms\LogSmsSender;
use Filament\Forms\Components\FileUpload;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(SmsSender::class, function () {
            $kavenegar = app(SettingsService::class)->kavenegar();

            if (($kavenegar['enabled'] ?? false) && ! empty($kavenegar['api_key'])) {
                return new KavenegarSmsSender;
            }

            return match (config('sms.driver')) {
                'kavenegar' => new KavenegarSmsSender,
                default => new LogSmsSender,
            };
        });
    }

    public function boot(): void
    {
        if (! $this->app->runningInConsole() && request()->hasHeader('Host')) {
            URL::forceRootUrl(rtrim(request()->root(), '/'));
        }

        Product::observe(ProductObserver::class);
        Category::observe(CategoryObserver::class);
        Brand::observe(BrandObserver::class);
        Post::observe(PostObserver::class);
        HomeSlider::observe(HomeSliderObserver::class);
        ShippingMethod::observe(ShippingMethodObserver::class);

        \Illuminate\Support\Facades\View::composer([
            'shop.partials.header',
            'shop.partials.overlays',
            'shop.partials.mobile-menu',
        ], function ($view) {
            $cache = app(ShopCacheService::class);
            $view->with('searchCategories', $cache->categories());
            $view->with('navCategories', $cache->navCategories());
        });

        Gate::policy(Order::class, OrderPolicy::class);
        Gate::policy(Payment::class, PaymentPolicy::class);
        Gate::policy(UserAddress::class, UserAddressPolicy::class);

        \Illuminate\Support\Facades\Route::bind('author', function (string $value) {
            return User::query()
                ->where('slug', $value)
                ->where('is_author', true)
                ->firstOrFail();
        });

        \Filament\Tables\Actions\CreateAction::configureUsing(function ($action): void {
            $action
                ->label('افزودن')
                ->successNotification(CrudSuccessNotification::created());
        });
        \Filament\Tables\Actions\EditAction::configureUsing(function ($action): void {
            $action
                ->label('ویرایش')
                ->successNotification(CrudSuccessNotification::saved());
        });
        \Filament\Tables\Actions\DeleteAction::configureUsing(function ($action): void {
            $action
                ->label('حذف')
                ->successNotification(CrudSuccessNotification::deleted());
        });
        \Filament\Tables\Actions\ViewAction::configureUsing(fn ($action) => $action->label('مشاهده'));
        \Filament\Tables\Actions\DeleteBulkAction::configureUsing(function ($action): void {
            $action
                ->label('حذف انتخاب‌شده‌ها')
                ->successNotification(CrudSuccessNotification::deleted());
        });
        \Filament\Actions\CreateAction::configureUsing(function ($action): void {
            $action
                ->label('افزودن')
                ->successNotification(CrudSuccessNotification::created());
        });
        \Filament\Actions\EditAction::configureUsing(function ($action): void {
            $action
                ->label('ویرایش')
                ->successNotification(CrudSuccessNotification::saved());
        });
        \Filament\Actions\DeleteAction::configureUsing(function ($action): void {
            $action
                ->label('حذف')
                ->successNotification(CrudSuccessNotification::deleted());
        });

        FileUpload::configureUsing(function (FileUpload $component): void {
            $component
                ->fetchFileInformation(false)
                ->imagePreviewHeight('150')
                ->loadingIndicatorPosition('center');
        });
    }
}
