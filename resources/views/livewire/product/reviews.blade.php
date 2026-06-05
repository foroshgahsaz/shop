<div class="mt-8">
    <h3 class="text-lg font-semibold mb-4">نظرات</h3>

    @if (session('review_success'))
        <div class="mb-3 p-2 bg-green-100 text-green-800 rounded text-sm">{{ session('review_success') }}</div>
    @endif

    @auth
        <form wire:submit="submitReview" class="mb-6 space-y-3 border p-4 rounded">
            <div>
                <label class="block mb-1 text-sm">امتیاز</label>
                <select wire:model="rating" class="border rounded px-2 py-1">
                    @for ($i = 5; $i >= 1; $i--)
                        <option value="{{ $i }}">{{ $i }} ستاره</option>
                    @endfor
                </select>
            </div>
            <textarea wire:model="comment" placeholder="نظر شما..." class="w-full border rounded px-3 py-2" rows="3"></textarea>
            @error('rating') <span class="text-red-600 text-sm">{{ $message }}</span> @enderror
            <button type="submit" class="bg-[#6c7fd8] text-white px-4 py-2 rounded text-sm">ثبت نظر</button>
        </form>
    @else
        <p class="text-sm mb-4"><a href="{{ route('login') }}" class="text-[#6c7fd8]">وارد شوید</a> تا نظر بدهید.</p>
    @endauth

    @forelse ($reviews as $review)
        <div class="border-b py-3">
            <p class="font-semibold text-sm">{{ $review->user->name }} — {{ $review->rating }}/5</p>
            <p class="text-gray-600 text-sm mt-1">{{ $review->comment }}</p>
        </div>
    @empty
        <p class="text-sm text-gray-500">هنوز نظری ثبت نشده.</p>
    @endforelse

    <div class="mt-4">{{ $reviews->links() }}</div>
</div>
