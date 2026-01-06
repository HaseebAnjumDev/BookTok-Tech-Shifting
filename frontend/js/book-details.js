(function () {
	function getQueryParam(name) {
		try {
			var params = new URLSearchParams(window.location.search);
			return params.get(name);
		} catch (e) {
			return null;
		}
	}

	function setText(id, value) {
		var el = document.getElementById(id);
		if (!el) return;
		el.textContent = value == null ? '' : String(value);
	}

	function setHtml(id, value) {
		var el = document.getElementById(id);
		if (!el) return;
		el.innerHTML = value == null ? '' : String(value);
	}

	function showError(message) {
		var errorEl = document.getElementById('bookDetailsError');
		var card = document.getElementById('bookDetailsCard');
		if (card) card.classList.add('d-none');
		if (errorEl) {
			errorEl.textContent = message;
			errorEl.classList.remove('d-none');
		}
	}

	function formatPriceUSD(value) {
		var n = isNaN(value) ? 0 : Number(value);
		return '$' + n.toFixed(2);
	}

	function parseBookElement(bookEl) {
		function text(tag) {
			var el = bookEl.getElementsByTagName(tag)[0];
			return el ? (el.textContent || '').trim() : '';
		}

		var authorEl = bookEl.getElementsByTagName('author')[0];
		var firstName = '';
		var lastName = '';
		if (authorEl) {
			var fn = authorEl.getElementsByTagName('firstName')[0];
			var ln = authorEl.getElementsByTagName('lastName')[0];
			firstName = fn ? (fn.textContent || '').trim() : '';
			lastName = ln ? (ln.textContent || '').trim() : '';
		}

		var priceEl = bookEl.getElementsByTagName('price')[0];
		var price = priceEl ? Number((priceEl.textContent || '').trim()) : 0;
		var currency = priceEl ? priceEl.getAttribute('currency') : 'USD';

		var tags = [];
		var tagsEl = bookEl.getElementsByTagName('tags')[0];
		if (tagsEl) {
			Array.prototype.forEach.call(tagsEl.getElementsByTagName('tag'), function (t) {
				var v = (t && t.textContent ? t.textContent : '').trim();
				if (v) tags.push(v);
			});
		}

		return {
			id: bookEl.getAttribute('id') || '',
			title: text('title'),
			author: (firstName + ' ' + lastName).trim(),
			genre: text('genre'),
			format: text('format'),
			language: text('language'),
			isbn: text('isbn'),
			publishDate: text('publishDate'),
			price: price,
			currency: currency || 'USD',
			rating: text('rating'),
			coverImage: text('coverImage'),
			description: text('description'),
			tags: tags,
		};
	}

	function setButtonDisabled(btn, disabled) {
		if (!btn) return;
		btn.disabled = !!disabled;
		btn.classList.toggle('disabled', !!disabled);
	}

	function buildCartDataset(book) {
		return {
			bookId: book.id,
			bookTitle: book.title,
			bookAuthor: book.author,
			bookPrice: String(book.price || 0),
			bookImage: book.coverImage,
		};
	}

	function isUnavailable(tags) {
		return (tags || []).some(function (t) {
			return String(t || '').trim().toLowerCase() === 'unavailable';
		});
	}

	function pickDisplayTag(tags) {
		var usable = (tags || []).filter(function (t) {
			return t && t !== 'featured';
		});
		return usable.length ? usable[0] : '';
	}

	document.addEventListener('DOMContentLoaded', function () {
		var bookId = getQueryParam('id');
		if (!bookId) {
			showError('Missing book id. Please return to the catalog and select a book.');
			return;
		}

		var xmlUrl = '../../xml/books.xml';

		fetch(xmlUrl, { cache: 'no-store' })
			.then(function (res) {
				if (!res.ok) throw new Error('Failed to load books.xml');
				return res.text();
			})
			.then(function (xmlText) {
				var parser = new DOMParser();
				var doc = parser.parseFromString(xmlText, 'application/xml');

				var parseErr = doc.getElementsByTagName('parsererror')[0];
				if (parseErr) {
					throw new Error('books.xml is not valid XML.');
				}

				var books = Array.prototype.slice.call(doc.getElementsByTagName('book'));
				var bookEl = books.find(function (b) {
					return String(b.getAttribute('id')) === String(bookId);
				});

				if (!bookEl) {
					showError('Book not found. Please return to the catalog and try again.');
					return;
				}

				var book = parseBookElement(bookEl);
				document.title = 'BookTok - ' + (book.title || 'Book Details');

				setText('bookTitleHeading', book.title || 'Book Details');
				setText('bookSubtitle', book.author ? ('by ' + book.author) : 'Explore book details and add to your cart.');

				setText('bookTitle', book.title);
				setText('bookAuthor', book.author);

				// Rating
				var ratingValue = book.rating ? String(book.rating) : '';
				if (ratingValue) {
					setHtml(
						'bookRating',
						'<i class="bi bi-star-fill text-warning me-1"></i>' +
							ratingValue
					);
				} else {
					setText('bookRating', '');
				}

				// Price + availability
				setText('bookPrice', formatPriceUSD(book.price));
				setText('bookAvailability', isUnavailable(book.tags) ? 'Currently unavailable' : 'Available');

				// Cover
				var img = document.getElementById('bookCoverImage');
				if (img) {
					img.src = book.coverImage || '';
					img.alt = (book.title ? book.title + ' cover' : 'Book cover');
				}

				// Description + details
				setText('bookDescription', book.description || '');
				setText('bookGenre', book.genre || '');
				setText('bookFormat', book.format || '');
				setText('bookPublishDate', book.publishDate || '');
				setText('bookLanguage', book.language || '');
				setText('bookIsbn', book.isbn || '');
				setText('bookTag', pickDisplayTag(book.tags) || '');

				var addBtn = document.getElementById('addToCartBtn');
				var buyBtn = document.getElementById('buyNowBtn');
				var cartDataset = buildCartDataset(book);

				var unavailable = isUnavailable(book.tags);
				setButtonDisabled(addBtn, unavailable);
				setButtonDisabled(buyBtn, unavailable);

				if (addBtn) {
					addBtn.addEventListener('click', function () {
						if (unavailable) return;
						if (window.BookTokCart && typeof window.BookTokCart.addFromDataset === 'function') {
							window.BookTokCart.addFromDataset(cartDataset);
							if (typeof window.BookTokCart.updateBadge === 'function') {
								window.BookTokCart.updateBadge();
							}
						}
					});
				}

				if (buyBtn) {
					buyBtn.addEventListener('click', function () {
						if (unavailable) return;
						if (window.BookTokCart && typeof window.BookTokCart.addFromDataset === 'function') {
							window.BookTokCart.addFromDataset(cartDataset);
							if (typeof window.BookTokCart.updateBadge === 'function') {
								window.BookTokCart.updateBadge();
							}
						}
						window.location.href = 'order.html';
					});
				}
			})
			.catch(function (err) {
				showError((err && err.message) ? err.message : 'Could not load book details.');
			});
	});
})();
