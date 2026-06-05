document.addEventListener('DOMContentLoaded', () => {
  initProductGallery();
  initProductLightbox();
  initProductZoom();
  initProductOptions();
  initProductQty();
  initProductTabs();
  initRelatedProductsSwiper();
  initVariantImageSync();
  initVariantLoadingOverlay();
});

function initVariantImageSync() {
  document.addEventListener('livewire:init', () => {
    Livewire.on('product-image-changed', ({ image }) => {
      if (!image) return;
      const mainImage = document.getElementById('productMainImage');
      if (mainImage) {
        mainImage.src = image;
        mainImage.dataset.zoom = image;
      }
    });
  });
}

function initVariantLoadingOverlay() {
  const grid = document.querySelector('.product-top-grid');
  const overlay = document.getElementById('productVariantOverlay');
  if (!grid || !overlay) {
    return;
  }

  let pending = 0;

  const show = () => {
    pending += 1;
    grid.classList.add('is-variant-loading');
    overlay.setAttribute('aria-hidden', 'false');
  };

  const hide = () => {
    pending = Math.max(0, pending - 1);
    if (pending === 0) {
      grid.classList.remove('is-variant-loading');
      overlay.setAttribute('aria-hidden', 'true');
    }
  };

  const isVariantAction = (action) => /selectAttribute|selectVariant/.test(action);

  grid.addEventListener('click', (event) => {
    const button = event.target.closest('button[wire\\:click]');
    if (!button || !grid.contains(button)) {
      return;
    }

    const action = button.getAttribute('wire:click') || '';
    if (isVariantAction(action)) {
      show();
    }
  });

  const bindLivewireHooks = () => {
    const variantWireId = grid.querySelector('[wire\\:key*="variant-selector-"]')
      ?.closest('[wire\\:id]')
      ?.getAttribute('wire:id');

    Livewire.hook('commit', ({ component, respond, succeed, fail }) => {
      const isVariantComponent = variantWireId
        ? component.id === variantWireId
        : component?.name === 'product.variant-selector';

      if (!isVariantComponent) {
        return;
      }

      respond(() => {
        succeed(hide);
        fail(hide);
      });
    });
  };

  if (window.Livewire) {
    bindLivewireHooks();
  } else {
    document.addEventListener('livewire:init', bindLivewireHooks, { once: true });
  }
}

let productGalleryIndex = 0;
let lightboxSwiper = null;

function getGalleryImages() {
  return Array.from(document.querySelectorAll('.productGalleryThumbs .swiper-slide img')).map((img) => ({
    src: img.dataset.zoom || img.src,
    alt: img.alt,
  }));
}

function setMainGalleryImage(index) {
  const images = getGalleryImages();
  const mainImage = document.getElementById('productMainImage');
  const thumbsEl = document.querySelector('.productGalleryThumbs');
  if (!mainImage || !images[index]) return;

  productGalleryIndex = index;
  mainImage.src = images[index].src;
  mainImage.dataset.zoom = images[index].src;
  mainImage.alt = images[index].alt;

  thumbsEl?.querySelectorAll('.swiper-slide').forEach((slide, i) => {
    slide.classList.toggle('swiper-slide-thumb-active', i === index);
  });
}

function initProductGallery() {
  const thumbsEl = document.querySelector('.productGalleryThumbs');
  if (!thumbsEl || typeof Swiper === 'undefined') return;

  new Swiper(thumbsEl, {
    direction: 'horizontal',
    spaceBetween: 10,
    slidesPerView: 'auto',
    freeMode: true,
    watchOverflow: true,
  });

  thumbsEl.querySelectorAll('.swiper-slide').forEach((slide, index) => {
    slide.addEventListener('click', () => {
      setMainGalleryImage(index);
      if (lightboxSwiper) lightboxSwiper.slideTo(index, 0);
    });
  });

  setMainGalleryImage(0);
}

function initProductLightbox() {
  const modal = document.getElementById('productZoomModal');
  const stage = modal?.querySelector('.productLightboxSwiper');
  if (!modal || !stage || typeof Swiper === 'undefined') return;

  lightboxSwiper = new Swiper(stage, {
    slidesPerView: 1,
    spaceBetween: 0,
    speed: 300,
    loop: false,
    navigation: {
      nextEl: modal.querySelector('[data-lightbox-next]'),
      prevEl: modal.querySelector('[data-lightbox-prev]'),
    },
    pagination: {
      el: modal.querySelector('.product-lightbox__pagination'),
      clickable: true,
    },
    keyboard: {
      enabled: true,
      onlyInViewport: false,
    },
    on: {
      slideChange(swiper) {
        if (!modal.classList.contains('is-open')) return;
        setMainGalleryImage(swiper.activeIndex);
      },
    },
  });

  const openLightbox = (index = productGalleryIndex) => {
    setMainGalleryImage(index);
    lightboxSwiper.slideTo(index, 0);
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  document.querySelectorAll('[data-open-lightbox]').forEach((node) => {
    node.addEventListener('click', (event) => {
      if (window.innerWidth >= 1024 && event.detail === 0) {
        // allow lens drag without opening on every tiny movement
      }
      openLightbox(productGalleryIndex);
    });

    node.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openLightbox(productGalleryIndex);
      }
    });
  });

  modal.querySelector('.product-lightbox__close')?.addEventListener('click', closeLightbox);
  modal.addEventListener('click', (event) => {
    if (event.target === modal) closeLightbox();
  });

  document.addEventListener('keydown', (event) => {
    if (!modal.classList.contains('is-open')) return;
    if (event.key === 'Escape') closeLightbox();
  });

  window.openProductLightbox = openLightbox;
  window.closeProductLightbox = closeLightbox;
}

