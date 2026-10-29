/* QuickMart demo store: search, filters, sorting, wishlist and cart */
"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const searchForm = document.querySelector("#search-form");
  const searchInput = document.querySelector("#search-input");
  const productGrid = document.querySelector("#product-grid");
  const products = [...document.querySelectorAll(".product-card")];
  const noResults = document.querySelector("#no-results");
  const resultsCount = document.querySelector("#results-count");
  const sortSelect = document.querySelector("#sort-select");
  const cartCount = document.querySelector("#cart-count");
  const toast = document.querySelector("#toast");
  const cartDialog = document.querySelector("#cart-dialog");
  const cartItemsContainer = document.querySelector("#cart-items");
  const cartTotal = document.querySelector("#cart-total");
  const cart = new Map();
  let toastTimeout;

  document.querySelector("#year").textContent = new Date().getFullYear();

  // Mobile navigation
  const mobileToggle = document.querySelector("#mobile-menu-toggle");
  const mainLinks = document.querySelector("#main-links");
  mobileToggle.addEventListener("click", () => {
    const open = mainLinks.classList.toggle("is-open");
    mobileToggle.setAttribute("aria-expanded", String(open));
    mobileToggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
  });
  mainLinks.querySelectorAll("a").forEach(link => link.addEventListener("click", () => {
    mainLinks.classList.remove("is-open");
    mobileToggle.setAttribute("aria-expanded", "false");
  }));

  // Expand/collapse category shortcuts
  const categoryMenu = document.querySelector("#category-menu");
  const categoryLinks = document.querySelector("#category-links");
  categoryMenu.addEventListener("click", () => {
    const expanded = categoryMenu.getAttribute("aria-expanded") === "true";
    categoryMenu.setAttribute("aria-expanded", String(!expanded));
    categoryLinks.hidden = expanded;
  });
  categoryLinks.querySelectorAll("a").forEach(link => link.addEventListener("click", () => {
    categoryLinks.hidden = true;
    categoryMenu.setAttribute("aria-expanded", "false");
  }));

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    window.clearTimeout(toastTimeout);
    toastTimeout = window.setTimeout(() => toast.classList.remove("show"), 2600);
  }

  // Search products by visible product name/category
  function filterProducts() {
    const query = searchInput.value.trim().toLowerCase();
    let visible = 0;
    products.forEach(card => {
      const matches = `${card.dataset.name} ${card.dataset.category} ${card.textContent}`.toLowerCase().includes(query);
      card.hidden = !matches;
      if (matches) visible += 1;
    });
    noResults.hidden = visible > 0;
    resultsCount.textContent = `${visible} product${visible === 1 ? "" : "s"}`;
  }

  searchForm.addEventListener("submit", event => {
    event.preventDefault();
    filterProducts();
    document.querySelector("#products").scrollIntoView({ behavior: "smooth" });
  });
  searchInput.addEventListener("input", filterProducts);

  // Sort cards while preserving the search filter
  sortSelect.addEventListener("change", () => {
    const sorted = [...products];
    if (sortSelect.value === "price-low") sorted.sort((a, b) => Number(a.dataset.price) - Number(b.dataset.price));
    if (sortSelect.value === "price-high") sorted.sort((a, b) => Number(b.dataset.price) - Number(a.dataset.price));
    if (sortSelect.value === "featured") sorted.sort((a, b) => products.indexOf(a) - products.indexOf(b));
    sorted.forEach(card => productGrid.appendChild(card));
    filterProducts();
  });

  // Wishlist hearts
  document.querySelectorAll(".wishlist").forEach(button => {
    button.addEventListener("click", () => {
      const active = button.getAttribute("aria-pressed") === "true";
      button.setAttribute("aria-pressed", String(!active));
      button.textContent = active ? "♡" : "♥";
      showToast(active ? "Removed from your wishlist." : "Added to your wishlist.");
    });
  });

  // Cart functions
  function updateCartCount() {
    let count = 0;
    cart.forEach(item => count += item.quantity);
    cartCount.textContent = String(count);
  }

  function renderCart() {
    cartItemsContainer.innerHTML = "";
    if (cart.size === 0) {
      cartItemsContainer.innerHTML = "<p>Your cart is empty. Add a product to get started.</p>";
      cartTotal.textContent = "₹0";
      return;
    }
    let total = 0;
    cart.forEach((item, name) => {
      total += item.price * item.quantity;
      const line = document.createElement("div");
      line.className = "cart-line";
      const description = document.createElement("div");
      description.textContent = name;
      const sub = document.createElement("small");
      sub.textContent = `₹${item.price} each`;
      description.appendChild(sub);

      const controls = document.createElement("div");
      controls.className = "qty-controls";
      const minus = document.createElement("button");
      minus.type = "button"; minus.textContent = "−"; minus.setAttribute("aria-label", `Remove one ${name}`);
      minus.addEventListener("click", () => changeQuantity(name, -1));
      const quantity = document.createElement("span");
      quantity.textContent = String(item.quantity);
      const plus = document.createElement("button");
      plus.type = "button"; plus.textContent = "+"; plus.setAttribute("aria-label", `Add one ${name}`);
      plus.addEventListener("click", () => changeQuantity(name, 1));
      controls.append(minus, quantity, plus);

      const subtotal = document.createElement("strong");
      subtotal.textContent = `₹${item.price * item.quantity}`;
      line.append(description, controls, subtotal);
      cartItemsContainer.appendChild(line);
    });
    cartTotal.textContent = `₹${total.toLocaleString("en-IN")}`;
  }

  function changeQuantity(name, delta) {
    const item = cart.get(name);
    if (!item) return;
    item.quantity += delta;
    if (item.quantity <= 0) cart.delete(name);
    updateCartCount();
    renderCart();
  }

  document.querySelectorAll(".add-button").forEach(button => {
    button.addEventListener("click", () => {
      const name = button.dataset.product;
      const price = Number(button.dataset.price);
      const existing = cart.get(name);
      if (existing) existing.quantity += 1;
      else cart.set(name, { price, quantity: 1 });
      updateCartCount();
      showToast(`${name} added to cart.`);
    });
  });

  document.querySelector("#cart-button").addEventListener("click", () => {
    renderCart();
    if (typeof cartDialog.showModal === "function") cartDialog.showModal();
    else showToast("Cart preview is not supported in this browser.");
  });
  document.querySelector("#close-cart").addEventListener("click", () => cartDialog.close());
  document.querySelector("#demo-checkout").addEventListener("click", () => cartDialog.close());
  cartDialog.addEventListener("click", event => {
    if (event.target === cartDialog) cartDialog.close();
  });

  // If an external product photo fails, use a neutral branded placeholder.
  document.querySelectorAll(".product-image img").forEach(img => {
    img.addEventListener("error", () => {
      img.style.display = "none";
      const fallback = document.createElement("div");
      fallback.className = "image-fallback";
      fallback.textContent = "QuickMart";
      fallback.style.cssText = "display:grid;place-items:center;width:100%;height:100%;background:#eef4f0;color:#147243;font-size:22px;font-weight:800;border-radius:8px";
      img.parentElement.appendChild(fallback);
    }, { once: true });
  });
});
