const FULL_CATEGORIES = [
    'Seni',
    'Antik',
    'Jam Tangan',
    'Permadani',
    'Kaligrafi',
    'Kendaraan Lain',
    'Barang Antik',
    'Vas',
    'Aksesoris',
    'Mobil Bekas',
    'Motor Bekas',
    'Perabotan',
    'Lukisan 90s',
    'Barang Elektronik',
    'Permata',
    'Random'
];

function showPage(pageId) {
    const pages = ['auctionPage', 'addItemPage', 'myItemsPage', 'myBidsPage', 'profilePage', 'adminPage'];
    pages.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = (id === pageId) ? 'block' : 'none';
    });
}

// Require login helper: returns user object if logged in, otherwise opens modal that asks whether to login
function ensureLoggedIn() {
    const userRaw = localStorage.getItem('user');
    if (userRaw) {
        try { currentUser = JSON.parse(userRaw); return currentUser; } catch (e) { return false; }
    }
    // Open the modal that offers to go to login or cancel
    openLoginChoiceModal();
    return false;
}

// Open/close handlers for login-choice modal
function openLoginChoiceModal(message) {
    const modal = document.getElementById('loginChoiceModal');
    if (!modal) {
        // fallback to old behavior
        showAlert('Silakan login untuk melanjutkan', 'info');
        setTimeout(() => {
            const loginPage = document.getElementById('loginPage');
            const main = document.getElementById('mainContent');
            if (loginPage) loginPage.style.display = 'flex';
            if (main) main.style.display = 'none';
            const emailInput = document.getElementById('loginEmail'); if (emailInput) emailInput.focus();
        }, 700);
        return;
    }
    // optional message override
    if (message) {
        const desc = document.getElementById('loginChoiceDesc'); if (desc) desc.textContent = message;
    }
    // Close mobile nav if open so the modal takes precedence
    const nav = document.querySelector('.nav-menu'); if (nav) nav.classList.remove('active');
    document.body.classList.remove('mobile-menu-open');
    const mobileNavBtn = document.getElementById('mobileNavToggle'); if (mobileNavBtn) mobileNavBtn.setAttribute('aria-expanded', 'false');

    modal.classList.add('active');
    document.body.classList.add('modal-open');
    setTimeout(() => {
        const primary = modal.querySelector('.btn-primary'); if (primary) primary.focus();
    }, 80);
}

function closeLoginChoiceModal() {
    const modal = document.getElementById('loginChoiceModal');
    if (!modal) return;
    modal.classList.remove('active');
    document.body.classList.remove('modal-open');
}

function proceedToLoginFromChoice() {
    closeLoginChoiceModal();
    showAlert('Silakan login untuk melanjutkan', 'info');
    const loginPage = document.getElementById('loginPage');
    const main = document.getElementById('mainContent');
    if (loginPage) loginPage.style.display = 'flex';
    if (main) main.style.display = 'none';
    setTimeout(() => { const emailInput = document.getElementById('loginEmail'); if (emailInput) emailInput.focus(); }, 200);
}

function updateWishlistBadge() {
    const badge = document.getElementById('wishlistBadge');
    if (badge) {
        badge.textContent = wishlist.length;
    }
}

let auctionItems = [];

async function loadItemsFromServer() {
    try {
        const res = await fetch('/api/items');
        if (!res.ok) throw new Error('Failed to fetch /api/items: ' + res.status);
        const data = await res.json();
        // normalize server fields to client expectation
        auctionItems = data.map(it => ({
            id: it.id,
            name: it.name,
            // normalize images from server (supports images array or single image)
            images: (function(){
                let arr = [];
                if (Array.isArray(it.images)) arr = it.images;
                else if (it.image) {
                    try { const p = JSON.parse(it.image); arr = Array.isArray(p) ? p : [it.image]; } catch (e) { arr = [it.image]; }
                }
                // normalize paths: convert backslashes to forward slashes and ensure leading slash for uploads
                return arr.map(src => {
                    if (!src) return src;
                    let s = src.replace(/\\/g, '/');
                    if (!/^https?:\/\//i.test(s) && !s.startsWith('/') && s.startsWith('uploads/')) s = '/' + s;
                    return s;
                });
            })(),
            image: (function(){
                const imgs = (Array.isArray(it.images) ? it.images : (it.image ? (function(){ try { const p = JSON.parse(it.image); return Array.isArray(p) ? p : [it.image]; } catch(e) { return [it.image]; } })() : []));
                const norm = imgs.map(src => { if (!src) return src; let s = src.replace(/\\/g, '/'); if (!/^https?:\/\//i.test(s) && !s.startsWith('/') && s.startsWith('uploads/')) s = '/' + s; return s; });
                return norm.length ? norm[0] : 'default-item.png';
            })(),
            description: it.description || '',
            currentBid: Number(it.price || it.currentBid || 0),
            initialPrice: Number(it.price || it.currentBid || 0),
            endTime: it.endTime || it.endsAt || new Date(Date.now() + 24*60*60*1000).toISOString(),
            seller: it.sellerName || it.seller || 'Penjual',
            sellerId: it.sellerId || it.seller_id || null,
            sellerPhone: it.sellerPhone || null,
            sellerRating: it.sellerRating || 4.5,
            categories: Array.isArray(it.categories) ? it.categories : (it.categories ? JSON.parse(it.categories) : []),
            soldNotified: false,
            status: it.status || 'active'
        }));
        // refresh UI
        renderCategoryFilters();
        renderSidebarCategories();
        renderAuctionItems();
        updateWishlistBadge();
    } catch (err) {
        console.error('loadItemsFromServer error', err);
        throw err;
    }
}

document.addEventListener('DOMContentLoaded', async function() {
    showLoader();

    // Fail-safe: sembunyikan loader setelah 7s jika masih aktif
    setTimeout(() => {
        const ld = document.getElementById('loader');
        if (ld && ld.classList.contains('active')) {
            ld.classList.remove('active');
            console.warn('Loader timeout — kemungkinan server tidak merespon atau ada error JS.');
            alert('Gagal memuat data. Periksa server atau console untuk error.');
        }
    }, 7000);

    try {
        // coba load data dari server dulu; jangan blok UI terlalu lama
        await loadItemsFromServer();
    } catch (err) {
        console.error('Error loadItemsFromServer on DOMContentLoaded:', err);
        // biarkan fallback timeout menangani notifikasi ke user
    } finally {
        // init UI / animations walau data gagal
        renderCategoryFilters();
        renderSidebarCategories();
        renderAuctionItems();
        updateWishlistBadge();
        startTimers();
        startEndedChecker();
        setupSidebarToggle();
        initLiquidScroll();
        hideLoader();
        // load notifications for current user (if logged)
        loadNotifications().catch(()=>{});
    }
});


let userBids = [];
let wishlist = [];
let currentBidItem = null;
let selectedCategories = new Set();
let isAdmin = false;
let currentUser = null; // Store logged-in user info
let notifications = [];
let _prevNotifUnread = 0;
const ADMIN_PASSWORD = 'admin123';
const ADMIN_ID = 'ADMIN2024'; // Special admin ID

auctionItems.forEach(item => {
    item.initialPrice = item.currentBid;
    item.soldNotified = false;
});

document.addEventListener('DOMContentLoaded', function() {
    showLoader();
    setTimeout(() => {
        renderCategoryFilters();
        renderSidebarCategories();
        renderAuctionItems();
        updateWishlistBadge();
        startTimers();
        startEndedChecker();
        setupSidebarToggle();
        
        // Initialize liquid scroll animation
        initLiquidScroll();
        
        hideLoader();
    }, 800);
});

// === Liquid Scroll Animation ===
function initLiquidScroll() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Add animation class
                entry.target.classList.add('liquid-scroll');
                // Optional: unobserve after animation
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    // Observe all auction cards and page elements
    document.addEventListener('DOMContentLoaded', () => {
        const elementsToObserve = document.querySelectorAll(
            '.auction-card, .bid-card, .empty-state, .page-header, .form-container'
        );
        elementsToObserve.forEach(el => observer.observe(el));
    });
}

// Setup liquid scroll for dynamically added elements
function setupLiquidScrollForElements() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('liquid-scroll');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    // Observe auction cards
    document.querySelectorAll('.auction-card:not(.liquid-scroll)').forEach(el => {
        observer.observe(el);
    });
    
    // Observe bid cards
    document.querySelectorAll('.bid-card:not(.liquid-scroll)').forEach(el => {
        observer.observe(el);
    });
}


document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        const page = this.dataset.page;

        // If link doesn't correspond to a page (e.g. logout, notifications), do nothing
        if (!page) return;

        // pages requiring login
        const authPages = ['mybid','myitem','profile','wishlist'];
        if (authPages.includes(page) && !localStorage.getItem('user')) {
            ensureLoggedIn();
            return;
        }

        if (page === 'admin' && !isAdmin) {
            alert('Anda tidak memiliki akses admin. Silakan login sebagai admin terlebih dahulu.');
            return;
        }
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        this.classList.add('active');
        
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        const target = document.getElementById(page + 'Page');
        if (target) {
            target.classList.add('active');
        } else {
            console.warn('Target page element not found for', page);
        }
        
        if (page === 'mybid') renderBidHistory();
        if (page === 'wishlist') renderWishlist();
        if (page === 'admin') renderAdminPanel();
    });
});

