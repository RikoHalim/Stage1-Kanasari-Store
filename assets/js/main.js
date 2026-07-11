'use strict';

/* ======================
   CART STATE
   ====================== */
const cart = {
  items: {
    1: { name:'Kemeja Batik Arjuna', price:349000, qty:1 },
    2: { name:'Blus Batik Srikandi', price:235000, qty:2 },
    3: { name:'Dress Batik Lestari', price:275000, qty:1 },
  },
  get count() {
    return Object.values(this.items).reduce((s, i) => s + i.qty, 0);
  },
  get total() {
    return Object.values(this.items).reduce((s, i) => s + i.price * i.qty, 0);
  }
};

/* ======================
   INIT
   ====================== */
document.addEventListener('DOMContentLoaded', () => {
  initMobileMenu();
  initCart();
  initReveal();
  initFilters();
  updateCartUI();
  checkAuth();
  initCheckoutCustomerState();
  initWhatsAppFloating();
  updateActiveNav();
  
  // Make entire product card clickable
  document.querySelectorAll('.product-card').forEach(card => {
    card.style.cursor = 'pointer';
    card.addEventListener('click', (e) => {
      // Don't trigger if clicking on a button, icon link, or regular link inside the card
      if (!e.target.closest('button, .card-action-btn, a')) {
        window.location.href = 'product.html';
      }
    });
  });
});

/* ======================
   DYNAMIC NAVBAR
   ====================== */
function updateActiveNav() {
  const currentPath = window.location.pathname;
  document.querySelectorAll('.nav-link, .nav-mobile-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href && currentPath.includes(href)) {
      document.querySelectorAll('.nav-link, .nav-mobile-link').forEach(l => l.classList.remove('active'));
      link.classList.add('active');
    }
  });
}

/* ======================
   DEMO MODAL SYSTEM
   ====================== */
