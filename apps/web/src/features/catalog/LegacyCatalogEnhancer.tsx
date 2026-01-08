"use client";

import { useEffect } from "react";

type LegacyOrderItem = {
  id?: string | number;
};

type LegacyOrder = {
  items?: LegacyOrderItem[];
};

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

type CartItem = {
  id: string;
  title: string;
  author: string;
  price: number;
  image: string;
};

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
  if (idx >= 0) {
    return "../" + path.slice(idx);
  }

  return path;
}

function readCartSafe(): CartItem[] {
  try {
    const raw = window.localStorage.getItem("booktokCart");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CartItem[]) : [];
  } catch {
    return [];
  }
}

function saveCartSafe(cart: CartItem[]): void {
  try {
    window.localStorage.setItem("booktokCart", JSON.stringify(cart));
  } catch {
    // ignore
  }
}

function updateCartBadgeFromStorage(): void {
  const badges = document.querySelectorAll<HTMLElement>(".cart-count-badge");
  if (!badges.length) return;

  const count = readCartSafe().length;
  for (const badge of Array.from(badges)) {
    if (!count) {
      badge.classList.add("d-none");
      continue;
    }

    badge.classList.remove("d-none");
    badge.textContent = count > 9 ? "9+" : String(count);
  }
}

function addToCartDatasetFallback(dataset: DOMStringMap): void {
  const id = dataset.bookId;
  if (!id) return;

  const title = dataset.bookTitle || "Untitled";
  const author = dataset.bookAuthor || "";
  const price = parseFloat(dataset.bookPrice || "0") || 0;
  const image = normalizeImagePath(dataset.bookImage || "");

  const cart = readCartSafe();
  const exists = cart.some((item) => String(item?.id) === String(id));
  if (!exists) {
    cart.push({
      id: String(id),
      title: String(title),
      author: String(author),
      price,
      image,
    });
    saveCartSafe(cart);
  }

  updateCartBadgeFromStorage();
}

