// ============ GLOBAL STATE ============
const adminState = {
    items: [],
    users: [],
    bids: [],
    currentDeleteItemId: null,
    currentRecommendationItem: null,
    searchQuery: '',
    statusFilter: ''
};

// ============ INITIALIZATION ============
document.addEventListener('DOMContentLoaded', () => {
    initializeAdmin();
    loadItemsData();
    setupEventListeners();
    renderItems();
});

function initializeAdmin() {
    checkAdminAccess();
    displayUserInfo();
}

function checkAdminAccess() {
    const isAdmin = localStorage.getItem('isAdminLoggedIn');
    
    if (!isAdmin) {
        alert('Anda tidak memiliki akses admin. Silakan login sebagai admin terlebih dahulu.');
        window.location.href = 'index.html';
        return;
    }
}

function displayUserInfo() {
    const userInfo = document.getElementById('userInfo');
    const adminName = localStorage.getItem('adminName') || 'Admin';
    userInfo.textContent = `Halo, ${adminName} 👋`;
}

// ============ EVENT LISTENERS ============
function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const section = item.getAttribute('data-section');
            switchSection(section);
        });
    });

    // Search and Filter
    document.getElementById('searchInput').addEventListener('input', (e) => {
        adminState.searchQuery = e.target.value.toLowerCase();
        renderItems();
    });

    document.getElementById('statusFilter').addEventListener('change', (e) => {
        adminState.statusFilter = e.target.value;
        renderItems();
    });
}

// ============ SECTION NAVIGATION ============
function switchSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.section-container').forEach(section => {
        section.classList.remove('active');
    });

    // Remove active from all nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });

    // Show selected section
    const sectionId = `${sectionName}-section`;
    const section = document.getElementById(sectionId);
    if (section) {
        section.classList.add('active');
    }

    // Add active to clicked nav item
    document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');

    // Load data if needed
    if (sectionName === 'stats') {
        loadStatistics();
    } else if (sectionName === 'users') {
        loadUsersData();
    }
}

// ============ ITEMS MANAGEMENT ============
function loadItemsData() {
    // Try to get items dari window.auctionItems (jika admin.html opened dari main app)
    if (window.auctionItems && Array.isArray(window.auctionItems)) {
        adminState.items = JSON.parse(JSON.stringify(window.auctionItems)); // Deep copy
    } else {
        // Otherwise try localStorage
        const storedItems = localStorage.getItem('auctionItems');
        if (storedItems) {
            try {
                adminState.items = JSON.parse(storedItems);
            } catch (e) {
                console.error('Error parsing items:', e);
                adminState.items = getSampleItems();
            }
        } else {
            adminState.items = getSampleItems();
        }
    }
}

function getSampleItems() {
    return [
        {
            id: 1,
            name: "Lukisan Monalisa Replica",
            image: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=600",
            description: "Replika sempurna dari masterpiece Leonardo da Vinci",
            currentBid: 25000000,
            initialPrice: 25000000,
            endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
            seller: "Gallery Renaissance",
            sellerId: "SELL001",
            sellerPhone: "082112345678",
            sellerRating: 4.8,
            categories: ["Seni", "Lukisan"],
            status: "active"
        },
        {
            id: 2,
            name: "Vas Keramik Dinasti Ming",
            image: "https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=600",
            description: "Vas antik dari Dinasti Ming dengan desain bunga",
            currentBid: 150000000,
            initialPrice: 150000000,
            endTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
            seller: "Asian Antiquities",
            sellerId: "SELL002",
            sellerPhone: "081987654321",
            sellerRating: 4.6,
            categories: ["Antik", "Vas"],
            status: "active"
        },
        {
            id: 3,
            name: "Jam Tangan Rolex Vintage",
            image: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=600",
            description: "Jam tangan Rolex Submariner tahun 1960an",
            currentBid: 85000000,
            initialPrice: 85000000,
            endTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            seller: "Luxury Watch Collection",
            sellerId: "SELL003",
            sellerPhone: "082456789012",
            sellerRating: 4.9,
            categories: ["Jam Tangan", "Vintage"],
            status: "ended"
        }
    ];
}

