// Data Storage (in-memory instead of localStorage)
let auctionItems = [
    {
        id: 1,
        name: "Lukisan Monalisa Replica",
        image: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=600",
        description: "Replika sempurna dari masterpiece Leonardo da Vinci, dibuat dengan teknik klasik dan cat minyak premium.",
        currentBid: 25000000,
        endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        seller: "Gallery Renaissance"
    },
    {
        id: 2,
        name: "Vas Keramik Dinasti Ming",
        image: "https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=600",
        description: "Vas antik dari Dinasti Ming (1368-1644), ornamen naga berlapis emas dengan kondisi sempurna.",
        currentBid: 150000000,
        endTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        seller: "Asian Antiquities"
    },
    {
        id: 3,
        name: "Jam Tangan Patek Philippe Vintage",
        image: "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=600",
        description: "Patek Philippe Calatrava tahun 1950-an, limited edition dengan sertifikat keaslian dan box original.",
        currentBid: 450000000,
        endTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
        seller: "Luxury Timepieces"
    },
    {
        id: 4,
        name: "Patung Marmer Yunani Kuno",
        image: "https://images.unsplash.com/photo-1566199101570-c9c4c2863f9d?w=600",
        description: "Patung dewi Aphrodite dari era Hellenistic, marmer Carrara putih dengan detail pahatan luar biasa.",
        currentBid: 320000000,
        endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        seller: "Classical Arts Foundation"
    },
    {
        id: 5,
        name: "Kaligrafi Arab Antik",
        image: "https://images.unsplash.com/photo-1612198188060-c7c2a3b66eae?w=600",
        description: "Kaligrafi suci berusia 400 tahun dengan tinta emas pada papirus, lengkap dengan frame kayu ukir.",
        currentBid: 85000000,
        endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        seller: "Islamic Heritage Museum"
    },
    {
        id: 6,
        name: "Permadani Persia Sutra",
        image: "https://images.unsplash.com/photo-1600166898329-c0f131b9b7dc?w=600",
        description: "Permadani sutra Iran ukuran 3x4 meter, motif taman surga dengan 1000 simpul per inci persegi.",
        currentBid: 175000000,
        endTime: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
        seller: "Persian Carpet House"
    }
];

let userBids = [];
let wishlist = [];
let currentBidItem = null;

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    showLoader();
    setTimeout(() => {
        renderAuctionItems();
        updateWishlistBadge();
        startTimers();
        hideLoader();
    }, 800);
});

// Navigation
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        const page = this.dataset.page;
        
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        this.classList.add('active');
        
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.getElementById(page + 'Page').classList.add('active');
        
        if (page === 'mybid') renderBidHistory();
        if (page === 'wishlist') renderWishlist();
    });
});


function renderAuctionItems() {
    const grid = document.getElementById('auctionGrid');
    grid.innerHTML = '';
    
    auctionItems.forEach(item => {
        const isWishlisted = wishlist.some(w => w.id === item.id);
        const card = createAuctionCard(item, isWishlisted);
        grid.appendChild(card);
    });
}

function createAuctionCard(item, isWishlisted = false) {
    const card = document.createElement('div');
    card.className = 'auction-card';
    
    const timeLeft = getTimeLeft(item.endTime);
    
    card.innerHTML = `
        <img src="${item.image}" alt="${item.name}" class="card-image">
        <div class="card-body">
            <h3 class="card-title">${item.name}</h3>
            <p class="card-description">${item.description}</p>
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
                <button class="btn btn-wishlist ${isWishlisted ? 'active' : ''}" onclick="toggleWishlist(${item.id})">
                    <i class="fas fa-heart"></i>
                </button>
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
}

// Bid History
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
            seller: 'Anda'
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

// Item Detail Functions
function openItemDetail(itemId) {
    const item = getItemById(itemId); // Implement this function to get item data
    const modal = document.getElementById('itemDetailModal');
    
    // Populate item details
    document.getElementById('detailItemTitle').textContent = item.name;
    document.getElementById('detailItemImage').src = item.image;
    document.getElementById('detailItemPrice').textContent = formatCurrency(item.currentPrice);
    document.getElementById('detailItemDescription').textContent = item.description;
    
    // Start timer
    updateItemTimer(item.endTime);
    
    // Load bid history
    loadBidHistory(itemId);
    
    // Show modal
    modal.style.display = 'flex';
}

function closeItemDetail() {
    document.getElementById('itemDetailModal').style.display = 'none';
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
    // Implement bid history loading logic here
    // Example:
    historyElement.innerHTML = `
        <div class="bid-history-item">
            <span class="bidder">User123</span>
            <span class="bid-amount">Rp 5.000.000</span>
            <span class="bid-time">2 menit yang lalu</span>
        </div>
    `;
}

// Update your existing code to call openItemDetail when an item is clicked
function createAuctionItem(item) {
    // ...existing code...
    itemElement.addEventListener('click', () => openItemDetail(item.id));
    // ...existing code...
}

// Helper function to format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(amount);
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