(function () {
  const STORAGE_KEY = 'booktokCart';

  function emitCartUpdated(cart) {
    try {
      var count = getCartCount(cart);
      document.dispatchEvent(
        new CustomEvent('booktok:cart-updated', {
          detail: {
            count: count,
            cart: cart,
          },
        })
      );
    } catch (e) {
      // ignore
    }
  }

  function readCart() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  function saveCart(cart) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {
      // ignore storage errors in this prototype
    }
  }

	function commitCart(cart) {
		saveCart(cart);
		updateCartBadge(cart);
		emitCartUpdated(cart);
	}

  function clearCart() {
    var empty = [];
		commitCart(empty);
  }

  function findItemIndex(cart, id) {
    return cart.findIndex(function (item) {
      return String(item.id) === String(id);
    });
  }

  function getCartCount(cart) {
    return Array.isArray(cart) ? cart.length : 0;
  }

  function formatPrice(value) {
    const number = isNaN(value) ? 0 : Number(value);
    return '$' + number.toFixed(2);
  }

  function normalizeImagePath(path) {
    if (!path) return '';

    if (path.indexOf('../assets/') === 0) return path;

    if (path.indexOf('frontend/assets/') === 0) {
      return '../' + path.substring('frontend/'.length);
    }

    if (path.indexOf('/frontend/assets/') === 0) {
      return '../' + path.substring('/frontend/'.length);
    }

    var idx = path.indexOf('assets/');
    if (idx >= 0) {
      return '../' + path.slice(idx);
    }

    return path;
  }

  function updateCartBadge(cart) {
    var badges = document.querySelectorAll('.cart-count-badge');
    if (!badges.length) return;

    var count = getCartCount(cart);

    badges.forEach(function (badge) {
      if (!count) {
        badge.classList.add('d-none');
        return;
      }

      badge.classList.remove('d-none');
      badge.textContent = count > 9 ? '9+' : String(count);
    });
  }

  function showCartToast(message) {
    var existing = document.getElementById('cartToast');
    if (existing) {
      var textEl = existing.querySelector('.cart-toast-text');
      if (textEl) {
        textEl.textContent = message;
      }
      existing.classList.add('show');
      setTimeout(function () {
        existing.classList.remove('show');
      }, 2200);
      return;
    }

    var toast = document.createElement('div');
    toast.id = 'cartToast';
    toast.className = 'cart-toast';
    toast.innerHTML = '<span class="cart-toast-text"></span>';
    toast.querySelector('.cart-toast-text').textContent = message;
    document.body.appendChild(toast);

    requestAnimationFrame(function () {
      toast.classList.add('show');
    });

    setTimeout(function () {
      toast.classList.remove('show');
    }, 2200);
  }

  function readOrdersSafe() {
    try {
      if (window.BookTokAuth && typeof window.BookTokAuth.readOrders === 'function') {
        var fromApi = window.BookTokAuth.readOrders();
        return Array.isArray(fromApi) ? fromApi : [];
      }
      var raw = window.localStorage.getItem('booktokOrders');
      if (!raw) return [];
      var parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  function isBookAlreadyPurchased(bookId) {
    if (bookId == null) return false;
    var idStr = String(bookId);
    var orders = readOrdersSafe();
    return orders.some(function (order) {
      var items = order && Array.isArray(order.items) ? order.items : [];
      return items.some(function (item) {
        return String(item && item.id) === idStr;
      });
    });
  }

  function addToCartFromDataset(dataset) {
    if (!dataset) return;
    const id = dataset.bookId;
    if (!id) return;

    const title = dataset.bookTitle || 'Untitled';
    const author = dataset.bookAuthor || '';
    const price = parseFloat(dataset.bookPrice || '0') || 0;
    const image = normalizeImagePath(dataset.bookImage || '');

    if (isBookAlreadyPurchased(id)) {
      showCartToast('"' + title + '" is already in your library');
      return;
    }

    var cart = readCart();
    var index = findItemIndex(cart, id);

    if (index === -1) {
      cart.push({
        id: id,
        title: title,
        author: author,
        price: price,
        image: image,
      });
    }

		commitCart(cart);
	showCartToast('Added "' + title + '" to your cart');
  }

  function setupGlobalAddToCartButtons() {
    if (setupGlobalAddToCartButtons.__bound) return;
    setupGlobalAddToCartButtons.__bound = true;

    document.addEventListener('click', function (event) {
      var target = event && event.target ? event.target : null;
      if (!target || !target.closest) return;

      var btn = target.closest('[data-cart-action="add"][data-book-id]');
      if (!btn) return;

      event.preventDefault();
      event.stopPropagation();
      addToCartFromDataset(btn.dataset);
    });
  }

  function renderOrderPageIfPresent() {
    var container = document.getElementById('orderItemsContainer');
    var countLabel = document.getElementById('orderItemsCountLabel');
    var subtotalEl = document.getElementById('orderSubtotal');
    var totalEl = document.getElementById('orderTotal');
    var proceedBtn = document.getElementById('proceedToPaymentBtn');

    if (!container || !subtotalEl || !totalEl) return;

    function rerender() {
      var cart = readCart();
      var count = getCartCount(cart);

      if (countLabel) {
        countLabel.textContent = count
          ? '(' + count + ' item' + (count > 1 ? 's' : '') + ')'
          : '(0 items)';
      }

      var subtotal = 0;

      // Empty cart: render a simple empty state inside the items container
      if (!count) {
        if (proceedBtn) {
          proceedBtn.classList.add('disabled');
          proceedBtn.setAttribute('aria-disabled', 'true');
        }

        container.innerHTML =
          '<div class="order-empty-state">' +
          '  <div class="order-empty-icon mb-3">' +
          '    <i class="bi bi-cart"></i>' +
          '  </div>' +
          '  <h2 class="order-empty-title mb-2">Your Cart is Empty</h2>' +
          '  <p class="order-empty-text mb-4">Looks like you haven&#39;t added any books yet.</p>' +
          '  <a href="catalog.html" class="btn order-empty-btn">Browse Books</a>' +
          '</div>';

        subtotalEl.textContent = formatPrice(0);
        totalEl.textContent = formatPrice(0);
        return;
      }

      // Non-empty cart: render items normally
      container.innerHTML = '';

      cart.forEach(function (item) {
        var priceNumber = isNaN(item.price) ? 0 : Number(item.price);
        subtotal += priceNumber;

        var card = document.createElement('div');
        card.className = 'order-item-card mb-3';
        card.dataset.bookId = item.id;

        var hasImage = !!item.image;
        card.innerHTML =
          '<div class="row g-3 align-items-center">' +
          '  <div class="col-auto">' +
          '    <div class="order-item-cover-wrapper">' +
          (hasImage
            ? '      <img src="' +
              item.image +
              '" alt="' +
              item.title.replace(/"/g, '&quot;') +
              ' cover" class="order-item-cover">'
            : '      <div class="order-item-cover-placeholder"><i class="bi bi-book"></i></div>') +
          '    </div>' +
          '  </div>' +
          '  <div class="col">' +
          '    <div class="d-flex justify-content-between align-items-start mb-1">' +
          '      <div>' +
          '        <h6 class="order-item-title mb-1">' +
          item.title +
          '</h6>' +
          '        <p class="order-item-author text-muted mb-0">' +
          item.author +
          '</p>' +
          '      </div>' +
          '      <div class="order-item-price fw-semibold">' +
          formatPrice(item.price) +
          '</div>' +
          '    </div>' +
          '    <div class="d-flex align-items-center gap-3 mt-2">' +
          '      <button type="button" class="btn btn-link text-danger p-0 order-remove-btn" aria-label="Remove ' +
          item.title.replace(/"/g, '&quot;') +
          ' from order">' +
          '        <i class="bi bi-trash3"></i>' +
          '      </button>' +
          '    </div>' +
          '  </div>' +
          '</div>';

        container.appendChild(card);
      });

      subtotalEl.textContent = formatPrice(subtotal);
      totalEl.textContent = formatPrice(subtotal); // no tax, total equals subtotal

      // attach listeners for remove buttons
      container.querySelectorAll('.order-remove-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var parentCard = btn.closest('.order-item-card');
          if (!parentCard) return;
          var id = parentCard.dataset.bookId;

          var cart = readCart();
          var index = findItemIndex(cart, id);
          if (index === -1) return;

          cart.splice(index, 1);
          commitCart(cart);
          rerender();
        });
      });
    }

    rerender();
  }

  document.addEventListener('DOMContentLoaded', function () {
    var initialCart = readCart();
    updateCartBadge(initialCart);
    setupGlobalAddToCartButtons();
    renderOrderPageIfPresent();
  });

	// Keep cart count in sync across pages/tabs.
	window.addEventListener('storage', function (e) {
		if (!e || e.key !== STORAGE_KEY) return;
		updateCartBadge(readCart());
	});

  // expose minimal API if needed later
  window.BookTokCart = {
    readCart: readCart,
    addFromDataset: addToCartFromDataset,
		getCount: function () {
			return getCartCount(readCart());
		},
    updateBadge: function () {
      updateCartBadge(readCart());
    },
    clear: clearCart,
  };
})();