function renderItems() {
    const itemsList = document.getElementById('itemsList');
    
    // Filter items
    let filteredItems = adminState.items.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(adminState.searchQuery) ||
                             item.seller.toLowerCase().includes(adminState.searchQuery);
        const matchesStatus = !adminState.statusFilter || item.status === adminState.statusFilter;
        return matchesSearch && matchesStatus;
    });

    if (filteredItems.length === 0) {
        itemsList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📭</div>
                <h3>Tidak Ada Item</h3>
                <p>Tidak ada item yang sesuai dengan kriteria pencarian Anda.</p>
            </div>
        `;
        return;
    }

    itemsList.innerHTML = filteredItems.map(item => createItemCard(item)).join('');
}

function createItemCard(item) {
    const isEnded = item.status === 'ended';
    const endDate = new Date(item.endTime);
    const now = new Date();
    const timeRemaining = isEnded ? 'Berakhir' : getTimeRemaining(endDate, now);

    return `
        <div class="item-card" id="item-${item.id}">
            <img src="${item.image}" alt="${item.name}" class="item-image" onerror="this.src='https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=600'">
            
            <div class="item-details">
                <div>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <h3 class="item-name">${item.name}</h3>
                        ${item.isRecommended ? '<span style="background: linear-gradient(135deg, #f59e0b, #fbbf24); color: white; padding: 0.3rem 0.7rem; border-radius: 12px; font-size: 0.75rem; font-weight: 600;">⭐ TOP</span>' : ''}
                    </div>
                    <p class="item-seller">📍 ${item.seller}</p>
                    <p class="item-seller">⭐ Rating: ${item.sellerRating}/5</p>
                </div>
                <div>
                    <p class="item-price">Rp ${formatCurrency(item.currentBid)}</p>
                    <span class="item-status ${item.status}">${item.status === 'active' ? '🟢 Aktif' : '⏹️ Berakhir'}</span>
                </div>
            </div>
            
            <div class="item-actions">
                <button class="btn btn-primary" onclick="openRecommendationModal(${item.id})">
                    💡 Rekomendasi
                </button>
                <button class="btn btn-danger" onclick="openDeleteModal(${item.id}, '${item.name}')">
                    🗑️ Hapus
                </button>
            </div>
        </div>
    `;
}

function formatCurrency(value) {
    return new Intl.NumberFormat('id-ID').format(value);
}

function getTimeRemaining(endDate, now) {
    const diff = endDate - now;
    if (diff <= 0) return 'Berakhir';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}h ${hours}j tersisa`;
    return `${hours}j tersisa`;
}

// ============ DELETE FUNCTIONALITY ============
function openDeleteModal(itemId, itemName) {
    adminState.currentDeleteItemId = itemId;
    
    const modal = document.getElementById('deleteModal');
    document.getElementById('deleteItemName').textContent = `"${itemName}"`;
    
    modal.classList.add('active');
}

function closeDeleteModal() {
    const modal = document.getElementById('deleteModal');
    modal.classList.remove('active');
    adminState.currentDeleteItemId = null;
}

function confirmDelete() {
    const itemId = adminState.currentDeleteItemId;
    
    if (!itemId) return;

    // Remove from state
    const itemIndex = adminState.items.findIndex(i => i.id === itemId);
    if (itemIndex > -1) {
        const deletedItem = adminState.items.splice(itemIndex, 1)[0];
        
        // Save to localStorage
        localStorage.setItem('auctionItems', JSON.stringify(adminState.items));
        
        // Update window.auctionItems jika available
        if (window.auctionItems && Array.isArray(window.auctionItems)) {
            const mainAppIndex = window.auctionItems.findIndex(i => i.id === itemId);
            if (mainAppIndex > -1) {
                window.auctionItems.splice(mainAppIndex, 1);
            }
        }
        
        // Show success message
        showToast(`✅ Item "${deletedItem.name}" berhasil dihapus`, 'success');
        
        // Render items again
        renderItems();
        
        // Close modal
        closeDeleteModal();
    }
}

