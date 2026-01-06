// Payment page behaviors: totals, input formatting, validation, and confirmation

(function () {
	function calculateCartTotal() {
		if (!window.BookTokCart || typeof window.BookTokCart.readCart !== 'function') {
			return 0;
		}
		var cart = window.BookTokCart.readCart();
		return cart.reduce(function (sum, item) {
			return sum + (item.price || 0) * (item.quantity || 0);
		}, 0);
	}

	var total = calculateCartTotal();
	var formattedTotal = '$' + (isNaN(total) ? '0.00' : total.toFixed(2));
	var paymentTotalLabel = document.getElementById('paymentOrderTotal');
	var paymentTotalToPay = document.getElementById('paymentTotalToPay');
	if (paymentTotalLabel) paymentTotalLabel.textContent = formattedTotal;
	if (paymentTotalToPay) paymentTotalToPay.textContent = formattedTotal;

	// Input formatting for card number, expiry, and CVV
	var cardNumberInput = document.getElementById('cardNumber');
	var cardExpiryInput = document.getElementById('cardExpiry');
	var cardCvcInput = document.getElementById('cardCvc');

	if (cardNumberInput) {
		cardNumberInput.addEventListener('input', function () {
			var digits = this.value.replace(/\D/g, '').slice(0, 16);
			var groups = [];
			for (var i = 0; i < digits.length; i += 4) {
				groups.push(digits.slice(i, i + 4));
			}
			this.value = groups.join(' ');
		});
	}

	if (cardExpiryInput) {
		cardExpiryInput.addEventListener('input', function () {
			var digits = this.value.replace(/\D/g, '').slice(0, 4);
			if (digits.length === 0) {
				this.value = '';
				return;
			}
			if (digits.length <= 2) {
				this.value = digits;
				return;
			}
			this.value = digits.slice(0, 2) + '/' + digits.slice(2);
		});
	}

	if (cardCvcInput) {
		cardCvcInput.addEventListener('input', function () {
			var digits = this.value.replace(/\D/g, '').slice(0, 4);
			this.value = digits;
		});
	}

	function triggerBookDownloads(cart) {
		if (!cart || !cart.length) return;
		var seenIds = new Set();
		cart.forEach(function (item) {
			var id = String(item.id);
			if (!id || seenIds.has(id)) return;
			seenIds.add(id);
			// Build a predictable file path per book ID, e.g. book-1.pdf, book-2.pdf, etc.
			// (keeps internal mapping stable)
			var href = '../assets/books/book-' + id + '.pdf';
			// But present a human-friendly file name to the customer based on the book title.
			var title = (item.title || 'Book-' + id).trim();
			var safeTitle = title
				.replace(/[\\/:*?"<>|]+/g, '') // remove characters not allowed in file names
				.replace(/\s+/g, ' ') // collapse whitespace
				.trim();
			if (!safeTitle) {
				safeTitle = 'Book-' + id;
			}
			var downloadName = safeTitle + '.pdf';
			var link = document.createElement('a');
			link.href = href;
			link.download = downloadName;
			link.style.display = 'none';
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
		});
	}

	var form = document.getElementById('paymentForm');
	var confirmBtn = document.getElementById('paymentConfirmBtn');
	var formCard = document.getElementById('paymentFormCard');
	var confirmation = document.getElementById('paymentConfirmation');
	var cardNameInput = document.getElementById('cardName');
	var billingCityInput = document.getElementById('billingCity');

	function validatePaymentForm() {
		var valid = true;

		if (cardNameInput) {
			cardNameInput.setCustomValidity('');
			if (!cardNameInput.value.trim()) {
				cardNameInput.setCustomValidity('Please enter the name on the card.');
				valid = false;
			}
		}

		if (cardNumberInput) {
			cardNumberInput.setCustomValidity('');
			var numberDigits = cardNumberInput.value.replace(/\s/g, '');
			if (!/^\d{16}$/.test(numberDigits)) {
				cardNumberInput.setCustomValidity('Please enter a valid 16-digit card number.');
				valid = false;
			}
		}

		if (cardExpiryInput) {
			cardExpiryInput.setCustomValidity('');
			if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(cardExpiryInput.value)) {
				cardExpiryInput.setCustomValidity('Enter expiry as MM/YY.');
				valid = false;
			}
		}

		if (cardCvcInput) {
			cardCvcInput.setCustomValidity('');
			if (!/^\d{3,4}$/.test(cardCvcInput.value)) {
				cardCvcInput.setCustomValidity('Enter a 3 or 4 digit CVV.');
				valid = false;
			}
		}

		if (billingCityInput) {
			billingCityInput.setCustomValidity('');
			if (!billingCityInput.value.trim()) {
				billingCityInput.setCustomValidity('Please enter your city.');
				valid = false;
			}
		}

		// Let the browser display any validation messages
		if (!form || !form.reportValidity()) {
			return false;
		}
		return valid;
	}

	if (confirmBtn && form && formCard && confirmation) {
		confirmBtn.addEventListener('click', function () {
			if (!validatePaymentForm()) {
				return;
			}

			confirmBtn.disabled = true;
			confirmBtn.classList.add('disabled');
			var originalHtml = confirmBtn.innerHTML;
			confirmBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Processing...';

			// Trigger downloads immediately within the same user gesture
			var cart = window.BookTokCart && typeof window.BookTokCart.readCart === 'function'
				? window.BookTokCart.readCart()
				: [];

			// Save a simple order record so it can be shown on the profile page
			if (cart && cart.length) {
				var orderTotal = calculateCartTotal();
				var itemsCopy = [];
				cart.forEach(function (item) {
					itemsCopy.push({
						id: item.id,
						title: item.title,
						author: item.author,
						price: item.price,
						quantity: item.quantity,
						image: item.image,
					});
				});

				var existingOrders = [];
				if (window.BookTokAuth && typeof window.BookTokAuth.readOrders === 'function') {
					existingOrders = window.BookTokAuth.readOrders() || [];
				} else {
					try {
						var raw = window.localStorage.getItem('booktokOrders');
						if (raw) {
							var parsed = JSON.parse(raw);
							if (Array.isArray(parsed)) existingOrders = parsed;
						}
					} catch (e) {
						existingOrders = [];
					}
				}

				var orderRecord = {
					id: Date.now(),
					placedAt: new Date().toISOString(),
					total: orderTotal,
					items: itemsCopy,
				};

				existingOrders.push(orderRecord);

				if (window.BookTokAuth && typeof window.BookTokAuth.saveOrders === 'function') {
					window.BookTokAuth.saveOrders(existingOrders);
				} else {
					try {
						window.localStorage.setItem('booktokOrders', JSON.stringify(existingOrders));
					} catch (e) {
						// ignore in demo
					}
				}
			}
			triggerBookDownloads(cart);
			if (window.BookTokCart && typeof window.BookTokCart.clear === 'function') {
				window.BookTokCart.clear();
			}

			// Smoothly transition to the confirmation state: hide form card and show confirmation
			formCard.classList.add('d-none');
			confirmation.classList.remove('d-none');
			document.body.classList.add('payment-complete');
			// After confirmation, keep things simple: show the confirmation
			// and scroll the page to the very top so it is fully visible.
			window.scrollTo({ top: 0, behavior: 'auto' });
			confirmBtn.innerHTML = originalHtml;
		});
	}
})();
