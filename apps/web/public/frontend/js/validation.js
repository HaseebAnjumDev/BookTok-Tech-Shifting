
document.addEventListener('DOMContentLoaded', function () {
	var form = document.getElementById('registerForm');

	if (form) {
		var firstNameInput = document.getElementById('firstName');
		var lastNameInput = document.getElementById('lastName');
		var usernameInput = document.getElementById('username');
		var emailInput = document.getElementById('email');
		var phoneInput = document.getElementById('phone');
		var addressInput = document.getElementById('address');
		var cityInput = document.getElementById('city');
		var postalCodeInput = document.getElementById('postalCode');
		var countryInput = document.getElementById('country');
		var passwordInput = document.getElementById('password');
		var confirmPasswordInput = document.getElementById('confirmPassword');
		var termsCheckbox = document.getElementById('termsCheckbox');

		function setError(input, errorElementId, message) {
		var errorEl = document.getElementById(errorElementId);
		if (errorEl) {
			errorEl.textContent = message || '';
		}
		if (input) {
			if (message) {
				input.classList.add('is-invalid');
				input.classList.remove('is-valid');
				input.setAttribute('aria-invalid', 'true');
			} else {
				input.classList.remove('is-invalid');
				input.removeAttribute('aria-invalid');
				if (input.value && input.value.trim() !== '') {
					input.classList.add('is-valid');
				} else {
					input.classList.remove('is-valid');
				}
			}
		}
		return !message;
	}

		function validateFirstName() {
		var value = firstNameInput.value.trim();
		var message = '';
		if (!value) {
			message = 'First Name is required';
		}
		return setError(firstNameInput, 'firstNameError', message);
	}

		function validateLastName() {
		var value = lastNameInput.value.trim();
		var message = '';
		if (!value) {
			message = 'Last Name is required';
		}
		return setError(lastNameInput, 'lastNameError', message);
	}

		function validateUsername() {
		var value = usernameInput.value.trim();
		var message = '';
		if (!value) {
			message = 'Username is required';
		} else if (/\s/.test(value)) {
			message = 'Username must not contain spacing';
		} else if (!/^[A-Za-z0-9_]{3,20}$/.test(value)) {
			message = 'Username must be 3-20 characters, alphanumeric and underscores only';
		}
		return setError(usernameInput, 'usernameError', message);
	}

		function validateEmail() {
		var value = emailInput.value.trim();
		var message = '';
		if (!value) {
			message = 'Email is required';
		} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
			message = 'Please enter a valid email address';
		}
		return setError(emailInput, 'emailError', message);
	}

		function isValidPhone(value) {
		if (!value) return false;
		if (!/^\+?[0-9\s\-().]+$/.test(value)) return false;
		var digits = value.replace(/\D/g, '');
		return digits.length >= 7 && digits.length <= 15;
	}

		function validatePhone() {
		var value = phoneInput.value.trim();
		var message = '';
		if (!value) {
			message = 'Phone Number is required';
		} else if (!isValidPhone(value)) {
			message = 'Please enter a valid phone number.';
		}
		return setError(phoneInput, 'phoneError', message);
	}

		function validateAddress() {
			// Optional: only basic trimming and length check if provided
			var value = addressInput ? addressInput.value.trim() : '';
			var message = '';
			if (value && value.length < 3) {
				message = 'Address must be at least 3 characters if provided';
			}
			return setError(addressInput, 'addressError', message);
		}

		function validateCity() {
			var value = cityInput ? cityInput.value.trim() : '';
			var message = '';
			if (!value) {
				message = 'City is required';
			}
			return setError(cityInput, 'cityError', message);
		}

		function validatePostalCode() {
			// Optional: allow empty, but if filled require at least 3 characters
			var value = postalCodeInput ? postalCodeInput.value.trim() : '';
			var message = '';
			if (value && value.length < 3) {
				message = 'Postal Code must be at least 3 characters if provided';
			}
			return setError(postalCodeInput, 'postalCodeError', message);
		}

		function validateCountry() {
			var value = countryInput ? countryInput.value.trim() : '';
			var message = '';
			if (!value) {
				message = 'Country is required';
			}
			return setError(countryInput, 'countryError', message);
		}

		function validatePassword() {
		var value = passwordInput.value;
		var message = '';
		if (!value) {
			message = 'Password is required';
		} else if (value.length < 8) {
			message = 'Password must have at least 8 characters';
		} else if (/\s/.test(value)) {
			message = "Password can't include spacing";
		} else if (/^[0-9]+$/.test(value)) {
			message = 'Password must include at least one letter';
		}
		var valid = setError(passwordInput, 'passwordError', message);
		if (confirmPasswordInput.value) {
			validateConfirmPassword();
		}
		return valid;
	}

		function validateConfirmPassword() {
		var value = confirmPasswordInput.value;
		var message = '';
		if (!value) {
			message = 'Please confirm the password';
		} else if (passwordInput.value && value !== passwordInput.value) {
			message = 'Passwords do not match';
		}
		return setError(confirmPasswordInput, 'confirmPasswordError', message);
	}

		function validateTerms() {
		var message = '';
		if (!termsCheckbox.checked) {
			message = 'You must agree to the Terms of Service and Privacy Policy.';
		}
		var errorEl = document.getElementById('termsError');
		if (errorEl) {
			errorEl.textContent = message;
		}
		return !message;
	}

		if (firstNameInput) {
		firstNameInput.required = true;
		firstNameInput.addEventListener('blur', validateFirstName);
		firstNameInput.addEventListener('input', validateFirstName);
	}

		if (lastNameInput) {
		lastNameInput.required = true;
		lastNameInput.addEventListener('blur', validateLastName);
		lastNameInput.addEventListener('input', validateLastName);
	}

		if (usernameInput) {
		usernameInput.required = true;
		usernameInput.addEventListener('blur', validateUsername);
		usernameInput.addEventListener('input', validateUsername);
	}

		if (emailInput) {
		emailInput.required = true;
		emailInput.addEventListener('blur', validateEmail);
		emailInput.addEventListener('input', validateEmail);
	}

		if (phoneInput) {
		phoneInput.required = true;
		phoneInput.addEventListener('blur', validatePhone);
		phoneInput.addEventListener('input', validatePhone);
	}

		if (addressInput) {
			addressInput.addEventListener('blur', validateAddress);
			addressInput.addEventListener('input', validateAddress);
		}

		if (cityInput) {
			cityInput.required = true;
			cityInput.addEventListener('blur', validateCity);
			cityInput.addEventListener('input', validateCity);
		}

		if (postalCodeInput) {
			postalCodeInput.addEventListener('blur', validatePostalCode);
			postalCodeInput.addEventListener('input', validatePostalCode);
		}

		if (countryInput) {
			countryInput.required = true;
			countryInput.addEventListener('blur', validateCountry);
			countryInput.addEventListener('input', validateCountry);
		}

		if (passwordInput) {
		passwordInput.required = true;
		passwordInput.addEventListener('blur', validatePassword);
		passwordInput.addEventListener('input', validatePassword);
	}

		if (confirmPasswordInput) {
		confirmPasswordInput.required = true;
		confirmPasswordInput.addEventListener('blur', validateConfirmPassword);
		confirmPasswordInput.addEventListener('input', validateConfirmPassword);
	}

		if (termsCheckbox) {
		termsCheckbox.required = true;
		termsCheckbox.addEventListener('change', validateTerms);
	}

		// On successful validation, prevent submit, save user locally, and redirect to login
		form.addEventListener('submit', function (event) {
			// Run custom validations so our rules for username, phone, password, etc. are enforced
			var valid = true;
			if (firstNameInput) valid = validateFirstName() && valid;
			if (lastNameInput) valid = validateLastName() && valid;
			if (usernameInput) valid = validateUsername() && valid;
			if (emailInput) valid = validateEmail() && valid;
			if (phoneInput) valid = validatePhone() && valid;
			if (addressInput) valid = validateAddress() && valid;
			if (cityInput) valid = validateCity() && valid;
			if (postalCodeInput) valid = validatePostalCode() && valid;
			if (countryInput) valid = validateCountry() && valid;
			if (passwordInput) valid = validatePassword() && valid;
			if (confirmPasswordInput) valid = validateConfirmPassword() && valid;
			if (termsCheckbox) valid = validateTerms() && valid;

			if (!valid) {
				// Stay on the page so the user can fix highlighted errors
				event.preventDefault();
				return;
			}

			// All checks passed – prevent actual form submission, store user locally, and go to login
			event.preventDefault();
			var userData = {
				firstName: firstNameInput ? firstNameInput.value.trim() : '',
				lastName: lastNameInput ? lastNameInput.value.trim() : '',
				username: usernameInput ? usernameInput.value.trim() : '',
				email: emailInput ? emailInput.value.trim() : '',
				phone: phoneInput ? phoneInput.value.trim() : '',
				address: addressInput ? addressInput.value.trim() : '',
				city: cityInput ? cityInput.value.trim() : '',
				postalCode: postalCodeInput ? postalCodeInput.value.trim() : '',
				country: countryInput ? countryInput.value.trim() : '',
				password: passwordInput ? passwordInput.value : '',
			};

			if (window.BookTokAuth && typeof window.BookTokAuth.saveRegisteredUser === 'function') {
				window.BookTokAuth.saveRegisteredUser(userData);
			} else {
				try {
					window.localStorage.setItem('booktokRegisteredUser', JSON.stringify(userData));
				} catch (e) {
					// ignore in demo
				}
			}

			window.location.href = 'login.html';
		});
	}

	// Password visibility toggles for any auth page (login/register)
	var toggleButtons = document.querySelectorAll('.auth-password-toggle');
	toggleButtons.forEach(function (btn) {
		btn.addEventListener('click', function () {
			var targetId = btn.getAttribute('data-target');
			var targetInput = document.getElementById(targetId);
			if (!targetInput) return;
			if (targetInput.type === 'password') {
				targetInput.type = 'text';
				btn.querySelector('i').classList.remove('bi-eye');
				btn.querySelector('i').classList.add('bi-eye-slash');
			} else {
				targetInput.type = 'password';
				btn.querySelector('i').classList.remove('bi-eye-slash');
				btn.querySelector('i').classList.add('bi-eye');
			}
		});
	});
});