// ============ RECOMMENDATION FUNCTIONALITY ============
function openRecommendationModal(itemId) {
    const item = adminState.items.find(i => i.id === itemId);
    
    if (!item) return;

    adminState.currentRecommendationItem = item;

    // Generate recommendations
    const recommendations = generateRecommendations(item);

    // Update modal content
    const itemSummary = document.getElementById('itemSummary');
    itemSummary.innerHTML = `
        <h4>${item.name}</h4>
        <p><strong>Harga Saat Ini:</strong> Rp ${formatCurrency(item.currentBid)}</p>
        <p><strong>Penjual:</strong> ${item.seller}</p>
        <p><strong>Status:</strong> ${item.status === 'active' ? 'Aktif' : 'Berakhir'}</p>
    `;

    const recommendationText = document.getElementById('recommendationText');
    recommendationText.innerHTML = recommendations.map(rec => `<li>${rec}</li>`).join('');

    const modal = document.getElementById('recommendationModal');
    modal.classList.add('active');
}

function closeRecommendationModal() {
    const modal = document.getElementById('recommendationModal');
    modal.classList.remove('active');
    adminState.currentRecommendationItem = null;
}

function generateRecommendations(item) {
    const recommendations = [];

    // 1. Kategori rekomendasi
    if (item.categories && item.categories.length > 0) {
        recommendations.push(`✓ <strong>Tingkatkan Visibilitas:</strong> Item "${item.name}" termasuk kategori ${item.categories.join(', ')}. Pertimbangkan untuk menampilkannya di bagian atas kategori tersebut untuk meningkatkan penjualan.`);
    }

    // 2. Price positioning
    if (item.currentBid > 50000000) {
        recommendations.push(`✓ <strong>Premium Item:</strong> Dengan harga Rp ${formatCurrency(item.currentBid)}, item ini cocok untuk premium showcase. Tampilkan di featured section untuk target buyer yang lebih tinggi.`);
    }

    // 3. Rating review
    if (item.sellerRating >= 4.5) {
        recommendations.push(`✓ <strong>Seller Terpercaya:</strong> Penjual memiliki rating ${item.sellerRating}/5. Highlight ini untuk meningkatkan kredibilitas item.`);
    }

    // 4. Status-based
    if (item.status === 'ended') {
        recommendations.push(`⚠️ <strong>Item Berakhir:</strong> Pertimbangkan untuk mengarsipkan item ini atau menyarankan penjual untuk relisting.`);
    } else {
        const endDate = new Date(item.endTime);
        const now = new Date();
        const hoursRemaining = Math.floor((endDate - now) / (1000 * 60 * 60));
        
        if (hoursRemaining < 12 && hoursRemaining > 0) {
            recommendations.push(`⏰ <strong>Waktu Habis Segera:</strong> Lelang berakhir dalam ${hoursRemaining} jam. Pertimbangkan untuk memberikan reminder kepada bidder yang tertarik.`);
        }
    }

    // 5. Bid activity
    if (!item.bids || item.bids.length === 0) {
        recommendations.push(`📊 <strong>Belum Ada Bid:</strong> Item belum mendapat penawaran. Coba turunkan harga awal atau tambahkan deskripsi yang lebih menarik.`);
    } else {
        recommendations.push(`✓ <strong>Ada Aktivitas Bid:</strong> Total ${item.bids.length} penawaran masuk. Item ini diminati pembeli.`);
    }

    // 6. Placement suggestion
    if (item.sellerRating >= 4.7) {
        recommendations.push(`⭐ <strong>Top Placement:</strong> Dengan rating sempurna, item ini bisa ditempatkan di home page atau featured auction section untuk maksimum exposure.`);
    }

    return recommendations;
}

