// Authentication and profile utilities for BookTok
// - Store registered user details (localStorage)
// - Manage logged-in session (sessionStorage/localStorage)
// - Update navbar auth/profile state
// - Handle login form behaviour
// - Initialise profile page (personal info + orders)

(function () {
	var REGISTERED_USER_KEY = 'booktokRegisteredUser';
	var CURRENT_USER_KEY = 'booktokCurrentUser';
	var ORDERS_KEY = 'booktokOrders';

	function safeReadStorage(storage, key) {
		try {
			var raw = storage.getItem(key);
			if (!raw) return null;
			return JSON.parse(raw);
		} catch (e) {
			return null;
		}
	}

	function safeWriteStorage(storage, key, value) {
		try {
			storage.setItem(key, JSON.stringify(value));
		} catch (e) {
			// ignore in this demo
		}
	}

	function getRegisteredUser() {
		return safeReadStorage(window.localStorage, REGISTERED_USER_KEY);
	}

	function saveRegisteredUser(user) {
		if (!user || typeof user !== 'object') return;
		safeWriteStorage(window.localStorage, REGISTERED_USER_KEY, user);
	}

	function getCurrentUser() {
		var user = safeReadStorage(window.sessionStorage, CURRENT_USER_KEY);
		if (!user) {
			user = safeReadStorage(window.localStorage, CURRENT_USER_KEY);
		}
		return user;
	}

	function setCurrentUser(user, remember) {
		if (!user || typeof user !== 'object') return;
		if (remember) {
			window.sessionStorage.removeItem(CURRENT_USER_KEY);
			safeWriteStorage(window.localStorage, CURRENT_USER_KEY, user);
		} else {
			window.localStorage.removeItem(CURRENT_USER_KEY);
			safeWriteStorage(window.sessionStorage, CURRENT_USER_KEY, user);
		}
	}

	function clearCurrentUser() {
		try {
			window.sessionStorage.removeItem(CURRENT_USER_KEY);
			window.localStorage.removeItem(CURRENT_USER_KEY);
		} catch (e) {
			// ignore
		}
	}

	function loginWithEmailAndPassword(email, password, rememberMe) {
		var result = {
			success: false,
			message: '',
			field: null,
			user: null,
		};

		var registered = getRegisteredUser();
		if (!registered) {
			result.message = 'No account found. Please create one first.';
			result.field = 'email';
			return result;
		}

		var normalizedInputEmail = String(email || '').trim().toLowerCase();
		var normalizedStoredEmail = String(registered.email || '').trim().toLowerCase();

		if (!normalizedInputEmail) {
			result.message = 'Email is required.';
			result.field = 'email';
			return result;
		}

		if (!password) {
			result.message = 'Password is required.';
			result.field = 'password';
			return result;
		}

		if (normalizedInputEmail !== normalizedStoredEmail) {
			result.message = 'We could not find an account with that email.';
			result.field = 'email';
			return result;
		}

		if (String(password) !== String(registered.password)) {
			result.message = 'Incorrect password. Please try again.';
			result.field = 'password';
			return result;
		}

		var publicUser = {
			firstName: registered.firstName || '',
			lastName: registered.lastName || '',
			username: registered.username || '',
			email: registered.email || '',
			phone: registered.phone || '',
			address: registered.address || '',
			city: registered.city || '',
			postalCode: registered.postalCode || '',
			country: registered.country || '',
		};

		setCurrentUser(publicUser, !!rememberMe);

		result.success = true;
		result.user = publicUser;
		return result;
	}

	function readOrders() {
		var raw = safeReadStorage(window.localStorage, ORDERS_KEY);
		return Array.isArray(raw) ? raw : [];
	}

	function saveOrders(orders) {
		if (!Array.isArray(orders)) return;
		safeWriteStorage(window.localStorage, ORDERS_KEY, orders);
	}

	function initNavbarAuth() {
		var authLinks = document.querySelector('.navbar .auth-links');
		var profileContainer = document.getElementById('navbarProfile');
		var profileNameEl = document.getElementById('navbarProfileName');

		var user = getCurrentUser();
		if (user && user.firstName) {
			if (authLinks) {
				authLinks.classList.add('d-none');
			}
			if (profileContainer && profileNameEl) {
				profileNameEl.textContent = user.firstName;
				profileContainer.classList.remove('d-none');
			}
		} else {
			if (authLinks) {
				authLinks.classList.remove('d-none');
			}
			if (profileContainer) {
				profileContainer.classList.add('d-none');
			}
		}
	}

	function initLoginForm() {
		var form = document.getElementById('loginForm');
		if (!form) return;

		var emailInput = document.getElementById('loginEmail');
		var passwordInput = document.getElementById('loginPassword');
		var rememberCheckbox = document.getElementById('rememberMe');
		var emailErrorEl = document.getElementById('loginEmailError');
		var passwordErrorEl = document.getElementById('loginPasswordError');
		var generalErrorEl = document.getElementById('loginFormError');

		function clearErrors() {
			[generalErrorEl, emailErrorEl, passwordErrorEl].forEach(function (el) {
				if (el) el.textContent = '';
			});
			if (emailInput) emailInput.classList.remove('is-invalid');
			if (passwordInput) passwordInput.classList.remove('is-invalid');
		}

		form.addEventListener('submit', function (event) {
			event.preventDefault();
			clearErrors();

			var email = emailInput ? emailInput.value : '';
			var password = passwordInput ? passwordInput.value : '';
			var remember = !!(rememberCheckbox && rememberCheckbox.checked);

			var result = loginWithEmailAndPassword(email, password, remember);

			if (!result.success) {
				if (result.field === 'email' && emailErrorEl && emailInput) {
					emailErrorEl.textContent = result.message;
					emailInput.classList.add('is-invalid');
				} else if (result.field === 'password' && passwordErrorEl && passwordInput) {
					passwordErrorEl.textContent = result.message;
					passwordInput.classList.add('is-invalid');
				} else if (generalErrorEl) {
					generalErrorEl.textContent = result.message;
				}
				return;
			}

			window.location.href = 'profile.html';
		});
	}

	function initProfilePage() {
		var profileRoot = document.getElementById('profilePageRoot');
		if (!profileRoot) return;

		var storedUser = getCurrentUser();
		var registeredUser = getRegisteredUser();
		var user = storedUser || registeredUser;
		if (!user) {
			window.location.href = 'login.html';
			return;
		}

		// Merge in any newer fields from the registered record so profile
		// always sees the most complete data set.
		if (registeredUser) {
			user = Object.assign({}, registeredUser, user);
		}

		var nameHeading = document.getElementById('profileNameHeading');
		var nameSub = document.getElementById('profileNameSubheading');
		var emailEl = document.getElementById('profileEmail');
		var phoneEl = document.getElementById('profilePhone');
		var fullNameEl = document.getElementById('profileFullName');
		var addressEl = document.getElementById('profileAddress');

		if (nameHeading) {
			nameHeading.textContent = user.firstName + (user.lastName ? ' ' + user.lastName : '');
		}
		if (nameSub) {
			nameSub.textContent = user.username || user.email || '';
		}
		if (emailEl) {
			emailEl.textContent = user.email || '';
		}
		if (phoneEl) {
			phoneEl.textContent = user.phone || '';
		}
		if (fullNameEl) {
			fullNameEl.textContent = user.firstName || user.lastName
				? (user.firstName || '') + (user.lastName ? ' ' + user.lastName : '')
				: '';
		}
		if (addressEl) {
			var addressParts = [];
			if (user.address) {
				addressParts.push(user.address);
			}
			// If no street address provided, show only city and country as requested
			if (!user.address) {
				if (user.city) addressParts.push(user.city);
				if (user.country) addressParts.push(user.country);
			} else {
				if (user.city) addressParts.push(user.city);
				if (user.postalCode) addressParts.push(user.postalCode);
				if (user.country) addressParts.push(user.country);
			}
			addressEl.textContent = addressParts.length ? addressParts.join(', ') : '';
		}

		var logoutBtn = document.getElementById('profileLogoutBtn');
		if (logoutBtn) {
			logoutBtn.addEventListener('click', function () {
				clearCurrentUser();
				initNavbarAuth();
				window.location.href = 'login.html';
			});
		}

		// Profile edit behaviour
		var editBtn = document.getElementById('profileEditBtn');
		var viewContainer = document.getElementById('profileInfoView');
		var editContainer = document.getElementById('profileInfoEdit');
		var actionsContainer = document.getElementById('profileEditActions');
		var cancelBtn = document.getElementById('profileEditCancelBtn');
		var saveBtn = document.getElementById('profileEditSaveBtn');

		var editFirstName = document.getElementById('profileEditFirstName');
		var editLastName = document.getElementById('profileEditLastName');
		var editPhone = document.getElementById('profileEditPhone');
		var editAddress = document.getElementById('profileEditAddress');
		var editCity = document.getElementById('profileEditCity');
		var editPostalCode = document.getElementById('profileEditPostalCode');
		var editCountry = document.getElementById('profileEditCountry');

		function markInvalid(input, isInvalid) {
			if (!input) return;
			if (isInvalid) {
				input.classList.add('is-invalid');
				input.setAttribute('aria-invalid', 'true');
			} else {
				input.classList.remove('is-invalid');
				input.removeAttribute('aria-invalid');
			}
		}

		function isValidPhoneValue(value) {
			if (!value) return false;
			if (!/^\+?[0-9\s\-().]+$/.test(value)) return false;
			var digits = value.replace(/\D/g, '');
			return digits.length >= 7 && digits.length <= 15;
		}

		function validateProfileEditRequired() {
			var ok = true;
			if (editFirstName) {
				var badFirst = !editFirstName.value.trim();
				markInvalid(editFirstName, badFirst);
				if (badFirst) ok = false;
			}
			if (editLastName) {
				var badLast = !editLastName.value.trim();
				markInvalid(editLastName, badLast);
				if (badLast) ok = false;
			}
			if (editPhone) {
				var phoneVal = editPhone.value.trim();
				var badPhone = !isValidPhoneValue(phoneVal);
				markInvalid(editPhone, badPhone);
				if (badPhone) ok = false;
			}
			if (editCity) {
				var badCity = !editCity.value.trim();
				markInvalid(editCity, badCity);
				if (badCity) ok = false;
			}
			if (editCountry) {
				var badCountry = !editCountry.value.trim();
				markInvalid(editCountry, badCountry);
				if (badCountry) ok = false;
			}
			return ok;
		}

		function populateEditForm(fromUser) {
			if (editFirstName) editFirstName.value = fromUser.firstName || '';
			if (editLastName) editLastName.value = fromUser.lastName || '';
			if (editPhone) editPhone.value = fromUser.phone || '';
			if (editAddress) editAddress.value = fromUser.address || '';
			if (editCity) editCity.value = fromUser.city || '';
			if (editPostalCode) editPostalCode.value = fromUser.postalCode || '';
			if (editCountry) editCountry.value = fromUser.country || '';
		}

		populateEditForm(user);

		function setEditMode(enabled) {
			if (!viewContainer || !editContainer || !actionsContainer || !editBtn) return;
			if (enabled) {
				viewContainer.classList.add('d-none');
				editContainer.classList.remove('d-none');
				actionsContainer.classList.remove('d-none');
				editBtn.classList.add('d-none');
			} else {
				viewContainer.classList.remove('d-none');
				editContainer.classList.add('d-none');
				actionsContainer.classList.add('d-none');
				editBtn.classList.remove('d-none');
			}
		}

		if (editBtn) {
			editBtn.addEventListener('click', function () {
				populateEditForm(user);
				setEditMode(true);
			});
		}

		if (cancelBtn) {
			cancelBtn.addEventListener('click', function () {
				populateEditForm(user);
				setEditMode(false);
			});
		}

		if (saveBtn) {
			saveBtn.addEventListener('click', function () {
				// Enforce same required rules as registration: first/last name, phone,
				// city and country must be present and phone must be valid.
				if (!validateProfileEditRequired()) {
					window.alert('Please fill in all required personal information fields with valid values before saving.');
					return;
				}

				// Read edits
				var updated = Object.assign({}, registeredUser || {}, user);
				if (editFirstName) updated.firstName = editFirstName.value.trim();
				if (editLastName) updated.lastName = editLastName.value.trim();
				if (editPhone) updated.phone = editPhone.value.trim();
				if (editAddress) updated.address = editAddress.value.trim();
				if (editCity) updated.city = editCity.value.trim();
				if (editPostalCode) updated.postalCode = editPostalCode.value.trim();
				if (editCountry) updated.country = editCountry.value.trim();

				// Persist full registered record (including password and other fields)
				saveRegisteredUser(updated);

				// Also update the current user snapshot in whichever storage is active
				var publicUser = {
					firstName: updated.firstName || '',
					lastName: updated.lastName || '',
					username: updated.username || '',
					email: updated.email || '',
					phone: updated.phone || '',
					address: updated.address || '',
					city: updated.city || '',
					postalCode: updated.postalCode || '',
					country: updated.country || '',
				};

				try {
					var storedLocal = safeReadStorage(window.localStorage, CURRENT_USER_KEY);
					var storedSession = safeReadStorage(window.sessionStorage, CURRENT_USER_KEY);
					if (storedLocal) {
						safeWriteStorage(window.localStorage, CURRENT_USER_KEY, publicUser);
					}
					if (storedSession) {
						safeWriteStorage(window.sessionStorage, CURRENT_USER_KEY, publicUser);
					}
				} catch (e) {
					// ignore
				}

				// Update in-memory user and re-render view
				user = Object.assign({}, updated);
				if (nameHeading) {
					nameHeading.textContent = user.firstName + (user.lastName ? ' ' + user.lastName : '');
				}
				if (fullNameEl) {
					fullNameEl.textContent = user.firstName || user.lastName
						? (user.firstName || '') + (user.lastName ? ' ' + user.lastName : '')
						: '';
				}
				if (phoneEl) {
					phoneEl.textContent = user.phone || '';
				}
				if (addressEl) {
					var addressParts2 = [];
					if (user.address) {
						addressParts2.push(user.address);
					}
					if (!user.address) {
						if (user.city) addressParts2.push(user.city);
						if (user.country) addressParts2.push(user.country);
					} else {
						if (user.city) addressParts2.push(user.city);
						if (user.postalCode) addressParts2.push(user.postalCode);
						if (user.country) addressParts2.push(user.country);
					}
					addressEl.textContent = addressParts2.length ? addressParts2.join(', ') : '';
				}

				setEditMode(false);
			});
		}

		initProfileTabs();
		renderOrdersSection();
	}

	function initProfileTabs() {
		var tabButtons = document.querySelectorAll('[data-profile-tab]');
		if (!tabButtons.length) return;

		var sections = document.querySelectorAll('[data-profile-section]');

		function activateTab(target) {
			var targetId = target.getAttribute('data-profile-tab');
			if (!targetId) return;

			tabButtons.forEach(function (btn) {
				if (btn.getAttribute('data-profile-tab') === targetId) {
					btn.classList.add('active');
				} else {
					btn.classList.remove('active');
				}
			});

			sections.forEach(function (section) {
				if (section.getAttribute('data-profile-section') === targetId) {
					section.classList.remove('d-none');
				} else {
					section.classList.add('d-none');
				}
			});
		}

		// Default: activate the button already marked active
		var initiallyActive = document.querySelector('[data-profile-tab].active') || tabButtons[0];
		if (initiallyActive) {
			activateTab(initiallyActive);
		}

		tabButtons.forEach(function (btn) {
			btn.addEventListener('click', function () {
				activateTab(btn);
			});
		});
	}

	function renderOrdersSection() {
		var listContainer = document.getElementById('profileOrdersList');
		var emptyState = document.getElementById('profileOrdersEmptyState');
		if (!listContainer || !emptyState) return;

		var orders = readOrders();

		if (!orders.length) {
			listContainer.innerHTML = '';
			emptyState.classList.remove('d-none');
			return;
		}

		emptyState.classList.add('d-none');
		listContainer.innerHTML = '';

		orders
			.slice()
			.sort(function (a, b) {
				return (b.placedAt || 0) > (a.placedAt || 0) ? 1 : -1;
			})
			.forEach(function (order) {
				var card = document.createElement('div');
				card.className = 'card border-1 shadow-sm mb-3 profile-order-card';

				var createdAt = order.placedAt ? new Date(order.placedAt) : null;
				var dateLabel = createdAt && !isNaN(createdAt.getTime())
					? createdAt.toLocaleString(undefined, {
						month: 'short',
						day: 'numeric',
						year: 'numeric',
						hour: '2-digit',
						minute: '2-digit',
					})
					: 'Recent order';

				var items = Array.isArray(order.items) ? order.items : [];
				var itemCount = items.reduce(function (sum, item) {
					return sum + (item.quantity || 0);
				}, 0);

				var firstTitle = items[0] && items[0].title ? items[0].title : '';
				var rawImage = items[0] && items[0].image ? items[0].image : '';
				var firstImage = rawImage;
				if (firstImage && firstImage.indexOf('../assets/') !== 0) {
					var imgIdx = firstImage.indexOf('assets/');
					if (imgIdx >= 0) {
						firstImage = '../' + firstImage.slice(imgIdx);
					}
				}
				var firstAuthor = items[0] && items[0].author ? items[0].author : '';
				var firstQty = items[0] && items[0].quantity ? items[0].quantity : 0;
				var firstPriceRaw = items[0] && items[0].price != null ? Number(items[0].price) : NaN;
				var hasFirstPrice = !isNaN(firstPriceRaw);
				var firstPriceLabel = hasFirstPrice ? '$' + firstPriceRaw.toFixed(2) : '';
				var firstLineTotalLabel = hasFirstPrice ? '$' + (firstPriceRaw * (firstQty || 1)).toFixed(2) : '';
				var moreCount = items.length > 1 ? items.length - 1 : 0;
				var summaryTitle = '';
				if (firstTitle && moreCount > 0) {
					summaryTitle = firstTitle + ' +' + moreCount + ' more';
				} else if (firstTitle) {
					summaryTitle = firstTitle;
				} else {
					summaryTitle = 'Book order';
				}

				var totalAmount = typeof order.total === 'number' ? order.total : 0;
				var totalLabel = '$' + totalAmount.toFixed(2);

				var imageHtml = '';
				if (firstImage) {
					imageHtml =
						'<div class="profile-order-cover me-3 flex-shrink-0">' +
						'<img src="' + firstImage + '" alt="' + (firstTitle || 'Book cover') + '" class="profile-order-cover-img" />' +
						'</div>';
				}

				card.innerHTML =
					'<div class="card-body d-flex flex-column flex-md-row justify-content-between align-items-start gap-3">' +
					'  <div class="d-flex align-items-start flex-grow-1">' +
					     imageHtml +
					'    <div>' +
					'      <div class="d-flex align-items-center gap-2 mb-1 small text-muted">' +
					'        <span class="badge bg-light text-muted border">Order</span>' +
					'        <span>' + dateLabel + '</span>' +
					'      </div>' +
					'      <h6 class="mb-1">' + summaryTitle + '</h6>' +
					( firstAuthor
						? '      <p class="text-muted small mb-1">by ' + firstAuthor + '</p>'
						: ''
					) +
					( hasFirstPrice
						? '      <p class="text-muted small mb-1">Price: ' + firstPriceLabel + ' &middot; Qty: ' + (firstQty || 1) + ' &middot; Line total: ' + firstLineTotalLabel + '</p>'
						: ''
					) +
					'      <p class="text-muted small mb-0">' + itemCount + ' item' + (itemCount === 1 ? '' : 's') + ' in this order</p>' +
					'    </div>' +
					'  </div>' +
					'  <div class="text-md-end ms-md-auto mt-2 mt-md-0">' +
					'    <div class="fw-semibold mb-1">' + totalLabel + '</div>' +
					'    <p class="text-muted small mb-0">Completed</p>' +
					'  </div>' +
					'</div>';

				listContainer.appendChild(card);
			});
	}

	document.addEventListener('DOMContentLoaded', function () {
		initNavbarAuth();
		initLoginForm();
		initProfilePage();
	});

	window.BookTokAuth = {
		getRegisteredUser: getRegisteredUser,
		saveRegisteredUser: saveRegisteredUser,
		getCurrentUser: getCurrentUser,
		setCurrentUser: setCurrentUser,
		clearCurrentUser: clearCurrentUser,
		loginWithEmailAndPassword: loginWithEmailAndPassword,
		readOrders: readOrders,
		saveOrders: saveOrders,
	};
})();