// Touch fallback: handle quick taps on touch devices when click may be delayed or blocked
(function() {
    function handleNavActivation(linkEl) {
        if (!linkEl) return;
        const page = linkEl.dataset.page;
        if (!page) return;
        // Pages that require authentication
        const authPages = ['mybid','myitem','profile','wishlist'];
        if (authPages.includes(page) && !localStorage.getItem('user')) {
            // Prompt the user to login (opens the choice modal)
            openLoginChoiceModal();
            // keep mobile nav open/closed behavior handled by modal styles; stop navigation
            return;
        }
        if (page === 'admin' && !isAdmin) { alert('Anda tidak memiliki akses admin. Silakan login sebagai admin terlebih dahulu.'); return; }
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        linkEl.classList.add('active');
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        const target = document.getElementById(page + 'Page');
        if (target) target.classList.add('active');
        if (page === 'mybid') renderBidHistory();
        if (page === 'wishlist') renderWishlist();
        if (page === 'admin') renderAdminPanel();

        // close mobile nav and overlay
        const nav = document.querySelector('.nav-menu');
        if (nav) nav.classList.remove('active');
        document.body.classList.remove('mobile-menu-open');
        const mobileNavBtn = document.getElementById('mobileNavToggle');
        if (mobileNavBtn) mobileNavBtn.setAttribute('aria-expanded', 'false');
        console.debug('Handled touch navigation to page', page);
    }

    document.addEventListener('touchstart', (e) => {
        const link = e.target.closest('.nav-link');
        if (link) {
            const page = link.dataset.page;
            if (!page) {
                link.click();
                const nav = document.querySelector('.nav-menu'); if (nav) nav.classList.remove('active');
                document.body.classList.remove('mobile-menu-open');
                const mobileNavBtn = document.getElementById('mobileNavToggle'); if (mobileNavBtn) mobileNavBtn.setAttribute('aria-expanded', 'false');
                return;
            }
            e.preventDefault();
            handleNavActivation(link);
        }
    }, { passive: false });

    
    const navMenuEl = document.querySelector('.nav-menu');
    if (navMenuEl) {
        navMenuEl.addEventListener('click', (e) => {
            const link = e.target.closest('.nav-link');
            if (!link) return;
            const page = link.dataset.page;
            if (!page) {
                return;
            }
            e.preventDefault();
            console.debug('nav-menu click delegating to', page || link.textContent.trim());
            handleNavActivation(link);
        });
        navMenuEl.addEventListener('touchstart', (e) => {
            const link = e.target.closest('.nav-link');
            if (!link) return;
            const page = link.dataset.page;
            if (!page) {
                link.click();
                const nav = document.querySelector('.nav-menu'); if (nav) nav.classList.remove('active');
                document.body.classList.remove('mobile-menu-open');
                const mobileNavBtn = document.getElementById('mobileNavToggle'); if (mobileNavBtn) mobileNavBtn.setAttribute('aria-expanded', 'false');
                return;
            }
            e.preventDefault();
            console.debug('nav-menu touchstart delegating to', page || link.textContent.trim());
            handleNavActivation(link);
        }, { passive: false });
    }
})();


// Notifications: load, render, mark read
async function loadNotifications() {
    const userRaw = localStorage.getItem('user');
    if (!userRaw) return;
    const user = JSON.parse(userRaw);
    try {
        const res = await fetch(`/api/notifications/${user.id}`);
        if (!res.ok) return;
        const data = await res.json();
        notifications = data;
        const unread = notifications.filter(n => n.readFlag === 0).length;
        const badge = document.getElementById('notifBadge');
        if (badge) badge.textContent = unread;

        if (unread > _prevNotifUnread && _prevNotifUnread !== 0) {
            showAlert('Anda memiliki notifikasi baru', 'info');
        }
        _prevNotifUnread = unread;
    } catch (err) { console.error('loadNotifications error', err); }
}

function openNotificationsModal() {
    const modal = document.getElementById('notificationsModal');
    modal.classList.add('active');
    renderNotifications();
}

function renderNotifications() {
    const list = document.getElementById('notificationsList');
    if (!list) return;
    if (!notifications.length) {
        list.innerHTML = '<div class="empty-state"><p>Tidak ada notifikasi.</p></div>';
        return;
    }
    // build HTML with placeholders for phone for won-notifications
    list.innerHTML = notifications.map(n => {
        const time = new Date(n.time).toLocaleString();
        const unreadClass = n.readFlag === 0 ? 'status-outbid' : '';
        const actions = [];
        if (n.type && n.type.startsWith('won')) {
            actions.push(`<button class="btn btn-primary" onclick="payViaWhatsAppFromNotif(${n.itemId}, ${n.id})">Bayar</button>`);
            actions.push(`<button class="btn btn-secondary" onclick="openItemFromNotif(${n.itemId})">Lihat</button>`);
        } else if (n.type === 'payment_received') {
            actions.push(`<button class="btn btn-secondary" onclick="openItemFromNotif(${n.itemId})">Lihat Transaksi</button>`);
        }
        actions.push(`<button class="btn" onclick="markNotificationRead(${n.id})">Tandai Dibaca</button>`);

        // add phone placeholder for won notifications
        const phonePlaceholder = n.type && n.type.startsWith('won') ? `<div id="notifPhone${n.id}" style="color:#444; font-size:0.9rem; margin-top:6px;">Nomor penjual: <em>memuat...</em></div>` : '';

        return `<div class="bid-card ${unreadClass}" style="display:flex; flex-direction:column; gap:8px; margin-bottom:8px; padding:12px;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <div style="font-weight:600">${n.message}</div>
                        <div style="color:#666; font-size:0.85rem;">${time}</div>
                    </div>
                    ${phonePlaceholder}
                    <div style="display:flex; gap:6px;">${actions.join('')}</div>
                </div>`;
    }).join('');

    // populate phone numbers for won notifications asynchronously
    notifications.forEach(n => {
        if (n.type && n.type.startsWith('won') && n.itemId) {
            const el = document.getElementById(`notifPhone${n.id}`);
            if (!el) return;
            // try to get from in-memory items first
            const item = getItemById(n.itemId);
            if (item && (item.sellerPhone || (item.seller && item.seller.phone))) {
                const phone = item.sellerPhone || (item.seller && item.seller.phone);
                el.innerHTML = `Nomor penjual: <strong>${phone}</strong>`;
            } else {
                // fetch item details
                fetch(`/api/items/${n.itemId}`).then(res => res.ok ? res.json() : null).then(body => {
                    if (!body || !body.item) { el.innerHTML = 'Nomor penjual: <em>tidak tersedia</em>'; return; }
                    const phone = body.item.sellerPhone || (body.item.seller && body.item.seller.phone);
                    el.innerHTML = phone ? `Nomor penjual: <strong>${phone}</strong>` : 'Nomor penjual: <em>tidak tersedia</em>';
                }).catch(() => {
                    el.innerHTML = 'Nomor penjual: <em>tidak tersedia</em>';
                });
            }
        }
    });
}

async function markNotificationRead(id) {
    try {
        const res = await fetch(`/api/notifications/${id}/read`, { method: 'PUT' });
        if (!res.ok) throw new Error('Failed');
        // update locally
        const n = notifications.find(x => x.id === id);
        if (n) n.readFlag = 1;
        renderNotifications();
        loadNotifications();
    } catch (err) { console.error('markNotificationRead error', err); }
}

function openItemFromNotif(itemId) {
    if (!itemId) return;
    closeDetailModal();
    openItemDetail(itemId);
}

// Open WhatsApp to seller from a notification (attempt to fetch item if not in memory)
async function payViaWhatsAppFromNotif(itemId, notifId) {
    try {
        // mark read immediately
        if (notifId) markNotificationRead(notifId);
        let item = getItemById(itemId);
        if (!item) {
            const res = await fetch(`/api/items/${itemId}`);
            if (res.ok) {
                const body = await res.json();
                item = body.item || null;
            }
        }
        if (!item) return alert('Informasi item tidak tersedia');
        let phone = item.sellerPhone || (item.seller && item.seller.phone) || null;
        if (!phone) {
            // fallback: try loading seller profile
            try {
                if (item.sellerId) {
                    const ures = await fetch(`/api/users/${item.sellerId}`);
                    if (ures.ok) {
                        const ubody = await ures.json();
                        if (ubody.user && ubody.user.phone) {
                            phone = ubody.user.phone;
                        }
                    }
                }
            } catch (e) { /* ignore */ }
        }
        if (!phone) return alert('Nomor penjual tidak tersedia');
        const buyerName = currentUser && currentUser.name ? currentUser.name : 'Pembeli';
        const message = encodeURIComponent(`Halo, saya ${buyerName} (pembeli) ingin mengonfirmasi pembayaran untuk barang: ${item.name || 'Barang'}. Mohon informasikan detail pembayaran dan alamat pengiriman.`);
        // normalize phone (strip non-digits, convert leading 0 to country code 62)
        let normalized = String(phone).replace(/\D/g, '');
        if (normalized.startsWith('0')) normalized = '62' + normalized.slice(1);
        const waLink = `https://wa.me/${normalized}?text=${message}`;
        window.open(waLink, '_blank');
    } catch (err) {
        console.error('payViaWhatsAppFromNotif error', err);
        alert('Gagal membuka WhatsApp');
    }
}

// Poll notifications every minute
setInterval(() => { loadNotifications().catch(()=>{}); }, 60*1000);




