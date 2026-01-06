// Loads books from /xml/books.xml and renders catalog cards dynamically.
// Keeps markup compatible with existing catalog filtering/sorting/cart scripts.

(function () {
	function safeText(el) {
		return el ? String(el.textContent || '').trim() : '';
	}

	function firstTagValue(parent, tag) {
		if (!parent) return '';
		var el = parent.getElementsByTagName(tag)[0];
		return safeText(el);
	}

	function parseBook(bookEl) {
		var authorEl = bookEl.getElementsByTagName('author')[0];
		var firstName = firstTagValue(authorEl, 'firstName');
		var lastName = firstTagValue(authorEl, 'lastName');

		var priceEl = bookEl.getElementsByTagName('price')[0];
		var price = priceEl ? Number(safeText(priceEl)) : 0;

		var rating = Number(firstTagValue(bookEl, 'rating') || '0');
		var publishDate = firstTagValue(bookEl, 'publishDate');

		var tags = [];
		var tagsEl = bookEl.getElementsByTagName('tags')[0];
		if (tagsEl) {
			Array.prototype.forEach.call(tagsEl.getElementsByTagName('tag'), function (t) {
				var v = safeText(t);
				if (v) tags.push(v);
			});
		}

		return {
			id: bookEl.getAttribute('id') || '',
			title: firstTagValue(bookEl, 'title'),
			author: (firstName + ' ' + lastName).trim(),
			genre: firstTagValue(bookEl, 'genre'),
			price: isNaN(price) ? 0 : price,
			rating: isNaN(rating) ? 0 : rating,
			publishDate: publishDate,
			coverImage: firstTagValue(bookEl, 'coverImage'),
			tags: tags,
		};
	}

	function formatPrice(value) {
		var n = isNaN(value) ? 0 : Number(value);
		return '$' + n.toFixed(2);
	}

	function pickBadge(tags) {
		// Match the catalog's second-badge labels/colors.
		// Skip "featured" (used only for sorting).
		var usable = (tags || []).filter(function (t) {
			return t && t !== 'featured';
		});

		var priority = [
			'staff-pick',
			'book-club',
			'classic',
			'new',
			'popular',
			'high-rated',
			'bestseller',
			'trending',
			'sale',
		];

		var tag = '';
		for (var i = 0; i < priority.length; i++) {
			if (usable.indexOf(priority[i]) >= 0) {
				tag = priority[i];
				break;
			}
		}

		var map = {
			'bestseller': { label: 'Bestseller', cls: 'badge rounded-pill bg-danger-subtle text-danger' },
			'staff-pick': { label: 'Staff pick', cls: 'badge rounded-pill bg-success-subtle text-success' },
			'book-club': { label: 'Book club', cls: 'badge rounded-pill bg-warning-subtle text-warning-emphasis' },
			'classic': { label: 'Classic', cls: 'badge rounded-pill bg-info-subtle text-info' },
			'new': { label: 'New', cls: 'badge rounded-pill bg-danger-subtle text-danger' },
			'popular': { label: 'Popular', cls: 'badge rounded-pill bg-primary-subtle text-primary' },
			'high-rated': { label: 'High rated', cls: 'badge rounded-pill bg-success-subtle text-success' },
			'trending': { label: 'Trending', cls: 'badge rounded-pill bg-primary-subtle text-primary' },
			'sale': { label: 'Sale', cls: 'badge rounded-pill bg-success-subtle text-success' },
		};

		return map[tag] || null;
	}

	function isFeatured(tags) {
		return Array.prototype.indexOf.call(tags || [], 'featured') >= 0 ? 1 : 0;
	}

	function isUnavailable(tags) {
		return (tags || []).some(function (t) {
			return String(t || '').trim().toLowerCase() === 'unavailable';
		});
	}

	function renderBookCard(book) {
		var unavailable = isUnavailable(book.tags);
		var available = !unavailable;
		var badge = pickBadge(book.tags);
		var featured = isFeatured(book.tags);

		var wrapper = document.createElement('div');
		wrapper.className = 'col-12 col-sm-6 col-lg-4 catalog-book-item';
		wrapper.dataset.bookId = String(book.id);
		wrapper.dataset.title = book.title;
		wrapper.dataset.author = book.author;
		wrapper.dataset.category = book.genre;
		wrapper.dataset.price = String(book.price.toFixed(2));
		wrapper.dataset.rating = String(book.rating.toFixed(1));
		wrapper.dataset.featured = String(featured);
		wrapper.dataset.date = book.publishDate || '';

		var categoryBadge =
			'<span class="badge bg-light text-muted border catalog-book-tag">' +
			book.genre +
			'</span>';

		var secondBadge = badge
			? '<span class="' + badge.cls + '">' + badge.label + '</span>'
			: '';

		var ratingHtml =
			'<span class="catalog-book-rating">' +
			'<i class="bi bi-star-fill text-warning me-1"></i>' +
			book.rating.toFixed(1) +
			'</span>';

		var availabilityText = available ? 'Available' : 'Currently unavailable';

		var actionsHtml = '';
		if (available) {
			actionsHtml =
				'<div class="catalog-book-actions">' +
				'  <button type="button" class="btn btn-sm btn-primary rounded-circle catalog-book-cart-icon"' +
				'    data-cart-action="add"' +
				'    data-book-id="' + String(book.id) + '"' +
				'    data-book-title="' + book.title.replace(/"/g, '&quot;') + '"' +
				'    data-book-author="' + book.author.replace(/"/g, '&quot;') + '"' +
				'    data-book-price="' + String(book.price.toFixed(2)) + '"' +
				'    data-book-image="' + String(book.coverImage).replace(/"/g, '&quot;') + '"' +
				'  >' +
				'    <i class="bi bi-cart-plus"></i>' +
				'  </button>' +
				'  <button type="button" class="btn btn-sm btn-outline-primary catalog-book-buy-btn"' +
				'    data-cart-action="buy"' +
				'    data-book-id="' + String(book.id) + '"' +
				'    data-book-title="' + book.title.replace(/"/g, '&quot;') + '"' +
				'    data-book-author="' + book.author.replace(/"/g, '&quot;') + '"' +
				'    data-book-price="' + String(book.price.toFixed(2)) + '"' +
				'    data-book-image="' + String(book.coverImage).replace(/"/g, '&quot;') + '"' +
				'  >Buy</button>' +
				'</div>';
		} else {
			actionsHtml =
				'<button type="button" class="btn btn-sm btn-outline-secondary" disabled>' +
				'  <i class="bi bi-cart-plus me-1"></i>Unavailable' +
				'</button>';
		}

		wrapper.innerHTML =
			'<div class="card h-100 shadow-sm border-0 catalog-book-card">' +
			'  <div class="catalog-book-media">' +
			'    <img src="' + String(book.coverImage).replace(/"/g, '&quot;') + '" class="catalog-book-cover card-img-top" alt="' + book.title.replace(/"/g, '&quot;') + ' cover">' +
			'  </div>' +
			'  <div class="card-body d-flex flex-column">' +
			'    <div class="d-flex justify-content-between align-items-center mb-2 small">' +
			categoryBadge +
			(secondBadge ? secondBadge : '') +
			'    </div>' +
			'    <h5 class="card-title mb-1">' + book.title + '</h5>' +
			'    <p class="card-subtitle text-muted small mb-2">' + book.author + '</p>' +
			'    <div class="d-flex align-items-center gap-2 mb-2 small text-muted">' +
			ratingHtml +
			'      <span>&middot;</span>' +
			'      <span>' + availabilityText + '</span>' +
			'    </div>' +
			'    <div class="mt-auto d-flex justify-content-between align-items-center">' +
			'      <span class="fw-semibold">' + formatPrice(book.price) + '</span>' +
			actionsHtml +
			'    </div>' +
			'  </div>' +
			'</div>';

		return wrapper;
	}

	document.addEventListener('DOMContentLoaded', function () {
		var grid = document.getElementById('catalogBooksGrid');
		if (!grid) return;

		// Clear any hard-coded items (we want XML as the source of truth).
		grid.innerHTML = '';

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
					throw new Error('books.xml is not valid XML');
				}

				var books = Array.prototype.slice.call(doc.getElementsByTagName('book')).map(parseBook);
				books.forEach(function (b) {
					grid.appendChild(renderBookCard(b));
				});

				document.dispatchEvent(new Event('booktok:catalog-rendered'));
			})
			.catch(function () {
				// Leave grid empty; books.js will show the empty state.
				document.dispatchEvent(new Event('booktok:catalog-rendered'));
			});
	});
})();
