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

let auctionItems = [
    {
        id: 1,
        name: "Lukisan Monalisa Replica",
        image: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=600",
        description: "Replika sempurna dari masterpiece Leonardo da Vinci, dibuat dengan teknik klasik dan cat minyak premium.",
        currentBid: 25000000,
        endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        seller: "Gallery Renaissance",
        sellerId: "SELL001",
        sellerPhone: "082112345678",
        sellerRating: 4.8,
        categories: ["Seni", "Lukisan 90s"]
    },
    {
        id: 2,
        name: "Vas Keramik Dinasti Ming",
        image: "https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=600",
        description: "Vas antik dari Dinasti Ming (1368-1644), ornamen naga berlapis emas dengan kondisi sempurna.",
        currentBid: 150000000,
        endTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        seller: "Asian Antiquities",
        sellerId: "SELL002",
        sellerPhone: "081987654321",
        sellerRating: 4.6,
        categories: ["Antik", "Vas", "Barang Antik"]
    },
    {
        id: 3,
        name: "Jam Tangan Patek Philippe Vintage",
        image: "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=600",
        description: "Patek Philippe Calatrava tahun 1950-an, limited edition dengan sertifikat keaslian dan box original.",
        currentBid: 450000000,
        endTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
        seller: "Luxury Timepieces",
        sellerId: "SELL003",
        sellerPhone: "085512345678",
        sellerRating: 4.9,
        categories: ["Jam Tangan", "Aksesoris"]
    },
    {
        id: 4,
        name: "Patung Marmer Yunani Kuno",
        image: "https://images.unsplash.com/photo-1566199101570-c9c4c2863f9d?w=600",
        description: "Patung dewi Aphrodite dari era Hellenistic, marmer Carrara putih dengan detail pahatan luar biasa.",
        currentBid: 320000000,
        endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        seller: "Classical Arts Foundation",
        sellerId: "SELL004",
        sellerPhone: "083345678901",
        sellerRating: 4.7,
        categories: ["Seni", "Antik", "Barang Antik"]
    },
    {
        id: 5,
        name: "Kaligrafi Arab Antik",
        image: "https://images.unsplash.com/photo-1612198188060-c7c2a3b66eae?w=600",
        description: "Kaligrafi suci berusia 400 tahun dengan tinta emas pada papirus, lengkap dengan frame kayu ukir.",
        currentBid: 85000000,
        endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        seller: "Islamic Heritage Museum",
        sellerId: "SELL005",
        sellerPhone: "089876543210",
        sellerRating: 4.5,
        categories: ["Kaligrafi", "Antik", "Barang Antik"]
    },
    {
        id: 6,
        name: "Permadani Persia Sutra",
        image: "https://images.unsplash.com/photo-1600166898329-c0f131b9b7dc?w=600",
        description: "Permadani sutra Iran ukuran 3x4 meter, motif taman surga dengan 1000 simpul per inci persegi.",
        currentBid: 175000000,
        endTime: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
        seller: "Persian Carpet House",
        sellerId: "SELL006",
        sellerPhone: "088765432109",
        sellerRating: 4.8,
        categories: ["Permadani", "Perabotan"]
    }
];

let userBids = [];
let wishlist = [];
let currentBidItem = null;
let selectedCategories = new Set();
let isAdmin = false;
let currentUser = null; // Store logged-in user info
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

        if (page === 'admin' && !isAdmin) {
            alert('Anda tidak memiliki akses admin. Silakan login sebagai admin terlebih dahulu.');
            return;
        }
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        this.classList.add('active');
        
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.getElementById(page + 'Page').classList.add('active');
        
        if (page === 'mybid') renderBidHistory();
        if (page === 'wishlist') renderWishlist();
        if (page === 'admin') renderAdminPanel();
    });
});


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
    

    const categoriesHtml = (item.categories || []).map(c => `<span class="bid-label" style="margin-right:6px; display:inline-block; background: rgba(0,0,0,0.04); padding:4px 8px; border-radius:12px; font-size:0.75rem;">${c}</span>`).join('');

    card.innerHTML = `
        <img src="${item.image}" alt="${item.name}" class="card-image">
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
                <button class="btn btn-primary" onclick="openBidModal(${item.id})">
                    <i class="fas fa-gavel"></i> Bid Sekarang
                </button>
                <button class="btn btn-secondary" onclick="openItemDetailModal(${item.id})" style="background: linear-gradient(135deg, #4a90e2, #357abd); color: white;">
                    <i class="fas fa-eye"></i> Lihat Detail
                </button>
                <button class="btn btn-wishlist ${isWishlisted ? 'active' : ''}" onclick="toggleWishlist(${item.id})">
                    <i class="fas fa-heart"></i>
                </button>
                ${isAdmin ? `<button class="btn btn-wishlist" style="background:#ff6b6b;color:#fff;" onclick="deleteItem(${item.id})"><i class="fas fa-trash"></i></button>` : ''}
            </div>
        </div>
    `;
    
    return card;
}


