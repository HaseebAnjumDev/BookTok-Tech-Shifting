"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

type CartItem = {
  id: string;
  title: string;
  author: string;
  price: number;
  image: string;
};

type LegacyOrderItem = { id?: string | number };

type LegacyOrder = { items?: LegacyOrderItem[] };

declare global {
  interface Window {
    BookTokAuth?: {
      readOrders?: () => unknown;
    };
    BookTokCart?: {
      readCart?: () => CartItem[];
      addFromDataset?: (dataset: DOMStringMap) => void;
      getCount?: () => number;
      updateBadge?: () => void;
      clear?: () => void;
    };
  }
}

const STORAGE_KEY = "booktokCart";

function readCart(): CartItem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CartItem[]) : [];
  } catch {
    return [];
  }
}

function saveCart(cart: CartItem[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  } catch {
    // ignore
  }
}

function getCartCount(cart: CartItem[]): number {
  return Array.isArray(cart) ? cart.length : 0;
}

function normalizeImagePath(pathValue: string): string {
  const path = String(pathValue || "");
  if (!path) return "";

  if (path.startsWith("../assets/")) return path;

  if (path.startsWith("frontend/assets/")) {
    return "../" + path.substring("frontend/".length);
  }

  if (path.startsWith("/frontend/assets/")) {
    return "../" + path.substring("/frontend/".length);
  }

  const idx = path.indexOf("assets/");
  if (idx >= 0) return "../" + path.slice(idx);

  return path;
}

function updateCartBadge(cart: CartItem[]): void {
  const badges = document.querySelectorAll<HTMLElement>(".cart-count-badge");
  if (!badges.length) return;

  const count = getCartCount(cart);
  for (const badge of Array.from(badges)) {
    if (!count) {
      badge.classList.add("d-none");
      continue;
    }

    badge.classList.remove("d-none");
    badge.textContent = count > 9 ? "9+" : String(count);
  }
}

function showCartToast(message: string): void {
  const existing = document.getElementById("cartToast");
  if (existing) {
    const textEl = existing.querySelector<HTMLElement>(".cart-toast-text");
    if (textEl) textEl.textContent = message;
    existing.classList.add("show");
    window.setTimeout(() => existing.classList.remove("show"), 2200);
    return;
  }

  const toast = document.createElement("div");
  toast.id = "cartToast";
  toast.className = "cart-toast";
  toast.innerHTML = '<span class="cart-toast-text"></span>';
  const textEl = toast.querySelector<HTMLElement>(".cart-toast-text");
  if (textEl) textEl.textContent = message;
  document.body.appendChild(toast);

  window.requestAnimationFrame(() => toast.classList.add("show"));
  window.setTimeout(() => toast.classList.remove("show"), 2200);
}

function readOrdersSafe(): LegacyOrder[] {
  try {
    if (window.BookTokAuth && typeof window.BookTokAuth.readOrders === "function") {
      const fromApi = window.BookTokAuth.readOrders();
      return Array.isArray(fromApi) ? (fromApi as LegacyOrder[]) : [];
    }

    const raw = window.localStorage.getItem("booktokOrders");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as LegacyOrder[]) : [];
  } catch {
    return [];
  }
}

function isBookAlreadyPurchased(bookId: string): boolean {
  if (bookId == null) return false;
  const idStr = String(bookId);
  const orders = readOrdersSafe();
  return orders.some((order) => {
    const items = order && Array.isArray(order.items) ? order.items : [];
    return items.some((item) => String(item && item.id) === idStr);
  });
}

function addToCartFromDataset(dataset: DOMStringMap): void {
  const id = dataset.bookId;
  if (!id) return;

  const title = dataset.bookTitle || "Untitled";
  const author = dataset.bookAuthor || "";
  const price = parseFloat(dataset.bookPrice || "0") || 0;
  const image = normalizeImagePath(dataset.bookImage || "");

  if (isBookAlreadyPurchased(String(id))) {
    showCartToast('"' + title + '" is already in your library');
    return;
  }

  const cart = readCart();
  const exists = cart.some((item) => String(item?.id) === String(id));
  if (!exists) {
    cart.push({
      id: String(id),
      title: String(title),
      author: String(author),
      price,
      image,
    });
    saveCart(cart);
  }

  updateCartBadge(cart);
  showCartToast('Added "' + title + '" to your cart');
}

function formatPrice(value: unknown): string {
  const number = Number.isFinite(Number(value)) ? Number(value) : 0;
  return "$" + number.toFixed(2);
}