function renderAuctionItems() {
    const grid = document.getElementById('auctionGrid');
    grid.innerHTML = '';
    

    const itemsToShow = auctionItems.filter(item => {
        if (selectedCategories.size === 0) return true;
        if (!item.categories || !item.categories.length) return false;
        return item.categories.some(c => selectedCategories.has(c));
    });

    if (itemsToShow.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon"><i class="fas fa-box-open"></i></div>
                <h2 class="empty-title">Tidak ada hasil</h2>
                <p class="empty-text">Coba ubah filter kategori Anda</p>
            </div>
        `;
        return;
    }

    itemsToShow.forEach(item => {
        const isWishlisted = wishlist.some(w => w.id === item.id);
        const card = createAuctionCard(item, isWishlisted);
        grid.appendChild(card);
    });
    
    // Trigger liquid scroll for newly rendered cards
    setupLiquidScrollForElements();
}

function createAuctionCard(item, isWishlisted = false) {
    const card = document.createElement('div');
    card.className = 'auction-card';
    
    const timeLeft = getTimeLeft(item.endTime);

    const userRaw = localStorage.getItem('user');
    const viewer = userRaw ? JSON.parse(userRaw) : null;
    const isSeller = viewer && viewer.id && item.sellerId && parseInt(viewer.id) === parseInt(item.sellerId);
    const isActive = item.status === 'active' && new Date(item.endTime) > new Date();

    const categoriesHtml = (item.categories || []).map(c => `<span class="bid-label" style="margin-right:6px; display:inline-block; background: rgba(0,0,0,0.04); padding:4px 8px; border-radius:12px; font-size:0.75rem;">${c}</span>`).join('');

    // Build action buttons according to state
    let actionButtons = '';
    if (!isActive) {
        actionButtons += `<button class="btn btn-secondary" disabled><i class="fas fa-clock"></i> Lelang Berakhir</button>`;
    } else if (isSeller) {
        actionButtons += `<button class="btn btn-secondary" disabled><i class="fas fa-ban"></i> Tidak bisa bid (Penjual)</button>`;
    } else {
        actionButtons += `<button class="btn btn-primary" onclick="openBidModal(${item.id})"><i class="fas fa-gavel"></i> Bid Sekarang</button>`;
    }

    actionButtons += `
        <button class="btn btn-secondary" onclick="openItemDetailModal(${item.id})" style="background: linear-gradient(135deg, #4a90e2, #357abd); color: white;">
            <i class="fas fa-eye"></i> Lihat Detail
        </button>
        <button class="btn btn-wishlist ${isWishlisted ? 'active' : ''}" onclick="toggleWishlist(${item.id})">
            <i class="fas fa-heart"></i>
        </button>
    `;

    if (viewer && viewer.id && parseInt(viewer.id) === parseInt(item.sellerId)) {
        actionButtons += `
            <button class="btn btn-secondary" onclick="openEditItemModal(${item.id})"><i class="fas fa-edit"></i></button>
            <button class="btn btn-warning" onclick="openSelectWinnerModal(${item.id})"><i class="fas fa-trophy"></i></button>
        `;
    }

    if (isAdmin) actionButtons += `<button class="btn btn-wishlist" style="background:#ff6b6b;color:#fff;" onclick="deleteItem(${item.id})"><i class="fas fa-trash"></i></button>`;

    card.innerHTML = `
        <img src="${item.image}" alt="${item.name}" class="card-image" onerror="this.src='default-item.png'">
        <div class="card-body">
            <h3 class="card-title">${item.name}</h3>
            <p class="card-description">${item.description}</p>
            <div style="margin-bottom:8px;">${categoriesHtml}</div>
            <div class="card-info">
                <div class="current-bid">
                    <div class="bid-label">Bid Saat Ini</div>
                    <div class="bid-amount">Rp ${formatPrice(item.currentBid)}</div>
                </div>
                <div class="time-left">
                    <div class="bid-label">Waktu Tersisa</div>
                    <div class="timer" data-end="${item.endTime}">${timeLeft}</div>
                </div>
            </div>
            <div class="card-actions">
                ${actionButtons}
            </div>
        </div>
    `;
    
    return card;
}


function openBidModal(itemId) {
    // require login first
    const user = ensureLoggedIn(); if (!user) return;
    currentBidItem = auctionItems.find(item => item.id === itemId);
    if (!currentBidItem) return alert('Item tidak ditemukan');
    // prevent seller from bidding their own item
    if (currentBidItem.sellerId && String(currentBidItem.sellerId) === String(user.id)) return alert('Anda tidak dapat menawar item Anda sendiri');
    // ensure auction active
    if (currentBidItem.status && currentBidItem.status !== 'active') return alert('Lelang untuk item ini sudah berakhir atau tidak aktif');
    if (new Date(currentBidItem.endTime) <= new Date()) return alert('Lelang sudah berakhir');

    document.getElementById('bidAmount').value = '';
    document.getElementById('bidAmount').min = currentBidItem.currentBid + 1000;
    document.getElementById('bidModal').classList.add('active');
}

function closeBidModal() {
    document.getElementById('bidModal').classList.remove('active');
    currentBidItem = null;
}

async function submitBid() {
      const bidAmount = parseInt(document.getElementById('bidAmount').value);
      if (!currentBidItem) return alert('Item tidak ditemukan');
      if (!bidAmount || bidAmount <= currentBidItem.currentBid) {
          alert('Bid harus lebih tinggi dari harga saat ini!');
          return;
      }

      const user = ensureLoggedIn();
      if (!user) return;

      try {
          const res = await fetch('/api/bids', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  userId: user.id,
                  itemId: currentBidItem.id,
                  amount: bidAmount
              })
          });
          const body = await res.json();
          console.log('submitBid response:', res.status, body); // DEBUG
          if (!res.ok) return alert(body.error || 'Gagal memasang bid');
          showNotification('Bid berhasil dipasang! 🎉');
          
          // ADDED: reload items + bid history
          await loadItemsFromServer();
          if (typeof loadBidHistory === 'function') {
              await loadBidHistory();
          }
      } catch (err) {
          console.error('submitBid error', err);
          alert('Gagal terhubung ke server');
      } finally {
          closeBidModal();
      }
    }


 async function toggleWishlist(itemId) {
      const user = ensureLoggedIn();
      if (!user) return;

      try {
          const res = await fetch('/api/wishlist', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId: user.id, itemId })
          });
          const body = await res.json();
          if (!res.ok) return alert(body.error || 'Gagal update wishlist');
          // refresh wishlist from server for accuracy
          const wlRes = await fetch(`/api/wishlist/${user.id}`);
          if (wlRes.ok) {
              const items = await wlRes.json();
              wishlist = items.map(i => ({ id: i.id, ...i }));
          } else {
              // fallback toggle locally
              const idx = wishlist.findIndex(w => w.id === itemId);
              if (idx >= 0) wishlist.splice(idx, 1);
              else {
                  const item = auctionItems.find(i => i.id === itemId);
                  if (item) wishlist.push(item);
              }
          }
          updateWishlistBadge();
          renderAuctionItems();
          if (document.getElementById('wishlistPage').classList.contains('active')) renderWishlist();
      } catch (err) {
          console.error('toggleWishlist error', err);
          alert('Gagal terhubung ke server');
      }
  }

function renderWishlist() {
    const grid = document.getElementById('wishlistGrid');
    
    if (wishlist.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon"><i class="fas fa-heart-broken"></i></div>
                <h2 class="empty-title">Wishlist Kosong</h2>
                <p class="empty-text">Anda belum menambahkan barang ke wishlist</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = '';
    wishlist.forEach(item => {
        const card = createAuctionCard(item, true);
        grid.appendChild(card);
    });
    
    setupLiquidScrollForElements();
}


async function renderBidHistory() {
    await loadBidHistory(); // Sudah handle semuanya di loadBidHistory()
}


function startTimers() {
    setInterval(() => {
        document.querySelectorAll('.timer').forEach(timer => {
            const endTime = timer.dataset.end;
            timer.textContent = getTimeLeft(endTime);
        });
    }, 1000);
}

function getTimeLeft(endTime) {
    const now = new Date();
    const end = new Date(endTime);
    const diff = end - now;
    
    if (diff <= 0) return 'Berakhir';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}h ${hours}j`;
    if (hours > 0) return `${hours}j ${minutes}m`;
    return `${minutes} menit`;
}


function formatPrice(price) {
    return new Intl.NumberFormat('id-ID').format(price);
}


function openItemDetail(itemId) {
    const item = getItemById(itemId);
    if (!item) { alert('Item tidak ditemukan'); return; }
    const modal = document.getElementById('itemDetailModal');
    if (!modal) { console.warn('itemDetailModal element missing'); return; }

    // Prefer dynamic modal if static detail IDs are not present
    if (!document.getElementById('detailItemTitle')) {
        return openItemDetailModal(itemId);
    }

    const titleEl = document.getElementById('detailItemTitle');
    if (titleEl) titleEl.textContent = item.name;
    const imgEl = document.getElementById('detailItemImage');
    if (imgEl) imgEl.src = item.image;
    const priceEl = document.getElementById('detailItemPrice');
    if (priceEl) priceEl.textContent = 'Rp ' + formatPrice(item.currentBid);
    const descEl = document.getElementById('detailItemDescription');
    if (descEl) descEl.textContent = item.description;
    
    updateItemTimer(item.endTime);
    
    loadBidHistory(itemId);
    
    modal.style.display = 'flex';
}

function closeItemDetail() {
    document.getElementById('itemDetailModal').style.display = 'none';
}

// New detailed item view with seller info and payment methods
async function openItemDetailModal(itemId) {
    let item = getItemById(itemId);
    try {
        const res = await fetch(`/api/items/${itemId}`);
        if (res.ok) {
            const body = await res.json();
            if (body.item) item = body.item;
        }
    } catch (err) {
        console.warn('Could not fetch full item details', err);
    }
    
    const detailHTML = `
        <div class="item-detail-page">
            <!-- Image Section -->
            <div class="detail-image-section">
                    <img id="detailMainImage" src="${item.image}" alt="${item.name}" class="detail-main-image" onerror="this.src='https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=600'">
                    ${(item.images && item.images.length > 1) ? `<div class="detail-thumbs">${item.images.map((img, idx) => `<img src="${img}" class="detail-thumb" onclick="document.getElementById('detailMainImage').src=\'${img}\'" onerror="this.src='https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=600'" alt="thumb-${idx}">`).join('')}</div>` : ''}
                </div>
            <!-- Info Section -->
            <div class="detail-info-section">
                <!-- Item Name & Details -->
                <div class="detail-header">
                    <h1 class="detail-title">${item.name}</h1>
                    <div class="detail-categories">
                        ${(item.categories || []).map(c => `<span class="category-badge">${c}</span>`).join('')}
                    </div>
                </div>
                
                <!-- Price & Auction Info -->
                <div class="detail-price-box">
                    <div class="price-label">Harga Lelang Saat Ini</div>
                    <div id="detailCurrentBid" class="price-value">Rp ${formatPrice(item.currentBid)}</div>
                    <div class="time-info">
                        <i class="fas fa-clock"></i> Waktu Tersisa: <span id="detailModalTimer">${getTimeLeft(item.endTime)}</span>
                    </div>
                </div>
                
                <!-- Description -->
                <div class="detail-section">
                    <h3><i class="fas fa-info-circle"></i> Deskripsi Barang</h3>
                    <p>${item.description}</p>
                </div>
                
                <!-- Detail -->
                ${item.detail ? `<div class="detail-section">
                    <h3><i class="fas fa-list"></i> Detail</h3>
                    <p>${item.detail}</p>
                </div>` : ''}
                
                <!-- Spesifikasi -->
                ${item.spec ? `<div class="detail-section">
                    <h3><i class="fas fa-cogs"></i> Spesifikasi</h3>
                    <p>${item.spec}</p>
                </div>` : ''}
                
                <!-- Kondisi -->
                ${item.condition ? `<div class="detail-section">
                    <h3><i class="fas fa-star-half-alt"></i> Kemulusan/Kondisi</h3>
                    <p><strong>${item.condition}</strong></p>
                </div>` : ''}
                
                <!-- Tahun Dibeli -->
                ${item.yearBought ? `<div class="detail-section">
                    <h3><i class="fas fa-calendar"></i> Dibeli Tahun</h3>
                    <p><strong>${item.yearBought}</strong></p>
                </div>` : ''}
                
                <!-- Keterangan Lainnya -->
                ${item.other ? `<div class="detail-section">
                    <h3><i class="fas fa-sticky-note"></i> Keterangan Lainnya</h3>
                    <p>${item.other}</p>
                </div>` : ''}
                
                <!-- Seller Info -->
                <div class="detail-section seller-info">
                    <h3><i class="fas fa-user-circle"></i> Informasi Penjual</h3>
                            <div class="seller-card">
                                <div class="seller-header">
                                    <div class="seller-avatar" id="sellerAvatar${item.id}">
                                        <i class="fas fa-store"></i>
                                    </div>
                                    <div class="seller-details" id="sellerDetails${item.id}">
                                        <div class="seller-name">${item.seller}</div>
                                        <div class="seller-id"><i class="fas fa-tag"></i> ID: <strong>${item.sellerId}</strong></div>
                                        <div class="seller-profile-loading" id="sellerLoading${item.id}">Memuat profil penjual...</div>
                                    </div>
                                </div>
                            </div>
                </div>
                
                <!-- Payment Methods -->
                <div class="detail-section payment-section">
                    <h3><i class="fas fa-money-bill-wave"></i> Metode Pembayaran</h3>
                    <div class="payment-options">
                        <button class="payment-btn" onclick="selectPaymentMethod('cod', '${item.sellerId}', '${item.sellerPhone}')">
                            <div class="payment-icon"><i class="fas fa-hand-holding-usd"></i></div>
                            <div class="payment-text">
                                <div class="payment-title">COD (Tunai)</div>
                                <div class="payment-desc">Bayar saat barang tiba</div>
                            </div>
                        </button>
                        
                        <button class="payment-btn" onclick="selectPaymentMethod('whatsapp', '${item.sellerId}', '${item.sellerPhone}')">
                            <div class="payment-icon"><i class="fab fa-whatsapp"></i></div>
                            <div class="payment-text">
                                <div class="payment-title">WhatsApp</div>
                                <div class="payment-desc">Hubungi via WhatsApp</div>
                            </div>
                        </button>
                    </div>
                </div>
                
                <!-- Action Buttons -->
                <div class="detail-actions">
                    <button class="btn btn-primary" onclick="openBidModal(${item.id}); closeDetailModal()">
                        <i class="fas fa-gavel"></i> Pasang Bid Sekarang
                    </button>
                    
                    <!-- Seller-only actions (Edit / Select Winner) -->
                    ${currentUser && currentUser.id && parseInt(currentUser.id) === parseInt(item.sellerId) ? `
                        <button class="btn btn-secondary" onclick="openEditItemModal(${item.id})"><i class="fas fa-edit"></i> Edit Item</button>
                        <button class="btn btn-warning" onclick="openSelectWinnerModal(${item.id})"><i class="fas fa-trophy"></i> Pilih Pemenang</button>
                    ` : ''}
                    <button class="btn btn-secondary" onclick="closeDetailModal()">
                        <i class="fas fa-times"></i> Tutup
                    </button>
                </div>
            </div>
        </div>
    `;
    
    const modal = document.getElementById('itemDetailModal');
    modal.innerHTML = `<div class="modal-content modal-detail" data-item-id="${item.id}"><button class="modal-close-top" onclick="closeDetailModal()" aria-label="Tutup">&times;</button>${detailHTML}</div>`;
    modal.classList.add('active');
    document.body.classList.add('modal-open');
    (async () => {
        try {
            const res = await fetch(`/api/users/${item.sellerId}`);
            if (!res.ok) return;
            const body = await res.json();
            const profile = body.user || {};
            const detailsEl = document.getElementById(`sellerDetails${item.id}`);
            const avatarEl = document.getElementById(`sellerAvatar${item.id}`);
            if (detailsEl) {
                detailsEl.innerHTML = `
                    <div class="seller-name">${profile.name || item.seller}</div>
                    <div class="seller-id"><i class="fas fa-tag"></i> ID: <strong>${item.sellerId}</strong></div>
                    ${profile.phone ? `<div class="seller-phone">📞 ${profile.phone}</div>` : ''}
                    ${profile.address ? `<div class="seller-address">📍 ${profile.address}</div>` : ''}
                    ${profile.instagram ? `<div class="seller-social">Instagram: ${profile.instagram}</div>` : ''}
                    ${profile.twitter ? `<div class="seller-social">Twitter: ${profile.twitter}</div>` : ''}
                `;
            }
            if (avatarEl && profile.photo) {
                avatarEl.innerHTML = `<img src="${profile.photo}" alt="avatar" style="width:48px;height:48px;border-radius:6px;object-fit:cover;">`;
            }
        } catch (err) { console.error('load seller profile err', err); }
    })();

    // --- image auto-rotate + thumbnail interactions ---
    try {
        const mainImg = document.getElementById('detailMainImage');
        const thumbs = Array.from(document.querySelectorAll('.detail-thumb'));
        let rotateIndex = 0;
        function pauseRotation() {
            const modalEl = document.getElementById('itemDetailModal');
            if (modalEl && modalEl._rotateTimer) { clearInterval(modalEl._rotateTimer); modalEl._rotateTimer = null; }
        }
        function resumeRotation() {
            const modalEl = document.getElementById('itemDetailModal');
            if (!modalEl) return;
            if (modalEl._rotateTimer) return;
            if (!Array.isArray(item.images) || item.images.length <= 1) return;
            modalEl._rotateTimer = setInterval(() => {
                rotateIndex = (rotateIndex + 1) % item.images.length;
                if (mainImg) mainImg.src = item.images[rotateIndex];
                thumbs.forEach((t, idx) => t.classList.toggle('active', idx === rotateIndex));
            }, 3000);
        }
        if (mainImg && Array.isArray(item.images) && item.images.length > 1) {
            // initialize
            mainImg.src = item.images[0];
            thumbs.forEach((t, idx) => {
                t.classList.toggle('active', idx === 0);
                t.addEventListener('click', () => {
                    rotateIndex = idx;
                    mainImg.src = item.images[rotateIndex];
                    thumbs.forEach((th, idd) => th.classList.toggle('active', idd === rotateIndex));
                });
                t.addEventListener('mouseenter', pauseRotation);
                t.addEventListener('mouseleave', resumeRotation);
            });
            mainImg.addEventListener('mouseenter', pauseRotation);
            mainImg.addEventListener('mouseleave', resumeRotation);
            // start rotation
            const modalEl = document.getElementById('itemDetailModal');
            if (modalEl) modalEl._rotateTimer = setInterval(() => {
                rotateIndex = (rotateIndex + 1) % item.images.length;
                mainImg.src = item.images[rotateIndex];
                thumbs.forEach((t, idx) => t.classList.toggle('active', idx === rotateIndex));
            }, 3000);
        }
    } catch (e) { console.warn('image rotate setup failed', e); }
}


function closeDetailModal() {
    const modal = document.getElementById('itemDetailModal');
    modal.classList.remove('active');
    // remove modal-open guard and allow background to scroll again
    document.body.classList.remove('modal-open');
    // clear any running image rotation timer
    try { if (modal && modal._rotateTimer) { clearInterval(modal._rotateTimer); modal._rotateTimer = null; } } catch(e) {}
    // clear content after close animation to avoid stale DOM
    setTimeout(() => {
        if (!modal.classList.contains('active')) modal.innerHTML = '';
    }, 300);
}

function selectPaymentMethod(method, sellerId, phone) {
    if (method === 'cod') {
        alert(`Metode: COD\nSeller ID: ${sellerId}\n\nHubungi penjual untuk konfirmasi pesanan.`);
        return;
    }

    if (method === 'whatsapp') {
        if (!phone) return alert('Nomor WhatsApp penjual tidak tersedia');
        // prefill message with item & buyer info if possible
        const buyerName = currentUser && currentUser.name ? currentUser.name : (currentUserEmail || 'Pembeli');
        const defaultMsg = encodeURIComponent(`Halo, saya ${buyerName} ingin mengonfirmasi pembayaran untuk barang lelang (Seller ID: ${sellerId}). Mohon informasikan detail pembayaran dan alamat pengiriman.`);
        const waLink = `https://wa.me/${phone}?text=${defaultMsg}`;
        window.open(waLink, '_blank');

        // Ask buyer to confirm they've contacted seller — then create a payment record with method 'whatsapp' (no proof)
        setTimeout(async () => {
            const proceed = confirm('Klik OK setelah Anda mengirim pesan WhatsApp dan mengonfirmasi pembayaran dengan penjual.');
            if (!proceed) return;
            try {
                // try to find current item id and current bid amount; fallback to 0
                const itemIdEl = document.querySelector('.modal-detail') && document.querySelector('.modal-detail').dataset && document.querySelector('.modal-detail').dataset.itemId;
                const itemId = itemIdEl || null;
                const amount = document.getElementById('detailCurrentBid') ? document.getElementById('detailCurrentBid').textContent.replace(/[^0-9]/g,'') : 0;
                const userRaw = localStorage.getItem('user');
                if (!userRaw) return alert('Anda harus login untuk melakukan pembayaran');
                const user = JSON.parse(userRaw);
                await fetch('/api/payments', { method: 'POST', body: new URLSearchParams({ itemId: itemId || '', userId: user.id, amount: amount || 0, method: 'whatsapp' })});
                alert('Permintaan pembayaran WhatsApp dikirim. Status item diperbarui.');
                // refresh items
                loadItemsFromServer();
            } catch (err) { console.error(err); alert('Gagal mengonfirmasi pembayaran'); }
        }, 500);
        return;
    }
}


// Open edit modal prefilled with item's data
async function openEditItemModal(itemId) {
    let item = getItemById(itemId);
    try {
        const res = await fetch(`/api/items/${itemId}`);
        if (res.ok) {
            const body = await res.json();
            if (body.item) item = body.item;
        }
    } catch (err) { console.warn('Could not fetch item for edit', err); }
    if (!item) return alert('Item tidak ditemukan');
    const modal = document.getElementById('itemDetailModal');
    const editHTML = `
        <div class="modal-content">
            <h3>Edit Item</h3>
            <form id="editItemForm">
                <div class="form-group"><label>Nama</label><input name="name" class="form-input" value="${item.name}"></div>
                <div class="form-group"><label>Deskripsi</label><textarea name="description" class="form-textarea">${item.description}</textarea></div>
                <div class="form-group"><label>Detail</label><textarea name="detail" class="form-textarea">${item.detail || ''}</textarea></div>
                <div class="form-group"><label>Spesifikasi</label><textarea name="spec" class="form-textarea">${item.spec || ''}</textarea></div>
                <div class="form-group"><label>Kemulusan/Kondisi</label><select name="condition" class="form-input"><option value="">-- Pilih --</option><option value="Sangat Baik" ${item.condition === 'Sangat Baik' ? 'selected' : ''}>Sangat Baik (95-100%)</option><option value="Baik" ${item.condition === 'Baik' ? 'selected' : ''}>Baik (80-95%)</option><option value="Cukup Baik" ${item.condition === 'Cukup Baik' ? 'selected' : ''}>Cukup Baik (60-80%)</option><option value="Kurang Baik" ${item.condition === 'Kurang Baik' ? 'selected' : ''}>Kurang Baik (40-60%)</option><option value="Rusak" ${item.condition === 'Rusak' ? 'selected' : ''}>Rusak (&lt;40%)</option></select></div>
                <div class="form-group"><label>Dibeli Tahun Berapa</label><input name="yearBought" type="number" class="form-input" value="${item.yearBought || ''}" min="1900" max="2100"></div>
                <div class="form-group"><label>Keterangan Lainnya</label><textarea name="other" class="form-textarea">${item.other || ''}</textarea></div>
                <div class="form-group"><label>Harga Awal</label><input name="price" type="number" class="form-input" value="${item.price}"></div>
                <div class="form-group"><label>Selesai Pada (ISO)</label><input name="endTime" class="form-input" value="${item.endTime}"></div>
                <div class="form-group"><label>Gambar</label><input name="images" type="file" class="form-input" multiple></div>
                <div style="text-align:right; margin-top:8px;">
                    <button class="btn btn-secondary" type="button" onclick="closeDetailModal()">Batal</button>
                    <button class="btn btn-primary" type="submit">Simpan Perubahan</button>
                </div>
            </form>
        </div>
    `;
    modal.innerHTML = editHTML;
    modal.classList.add('active');

    const form = document.getElementById('editItemForm');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        formData.append('sellerId', currentUser && currentUser.id ? currentUser.id : '');
        try {
            const res = await fetch(`/api/items/${itemId}`, { method: 'PUT', body: formData });
            const body = await res.json();
            if (!res.ok) return alert(body.error || 'Gagal menyimpan item');
            alert('Item diperbarui');
            modal.classList.remove('active');
            loadItemsFromServer();
        } catch (err) { console.error(err); alert('Gagal terhubung ke server'); }
    });
}

