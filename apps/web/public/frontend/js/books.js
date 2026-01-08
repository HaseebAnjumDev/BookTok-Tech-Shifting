// Catalog page behaviors: filtering, sorting, layout, and deep-link category

(function () {
	var booksGrid;
	var bookItems = [];
	var searchInput;
	var sortMenu;
	var sortLabel;
	var categoryList;
	var priceMinInput;
	var priceMaxInput;
	var emptyState;
	var clearFiltersEmptyBtn;
	var gridViewBtn;
	var listViewBtn;
	var currentSort = 'featured';
	var controlsBound = false;

	function refreshDomRefs() {
		booksGrid = document.getElementById('catalogBooksGrid');
		searchInput = document.getElementById('catalogSearchInput');
		sortMenu = document.getElementById('catalogSortMenu');
		sortLabel = document.getElementById('catalogSortLabel');
		categoryList = document.getElementById('catalogCategoryList');
		priceMinInput = document.getElementById('priceMinInput');
		priceMaxInput = document.getElementById('priceMaxInput');
		emptyState = document.getElementById('catalogEmptyState');
		clearFiltersEmptyBtn = document.getElementById('catalogClearFiltersEmpty');
		gridViewBtn = document.getElementById('gridViewBtn');
		listViewBtn = document.getElementById('listViewBtn');
	}

	function refreshBookItems() {
		if (!booksGrid) {
			bookItems = [];
			return;
		}
		bookItems = Array.prototype.slice.call(booksGrid.querySelectorAll('.catalog-book-item'));
		// Preserve original order for "Featured" sort
		bookItems.forEach(function (item, index) {
			if (!item.dataset.index) {
				item.dataset.index = String(index);
			}
		});
	}

	function getActiveCategory() {
		if (!categoryList) return 'all';
		var active = categoryList.querySelector('.list-group-item.active');
		return active ? active.getAttribute('data-category') : 'all';
	}

	function applyFiltersAndSort() {
		var termValue = searchInput && searchInput.value ? searchInput.value : '';
		var term = termValue.trim().toLowerCase();
		var activeCategory = getActiveCategory();
		var minPrice = parseFloat((priceMinInput && priceMinInput.value) || '0');
		var maxPrice = parseFloat((priceMaxInput && priceMaxInput.value) || '999999');
		var sortBy = currentSort || 'featured';

		var visibleItems = [];

		bookItems.forEach(function (item) {
			var title = (item.dataset.title || '').toLowerCase();
			var author = (item.dataset.author || '').toLowerCase();
			var category = item.dataset.category || '';
			var categoryLower = category.toLowerCase();
			var price = parseFloat(item.dataset.price || '0');
			var matches = true;

			// Search filter
			if (term) {
				matches = title.includes(term) || author.includes(term) || categoryLower.includes(term);
			}

			// Category filter
			if (matches && activeCategory && activeCategory !== 'all') {
				matches = category === activeCategory;
			}

			// Price filter
			if (matches && !isNaN(minPrice)) {
				matches = price >= minPrice;
			}
			if (matches && !isNaN(maxPrice)) {
				matches = price <= maxPrice;
			}

			if (matches) {
				item.classList.remove('d-none');
				visibleItems.push(item);
			} else {
				item.classList.add('d-none');
			}
		});

		// Sort visible items
		visibleItems.sort(function (a, b) {
			var aPrice = parseFloat(a.dataset.price || '0');
			var bPrice = parseFloat(b.dataset.price || '0');
			var aRating = parseFloat(a.dataset.rating || '0');
			var bRating = parseFloat(b.dataset.rating || '0');
			var aFeatured = a.dataset.featured === '1' ? 1 : 0;
			var bFeatured = b.dataset.featured === '1' ? 1 : 0;
			var aDate = a.dataset.date || '';
			var bDate = b.dataset.date || '';
			var aIndex = parseInt(a.dataset.index || '0', 10);
			var bIndex = parseInt(b.dataset.index || '0', 10);

			if (sortBy === 'price-asc') {
				return aPrice - bPrice;
			}
			if (sortBy === 'price-desc') {
				return bPrice - aPrice;
			}
			if (sortBy === 'rating-desc') {
				return bRating - aRating;
			}
			if (sortBy === 'newest') {
				// Newest first by date string
				if (aDate > bDate) return -1;
				if (aDate < bDate) return 1;
				return 0;
			}

			// Featured: featured items first, then original order
			if (bFeatured !== aFeatured) {
				return bFeatured - aFeatured;
			}
			return aIndex - bIndex;
		});

		// Re-append in sorted order
		visibleItems.forEach(function (item) {
			booksGrid.appendChild(item.parentElement ? item : item);
		});

		// Empty state toggle
		if (emptyState) {
			if (visibleItems.length === 0) {
				emptyState.classList.remove('d-none');
			} else {
				emptyState.classList.add('d-none');
			}
		}
	}

	function resetFilters() {
		if (searchInput) searchInput.value = '';
		if (priceMinInput) priceMinInput.value = '0';
		if (priceMaxInput) priceMaxInput.value = '100';
		currentSort = 'featured';
		if (sortLabel) sortLabel.textContent = 'Featured';
		if (sortMenu) {
			Array.prototype.forEach.call(sortMenu.querySelectorAll('.dropdown-item'), function (item) {
				item.classList.toggle('active', item.getAttribute('data-sort-value') === 'featured');
			});
		}

		if (categoryList) {
			Array.prototype.forEach.call(categoryList.querySelectorAll('.list-group-item'), function (btn) {
				btn.classList.toggle('active', btn.getAttribute('data-category') === 'all');
			});
		}

		applyFiltersAndSort();
	}

	// Buy Now buttons on catalog cards: add selected book to cart and go to order page
	function setupBuyNowButtons() {
		var buyButtons = document.querySelectorAll('[data-cart-action="buy"][data-book-id]');
		if (!buyButtons.length) return;

		buyButtons.forEach(function (btn) {
			btn.addEventListener('click', function (event) {
				// Prevent card link navigation; we handle redirect ourselves
				if (event) {
					event.preventDefault();
					event.stopPropagation();
				}

				if (window.BookTokCart && typeof window.BookTokCart.addFromDataset === 'function') {
					window.BookTokCart.addFromDataset(btn.dataset);
					if (typeof window.BookTokCart.updateBadge === 'function') {
						window.BookTokCart.updateBadge();
					}
				}

				window.location.href = 'order.html';
			});
		});
	}

	// Clicking a book card opens its details page
	function setupBookCardNavigation() {
		bookItems.forEach(function (item) {
			item.addEventListener('click', function (event) {
				// Ignore clicks on action buttons inside the card
				var target = event && event.target ? event.target : null;
				if (target && target.closest && target.closest('[data-cart-action]')) {
					return;
				}

				var id = item.dataset.bookId;
				if (!id) return;
				window.location.href = 'book.html?id=' + encodeURIComponent(id);
			});
		});
	}

	function bindControlsOnce() {
		if (controlsBound) return;
		controlsBound = true;

		if (searchInput) {
			searchInput.addEventListener('input', applyFiltersAndSort);
		}

		if (sortMenu) {
			sortMenu.addEventListener('click', function (e) {
				var target = e.target.closest('.dropdown-item');
				if (!target) return;
				var value = target.getAttribute('data-sort-value') || 'featured';
				currentSort = value;
				if (sortLabel) sortLabel.textContent = target.textContent.trim();
				Array.prototype.forEach.call(sortMenu.querySelectorAll('.dropdown-item'), function (item) {
					item.classList.remove('active');
				});
				target.classList.add('active');
				applyFiltersAndSort();
			});
		}

		if (priceMinInput) {
			priceMinInput.addEventListener('change', applyFiltersAndSort);
		}

		if (priceMaxInput) {
			priceMaxInput.addEventListener('change', applyFiltersAndSort);
		}

		if (categoryList) {
			categoryList.addEventListener('click', function (e) {
				var target = e.target.closest('.list-group-item');
				if (!target) return;
				Array.prototype.forEach.call(categoryList.querySelectorAll('.list-group-item'), function (btn) {
					btn.classList.remove('active');
				});
				target.classList.add('active');
				applyFiltersAndSort();
			});
		}

		if (clearFiltersEmptyBtn) {
			clearFiltersEmptyBtn.addEventListener('click', resetFilters);
		}
	}

	// Layout toggle
	function setGridLayout(isGrid) {
		if (!booksGrid) return;
		if (isGrid) {
			booksGrid.classList.remove('list-view');
			if (gridViewBtn) gridViewBtn.classList.add('active');
			if (listViewBtn) listViewBtn.classList.remove('active');
		} else {
			booksGrid.classList.add('list-view');
			if (gridViewBtn) gridViewBtn.classList.remove('active');
			if (listViewBtn) listViewBtn.classList.add('active');
		}
	}

	function bindLayoutOnce() {
		if (gridViewBtn && !gridViewBtn.dataset.boundLayout) {
			gridViewBtn.dataset.boundLayout = '1';
			gridViewBtn.addEventListener('click', function () {
				setGridLayout(true);
			});
		}

		if (listViewBtn && !listViewBtn.dataset.boundLayout) {
			listViewBtn.dataset.boundLayout = '1';
			listViewBtn.addEventListener('click', function () {
				setGridLayout(false);
			});
		}
	}

	function applyInitialCategoryOnce() {
		if (!categoryList || categoryList.dataset.boundInitialCategory) return;
		categoryList.dataset.boundInitialCategory = '1';
		try {
			var params = new URLSearchParams(window.location.search);
			var initialCategory = params.get('category');
			if (initialCategory) {
				var targetBtn = categoryList.querySelector('.list-group-item[data-category="' + initialCategory + '"]');
				if (targetBtn) {
					Array.prototype.forEach.call(categoryList.querySelectorAll('.list-group-item'), function (btn) {
						btn.classList.toggle('active', btn === targetBtn);
					});
				}
			}
		} catch (e) {
			// ignore
		}
	}

	function setupBuyNowButtons() {
		var buyButtons = document.querySelectorAll('[data-cart-action="buy"][data-book-id]');
		if (!buyButtons.length) return;

		buyButtons.forEach(function (btn) {
			if (btn.dataset.boundBuy === '1') return;
			btn.dataset.boundBuy = '1';

			btn.addEventListener('click', function (event) {
				if (event) {
					event.preventDefault();
					event.stopPropagation();
				}

				if (window.BookTokCart && typeof window.BookTokCart.addFromDataset === 'function') {
					window.BookTokCart.addFromDataset(btn.dataset);
					if (typeof window.BookTokCart.updateBadge === 'function') {
						window.BookTokCart.updateBadge();
					}
				}

				window.location.href = 'order.html';
			});
		});
	}

	function setupBookCardNavigation() {
		bookItems.forEach(function (item) {
			if (item.dataset.boundNav === '1') return;
			item.dataset.boundNav = '1';

			item.addEventListener('click', function (event) {
				var target = event && event.target ? event.target : null;
				if (target && target.closest && target.closest('[data-cart-action]')) {
					return;
				}

				var id = item.dataset.bookId;
				if (!id) return;
				window.location.href = 'book.html?id=' + encodeURIComponent(id);
			});
		});
	}

	function init() {
		refreshDomRefs();
		if (!booksGrid) return;
		refreshBookItems();
		bindControlsOnce();
		bindLayoutOnce();
		applyInitialCategoryOnce();
		setupBuyNowButtons();
		setupBookCardNavigation();
		applyFiltersAndSort();
	}

	document.addEventListener('DOMContentLoaded', init);
	document.addEventListener('booktok:catalog-rendered', init);
})();

