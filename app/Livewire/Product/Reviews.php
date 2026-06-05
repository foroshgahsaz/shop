<?php

namespace App\Livewire\Product;

use App\Models\Product;
use App\Models\ProductReview;
use Livewire\Component;
use Livewire\WithPagination;

class Reviews extends Component
{
    use WithPagination;

    public Product $product;

    public int $rating = 5;

    public string $comment = '';

    public function submitReview(): void
    {
        if (! auth()->check()) {
            $this->redirect(route('login'), navigate: true);

            return;
        }

        $this->validate([
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'comment' => ['nullable', 'string', 'max:2000'],
        ]);

        ProductReview::updateOrCreate(
            ['user_id' => auth()->id(), 'product_id' => $this->product->id],
            ['rating' => $this->rating, 'comment' => $this->comment, 'is_approved' => false]
        );

        $this->reset(['comment']);
        $this->rating = 5;
        session()->flash('review_success', 'نظر شما ثبت شد و پس از تایید نمایش داده می‌شود.');
    }

    public function render()
    {
        $reviews = $this->product->reviews()
            ->where('is_approved', true)
            ->with('user:id,name')
            ->latest()
            ->paginate(5);

        return view('livewire.product.reviews', compact('reviews'));
    }
}