// Open modal for selecting winner
async function openSelectWinnerModal(itemId) {
    const modal = document.getElementById('itemDetailModal');
    modal.innerHTML = '<div class="modal-content"><h3>Pilih Pemenang</h3><div id="winnerList">Memuat bids...</div><div style="text-align:right; margin-top:8px;"><button class="btn btn-secondary" onclick="closeDetailModal()">Tutup</button></div></div>';
    modal.classList.add('active');
    try {
        const res = await fetch('/api/bids?itemId=' + itemId);
        const bids = await res.json();
        const list = document.getElementById('winnerList');
        if (!bids.length) { list.innerHTML = '<p>Tidak ada bid</p>'; return; }
        // fetch user profiles for display
        const entries = await Promise.all(bids.map(async b => {
            try {
                const ures = await fetch(`/api/users/${b.userId}`);
                const ubody = ures.ok ? await ures.json() : null;
                const user = ubody && ubody.user ? ubody.user : null;
                return { bid: b, user };
            } catch (e) { return { bid: b, user: null }; }
        }));
        list.innerHTML = entries.map(e => {
            const b = e.bid; const u = e.user;
            const displayName = u && u.name ? `${u.name} (${u.email || u.id})` : `User ${b.userId}`;
            return `<div class="bid-card"><div class="bid-details"><strong>${displayName}</strong> - Rp ${formatPrice(b.amount)}</div><div style="text-align:right;"><button type="button" class="btn btn-primary" onclick="selectWinner(${itemId}, ${b.userId}, ${b.id})">Pilih</button></div></div>`;
        }).join('');
    } catch (err) { console.error(err); document.getElementById('winnerList').innerHTML = '<p>Gagal memuat bids</p>'; }
}