window.showDemoModal = function(title, message) {
  const existingModal = document.getElementById('demoModal');
  if (existingModal) existingModal.remove();

  const modalHtml = `
    <div id="demoModal" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.4); backdrop-filter:blur(4px); z-index:9999; display:flex; justify-content:center; align-items:center; animation:fadeIn 0.2s ease;">
      <div style="background:white; padding:32px; border-radius:16px; width:90%; max-width:400px; box-shadow:0 10px 25px rgba(0,0,0,0.1); text-align:center; transform:scale(0.95); animation:scaleUp 0.3s ease forwards;">
        <h3 style="font-family:var(--font-heading); font-size:24px; margin-bottom:16px; font-weight:700; color:var(--primary);">${title}</h3>
        <p style="font-size:16px; color:var(--neutral-600); margin-bottom:24px; line-height:1.5;">${message}</p>
        <button onclick="document.getElementById('demoModal').remove()" style="background:var(--primary); color:white; border:none; padding:12px 24px; border-radius:8px; font-size:16px; font-weight:600; cursor:pointer; width:100%;">Mengerti</button>
      </div>
    </div>
    <style>
      @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
      @keyframes scaleUp { from { transform:scale(0.95); } to { transform:scale(1); } }
    </style>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHtml);
};


function getKanasariUser() {
  const loginAt = localStorage.getItem('kanasari_login_at');
  const rawUser = localStorage.getItem('kanasari_user');
  if (!loginAt || !rawUser) {
    localStorage.removeItem('kanasari_user');
    localStorage.removeItem('kanasari_login_at');
    return null;
  }
  try {
    return JSON.parse(rawUser);
  } catch (err) {
    localStorage.removeItem('kanasari_user');
    localStorage.removeItem('kanasari_login_at');
    return null;
  }
}

function isCustomerLoggedIn() {
  const user = getKanasariUser();
  return !!user && user.role === 'customer';
}

window.goToCheckout = function() {
  if (isCustomerLoggedIn()) {
    window.location.href = 'checkout.html';
    return;
  }
  localStorage.setItem('kanasari_return_after_login', 'checkout.html');
  window.location.href = 'login.html?return=checkout.html';
};

function initCheckoutCustomerState() {
  const panel = document.getElementById('checkout-login-panel');
  if (!panel) return;
  const user = getKanasariUser();
  const nameInput = document.getElementById('nama');
  const phoneInput = document.getElementById('hp');
  const addressInput = document.getElementById('alamat');
  const citySelect = document.getElementById('kota');
  const districtSelect = document.getElementById('kecamatan');
  const provinceSelect = document.getElementById('provinsi');
  const postalInput = document.getElementById('kodepos');

  if (user && user.role === 'customer') {
    panel.style.display = 'none';
    if (nameInput && !nameInput.value) nameInput.value = user.name || 'Customer Kanasari';
    if (phoneInput && !phoneInput.value) phoneInput.value = '08123456789';
    if (addressInput && !addressInput.value) addressInput.value = 'Jl. Mawar No. 12, RT 03/RW 05, Bojongsoang';
    if (citySelect && !citySelect.value) citySelect.value = 'Kabupaten Bandung';
    if (districtSelect && !districtSelect.value) districtSelect.value = 'Bojongsoang';
    if (provinceSelect && !provinceSelect.value) provinceSelect.value = 'Jawa Barat';
    if (postalInput && !postalInput.value) postalInput.value = '40235';
    return;
  }

  panel.style.display = '';
  panel.classList.remove('logged-in');
  const loginBtn = panel.querySelector('.checkout-login-btn');
  if (loginBtn) {
    loginBtn.textContent = 'Login Customer';
    loginBtn.setAttribute('type', 'button');
    loginBtn.onclick = () => {
      localStorage.setItem('kanasari_return_after_login', 'checkout.html');
      window.location.href = 'login.html?return=checkout.html';
    };
  }
}
/* ======================
   MOCK AUTH FLOW
   ====================== */
function checkAuth() {
  const user = getKanasariUser();
  const accBtn = document.getElementById('nav-account');
  if (user && accBtn) {
    
    let menuHtml = '';
    
    if (user.role === 'admin') {
      menuHtml = `
        <a href="admin/index.html" class="profile-dropdown-item">Dashboard Admin</a>
        <a href="admin/index.html" class="profile-dropdown-item">Manajemen Pesanan</a>
        <a href="admin/index.html" class="profile-dropdown-item">Katalog Produk</a>
      `;
    } else if (user.role === 'affiliate') {
      menuHtml = `
        <a href="affiliate/index.html" class="profile-dropdown-item">Dashboard Affiliate</a>
        <a href="affiliate/index.html" class="profile-dropdown-item">Tautan Saya</a>
        <a href="affiliate/index.html" class="profile-dropdown-item">Cek Komisi</a>
      `;
    } else {
      menuHtml = `
        <a href="#" class="profile-dropdown-item" onclick="showDemoModal('Akun', 'Halaman akun pelanggan akan tersedia di Tahap 2.')">Akun Saya</a>
        <a href="#" class="profile-dropdown-item" onclick="showDemoModal('Pesanan', 'Riwayat pesanan akan tersedia di Tahap 2.')">Pesanan Saya</a>
        <a href="#" class="profile-dropdown-item" onclick="showDemoModal('Wishlist', 'Fitur Wishlist akan hadir di Tahap 2.')">Wishlist</a>
      `;
    }
    
    // Replace with dropdown wrap
    accBtn.outerHTML = `
      <div class="profile-dropdown-wrap desktop-only">
        <button class="nav-action-btn" style="white-space: nowrap; font-size:16px; font-weight:600; font-family:var(--font); letter-spacing:0.04em;">Hai, ${user.name.split(' ')[0]}</button>
        <div class="profile-dropdown-menu">
          ${menuHtml}
          <button onclick="logoutMock()" class="profile-dropdown-item text-red" style="border:none; width:100%; text-align:left; background:transparent; cursor:pointer;">Logout</button>
        </div>
      </div>
    `;

    // Add profile info to mobile hamburger menu
    const mobileMenuUl = document.querySelector('.nav-mobile ul');
    if (mobileMenuUl) {
      const mobileProfileHtml = `
        <li style="padding: 16px 24px; background: var(--neutral-50); margin-bottom: 12px; border-radius: 8px;">
          <div style="font-weight: 700; font-size: 18px; color: var(--neutral-900);">Hai, ${user.name}</div>
        </li>
        ${menuHtml.replace(/class="profile-dropdown-item"/g, 'class="nav-mobile-link"').replace(/<a /g, '<li><a ').replace(/<\/a>/g, '</a></li>')}
        <li><button onclick="logoutMock()" class="nav-mobile-link text-red" style="border:none; width:100%; text-align:left; background:transparent; padding: 12px 24px; font-size: 16px; cursor:pointer; font-family: inherit;">Logout</button></li>
      `;
      mobileMenuUl.insertAdjacentHTML('afterbegin', mobileProfileHtml);
    }
  }
}

window.logoutMock = function() {
  localStorage.removeItem('kanasari_user');
  localStorage.removeItem('kanasari_login_at');
  sessionStorage.removeItem('kanasari_session_active');
  window.location.reload();
}

/* ======================
   MOBILE MENU
   ====================== */
function initMobileMenu() {
  const btn = document.getElementById('nav-toggle-btn');
  const menu = document.getElementById('nav-mobile');
  const burger = document.getElementById('hamburger');
  if (!btn || !menu) return;

  let overlay = document.getElementById('nav-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'nav-overlay';
    overlay.id = 'nav-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    document.body.appendChild(overlay);
  }

  const open = () => {
    menu.classList.add('open');
    overlay.classList.add('open');
    burger && burger.classList.add('open');
    btn.setAttribute('aria-expanded', 'true');
    document.body.classList.add('nav-drawer-open');
  };

  const close = () => {
    menu.classList.remove('open');
    overlay.classList.remove('open');
    burger && burger.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('nav-drawer-open');
  };

  btn.addEventListener('click', () => menu.classList.contains('open') ? close() : open());
  overlay.addEventListener('click', close);
  menu.querySelectorAll('.nav-mobile-link').forEach(link => link.addEventListener('click', close));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
}

/* ======================
   CART
   ====================== */
function initCart() {
  const openBtn  = document.getElementById('cart-toggle-btn');
  const closeBtn = document.getElementById('cart-close-btn');
  const overlay  = document.getElementById('cart-overlay');
  const sidebar  = document.getElementById('cart-sidebar');
  if (!sidebar) return;

  const open  = () => { sidebar.classList.add('open'); overlay.classList.add('open'); document.body.style.overflow='hidden'; };
  const close = () => { sidebar.classList.remove('open'); overlay.classList.remove('open'); document.body.style.overflow=''; };

  openBtn  && openBtn.addEventListener('click', open);
  closeBtn && closeBtn.addEventListener('click', close);
  overlay  && overlay.addEventListener('click', close);
  document.addEventListener('keydown', e => { if(e.key==='Escape' && sidebar.classList.contains('open')) close(); });
}

function updateCartUI() {
  const badge = document.getElementById('cart-count');
  const total = document.getElementById('cart-total');
  if (badge) badge.textContent = cart.count;
  if (total) total.textContent = 'Rp ' + cart.total.toLocaleString('id-ID');
}

function addCart(name, priceStr, initialQty = 1) {
  // Parse numeric price from string like "Rp 349.000"
  const price = parseInt(priceStr.replace(/[^0-9]/g, '')) || 0;
  const newId = Date.now(); // Unique ID for cart item
  
  // Add to cart state
  cart.items[newId] = { name: name, price: price, qty: initialQty };
  
  // Update badge animation
  const badge = document.getElementById('cart-count');
  if (badge) {
    badge.style.transform = 'scale(1.6)';
    badge.style.transition = 'transform .2s cubic-bezier(.34,1.56,.64,1)';
    setTimeout(() => { badge.style.transform = 'scale(1)'; }, 250);
  }
  
  // Append new item to cart DOM
  const cartBody = document.getElementById('cart-body');
  if (cartBody) {
    // Select an image based on product name just for mockup variety
    let imgFile = 'product_1.png';
    if (name.toLowerCase().includes('blus')) imgFile = 'product_2.png';
    if (name.toLowerCase().includes('dress')) imgFile = 'product_4.png';
    
    const itemHtml = `
      <div class="cart-item" id="ci-${newId}" style="animation: fadeIn 0.3s ease;">
        <img src="assets/img/${imgFile}" alt="${name}" class="cart-item-img" loading="lazy" width="76" height="95"/>
        <div class="cart-item-info">
          <div class="cart-item-name">${name}</div>
          <div class="cart-item-variant">Ukuran: M - Warna: Pilihan</div>
          <div class="cart-item-price">${priceStr}</div>
          <div class="cart-item-qty">
            <button class="qty-btn" onclick="chQty(-1,${newId})" aria-label="Kurang">-</button>
            <span class="qty-val" id="qv-${newId}">${initialQty}</span>
            <button class="qty-btn" onclick="chQty(1,${newId})" aria-label="Tambah">+</button>
          </div>
        </div>
        <button class="cart-item-remove" onclick="rmCart(${newId})" aria-label="Hapus">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
        </button>
      </div>
    `;
    cartBody.insertAdjacentHTML('beforeend', itemHtml);
  }
  
  // Update total counts
  updateCartUI();
  
  toast(`"${name}" berhasil ditambahkan ke keranjang!`);
  
  // Open cart sidebar automatically so user sees the change
  const sidebar = document.getElementById('cart-sidebar');
  const overlay = document.getElementById('cart-overlay');
  if (sidebar && overlay) {
    sidebar.classList.add('open');
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
}

function chQty(delta, id) {
  const el = document.getElementById(`qv-${id}`);
  if (!el) return;
  const cur = parseInt(el.textContent);
  const nxt = Math.max(1, cur + delta);
  el.textContent = nxt;
  if (cart.items[id]) cart.items[id].qty = nxt;
  updateCartUI();
}

function rmCart(id) {
  const el = document.getElementById(`ci-${id}`);
  if (!el) return;
  el.style.transition = 'all .25s ease';
  el.style.opacity = '0';
  el.style.transform = 'translateX(20px)';
  setTimeout(() => {
    el.remove();
    delete cart.items[id];
    updateCartUI();
  }, 250);
}

/* ======================
   WISHLIST TOGGLE
   ====================== */
function toggleWish(btn, name) {
  const heart = btn.querySelector('svg path');
  const isOn = btn.classList.toggle('active');
  if (heart) { heart.style.fill = isOn ? '#E8725A' : 'none'; heart.style.stroke = isOn ? '#E8725A' : 'currentColor'; }
  btn.style.transform = 'scale(1.25)';
  setTimeout(() => { btn.style.transform='scale(1)'; }, 250);
  toast(isOn ? `"${name}" ditambahkan ke wishlist` : `"${name}" dihapus dari wishlist`);
}

/* ======================
   PRODUCT FILTER TABS
   ====================== */
function initFilters() { applyProductFilters(); }

function getActiveCategory() {
  return document.querySelector('.filter-tab.active')?.dataset.cat || 'all';
}

function getActiveSubcategory() {
  return document.querySelector('.sub-filter-tab.active')?.dataset.subcat || 'all';
}

function productPrice(card) {
  const raw = card.querySelector('.price-main')?.textContent || '0';
  return Number(raw.replace(/[^0-9]/g, '')) || 0;
}

function productPopularity(card) {
  const raw = card.querySelector('.product-card-rating')?.textContent || '';
  const found = raw.match(/\((\d+)/);
  return found ? Number(found[1]) : 0;
}

function sortProductCards(mode) {
  const grid = document.getElementById('products-grid');
  if (!grid) return;
  const cards = Array.from(grid.querySelectorAll('.product-card'));
  cards.forEach((card, index) => {
    if (!card.dataset.originalOrder) card.dataset.originalOrder = String(index);
  });
  const sorted = cards.slice().sort((a, b) => {
    if (mode === 'low') return productPrice(a) - productPrice(b);
    if (mode === 'high') return productPrice(b) - productPrice(a);
    if (mode === 'popular') return productPopularity(b) - productPopularity(a);
    return Number(a.dataset.originalOrder) - Number(b.dataset.originalOrder);
  });
  sorted.forEach(card => grid.appendChild(card));
}

function applyProductFilters() {
  const cat = getActiveCategory();
  const subcat = getActiveSubcategory();
  sortProductCards(subcat);
  document.querySelectorAll('.product-card').forEach(card => {
    const matchCat = cat === 'all' || card.dataset.cat === cat;
    const matchSub =
      subcat === 'all' ||
      subcat === 'low' ||
      subcat === 'high' ||
      subcat === 'popular' ||
      (subcat === 'new' && !!card.querySelector('.badge-new')) ||
      (subcat === 'best' && !!card.querySelector('.badge-best'));
    card.style.display = matchCat && matchSub ? '' : 'none';
  });
}

function filterTab(cat) {
  document.querySelectorAll('.filter-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.cat === cat);
  });
  applyProductFilters();
}

function filterSubTab(subcat) {
  document.querySelectorAll('.sub-filter-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.subcat === subcat);
  });
  applyProductFilters();
}
function togglePriceSort(button) {
  const nextMode = button.dataset.subcat === 'low' && button.classList.contains('active')
    ? 'high'
    : 'low';
  button.dataset.subcat = nextMode;
  button.setAttribute(
    'aria-label',
    nextMode === 'low'
      ? 'Urutkan harga dari rendah ke tinggi'
      : 'Urutkan harga dari tinggi ke rendah'
  );
  const icon = button.querySelector('.price-sort-icon');
  if (icon) icon.innerHTML = nextMode === 'low' ? '&#8593;' : '&#8595;';
  filterSubTab(nextMode);
}
/* ======================
   SCROLL REVEAL
   ====================== */
function initReveal() {
  const els = document.querySelectorAll('[data-reveal]');
  if (!els.length) return;
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('revealed'); obs.unobserve(e.target); } });
  }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });
  els.forEach(el => obs.observe(el));
}


/* ======================
   FLOATING WHATSAPP
   ====================== */
function initWhatsAppFloating() {
  if (document.querySelector('.whatsapp-float')) return;
  const link = document.createElement('a');
  link.className = 'whatsapp-float';
  link.href = 'https://wa.me/6281234567890?text=Halo%20Kanasari%20Store%2C%20saya%20ingin%20bertanya%20tentang%20produk.';
  link.target = '_blank';
  link.rel = 'noopener';
  link.setAttribute('aria-label', 'Hubungi Kanasari Store via WhatsApp');
  link.innerHTML = `
    <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <path d="M16.04 3.2A12.66 12.66 0 0 0 5.1 22.24L3.6 28.8l6.72-1.42A12.65 12.65 0 1 0 16.04 3.2Zm0 2.34a10.31 10.31 0 0 1 8.78 15.72 10.27 10.27 0 0 1-12.98 3.62l-.44-.22-4.1.86.9-4-.28-.46A10.31 10.31 0 0 1 16.04 5.54Zm-4.1 4.58c-.25 0-.66.1-1 .47-.34.38-1.32 1.3-1.32 3.16s1.35 3.66 1.54 3.91c.19.25 2.62 4.2 6.47 5.72 3.2 1.26 3.85 1.01 4.55.95.7-.07 2.25-.92 2.57-1.82.32-.89.32-1.66.22-1.82-.1-.16-.35-.25-.73-.45-.38-.19-2.25-1.11-2.6-1.24-.35-.13-.6-.19-.86.19-.25.38-.98 1.24-1.2 1.49-.22.25-.44.29-.82.1-.38-.19-1.6-.59-3.05-1.88-1.13-1-1.89-2.24-2.11-2.62-.22-.38-.02-.58.17-.77.17-.17.38-.45.57-.67.19-.22.25-.38.38-.64.13-.25.06-.48-.03-.67-.1-.19-.86-2.08-1.18-2.85-.31-.75-.63-.65-.86-.66h-.73Z" />
    </svg>`;
  document.body.appendChild(link);
}
/* ======================
   NEWSLETTER
   ====================== */
function nlSubmit(e) {
  e.preventDefault();
  window.open('https://wa.me/6281234567890?text=Saya%20ingin%20gabung%20channel%20WhatsApp%20Kanasari', '_blank', 'noopener');
  toast('Membuka channel WhatsApp Kanasari');
}

/* ======================
   TOAST
   ====================== */
let toastTimer;
function toast(msg) {
  const el = document.getElementById('toast');
  const msgEl = document.getElementById('toast-msg');
  if (!el || !msgEl) return;
  clearTimeout(toastTimer);
  el.classList.remove('show');
  setTimeout(() => {
    msgEl.textContent = msg;
    el.classList.add('show');
    toastTimer = setTimeout(() => el.classList.remove('show'), 3000);
  }, 50);
}

/* ======================
   SMOOTH SCROLL
   ====================== */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const id = a.getAttribute('href').slice(1);
    const target = document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    const navH = (document.getElementById('navbar')?.offsetHeight || 72);
    const annH = (document.getElementById('ann-bar')?.offsetHeight || 0);
    window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - navH - annH, behavior: 'smooth' });
  });
});

/* ======================
   SEARCH
   ====================== */
const searchInput = document.getElementById('nav-search-input');
if (searchInput) {
  searchInput.addEventListener('keydown', e => {
    if (e.key === 'Enter' && searchInput.value.trim()) {
      toast(`Mencari "${searchInput.value.trim()}"...`);
    }
  });
}

/* Make Product Images Clickable */
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.product-card-img').forEach(img => {
    img.style.cursor = 'pointer';
    img.addEventListener('click', () => {
      window.location.href = 'product.html';
    });
  });
});