function applyRecommendation() {
    if (!adminState.currentRecommendationItem) return;

    const item = adminState.currentRecommendationItem;
    
    // Tandai item sebagai "recommended" - pindahkan ke top
    item.isRecommended = true;
    item.recommendedDate = new Date();
    item.recommendedPriority = 1;

    // Move item ke awal array (top)
    const itemIndex = adminState.items.findIndex(i => i.id === item.id);
    if (itemIndex > -1) {
        const [movedItem] = adminState.items.splice(itemIndex, 1);
        adminState.items.unshift(movedItem);
    }

    // Save to localStorage
    localStorage.setItem('auctionItems', JSON.stringify(adminState.items));

    // Update window.auctionItems jika available
    if (window.auctionItems && Array.isArray(window.auctionItems)) {
        const mainAppIndex = window.auctionItems.findIndex(i => i.id === item.id);
        if (mainAppIndex > -1) {
            const [movedMainItem] = window.auctionItems.splice(mainAppIndex, 1);
            movedMainItem.isRecommended = true;
            movedMainItem.recommendedDate = new Date();
            window.auctionItems.unshift(movedMainItem);
        }
    }

    showToast(`✅ "${item.name}" sekarang di top recommendation! 🌟`, 'success');
    closeRecommendationModal();
    renderItems();
}

// ============ STATISTICS ============
function loadStatistics() {
    const stats = calculateStatistics();

    document.getElementById('totalItems').textContent = stats.totalItems;
    document.getElementById('totalBids').textContent = stats.totalBids;
    document.getElementById('totalUsers').textContent = stats.totalUsers;
    document.getElementById('activeAuctions').textContent = stats.activeAuctions;
}

function calculateStatistics() {
    const totalItems = adminState.items.length;
    const totalBids = adminState.items.reduce((sum, item) => {
        return sum + (item.bids ? item.bids.length : 0);
    }, 0);
    const totalUsers = adminState.users.length;
    const activeAuctions = adminState.items.filter(i => i.status === 'active').length;

    return {
        totalItems,
        totalBids,
        totalUsers,
        activeAuctions
    };
}

// ============ USERS MANAGEMENT ============
function loadUsersData() {
    // Simulating API call
    const storedUsers = localStorage.getItem('registeredUsers');
    
    if (storedUsers) {
        try {
            adminState.users = JSON.parse(storedUsers);
        } catch (e) {
            adminState.users = [];
        }
    }

    renderUsers();
}

function renderUsers() {
    const usersList = document.getElementById('usersList');

    if (adminState.users.length === 0) {
        usersList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">👤</div>
                <h3>Belum Ada Users</h3>
                <p>Tidak ada user yang terdaftar di sistem.</p>
            </div>
        `;
        return;
    }

    usersList.innerHTML = adminState.users.map(user => createUserCard(user)).join('');
}

function createUserCard(user) {
    const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase();
    const joinDate = new Date(user.joinDate).toLocaleDateString('id-ID');

    return `
        <div class="user-card">
            <div class="user-info-details">
                <div class="user-avatar">${initials}</div>
                <div class="user-details">
                    <h3>${user.name}</h3>
                    <p>📧 ${user.email}</p>
                    <p>📞 ${user.phone || '-'}</p>
                    <p>📅 Bergabung: ${joinDate}</p>
                </div>
            </div>
        </div>
    `;
}

// ============ TOAST NOTIFICATIONS ============
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    
    toast.textContent = message;
    toast.className = `toast active ${type}`;

    setTimeout(() => {
        toast.classList.remove('active');
    }, 3000);
}

// ============ LOGOUT FUNCTIONALITY ============
function logoutAdmin() {
    if (confirm('Anda yakin ingin keluar dari panel admin?')) {
        localStorage.removeItem('isAdminLoggedIn');
        localStorage.removeItem('adminName');
        
        showToast('✅ Anda telah logout dari admin panel', 'success');
        
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    }
}

// ============ UTILITY FUNCTIONS ============
function getItemById(id) {
    return adminState.items.find(item => item.id === id);
}