async function selectWinner(itemId, winnerId, bidId) {
    if (!confirm('Pilih user ini sebagai pemenang?')) return;
    // determine sellerId: prefer logged-in user, fallback to item data
    const sellerFromUser = currentUser && currentUser.id ? currentUser.id : null;
    const item = getItemById(itemId) || null;
    const sellerFromItem = item && item.sellerId ? item.sellerId : null;
    const sellerId = sellerFromUser || sellerFromItem;
    if (!sellerId) return alert('Anda harus login sebagai penjual untuk memilih pemenang.');

    try {
        const res = await fetch(`/api/items/${itemId}/select-winner`, {
            method: 'POST',
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify({ sellerId, winnerId, bidId })
        });
        let body = {};
        try { body = await res.json(); } catch(e) { /* ignore parse error */ }
        if (!res.ok) {
            console.error('selectWinner failed', res.status, body);
            return alert(body.error || `Gagal memilih pemenang (status ${res.status})`);
        }
        // show totals if provided
        if (body && (body.totalDue || body.fee)) {
            alert(`Pemenang dipilih. Total yang harus dibayar: Rp ${Number(body.totalDue || 0).toLocaleString()} (biaya admin: Rp ${Number(body.fee || 0).toLocaleString()}).`);
        } else {
            alert('Pemenang berhasil dipilih');
        }
        closeDetailModal();
        await loadItemsFromServer();
    } catch (err) { console.error('selectWinner error', err); alert('Gagal terhubung ke server'); }
}