function openBidModal(itemId) {
    currentBidItem = auctionItems.find(item => item.id === itemId);
    document.getElementById('bidAmount').value = '';
    document.getElementById('bidAmount').min = currentBidItem.currentBid + 1000;
    document.getElementById('bidModal').classList.add('active');
}

function closeBidModal() {
    document.getElementById('bidModal').classList.remove('active');
    currentBidItem = null;
}

function submitBid() {
    const bidAmount = parseInt(document.getElementById('bidAmount').value);
    
    if (!bidAmount || bidAmount <= currentBidItem.currentBid) {
        alert('Bid harus lebih tinggi dari harga saat ini!');
        return;
    }
    
    
    currentBidItem.currentBid = bidAmount;
    
    
    const existingBidIndex = userBids.findIndex(b => b.itemId === currentBidItem.id);
    if (existingBidIndex >= 0) {
        userBids[existingBidIndex].amount = bidAmount;
        userBids[existingBidIndex].time = new Date().toISOString();
    } else {
        userBids.push({
            itemId: currentBidItem.id,
            amount: bidAmount,
            time: new Date().toISOString(),
            status: 'winning'
        });
    }
    
    closeBidModal();
    renderAuctionItems();
    
    
    showNotification('Bid berhasil dipasang! 🎉');
}


function toggleWishlist(itemId) {
    const index = wishlist.findIndex(w => w.id === itemId);
    
    if (index >= 0) {
        wishlist.splice(index, 1);
    } else {
        const item = auctionItems.find(i => i.id === itemId);
        wishlist.push(item);
    }
    
    updateWishlistBadge();
    renderAuctionItems();
    
    if (document.getElementById('wishlistPage').classList.contains('active')) {
        renderWishlist();
    }
}