function renderOrderPageIfPresent(): void {
  const container = document.getElementById("orderItemsContainer");
  const countLabel = document.getElementById("orderItemsCountLabel");
  const subtotalEl = document.getElementById("orderSubtotal");
  const totalEl = document.getElementById("orderTotal");
  const proceedBtn = document.getElementById("proceedToPaymentBtn");

  if (!container || !subtotalEl || !totalEl) return;

  const containerEl = container as HTMLElement;
  const subtotalTextEl = subtotalEl as HTMLElement;
  const totalTextEl = totalEl as HTMLElement;

  function rerender(): void {
    const cart = readCart();
    const count = getCartCount(cart);

    if (countLabel) {
      countLabel.textContent = count
        ? "(" + count + " item" + (count > 1 ? "s" : "") + ")"
        : "(0 items)";
    }

    if (!count) {
      if (proceedBtn) {
        proceedBtn.classList.add("disabled");
        proceedBtn.setAttribute("aria-disabled", "true");
      }

      containerEl.innerHTML =
        '<div class="order-empty-state">' +
        '  <div class="order-empty-icon mb-3">' +
        '    <i class="bi bi-cart"></i>' +
        "  </div>" +
        '  <h2 class="order-empty-title mb-2">Your Cart is Empty</h2>' +
        '  <p class="order-empty-text mb-4">Looks like you haven&#39;t added any books yet.</p>' +
        '  <a href="catalog.html" class="btn order-empty-btn">Browse Books</a>' +
        "</div>";

      subtotalTextEl.textContent = formatPrice(0);
      totalTextEl.textContent = formatPrice(0);
      updateCartBadge(cart);
      return;
    }

    if (proceedBtn) {
      proceedBtn.classList.remove("disabled");
      proceedBtn.removeAttribute("aria-disabled");
    }

    containerEl.innerHTML = "";

    let subtotal = 0;

    for (const item of cart) {
      const priceNumber = Number.isFinite(Number(item.price)) ? Number(item.price) : 0;
      subtotal += priceNumber;

      const card = document.createElement("div");
      card.className = "order-item-card mb-3";
      card.dataset.bookId = String(item.id);

      const hasImage = !!item.image;
      const safeTitle = String(item.title || "Untitled").replace(/"/g, "&quot;");

      card.innerHTML =
        '<div class="row g-3 align-items-center">' +
        '  <div class="col-auto">' +
        '    <div class="order-item-cover-wrapper">' +
        (hasImage
          ? '      <img src="' +
            String(item.image) +
            '" alt="' +
            safeTitle +
            ' cover" class="order-item-cover">'
          : '      <div class="order-item-cover-placeholder"><i class="bi bi-book"></i></div>') +
        '    </div>' +
        '  </div>' +
        '  <div class="col">' +
        '    <div class="d-flex justify-content-between align-items-start mb-1">' +
        '      <div>' +
        '        <h6 class="order-item-title mb-1">' +
        String(item.title || "Untitled") +
        '</h6>' +
        '        <p class="order-item-author text-muted mb-0">' +
        String(item.author || "") +
        '</p>' +
        '      </div>' +
        '      <div class="order-item-price fw-semibold">' +
        formatPrice(item.price) +
        '</div>' +
        '    </div>' +
        '    <div class="d-flex align-items-center gap-3 mt-2">' +
        '      <button type="button" class="btn btn-link text-danger p-0 order-remove-btn" aria-label="Remove ' +
        safeTitle +
        ' from order">' +
        '        <i class="bi bi-trash3"></i>' +
        '      </button>' +
        '    </div>' +
        '  </div>' +
        '</div>';

      containerEl.appendChild(card);
    }

    subtotalTextEl.textContent = formatPrice(subtotal);
    totalTextEl.textContent = formatPrice(subtotal); // no tax, total equals subtotal
    updateCartBadge(cart);

    const removeButtons = Array.from(
      containerEl.querySelectorAll<HTMLButtonElement>(".order-remove-btn")
    );
    for (const btn of removeButtons) {
      btn.addEventListener("click", () => {
        const parentCard = btn.closest<HTMLElement>(".order-item-card");
        const id = parentCard?.dataset.bookId;
        if (!id) return;

        const cartNow = readCart().filter((x) => String(x?.id) !== String(id));
        saveCart(cartNow);
        updateCartBadge(cartNow);
        rerender();
      });
    }
  }

  rerender();
}

let bound = false;

export function LegacyCartRuntime() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Expose API for legacy code (e.g. book-details.js)
    window.BookTokCart = {
      readCart,
      addFromDataset: addToCartFromDataset,
      getCount: () => getCartCount(readCart()),
      updateBadge: () => updateCartBadge(readCart()),
      clear: () => {
        saveCart([]);
        updateCartBadge([]);
        renderOrderPageIfPresent();
      },
    };

    updateCartBadge(readCart());
    renderOrderPageIfPresent();

    if (!bound) {
      bound = true;

      document.addEventListener("click", (event) => {
        const target = (event.target as Element | null) ?? null;
        if (!target || !(target as any).closest) return;

        const btn = (target as any).closest('[data-cart-action="add"][data-book-id]') as
          | HTMLButtonElement
          | null;
        if (!btn) return;

        event.preventDefault();
        event.stopPropagation();
        addToCartFromDataset(btn.dataset);
      });

      window.addEventListener("storage", (e) => {
        if (!e || e.key !== STORAGE_KEY) return;
        updateCartBadge(readCart());
        renderOrderPageIfPresent();
      });
    }
  }, [pathname, searchParams]);

  return null;
}
