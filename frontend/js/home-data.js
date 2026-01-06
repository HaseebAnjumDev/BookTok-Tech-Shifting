// Home page: hydrate hero picks + featured/bestseller sections from /xml/books.xml
// Keeps existing card markup intact; only updates text/attributes in-place.

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
			coverImage: firstTagValue(bookEl, 'coverImage'),
			tags: tags,
		};
	}

	function formatPrice(value) {
		var n = isNaN(value) ? 0 : Number(value);
		return '$' + n.toFixed(2);
	}

	function normalizeImagePathForHome(path) {
		if (!path) return '';

		// books.xml is authored relative to frontend/pages (../assets/...).
		// index.html is at repo root, so convert ../assets/... -> frontend/assets/...
		if (path.indexOf('../assets/') === 0) {
			return 'frontend/' + path.substring('../'.length);
		}

		return path;
	}

	function labelFromTags(tags, fallback) {
		var usable = (tags || []).filter(function (t) {
			return t && t !== 'featured';
		});

		var map = {
			'bestseller': 'Bestseller',
			'staff-pick': 'Staff pick',
			'book-club': 'Book club',
			'classic': 'Classic',
			'new': 'New',
			'popular': 'Popular',
			'high-rated': 'High rated',
			'trending': 'Trending',
			'sale': 'Sale',
			'unavailable': 'Unavailable',
		};

		for (var i = 0; i < usable.length; i++) {
			var key = String(usable[i] || '').trim().toLowerCase();
			if (map[key]) return map[key];
		}

		return fallback || '';
	}

	function hydrateFeaturedCard(cardLink, book) {
		if (!cardLink || !book) return;

		// Keep the same pattern of linking to catalog-by-category
		if (book.genre) {
			cardLink.setAttribute('href', 'frontend/pages/catalog.html?category=' + encodeURIComponent(book.genre));
		}

		var img = cardLink.querySelector('img');
		if (img) {
			img.src = normalizeImagePathForHome(book.coverImage);
			img.alt = (book.title ? book.title + ' cover' : 'Book cover');
		}

		var badge = cardLink.querySelector('.featured-book-tag');
		if (badge) {
			badge.textContent = labelFromTags(book.tags, badge.textContent);
		}

		var rating = cardLink.querySelector('.featured-book-rating');
		if (rating) {
			rating.innerHTML = '<i class="bi bi-star-fill me-1"></i>' + (book.rating ? book.rating.toFixed(1) : '');
		}

		var titleEl = cardLink.querySelector('.featured-book-title');
		if (titleEl) titleEl.textContent = book.title || '';

		var authorEl = cardLink.querySelector('.featured-book-author');
		if (authorEl) authorEl.textContent = book.author || '';

		var priceEl = cardLink.querySelector('.featured-book-price');
		if (priceEl) priceEl.textContent = formatPrice(book.price);

		var btn = cardLink.querySelector('button[data-cart-action="add"][data-book-id]');
		if (btn) {
			btn.dataset.bookId = String(book.id);
			btn.dataset.bookTitle = book.title || '';
			btn.dataset.bookAuthor = book.author || '';
			btn.dataset.bookPrice = String((book.price || 0).toFixed(2));
			btn.dataset.bookImage = normalizeImagePathForHome(book.coverImage);
		}
	}

	function hydrateBestsellerCard(cardLink, book) {
		if (!cardLink || !book) return;

		if (book.genre) {
			cardLink.setAttribute('href', 'frontend/pages/catalog.html?category=' + encodeURIComponent(book.genre));
		}

		var img = cardLink.querySelector('img');
		if (img) {
			img.src = normalizeImagePathForHome(book.coverImage);
			img.alt = (book.title ? book.title + ' cover' : 'Book cover');
		}

		var badge = cardLink.querySelector('.bestseller-tag');
		if (badge) {
			badge.textContent = labelFromTags(book.tags, badge.textContent);
		}

		var titleEl = cardLink.querySelector('.bestseller-title');
		if (titleEl) titleEl.textContent = book.title || '';

		var authorEl = cardLink.querySelector('.bestseller-author');
		if (authorEl) authorEl.textContent = book.author || '';

		var priceEl = cardLink.querySelector('.bestseller-price');
		if (priceEl) priceEl.textContent = formatPrice(book.price);

		var btn = cardLink.querySelector('button[data-cart-action="add"][data-book-id]');
		if (btn) {
			btn.dataset.bookId = String(book.id);
			btn.dataset.bookTitle = book.title || '';
			btn.dataset.bookAuthor = book.author || '';
			btn.dataset.bookPrice = String((book.price || 0).toFixed(2));
			btn.dataset.bookImage = normalizeImagePathForHome(book.coverImage);
		}
	}

	function hydrateHeroPickCards(booksById) {
		var picks = document.querySelectorAll('.hero-picks-grid .hero-pick-card');
		if (!picks.length) return;

		// Keep the hero "mood" labels as-is; only hydrate the title and link.
		var idsInOrder = ['2', '1', '3'];
		Array.prototype.forEach.call(picks, function (pickEl, idx) {
			var id = idsInOrder[idx];
			var book = id ? booksById[id] : null;
			if (!book) return;

			var titleEl = pickEl.querySelector('.hero-pick-title');
			if (titleEl) titleEl.textContent = book.title || '';

			pickEl.setAttribute('href', 'frontend/pages/book.html?id=' + encodeURIComponent(String(book.id)));
		});
	}

	function hydrateHomeSections(doc) {
		var books = Array.prototype.slice.call(doc.getElementsByTagName('book')).map(parseBook);
		var booksById = {};
		books.forEach(function (b) {
			if (b && b.id) booksById[String(b.id)] = b;
		});

		hydrateHeroPickCards(booksById);

		var featuredButtons = document.querySelectorAll('.featured-books-grid button[data-cart-action="add"][data-book-id]');
		Array.prototype.forEach.call(featuredButtons, function (btn) {
			var id = btn.dataset.bookId;
			var book = booksById[String(id)];
			if (!book) return;
			var cardLink = btn.closest('a');
			hydrateFeaturedCard(cardLink, book);
		});

		var bestsellerButtons = document.querySelectorAll('.bestsellers-grid button[data-cart-action="add"][data-book-id]');
		Array.prototype.forEach.call(bestsellerButtons, function (btn) {
			var id = btn.dataset.bookId;
			var book = booksById[String(id)];
			if (!book) return;
			var cardLink = btn.closest('a');
			hydrateBestsellerCard(cardLink, book);
		});
	}

	document.addEventListener('DOMContentLoaded', function () {
		var xmlUrl = 'xml/books.xml';

		fetch(xmlUrl, { cache: 'no-store' })
			.then(function (res) {
				if (!res.ok) throw new Error('Failed to load books.xml');
				return res.text();
			})
			.then(function (xmlText) {
				var parser = new DOMParser();
				var doc = parser.parseFromString(xmlText, 'application/xml');
				var parseErr = doc.getElementsByTagName('parsererror')[0];
				if (parseErr) throw new Error('books.xml is not valid XML');
				hydrateHomeSections(doc);
			})
			.catch(function () {
				// If XML fails to load, leave existing hardcoded HTML as a fallback.
			});
	});
})();