function safeText(el: Element | null | undefined): string {
  return el ? String(el.textContent ?? "").trim() : "";
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

function getPurchasedIds(): Set<string> {
  const set = new Set<string>();
  const orders = readOrdersSafe();

  for (const order of orders) {
    const items = Array.isArray(order?.items) ? order.items : [];
    for (const item of items) {
      if (item && item.id != null) {
        set.add(String(item.id));
      }
    }
  }

  return set;
}

function firstTagValue(parent: Element | null, tag: string): string {
  if (!parent) return "";
  const el = parent.getElementsByTagName(tag)[0];
  return safeText(el);
}

type ParsedBook = {
  id: string;
  title: string;
  author: string;
  genre: string;
  price: number;
  rating: number;
  publishDate: string;
  coverImage: string;
  tags: string[];
};

function parseBook(bookEl: Element): ParsedBook {
  const authorEl = bookEl.getElementsByTagName("author")[0] ?? null;
  const firstName = firstTagValue(authorEl, "firstName");
  const lastName = firstTagValue(authorEl, "lastName");

  const priceEl = bookEl.getElementsByTagName("price")[0] ?? null;
  const priceRaw = priceEl ? Number(safeText(priceEl)) : 0;
  const price = Number.isFinite(priceRaw) ? priceRaw : 0;

  const ratingRaw = Number(firstTagValue(bookEl, "rating") || "0");
  const rating = Number.isFinite(ratingRaw) ? ratingRaw : 0;

  const publishDate = firstTagValue(bookEl, "publishDate");

  const tags: string[] = [];
  const tagsEl = bookEl.getElementsByTagName("tags")[0] ?? null;
  if (tagsEl) {
    const tagNodes = tagsEl.getElementsByTagName("tag");
    for (const node of Array.from(tagNodes)) {
      const v = safeText(node);
      if (v) tags.push(v);
    }
  }

  return {
    id: bookEl.getAttribute("id") || "",
    title: firstTagValue(bookEl, "title"),
    author: `${firstName} ${lastName}`.trim(),
    genre: firstTagValue(bookEl, "genre"),
    price,
    rating,
    publishDate,
    coverImage: firstTagValue(bookEl, "coverImage"),
    tags,
  };
}

function formatPrice(value: number): string {
  const n = Number.isFinite(value) ? Number(value) : 0;
  return `$${n.toFixed(2)}`;
}

function pickBadge(tags: string[]): { label: string; cls: string } | null {
  const usable = (tags || []).filter((t) => t && t !== "featured");

  const priority = [
    "staff-pick",
    "book-club",
    "classic",
    "new",
    "popular",
    "high-rated",
    "bestseller",
    "trending",
    "sale",
  ];

  let tag = "";
  for (const p of priority) {
    if (usable.includes(p)) {
      tag = p;
      break;
    }
  }

  const map: Record<string, { label: string; cls: string }> = {
    bestseller: { label: "Bestseller", cls: "badge rounded-pill bg-danger-subtle text-danger" },
    "staff-pick": { label: "Staff pick", cls: "badge rounded-pill bg-success-subtle text-success" },
    "book-club": {
      label: "Book club",
      cls: "badge rounded-pill bg-warning-subtle text-warning-emphasis",
    },
    classic: { label: "Classic", cls: "badge rounded-pill bg-info-subtle text-info" },
    new: { label: "New", cls: "badge rounded-pill bg-danger-subtle text-danger" },
    popular: { label: "Popular", cls: "badge rounded-pill bg-primary-subtle text-primary" },
    "high-rated": {
      label: "High rated",
      cls: "badge rounded-pill bg-success-subtle text-success",
    },
    trending: { label: "Trending", cls: "badge rounded-pill bg-primary-subtle text-primary" },
    sale: { label: "Sale", cls: "badge rounded-pill bg-success-subtle text-success" },
  };

  return map[tag] || null;
}

function isFeatured(tags: string[]): number {
  return tags.includes("featured") ? 1 : 0;
}

function isUnavailable(tags: string[]): boolean {
  return (tags || []).some((t) => String(t || "").trim().toLowerCase() === "unavailable");
}

function escapeAttr(value: string): string {
  return String(value).replace(/"/g, "&quot;");
}

function renderBookCard(book: ParsedBook, purchasedIds: Set<string>): HTMLDivElement {
  const unavailable = isUnavailable(book.tags);
  const available = !unavailable;
  const badge = pickBadge(book.tags);
  const featured = isFeatured(book.tags);
  const purchased = purchasedIds.has(String(book.id));

  const wrapper = document.createElement("div");
  wrapper.className = "col-12 col-sm-6 col-lg-4 catalog-book-item";
  wrapper.dataset.bookId = String(book.id);
  wrapper.dataset.title = book.title;
  wrapper.dataset.author = book.author;
  wrapper.dataset.category = book.genre;
  wrapper.dataset.price = String(book.price.toFixed(2));
  wrapper.dataset.rating = String(book.rating.toFixed(1));
  wrapper.dataset.featured = String(featured);
  wrapper.dataset.date = book.publishDate || "";

  const categoryBadge =
    '<span class="badge bg-light text-muted border catalog-book-tag">' + book.genre + "</span>";

  const secondBadge = badge ? `<span class="${badge.cls}">${badge.label}</span>` : "";

  const purchasedBadge = purchased
    ? '<span class="badge rounded-pill bg-success-subtle text-success">Purchased</span>'
    : "";

  const ratingHtml =
    '<span class="catalog-book-rating">' +
    '<i class="bi bi-star-fill text-warning me-1"></i>' +
    book.rating.toFixed(1) +
    "</span>";

  const availabilityText = available ? "Available" : "Currently unavailable";

  let actionsHtml = "";
  if (available && !purchased) {
    actionsHtml =
      '<div class="catalog-book-actions">' +
      '  <button type="button" class="btn btn-sm btn-primary rounded-circle catalog-book-cart-icon"' +
      '    data-cart-action="add"' +
      '    data-book-id="' +
      String(book.id) +
      '"' +
      '    data-book-title="' +
      escapeAttr(book.title) +
      '"' +
      '    data-book-author="' +
      escapeAttr(book.author) +
      '"' +
      '    data-book-price="' +
      String(book.price.toFixed(2)) +
      '"' +
      '    data-book-image="' +
      escapeAttr(String(book.coverImage)) +
      '"' +
      "  >" +
      '    <i class="bi bi-cart-plus"></i>' +
      "  </button>" +
      '  <button type="button" class="btn btn-sm btn-outline-primary catalog-book-buy-btn"' +
      '    data-cart-action="buy"' +
      '    data-book-id="' +
      String(book.id) +
      '"' +
      '    data-book-title="' +
      escapeAttr(book.title) +
      '"' +
      '    data-book-author="' +
      escapeAttr(book.author) +
      '"' +
      '    data-book-price="' +
      String(book.price.toFixed(2)) +
      '"' +
      '    data-book-image="' +
      escapeAttr(String(book.coverImage)) +
      '"' +
      "  >Buy</button>" +
      "</div>";
  } else if (available && purchased) {
    actionsHtml =
      '<div class="catalog-book-actions">' +
      '  <button type="button" class="btn btn-sm btn-primary rounded-circle catalog-book-cart-icon" disabled aria-disabled="true" title="Already purchased">' +
      '    <i class="bi bi-cart-plus"></i>' +
      "  </button>" +
      '  <button type="button" class="btn btn-sm btn-outline-primary catalog-book-buy-btn" disabled aria-disabled="true" title="Already purchased">In Library</button>' +
      "</div>";
  } else {
    actionsHtml =
      '<button type="button" class="btn btn-sm btn-outline-secondary" disabled>' +
      '  <i class="bi bi-cart-plus me-1"></i>Unavailable' +
      "</button>";
  }

  wrapper.innerHTML =
    '<div class="card h-100 shadow-sm border-0 catalog-book-card">' +
    '  <div class="catalog-book-media">' +
    '    <img src="' +
    escapeAttr(String(book.coverImage)) +
    '" class="catalog-book-cover card-img-top" alt="' +
    escapeAttr(book.title) +
    ' cover">' +
    "  </div>" +
    '  <div class="card-body d-flex flex-column">' +
    '    <div class="d-flex justify-content-between align-items-center mb-2 small">' +
    categoryBadge +
    (secondBadge ? secondBadge : "") +
    (purchasedBadge ? purchasedBadge : "") +
    "    </div>" +
    '    <h5 class="card-title mb-1">' +
    book.title +
    "</h5>" +
    '    <p class="card-subtitle text-muted small mb-2">' +
    book.author +
    "</p>" +
    '    <div class="d-flex align-items-center gap-2 mb-2 small text-muted">' +
    ratingHtml +
    "      <span>&middot;</span>" +
    "      <span>" +
    availabilityText +
    "</span>" +
    "    </div>" +
    '    <div class="mt-auto d-flex justify-content-between align-items-center">' +
    '      <span class="fw-semibold">' +
    formatPrice(book.price) +
    "</span>" +
    actionsHtml +
    "    </div>" +
    "  </div>" +
    "</div>";

  return wrapper;
}

function initFilteringAndSorting(): void {
  let booksGrid: HTMLElement | null = null;
  let bookItems: HTMLElement[] = [];
  let searchInput: HTMLInputElement | null = null;
  let sortMenu: HTMLElement | null = null;
  let sortLabel: HTMLElement | null = null;
  let categoryList: HTMLElement | null = null;
  let priceMinInput: HTMLInputElement | null = null;
  let priceMaxInput: HTMLInputElement | null = null;
  let emptyState: HTMLElement | null = null;
  let clearFiltersEmptyBtn: HTMLElement | null = null;
  let gridViewBtn: HTMLElement | null = null;
  let listViewBtn: HTMLElement | null = null;
  let currentSort = "featured";
  let controlsBound = false;

  function refreshDomRefs() {
    booksGrid = document.getElementById("catalogBooksGrid");
    searchInput = document.getElementById("catalogSearchInput") as HTMLInputElement | null;
    sortMenu = document.getElementById("catalogSortMenu");
    sortLabel = document.getElementById("catalogSortLabel");
    categoryList = document.getElementById("catalogCategoryList");
    priceMinInput = document.getElementById("priceMinInput") as HTMLInputElement | null;
    priceMaxInput = document.getElementById("priceMaxInput") as HTMLInputElement | null;
    emptyState = document.getElementById("catalogEmptyState");
    clearFiltersEmptyBtn = document.getElementById("catalogClearFiltersEmpty");
    gridViewBtn = document.getElementById("gridViewBtn");
    listViewBtn = document.getElementById("listViewBtn");
  }

  function refreshBookItems() {
    if (!booksGrid) {
      bookItems = [];
      return;
    }

    bookItems = Array.from(booksGrid.querySelectorAll<HTMLElement>(".catalog-book-item"));

    // Preserve original order for "Featured" sort
    bookItems.forEach((item, index) => {
      if (!item.dataset.index) {
        item.dataset.index = String(index);
      }
    });
  }

  function getActiveCategory(): string {
    if (!categoryList) return "all";
    const active = categoryList.querySelector<HTMLElement>(".list-group-item.active");
    return active ? active.getAttribute("data-category") || "all" : "all";
  }

  function applyFiltersAndSort() {
    if (!booksGrid) return;

    const termValue = searchInput?.value ? searchInput.value : "";
    const term = termValue.trim().toLowerCase();
    const activeCategory = getActiveCategory();
    const minPrice = parseFloat(priceMinInput?.value || "0");
    const maxPrice = parseFloat(priceMaxInput?.value || "999999");
    const sortBy = currentSort || "featured";

    const visibleItems: HTMLElement[] = [];

    for (const item of bookItems) {
      const title = (item.dataset.title || "").toLowerCase();
      const author = (item.dataset.author || "").toLowerCase();
      const category = item.dataset.category || "";
      const categoryLower = category.toLowerCase();
      const price = parseFloat(item.dataset.price || "0");
      let matches = true;

      if (term) {
        matches = title.includes(term) || author.includes(term) || categoryLower.includes(term);
      }

      if (matches && activeCategory && activeCategory !== "all") {
        matches = category === activeCategory;
      }

      if (matches && !Number.isNaN(minPrice)) {
        matches = price >= minPrice;
      }

      if (matches && !Number.isNaN(maxPrice)) {
        matches = price <= maxPrice;
      }

      if (matches) {
        item.classList.remove("d-none");
        visibleItems.push(item);
      } else {
        item.classList.add("d-none");
      }
    }

    visibleItems.sort((a, b) => {
      const aPrice = parseFloat(a.dataset.price || "0");
      const bPrice = parseFloat(b.dataset.price || "0");
      const aRating = parseFloat(a.dataset.rating || "0");
      const bRating = parseFloat(b.dataset.rating || "0");
      const aFeatured = a.dataset.featured === "1" ? 1 : 0;
      const bFeatured = b.dataset.featured === "1" ? 1 : 0;
      const aDate = a.dataset.date || "";
      const bDate = b.dataset.date || "";
      const aIndex = parseInt(a.dataset.index || "0", 10);
      const bIndex = parseInt(b.dataset.index || "0", 10);

      if (sortBy === "price-asc") return aPrice - bPrice;
      if (sortBy === "price-desc") return bPrice - aPrice;
      if (sortBy === "rating-desc") return bRating - aRating;
      if (sortBy === "newest") {
        if (aDate > bDate) return -1;
        if (aDate < bDate) return 1;
        return 0;
      }

      if (bFeatured !== aFeatured) return bFeatured - aFeatured;
      return aIndex - bIndex;
    });

    for (const item of visibleItems) {
      booksGrid.appendChild(item);
    }

    if (emptyState) {
      if (visibleItems.length === 0) emptyState.classList.remove("d-none");
      else emptyState.classList.add("d-none");
    }
  }

  function resetFilters() {
    if (searchInput) searchInput.value = "";
    if (priceMinInput) priceMinInput.value = "0";
    if (priceMaxInput) priceMaxInput.value = "100";

    currentSort = "featured";
    if (sortLabel) sortLabel.textContent = "Featured";

    if (sortMenu) {
      const items = Array.from(sortMenu.querySelectorAll<HTMLElement>(".dropdown-item"));
      for (const item of items) {
        item.classList.toggle("active", item.getAttribute("data-sort-value") === "featured");
      }
    }

    if (categoryList) {
      const btns = Array.from(categoryList.querySelectorAll<HTMLElement>(".list-group-item"));
      for (const btn of btns) {
        btn.classList.toggle("active", btn.getAttribute("data-category") === "all");
      }
    }

    applyFiltersAndSort();
  }

  function setGridLayout(isGrid: boolean) {
    if (!booksGrid) return;

    if (isGrid) {
      booksGrid.classList.remove("list-view");
      gridViewBtn?.classList.add("active");
      listViewBtn?.classList.remove("active");
    } else {
      booksGrid.classList.add("list-view");
      gridViewBtn?.classList.remove("active");
      listViewBtn?.classList.add("active");
    }
  }

  function bindLayoutOnce() {
    if (gridViewBtn && gridViewBtn.dataset.boundLayout !== "1") {
      gridViewBtn.dataset.boundLayout = "1";
      gridViewBtn.addEventListener("click", () => setGridLayout(true));
    }

    if (listViewBtn && listViewBtn.dataset.boundLayout !== "1") {
      listViewBtn.dataset.boundLayout = "1";
      listViewBtn.addEventListener("click", () => setGridLayout(false));
    }
  }

  function applyInitialCategoryOnce() {
    if (!categoryList || categoryList.dataset.boundInitialCategory === "1") return;
    categoryList.dataset.boundInitialCategory = "1";

    try {
      const params = new URLSearchParams(window.location.search);
      const initialCategory = params.get("category");
      if (initialCategory) {
        const targetBtn = categoryList.querySelector<HTMLElement>(
          `.list-group-item[data-category="${initialCategory}"]`
        );
        if (targetBtn) {
          const btns = Array.from(categoryList.querySelectorAll<HTMLElement>(".list-group-item"));
          for (const btn of btns) {
            btn.classList.toggle("active", btn === targetBtn);
          }
        }
      }
    } catch {
      // ignore
    }
  }

  function setupBuyNowButtons() {
    const buyButtons = Array.from(
      document.querySelectorAll<HTMLButtonElement>(
        '[data-cart-action="buy"][data-book-id]'
      )
    );

    for (const btn of buyButtons) {
      if (btn.dataset.boundBuy === "1") continue;
      btn.dataset.boundBuy = "1";

      btn.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();

        if (window.BookTokCart && typeof window.BookTokCart.addFromDataset === "function") {
          window.BookTokCart.addFromDataset(btn.dataset);
          if (typeof window.BookTokCart.updateBadge === "function") {
            window.BookTokCart.updateBadge();
          }
        } else {
          addToCartDatasetFallback(btn.dataset);
        }

        window.location.href = "order.html";
      });
    }
  }

  function setupBookCardNavigation() {
    for (const item of bookItems) {
      if (item.dataset.boundNav === "1") continue;
      item.dataset.boundNav = "1";

      item.addEventListener("click", (event) => {
        const target = (event as MouseEvent).target as Element | null;
        if (target && target.closest && target.closest("[data-cart-action]")) {
          return;
        }

        const id = item.dataset.bookId;
        if (!id) return;
        window.location.href = `book.html?id=${encodeURIComponent(id)}`;
      });
    }
  }

  function bindControlsOnce() {
    if (controlsBound) return;
    controlsBound = true;

    searchInput?.addEventListener("input", applyFiltersAndSort);

    if (sortMenu) {
      sortMenu.addEventListener("click", (e) => {
        const target = (e.target as Element | null)?.closest?.(".dropdown-item") as
          | HTMLElement
          | null;
        if (!target) return;

        const value = target.getAttribute("data-sort-value") || "featured";
        currentSort = value;
        if (sortLabel) sortLabel.textContent = target.textContent?.trim() || "Featured";

        const items = Array.from(
          (e.currentTarget as HTMLElement).querySelectorAll<HTMLElement>(".dropdown-item")
        );
        for (const item of items) item.classList.remove("active");
        target.classList.add("active");

        applyFiltersAndSort();
      });
    }

    priceMinInput?.addEventListener("change", applyFiltersAndSort);
    priceMaxInput?.addEventListener("change", applyFiltersAndSort);

    if (categoryList) {
      categoryList.addEventListener("click", (e) => {
        const target = (e.target as Element | null)?.closest?.(".list-group-item") as
          | HTMLElement
          | null;
        if (!target) return;

        const btns = Array.from(
          (e.currentTarget as HTMLElement).querySelectorAll<HTMLElement>(".list-group-item")
        );
        for (const btn of btns) btn.classList.remove("active");
        target.classList.add("active");

        applyFiltersAndSort();
      });
    }

    clearFiltersEmptyBtn?.addEventListener("click", resetFilters);
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

  // idempotent: can be called after grid re-render
  init();
  document.addEventListener("booktok:catalog-rendered", init);
}

async function renderCatalogFromXml(): Promise<void> {
  const grid = document.getElementById("catalogBooksGrid");
  if (!grid) return;

  const purchasedIds = getPurchasedIds();

  // Clear any hard-coded items
  grid.innerHTML = "";

  try {
    const res = await fetch("/xml/books.xml", { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to load books.xml");

    const xmlText = await res.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, "application/xml");

    const parseErr = doc.getElementsByTagName("parsererror")[0];
    if (parseErr) throw new Error("books.xml is not valid XML");

    const books = Array.from(doc.getElementsByTagName("book")).map(parseBook);
    for (const book of books) {
      grid.appendChild(renderBookCard(book, purchasedIds));
    }
  } finally {
    document.dispatchEvent(new Event("booktok:catalog-rendered"));
  }
}

export function LegacyCatalogEnhancer() {
  useEffect(() => {
    // Avoid double-binding in React Strict Mode by attaching a flag to the grid.
    const grid = document.getElementById("catalogBooksGrid") as HTMLElement | null;
    if (grid && grid.dataset.tsCatalogBound === "1") return;
    if (grid) grid.dataset.tsCatalogBound = "1";

    void renderCatalogFromXml();
    initFilteringAndSorting();
  }, []);

  return null;
}