function initProductZoom() {
  const zoomRoot = document.querySelector('.product-zoom');
  const stage = document.querySelector('.product-zoom__stage');
  const lens = document.querySelector('.product-zoom__lens');
  const result = document.querySelector('.product-zoom__result');
  const mainImage = document.getElementById('productMainImage');

  if (!zoomRoot || !stage || !lens || !result || !mainImage) return;

  const zoomLevel = 2.2;
  let dragStart = 0;

  stage.addEventListener('mousedown', () => {
    dragStart = Date.now();
  });

  stage.addEventListener('click', (event) => {
    if (window.innerWidth < 1024) return;
    if (Date.now() - dragStart > 250) {
      event.stopImmediatePropagation();
    }
  }, true);

  const updateZoom = (event) => {
    if (window.innerWidth < 1024) return;
    if (document.getElementById('productZoomModal')?.classList.contains('is-open')) return;

    const rect = stage.getBoundingClientRect();
    let x = event.clientX - rect.left;
    let y = event.clientY - rect.top;

    if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
      zoomRoot.classList.remove('is-active');
      return;
    }

    const lensW = lens.offsetWidth;
    const lensH = lens.offsetHeight;
    x = Math.max(lensW / 2, Math.min(rect.width - lensW / 2, x));
    y = Math.max(lensH / 2, Math.min(rect.height - lensH / 2, y));

    lens.style.left = `${x - lensW / 2}px`;
    lens.style.top = `${y - lensH / 2}px`;

    const bgW = rect.width * zoomLevel;
    const bgH = rect.height * zoomLevel;
    const bgX = (x / rect.width) * bgW - result.offsetWidth / 2;
    const bgY = (y / rect.height) * bgH - result.offsetHeight / 2;

    result.style.backgroundImage = `url('${mainImage.dataset.zoom || mainImage.src}')`;
    result.style.backgroundSize = `${bgW}px ${bgH}px`;
    result.style.backgroundPosition = `-${bgX}px -${bgY}px`;
    zoomRoot.classList.add('is-active');
  };

  stage.addEventListener('mousemove', updateZoom);
  stage.addEventListener('mouseleave', () => zoomRoot.classList.remove('is-active'));
}

function initProductOptions() {
  document.querySelectorAll('[data-color-option]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const colorName = btn.getAttribute('aria-label') || '';
      document.querySelectorAll('[data-color-option]').forEach((item) => {
        item.classList.toggle('is-active', item.getAttribute('aria-label') === colorName);
      });
    });
  });

  document.querySelectorAll('[data-storage-option]').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-storage-option]').forEach((item) => item.classList.remove('is-active'));
      btn.classList.add('is-active');
      const price = btn.dataset.price;
      if (!price) return;
      const priceHtml = `${price} <span>تومان</span>`;
      const priceEl = document.getElementById('productPrice');
      if (priceEl) priceEl.innerHTML = priceHtml;
      const mobilePriceEl = document.getElementById('productMobilePrice');
      if (mobilePriceEl) mobilePriceEl.innerHTML = priceHtml;
    });
  });

  document.querySelectorAll('[data-warranty-option]').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-warranty-option]').forEach((item) => item.classList.remove('is-active'));
      btn.classList.add('is-active');
      const warrantyLabel = document.getElementById('selectedWarrantyLabel');
      const label = btn.getAttribute('aria-label') || btn.textContent.trim();
      if (warrantyLabel && label) {
        warrantyLabel.textContent = label.replace(/^گارانتی\s*/, '');
      }
    });
  });

  document.querySelectorAll('[data-favorite-btn]').forEach((btn) => {
    btn.addEventListener('click', () => btn.classList.toggle('is-active'));
  });
}

function initProductQty() {
  const input = document.getElementById('productQty');
  if (!input) return;

  document.querySelector('[data-qty-minus]')?.addEventListener('click', () => {
    input.value = Math.max(1, Number(input.value) - 1);
  });

  document.querySelector('[data-qty-plus]')?.addEventListener('click', () => {
    input.value = Number(input.value) + 1;
  });
}

function initProductTabs() {
  const tabs = document.querySelectorAll('[data-product-tab]');
  const panels = document.querySelectorAll('[data-product-panel]');

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.productTab;
      tabs.forEach((item) => item.classList.toggle('is-active', item === tab));
      panels.forEach((panel) => {
        panel.classList.toggle('is-active', panel.dataset.productPanel === target);
      });
    });
  });

  document.querySelector('.product-info__more')?.addEventListener('click', (event) => {
    event.preventDefault();
    const specsTab = document.querySelector('[data-product-tab="specs"]');
    specsTab?.click();
    document.getElementById('specs')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

function initRelatedProductsSwiper() {
  const el = document.querySelector('.relatedProductsSwiper');
  if (!el || typeof Swiper === 'undefined') return;

  const section = el.closest('section');
  new Swiper(el, {
    slidesPerView: 'auto',
    spaceBetween: 12,
    grabCursor: true,
    navigation: {
      nextEl: section?.querySelector('[data-related-next]'),
      prevEl: section?.querySelector('[data-related-prev]'),
    },
    breakpoints: {
      768: { spaceBetween: 16 },
    },
  });
}