function updateItemTimer(endTime) {
    // handle both possible timer IDs used across templates
    const ids = ['detailItemTimer', 'detailModalTimer'];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        // clear previous timer if any
        if (el._auctionTimer) clearInterval(el._auctionTimer);
        el._auctionTimer = setInterval(() => {
            const diff = new Date(endTime) - new Date();
            if (diff <= 0) {
                el.textContent = 'Lelang Berakhir';
                clearInterval(el._auctionTimer);
                return;
            }
            const days = Math.floor(diff / (1000*60*60*24));
            const hours = Math.floor((diff % (1000*60*60*24)) / (1000*60*60));
            const minutes = Math.floor((diff % (1000*60*60)) / (1000*60));
            const seconds = Math.floor((diff % (1000*60)) / 1000);
            if (days > 0) el.textContent = `${days}h ${hours}j ${minutes}m ${seconds}s`;
            else if (hours > 0) el.textContent = `${hours}j ${minutes}m ${seconds}s`;
            else el.textContent = `${minutes}m ${seconds}s`;
        }, 1000);
    });}

async function loadBidHistory() {
    const userRaw = localStorage.getItem('user');
    if (!userRaw) return;
    const user = JSON.parse(userRaw);

    const container = document.getElementById('bidHistory');
    if (!container) {
        console.warn('bidHistory container not found in DOM');
        return;
    }

    try {
        const res = await fetch(`/api/bids?userId=${user.id}`);
        if (!res.ok) {
            console.error('loadBidHistory failed', res.status);
            container.innerHTML = `<div class="empty-state"><h3>Error loading bids</h3></div>`;
            return;
        }
        const data = await res.json();
        // support both old array response and new `{ bids: [...] }` response
        const bids = Array.isArray(data) ? data : (data.bids || []);

        if (!bids || bids.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon"><i class="fas fa-gavel"></i></div>
                    <div class="empty-title">Belum Ada Penawaran</div>
                    <div class="empty-text">Mulai ikut lelang untuk melihat riwayat penawaran Anda</div>
                </div>`;
            return;
        }

        container.innerHTML = '';
        for (const bid of bids) {
            let dateStr = bid.time || bid.createdAt || new Date().toISOString();
            let displayDate = 'N/A';
            try { displayDate = new Date(dateStr).toLocaleString('id-ID'); } catch (e) { console.warn('Date parse error for:', dateStr); }

            const itemTitle = bid.itemTitle || bid.name || 'Item';
            const itemImage = bid.itemImage || bid.image || 'default.png';
            const sellerName = bid.sellerName || '';
            const sellerPhone = bid.sellerPhone || '';
            const yourBid = formatPrice(bid.amount || 0);
            const highest = formatPrice(bid.highestBid || bid.currentPrice || 0);

            // determine status badge (win if item sold/pending and winner is current user)
            let statusBadge = '';
            if ((bid.itemStatus === 'sold' || bid.itemStatus === 'pending_payment') && String(bid.itemWinnerId) === String(user.id)) {
                statusBadge = '<span class="badge status-win">MENANG</span>';
            } else if (bid.itemStatus === 'sold' || bid.itemStatus === 'pending_payment') {
                statusBadge = '<span class="badge status-lost">LEPAS</span>';
            } else if (bid.itemStatus === 'expired') {
                statusBadge = '<span class="badge status-expired">EXPIRED</span>';
            }

            // if there's a recorded winner for this item, fetch their name to display
            let winnerRow = '';
            if (bid.itemWinnerId) {
                try {
                    const wres = await fetch(`/api/users/${bid.itemWinnerId}`);
                    if (wres.ok) {
                        const wbody = await wres.json();
                        const winnerName = (wbody && wbody.user && wbody.user.name) ? wbody.user.name : `User ${bid.itemWinnerId}`;
                        winnerRow = `<div class="seller-row"><strong>Pemenang:</strong> ${winnerName}</div>`;
                    }
                } catch (e) { console.warn('Failed to fetch winner name', e); }
            }

            const bidCard = `
                <div class="bid-card">
                    <div class="bid-left">
                        <img src="${itemImage}" alt="${itemTitle}" class="bid-image" onerror="this.src='default.png'">
                    </div>
                    <div class="bid-body">
                        <div class="bid-top">
                            ${statusBadge}
                            <h3 class="bid-title">${itemTitle}</h3>
                            <div class="bid-sub">${(bid.itemDescription || '').slice(0, 120)}</div>
                        </div>

                        <div class="bid-meta">
                            <div class="meta-left">
                                <div class="meta-label">Bid Anda</div>
                                <div class="meta-value">${yourBid}</div>
                            </div>
                        </div>

                        ${sellerName ? `<div class="seller-row"><strong>Penjual:</strong> ${sellerName}${sellerPhone ? ` &middot; ${sellerPhone}` : ''}</div>` : ''}
                        ${winnerRow}
                    </div>

                    <div class="bid-right">
                        <div class="right-label">Bid Tertinggi Saat Ini</div>
                        <div class="right-value">${highest}</div>
                    </div>
                </div>`;

            container.insertAdjacentHTML('beforeend', bidCard);
        }

        setupLiquidScrollForElements();
    } catch (err) {
        console.error('loadBidHistory error:', err);
        container.innerHTML = `<div class="empty-state"><h3>Error: ${err.message}</h3></div>`;
    }
}

function createAuctionItem(item) {
    // create card element and attach click safely
    const card = createAuctionCard(item, wishlist.some(w => w.id === item.id));
    card.addEventListener('click', () => openItemDetail(item.id));
    return card;
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(amount);
}

function getItemById(id) {
    return auctionItems.find(i => i.id === id) || null;
}

// Handle Add Item form submission (upload + fields -> /api/items)
document.addEventListener('DOMContentLoaded', () => {
    const addItemForm = document.getElementById('addItemForm');
    if (!addItemForm) return;

    addItemForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const userRaw = localStorage.getItem('user');
        if (!userRaw) { alert('Harus login untuk menambahkan barang'); return; }
        const user = JSON.parse(userRaw);

        const name = document.getElementById('itemName').value.trim();
        const description = document.getElementById('itemDescription').value.trim();
        const detail = document.getElementById('itemDetail').value.trim();
        const spec = document.getElementById('itemSpec').value.trim();
        const condition = document.getElementById('itemCondition').value.trim();
        const yearBought = document.getElementById('itemYearBought').value.trim();
        const other = document.getElementById('itemOther').value.trim();
        const price = document.getElementById('itemPrice').value;
        const endTime = document.getElementById('itemEndTime').value;
        const imageInput = document.getElementById('itemImages');
        const categories = Array.from(document.querySelectorAll('.item-category-checkbox:checked')).map(c => c.value);

        if (!name || !price || !endTime) { alert('Mohon lengkapi nama, harga, dan waktu berakhir'); return; }
        
        // Validasi foto wajib minimal 4 dan maksimal 10
        if (!imageInput || !imageInput.files || imageInput.files.length === 0) {
            alert('Mohon upload minimal 4 foto barang (maksimal 10 foto)');
            return;
        }
        
        if (imageInput.files.length < 4) {
            alert(`Mohon upload minimal 4 foto. Saat ini: ${imageInput.files.length} foto`);
            return;
        }
        
        if (imageInput.files.length > 10) {
            alert(`Maksimal 10 foto. Saat ini: ${imageInput.files.length} foto`);
            return;
        }
        
        // Validasi ukuran file (max 5MB per file)
        for (let i = 0; i < imageInput.files.length; i++) {
            const file = imageInput.files[i];
            if (file.size > 5 * 1024 * 1024) {
                alert(`File ${file.name} terlalu besar (Max 5MB per file)`);
                return;
            }
        }

        const formData = new FormData();
        formData.append('name', name);
        formData.append('description', description);
        formData.append('detail', detail);
        formData.append('spec', spec);
        formData.append('condition', condition);
        formData.append('yearBought', yearBought);
        formData.append('other', other);
        formData.append('price', price);
        formData.append('endTime', endTime);
        formData.append('sellerId', user.id);
        formData.append('categories', JSON.stringify(categories));
        
        // Append multiple image files
        for (let i = 0; i < imageInput.files.length; i++) {
            formData.append('images', imageInput.files[i]);
        }

        try {
            const res = await fetch('/api/items', { method: 'POST', body: formData });
            const body = await res.json().catch(() => ({}));
            console.log('addItem response:', res.status, body);
            if (!res.ok) return alert(body.error || 'Gagal menambahkan item');

            showNotification('Item berhasil ditambahkan!');
            addItemForm.reset();
            // refresh items and navigate to home
            await loadItemsFromServer();
            const homeLink = document.querySelector('.nav-link[data-page="home"]');
            if (homeLink) homeLink.click();
        } catch (err) {
            console.error('addItem error', err);
            alert('Gagal terhubung ke server');
        }
    });
});

function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: linear-gradient(135deg, var(--gold), var(--maroon));
        color: white;
        padding: 1.5rem 2rem;
        border-radius: 12px;
        box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
        z-index: 4000;
        font-weight: 600;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function showLoader() {
    document.getElementById('loader').classList.add('active');
}

function hideLoader() {
    document.getElementById('loader').classList.remove('active');
}


document.getElementById('bidModal').addEventListener('click', function(e) {
    if (e.target === this) closeBidModal();
});

function startEndedChecker() {

    setInterval(() => {
        const now = new Date();
        auctionItems.forEach(item => {
            if (!item.soldNotified && new Date(item.endTime) - now <= 0) {
                item.soldNotified = true;
                item.sold = true;


                if (item.seller === 'Anda') {

                    const userBid = userBids.find(b => b.itemId === item.id && b.amount === item.currentBid);
                    const buyer = userBid ? 'Anda' : 'Pembeli Tidak Diketahui';
                    showSuccessModal(item, buyer);
                }
            }
        });
    }, 2000);
}

function showSuccessModal(item, buyer) {
    const modal = document.getElementById('successModal');
    document.getElementById('successItemImage').src = item.image || '';
    document.getElementById('successItemTitle').textContent = item.name;
    document.getElementById('successItemMessage').textContent = `Barang "${item.name}" berhasil terjual kepada ${buyer}.`;
    document.getElementById('successItemPrice').textContent = 'Rp ' + formatPrice(item.currentBid);
    modal.classList.add('active');
}

function closeSuccessModal() {
    document.getElementById('successModal').classList.remove('active');
}

function viewTransaction() {

    closeSuccessModal();
    const myItemLink = document.querySelector('[data-page="myitem"]');
    if (myItemLink) myItemLink.click();
}

function renderCategoryFilters() {
    const container = document.getElementById('categoryFilters');
    if (!container) return;



    const cats = new Set();
    auctionItems.forEach(i => {
        if (Array.isArray(i.categories)) i.categories.forEach(c => cats.add(c));
    });

    

    const defaultOrder = FULL_CATEGORIES;

    container.innerHTML = '';
    const ordered = Array.from(cats).sort((a,b) => (defaultOrder.indexOf(a) - defaultOrder.indexOf(b)));
    (ordered.length ? ordered : defaultOrder).forEach(cat => {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'filter-chip';
        chip.textContent = cat;
        chip.addEventListener('click', () => {
            if (chip.classList.contains('active')) {
                chip.classList.remove('active');
                selectedCategories.delete(cat);
            } else {
                chip.classList.add('active');
                selectedCategories.add(cat);
            }
            updateSidebarChecks();
            renderAuctionItems();
        });
        container.appendChild(chip);
    });
}


function renderSidebarCategories() {
    const container = document.getElementById('sidebarCategories');
    if (!container) return;

    container.innerHTML = '';
    FULL_CATEGORIES.forEach(cat => {
        const countItems = auctionItems.filter(i => 
            i.categories && i.categories.includes(cat)
        ).length;

        const itemDiv = document.createElement('label');
        itemDiv.className = 'category-item';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = cat;
        checkbox.checked = selectedCategories.has(cat);
        
        const label = document.createElement('span');
        label.textContent = cat;
        
        const count = document.createElement('span');
        count.className = 'category-count';
        count.textContent = countItems;
        
        checkbox.addEventListener('change', () => {
            if (checkbox.checked) {
                selectedCategories.add(cat);
                itemDiv.classList.add('active');
            } else {
                selectedCategories.delete(cat);
                itemDiv.classList.remove('active');
            }
            updateFilterChips();
            renderAuctionItems();
            closeSidebarMobile();
        });

        itemDiv.appendChild(checkbox);
        itemDiv.appendChild(label);
        itemDiv.appendChild(count);
        container.appendChild(itemDiv);

        if (selectedCategories.has(cat)) {
            itemDiv.classList.add('active');
        }
    });
}

function updateSidebarChecks() {
    const checkboxes = document.querySelectorAll('#sidebarCategories input[type="checkbox"]');
    checkboxes.forEach(cb => {
        cb.checked = selectedCategories.has(cb.value);
        if (cb.checked) {
            cb.closest('.category-item').classList.add('active');
        } else {
            cb.closest('.category-item').classList.remove('active');
        }
    });
}

function updateFilterChips() {
    const chips = document.querySelectorAll('.category-filters .filter-chip');
    chips.forEach(chip => {
        if (selectedCategories.has(chip.textContent)) {
            chip.classList.add('active');
        } else {
            chip.classList.remove('active');
        }
    });
}


function setupSidebarToggle() {
    const toggleBtn = document.getElementById('sidebarToggle');
    const mobileNavBtn = document.getElementById('mobileNavToggle');
    const sidebar = document.querySelector('.category-sidebar');
    const closeBtn = document.getElementById('sidebarClose');
    const navMenu = document.querySelector('.nav-menu');

    if (!toggleBtn || !sidebar) return;

    // mobile overlay DOM element (created once)
    let mobileOverlay = document.getElementById('mobileOverlay');
    if (!mobileOverlay) {
        mobileOverlay = document.createElement('div');
        mobileOverlay.id = 'mobileOverlay';
        document.body.appendChild(mobileOverlay);
    }

    function setBodyOverlay(open) {
        document.body.classList.toggle('mobile-menu-open', open);
        if (mobileOverlay) mobileOverlay.classList.toggle('active', open);
    }

    function resetMobilePanels() {
        if (sidebar) { sidebar.classList.remove('active'); sidebar.style.visibility = ''; }
        if (navMenu) { navMenu.classList.remove('active'); navMenu.style.visibility = ''; }
        document.body.classList.remove('mobile-menu-open');
    }

    function updateToggleVisibility() {
        if (window.innerWidth <= 768) {
            toggleBtn.style.display = 'block';
            if (mobileNavBtn) mobileNavBtn.style.display = 'block';
        } else {
            toggleBtn.style.display = 'none';
            if (mobileNavBtn) mobileNavBtn.style.display = 'none';
            resetMobilePanels();
        }
    }

    // Relocate panels depending on viewport width
    function relocatePanels() {
        const navContainer = document.querySelector('.nav-container');
        const homeWrapper = document.querySelector('.home-wrapper');
        if (window.innerWidth <= 1000) {
            if (navMenu && navMenu.parentElement !== document.body) document.body.appendChild(navMenu);
            if (sidebar && sidebar.parentElement !== document.body) document.body.appendChild(sidebar);
        } else {
            if (navMenu && navContainer && navMenu.parentElement !== navContainer) navContainer.appendChild(navMenu);
            if (sidebar && homeWrapper && sidebar.parentElement !== homeWrapper) {
                homeWrapper.insertBefore(sidebar, homeWrapper.firstChild);
                sidebar.classList.remove('active');
            }
            setBodyOverlay(false);
        }
    }

    relocatePanels();
    updateToggleVisibility();
    window.addEventListener('resize', () => { relocatePanels(); updateToggleVisibility(); });

    toggleBtn.addEventListener('click', () => {
        const isActive = sidebar.classList.toggle('active');
        setBodyOverlay(isActive);
        toggleBtn.setAttribute('aria-expanded', String(isActive));
    });

    // support touchstart as well for devices that prefer it (improves responsiveness)
    toggleBtn.addEventListener('touchstart', (e) => { e.preventDefault(); toggleBtn.click(); }, { passive: false });

    if (mobileNavBtn && navMenu) {
        mobileNavBtn.addEventListener('click', () => {
            const isActive = navMenu.classList.toggle('active');
            setBodyOverlay(isActive);
            mobileNavBtn.setAttribute('aria-expanded', String(isActive));
        });
        mobileNavBtn.addEventListener('touchstart', (e) => { e.preventDefault(); mobileNavBtn.click(); }, { passive: false });

        navMenu.addEventListener('click', (e) => {
            if (e.target.closest('.nav-link')) {
                setTimeout(() => {
                    navMenu.classList.remove('active');
                    setBodyOverlay(false);
                }, 250);
            }
        });
    }

    closeBtn.addEventListener('click', () => {
        sidebar.classList.remove('active');
        setBodyOverlay(false);
    });

    sidebar.addEventListener('click', (e) => {
        if (e.target.closest('.category-item')) {
            setTimeout(() => closeSidebarMobile(), 300);
        }
    });

    // Global handler: ESC to close mobile panels; click outside to close
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            resetMobilePanels();
        }
    });

    document.addEventListener('click', (e) => {
        if (window.innerWidth > 1000) return;
        if (sidebar.classList.contains('active') && !e.target.closest('.category-sidebar') && !e.target.closest('#sidebarToggle')) {
            resetMobilePanels();
        }
        if (navMenu && navMenu.classList.contains('active') && !e.target.closest('.nav-menu') && !e.target.closest('#mobileNavToggle')) {
            resetMobilePanels();
        }
    });

    if (mobileOverlay) {
        mobileOverlay.addEventListener('click', () => resetMobilePanels());
    }

    resetMobilePanels();
}

function closeSidebarMobile() {
    if (window.innerWidth <= 1000) {
        const sidebar = document.querySelector('.category-sidebar');
        if (sidebar) sidebar.classList.remove('active');
        document.body.classList.remove('mobile-menu-open');
    }
}


function deleteItem(itemId) {
    if (!isAdmin) { alert('Akses ditolak (hanya admin)'); return; }
    if (!confirm('Hapus item ini dari daftar lelang?')) return;
    const idx = auctionItems.findIndex(i => i.id === itemId);
    if (idx >= 0) auctionItems.splice(idx, 1);
    renderAdminPanel();
    showNotification('Item berhasil dihapus');
}

function renderAdminPanel() {
    const container = document.getElementById('adminListContainer');
    if (!container) return;
    if (!isAdmin) {
        container.innerHTML = `<div class="empty-state"><h3>Anda bukan admin.</h3></div>`;
        return;
    }
    if (auctionItems.length === 0) {
        container.innerHTML = `<div class="empty-state"><h3>Tidak ada item.</h3></div>`;
        return;
    }

    container.innerHTML = '';
    auctionItems.forEach(item => {
        const row = document.createElement('div');
        row.className = 'admin-row';
        row.innerHTML = `
            <img src="${item.image}" alt="${item.name}">
            <div class="admin-meta">
                <h3 style="margin:0">${item.name} <span class="admin-badge">${item.seller}</span></h3>
                <p style="margin:6px 0; color:var(--warm-gray);">Rp ${formatPrice(item.currentBid)} • ${item.categories ? item.categories.join(', ') : ''}</p>
                <p style="margin:0; color:var(--warm-gray); font-size:0.9rem;">${item.description}</p>
            </div>
            <div class="admin-actions">
                <button class="btn btn-cancel" onclick="deleteItem(${item.id})">Hapus</button>
            </div>
        `;
        container.appendChild(row);
    });
}

function setCurrentUser(user) {
    if (typeof user === 'string') {
        currentUser = { email: user };
        currentUserEmail = user;
    } else {
        currentUser = user || null;
        currentUserEmail = user && user.email ? user.email : null;
    }
    console.log('✅ Current user set', currentUser);
}

function setAdminUser() {
    isAdmin = true;
    console.log('✅ Admin user set');
    window.location.href = 'admin.html';
}

function logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('isAdminLoggedIn');
    window.location.href = 'index.html';
}


function logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('isAdminLoggedIn');
    location.reload();
}

async function markAllRead() {
    const unread = notifications.filter(n => n.readFlag === 0);
    for (const n of unread) {
        await markNotificationRead(n.id);
    }
    showAlert('Semua notifikasi ditandai dibaca', 'success');
}

// Handle multiple image uploads with preview
document.addEventListener('DOMContentLoaded', () => {
    const imageInput = document.getElementById('itemImages');
    const previewContainer = document.getElementById('imagePreviewContainer');
    const previewGrid = document.getElementById('imagePreviewGrid');
    const imageCount = document.getElementById('imageCount');
    const imageWarning = document.getElementById('imageWarning');
    const clearImagesBtn = document.getElementById('clearImagesBtn');
    const fileInputWrapper = document.querySelector('.file-input-wrapper-multiple');
    
    if (!imageInput) return;
    
    // Handle file selection
    imageInput.addEventListener('change', (e) => {
        const files = e.target.files;
        updateImagePreview(files);
    });
    
    // Handle drag and drop
    fileInputWrapper.addEventListener('dragover', (e) => {
        e.preventDefault();
        fileInputWrapper.style.borderColor = 'var(--charcoal)';
        fileInputWrapper.style.background = 'rgba(193, 164, 97, 0.2)';
    });
    
    fileInputWrapper.addEventListener('dragleave', () => {
        fileInputWrapper.style.borderColor = 'var(--gold)';
        fileInputWrapper.style.background = 'linear-gradient(135deg, var(--champagne), var(--light-gold))';
    });
    
    fileInputWrapper.addEventListener('drop', (e) => {
        e.preventDefault();
        fileInputWrapper.style.borderColor = 'var(--gold)';
        fileInputWrapper.style.background = 'linear-gradient(135deg, var(--champagne), var(--light-gold))';
        
        const files = e.dataTransfer.files;
        imageInput.files = files;
        
        const event = new Event('change', { bubbles: true });
        imageInput.dispatchEvent(event);
    });
    
    fileInputWrapper.addEventListener('click', () => {
        imageInput.click();
    });
    
    // Clear images button
    if (clearImagesBtn) {
        clearImagesBtn.addEventListener('click', () => {
            imageInput.value = '';
            previewContainer.style.display = 'none';
            previewGrid.innerHTML = '';
            imageWarning.style.display = 'none';
        });
    }
    
    function updateImagePreview(files) {
        previewGrid.innerHTML = '';
        imageWarning.style.display = 'none';
        
        const fileCount = files.length;
        imageCount.textContent = fileCount;
        
        // Validasi jumlah file
        if (fileCount < 4) {
            imageWarning.textContent = `⚠️ Minimal 4 foto diperlukan (Saat ini: ${fileCount})`;
            imageWarning.style.display = 'block';
            imageWarning.style.color = 'var(--gold)';
        } else if (fileCount > 10) {
            imageWarning.textContent = `⚠️ Maksimal 10 foto (Saat ini: ${fileCount})`;
            imageWarning.style.display = 'block';
            imageWarning.style.color = 'var(--gold)';
        } else {
            imageWarning.textContent = '✅ Jumlah foto sudah sesuai';
            imageWarning.style.display = 'block';
            imageWarning.style.color = 'var(--charcoal)';
        }
        
        // Show preview if ada file
        if (fileCount > 0) {
            previewContainer.style.display = 'block';
            
            Array.from(files).forEach((file, index) => {
                const reader = new FileReader();
                
                reader.onload = (e) => {
                    const previewItem = document.createElement('div');
                    previewItem.className = 'image-preview-item';
                    previewItem.innerHTML = `
                        <img src="${e.target.result}" alt="Preview ${index + 1}">
                        <button type="button" class="remove-btn" data-index="${index}" title="Hapus foto ini">
                            <i class="fas fa-trash"></i>
                        </button>
                    `;
                    
                    previewGrid.appendChild(previewItem);
                    
                    const removeBtn = previewItem.querySelector('.remove-btn');
                    removeBtn.addEventListener('click', (evt) => {
                        evt.stopPropagation();
                        removeImageByIndex(index);
                    });
                };
                
                reader.readAsDataURL(file);
            });
        } else {
            previewContainer.style.display = 'none';
        }
    }
    
    function removeImageByIndex(indexToRemove) {
        const dataTransfer = new DataTransfer();
        const files = imageInput.files;
        
        for (let i = 0; i < files.length; i++) {
            if (i !== indexToRemove) {
                dataTransfer.items.add(files[i]);
            }
        }
        
        imageInput.files = dataTransfer.files;
        updateImagePreview(imageInput.files);
    }
});

(function() {
    function toggleSidebar() {
        const sidebar = document.querySelector('.category-sidebar');
        const toggleBtn = document.getElementById('sidebarToggle');
        if (!sidebar || !toggleBtn) return;
        const isActive = sidebar.classList.toggle('active');
        document.body.classList.toggle('mobile-menu-open', isActive);
        toggleBtn.setAttribute('aria-expanded', String(isActive));
        // hide other panel if open
        const nav = document.querySelector('.nav-menu'); if (nav && nav.classList.contains('active')) { nav.classList.remove('active'); }
    }
    function toggleNav() {
        const nav = document.querySelector('.nav-menu');
        const mobileNavBtn = document.getElementById('mobileNavToggle');
        if (!nav || !mobileNavBtn) return;
        const isActive = nav.classList.toggle('active');
        document.body.classList.toggle('mobile-menu-open', isActive);
        mobileNavBtn.setAttribute('aria-expanded', String(isActive));
        const sidebar = document.querySelector('.category-sidebar'); if (sidebar && sidebar.classList.contains('active')) { sidebar.classList.remove('active'); }
    }

    // Search functionality
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const searchClearLeft = document.getElementById('searchClearLeft');
    
    if (searchInput && searchBtn) {
        searchBtn.addEventListener('click', performSearch);
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') performSearch();
        });
        
        searchInput.addEventListener('input', (e) => {
            if (e.target.value.trim()) {
                if (searchClearLeft) searchClearLeft.style.display = 'block';
            } else {
                if (searchClearLeft) searchClearLeft.style.display = 'none';
            }
        });
        
        if (searchClearLeft) {
            searchClearLeft.addEventListener('click', () => {
                searchInput.value = '';
                searchClearLeft.style.display = 'none';
                performSearch();
            });
        }
    }
    
    function performSearch() {
        const query = searchInput.value.trim().toLowerCase();
        const grid = document.getElementById('auctionGrid');
        
        if (!query) {
            // If search is empty, show all items
            renderAuctionItems();
            return;
        }
        
        // Filter items based on search query
        const filteredItems = auctionItems.filter(item => {
            const name = (item.name || '').toLowerCase();
            const description = (item.description || '').toLowerCase();
            const categories = (item.categories || []).map(c => c.toLowerCase()).join(' ');
            
            return name.includes(query) || description.includes(query) || categories.includes(query);
        });
        
        grid.innerHTML = '';
        
        if (filteredItems.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon"><i class="fas fa-search"></i></div>
                    <h2 class="empty-title">Tidak ada hasil pencarian</h2>
                    <p class="empty-text">Coba gunakan kata kunci yang berbeda</p>
                </div>
            `;
            return;
        }
        
        filteredItems.forEach(item => {
            const isWishlisted = wishlist.some(w => w.id === item.id);
            const card = createAuctionCard(item, isWishlisted);
            grid.appendChild(card);
        });
        
        setupLiquidScrollForElements();
    }

    document.addEventListener('click', (e) => {
        if (e.target.closest('#sidebarToggle')) { toggleSidebar(); }
        if (e.target.closest('#mobileNavToggle')) { toggleNav(); }
    });

    document.addEventListener('touchstart', (e) => {
        if (e.target.closest('#sidebarToggle')) { e.preventDefault(); toggleSidebar(); }
        if (e.target.closest('#mobileNavToggle')) { e.preventDefault(); toggleNav(); }
    }, { passive: false });
})();