function updateWishlistBadge() {
    document.getElementById('wishlistBadge').textContent = wishlist.length;
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


function renderBidHistory() {
    const container = document.getElementById('bidHistory');
    
    if (userBids.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon"><i class="fas fa-gavel"></i></div>
                <h2 class="empty-title">Belum Ada Penawaran</h2>
                <p class="empty-text">Mulai ikut lelang untuk melihat riwayat penawaran Anda</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = '';
    userBids.forEach(bid => {
        const item = auctionItems.find(i => i.id === bid.itemId);
        if (!item) return;
        
        const isWinning = bid.amount >= item.currentBid;
        const statusClass = isWinning ? 'status-winning' : 'status-outbid';
        const statusText = isWinning ? '✓ Menang' : '✗ Kalah Bid';
        
        const card = document.createElement('div');
        card.className = 'bid-card';
        card.innerHTML = `
            <img src="${item.image}" alt="${item.name}" class="bid-image">
            <div class="bid-details">
                <span class="bid-status ${statusClass}">${statusText}</span>
                <h3 class="card-title">${item.name}</h3>
                <p class="card-description">${item.description}</p>
                <div class="card-info" style="border: none; padding: 0;">
                    <div class="current-bid">
                        <div class="bid-label">Bid Anda</div>
                        <div class="bid-amount">Rp ${formatPrice(bid.amount)}</div>
                    </div>
                    <div class="time-left">
                        <div class="bid-label">Bid Tertinggi Saat Ini</div>
                        <div class="bid-amount" style="font-size: 1.2rem;">Rp ${formatPrice(item.currentBid)}</div>
                    </div>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
    
    setupLiquidScrollForElements();
}


document.getElementById('addItemForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const fileInput = document.getElementById('itemImage');
    const file = fileInput.files[0];
    
    if (!file) {
        alert('Silakan upload gambar barang');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const newItem = {
            id: Date.now(),
            name: document.getElementById('itemName').value,
            image: e.target.result,
            description: document.getElementById('itemDescription').value,
            currentBid: parseInt(document.getElementById('itemPrice').value),
            endTime: new Date(document.getElementById('itemEndTime').value).toISOString(),
            seller: 'Anda',
            initialPrice: parseInt(document.getElementById('itemPrice').value),
            soldNotified: false,
            categories: Array.from(document.querySelectorAll('.item-category-checkbox:checked')).map(el => el.value)
        };
        
        auctionItems.unshift(newItem);
        
        document.getElementById('addItemForm').reset();
        showNotification('Barang berhasil ditambahkan ke lelang! 🎊');
        
        
        document.querySelector('[data-page="home"]').click();
    };
    
    reader.readAsDataURL(file);
});


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
    const modal = document.getElementById('itemDetailModal');
    

    document.getElementById('detailItemTitle').textContent = item.name;
    document.getElementById('detailItemImage').src = item.image;
    document.getElementById('detailItemPrice').textContent = 'Rp ' + formatPrice(item.currentBid);
    document.getElementById('detailItemDescription').textContent = item.description;
    
    updateItemTimer(item.endTime);
    
    loadBidHistory(itemId);
    
    modal.style.display = 'flex';
}

function closeItemDetail() {
    document.getElementById('itemDetailModal').style.display = 'none';
}

// New detailed item view with seller info and payment methods
function openItemDetailModal(itemId) {
    const item = getItemById(itemId);
    
    const detailHTML = `
        <div class="item-detail-page">
            <!-- Image Section -->
            <div class="detail-image-section">
                <img src="${item.image}" alt="${item.name}" class="detail-main-image">
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
                    <div class="price-value">Rp ${formatPrice(item.currentBid)}</div>
                    <div class="time-info">
                        <i class="fas fa-clock"></i> Waktu Tersisa: <span id="detailModalTimer">${getTimeLeft(item.endTime)}</span>
                    </div>
                </div>
                
                <!-- Description -->
                <div class="detail-section">
                    <h3><i class="fas fa-info-circle"></i> Deskripsi Barang</h3>
                    <p>${item.description}</p>
                </div>
                
                <!-- Seller Info -->
                <div class="detail-section seller-info">
                    <h3><i class="fas fa-user-circle"></i> Informasi Penjual</h3>
                    <div class="seller-card">
                        <div class="seller-header">
                            <div class="seller-avatar">
                                <i class="fas fa-store"></i>
                            </div>
                            <div class="seller-details">
                                <div class="seller-name">${item.seller}</div>
                                <div class="seller-id"><i class="fas fa-tag"></i> ID: <strong>${item.sellerId}</strong></div>
                                <div class="seller-rating">
                                    <i class="fas fa-star"></i> ${item.sellerRating}/5.0 Rating
                                </div>
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
                    <button class="btn btn-secondary" onclick="closeDetailModal()">
                        <i class="fas fa-times"></i> Tutup
                    </button>
                </div>
            </div>
        </div>
    `;
    
    const modal = document.getElementById('itemDetailModal');
    modal.innerHTML = `<div class="modal-content modal-detail">${detailHTML}</div>`;
    modal.classList.add('active');
}

function closeDetailModal() {
    const modal = document.getElementById('itemDetailModal');
    modal.classList.remove('active');
}

function selectPaymentMethod(method, sellerId, phone) {
    if (method === 'cod') {
        alert(`Metode: COD\nSeller ID: ${sellerId}\n\nHubungi penjual untuk konfirmasi pesanan.`);
    } else if (method === 'whatsapp') {
        const waLink = `https://wa.me/${phone}?text=Halo! Saya ingin menghubungi Anda tentang barang lelang yang saya menangkan. Seller ID: ${sellerId}`;
        window.open(waLink, '_blank');
    }
}


function updateItemTimer(endTime) {
    const timerElement = document.getElementById('detailItemTimer');
    const timer = setInterval(() => {
        const timeLeft = new Date(endTime) - new Date();
        if (timeLeft <= 0) {
            clearInterval(timer);
            timerElement.textContent = 'Lelang Berakhir';
            return;
        }
        
        const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
        
        timerElement.textContent = `${days}h ${hours}j ${minutes}m ${seconds}d`;
    }, 1000);
}

function loadBidHistory(itemId) {
    const historyElement = document.getElementById('detailBidHistory');
    
    historyElement.innerHTML = `
        <div class="bid-history-item">
            <span class="bidder">User123</span>
            <span class="bid-amount">Rp 5.000.000</span>
            <span class="bid-time">2 menit yang lalu</span>
        </div>
    `;
}

function createAuctionItem(item) {

    itemElement.addEventListener('click', () => openItemDetail(item.id));

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
    const sidebar = document.querySelector('.category-sidebar');
    const closeBtn = document.getElementById('sidebarClose');

    if (!toggleBtn || !sidebar) return;


    function updateToggleVisibility() {
        if (window.innerWidth <= 768) {
            toggleBtn.style.display = 'block';
        } else {
            toggleBtn.style.display = 'none';
            sidebar.classList.remove('active');
        }
    }

    updateToggleVisibility();
    window.addEventListener('resize', updateToggleVisibility);


    toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('active');
    });


    closeBtn.addEventListener('click', () => {
        sidebar.classList.remove('active');
    });


    sidebar.addEventListener('click', (e) => {
        if (e.target.closest('.category-item')) {
            setTimeout(() => closeSidebarMobile(), 300);
        }
    });
}

function closeSidebarMobile() {
    if (window.innerWidth <= 768) {
        const sidebar = document.querySelector('.category-sidebar');
        if (sidebar) sidebar.classList.remove('active');
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

// Set currentUser after successful login
function setCurrentUser(email) {
    currentUser = {
        email: email,
        loginTime: new Date()
    };
}