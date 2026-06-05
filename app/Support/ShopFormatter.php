<?php

namespace App\Support;

use App\Models\Product;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ShopFormatter
{
    public static function money(int $amount): string
    {
        return number_format($amount).' تومان';
    }

    public static function discountPercent(Product $product): ?int
    {
        if (! $product->hasDiscount() || $product->price <= 0) {
            return null;
        }

        return (int) round((($product->price - $product->sale_price) / $product->price) * 100);
    }

    public static function productImage(?Product $product, string $fallback = 'shop/images/products/clothing.svg'): string
    {
        if (! $product) {
            return asset($fallback);
        }

        $image = $product->relationLoaded('images')
            ? ($product->images->firstWhere('is_primary', true) ?? $product->images->first())
            : null;

        if (! $image && $product->images()->exists()) {
            $image = $product->images()->where('is_primary', true)->first()
                ?? $product->images()->orderBy('position')->first();
        }

        if ($image?->image) {
            $path = $image->image;

            return Str::startsWith($path, ['http://', 'https://', '/'])
                ? $path
                : asset('storage/'.$path);
        }

        return asset($fallback);
    }

    public static function categoryImage(?string $path): string
    {
        if (! $path) {
            return asset('shop/images/categories/code.svg');
        }

        return Str::startsWith($path, ['http://', 'https://'])
            ? $path
            : asset('storage/'.$path);
    }
}
