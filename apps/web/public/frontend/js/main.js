// Global site-wide behaviors for BookTok frontend
// - Footer year
// - Optional back-to-top button on pages that include it

(function () {
	function initFooterYear() {
		var yearSpan = document.getElementById('currentYear');
		if (yearSpan) {
			yearSpan.textContent = new Date().getFullYear();
		}
	}

	function initBackToTop() {
		var backToTop = document.getElementById('backToTop');
		if (!backToTop) return;

		function toggleBackToTop() {
			if (window.scrollY > 250) {
				backToTop.classList.add('show');
			} else {
				backToTop.classList.remove('show');
			}
		}

		window.addEventListener('scroll', toggleBackToTop, { passive: true });
		backToTop.addEventListener('click', function () {
			window.scrollTo({ top: 0, behavior: 'smooth' });
		});

		// Initialize state on load
		toggleBackToTop();
	}

	document.addEventListener('DOMContentLoaded', function () {
		initFooterYear();
		initBackToTop();
	});
})();

