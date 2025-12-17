const adminState = {
    items: [],
    users: [],
    bids: [],
    currentDeleteItemId: null,
    currentRecommendationItem: null,
    searchQuery: '',
    statusFilter: ''
};

const ADMIN_ID = 'ADMIN-12345';

// INITIALIZATION
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

// EVENT LISTENERS
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
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            adminState.searchQuery = e.target.value.toLowerCase();
            renderItems();
        });
    }

    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', (e) => {
            adminState.statusFilter = e.target.value;
            renderItems();
        });
    }
}

// SECTION NAVIGATION
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
    const navItem = document.querySelector(`[data-section="${sectionName}"]`);
    if (navItem) {
        navItem.classList.add('active');
    }

    // Load data if needed
    if (sectionName === 'stats') {
        loadStatistics();
    } else if (sectionName === 'users') {
        loadUsersData();
    } else if (sectionName === 'items') {
        loadItemsData();
        renderItems();
    }
}

// ITEMS MANAGEMENT
async function loadItemsData() {
    try {
        const res = await fetch('/api/items', {
            headers: { 'x-admin-id': ADMIN_ID }
        });
        
        if (!res.ok) {
            console.warn('Fetch items from API failed, using localStorage');
            loadItemsFromStorage();
            return;
        }

        const data = await res.json();
        // Accept both formats: array or { items: [...] }
        if (Array.isArray(data)) {
            adminState.items = data;
        } else {
            adminState.items = data.items || [];
        }

        // normalize minimal fields if server uses different names
        adminState.items = adminState.items.map(it => ({
            id: it.id,
            name: it.name || it.title || 'Unnamed',
            image: it.image || it.img || it.photo || '',
            description: it.description || it.desc || '',
            price: Number(it.price || it.currentBid || it.initialPrice || 0),
            currentBid: Number(it.currentBid || it.price || 0),
            endTime: it.endTime || it.endsAt || new Date(Date.now() + 24*60*60*1000).toISOString(),
            seller: it.sellerName || it.seller || 'Penjual',
            sellerId: it.sellerId || it.seller_id || it.sellerId,
            sellerRating: it.sellerRating || 0,
            categories: Array.isArray(it.categories) ? it.categories : (it.categories ? JSON.parse(it.categories || '[]') : []),
            status: it.status || 'active',
            isRecommended: !!it.isRecommended
        }));

        renderItems();
    } catch (err) {
        console.error('Load items error:', err);
        loadItemsFromStorage();
    }
}

function loadItemsFromStorage() {
    if (window.auctionItems && Array.isArray(window.auctionItems)) {
        adminState.items = JSON.parse(JSON.stringify(window.auctionItems));
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

function renderItems() {
    const itemsList = document.getElementById('itemsList');
    
    if (!itemsList) return;

    // Filter items
    let filteredItems = adminState.items.filter(item => {
        const matchesSearch = (item.name && item.name.toLowerCase().includes(adminState.searchQuery)) ||
                             (item.seller && item.seller.toLowerCase().includes(adminState.searchQuery));
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
                    <p class="item-seller">📍 ${item.seller || 'Unknown'}</p>
                    <p class="item-time">⏱️ ${timeRemaining}</p>
                </div>
                <div>
                    <p class="item-price">Rp ${formatCurrency(item.price)}</p>
                    <span class="item-status ${item.status}">${item.status === 'active' ? '🟢 Aktif' : '⏹️ Berakhir'}</span>
                </div>
            </div>
            
            <div class="item-actions">
                <button class="btn btn-primary" onclick="openRecommendationModal(${item.id})">
                    💡 Rekomendasi
                </button>
                <button class="btn btn-danger" onclick="openDeleteModal(${item.id}, '${item.name.replace(/'/g, "\\'")}')">
                    🗑️ Hapus
                </button>
            </div>
        </div>
    `;
}

function formatCurrency(value) {
    return new Intl.NumberFormat('id-ID').format(value || 0);
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
    if (!modal) return;

    const deleteItemName = document.getElementById('deleteItemName');
    if (deleteItemName) {
        deleteItemName.textContent = `"${itemName}"`;
    }
    
    modal.classList.add('active');
}

function closeDeleteModal() {
    const modal = document.getElementById('deleteModal');
    if (!modal) return;

    modal.classList.remove('active');
    adminState.currentDeleteItemId = null;
}

async function confirmDelete() {
    const itemId = adminState.currentDeleteItemId;
    
    if (!itemId) return;

    try {
        const res = await fetch(`/api/admin/items/${itemId}`, {
            method: 'DELETE',
            headers: { 'x-admin-id': ADMIN_ID }
        });
        const data = await res.json();

        if (!res.ok) {
            showToast(`❌ ${data.error || 'Gagal menghapus'}`, 'error');
            return;
        }

        // Remove dari state
        const itemIndex = adminState.items.findIndex(i => i.id === itemId);
        if (itemIndex > -1) {
            const deletedItem = adminState.items.splice(itemIndex, 1)[0];
            showToast(`✅ Item "${deletedItem.name}" berhasil dihapus`, 'success');
        }

        renderItems();
        closeDeleteModal();
    } catch (err) {
        console.error('Delete error:', err);
        showToast(`❌ Gagal menghapus item: ${err.message}`, 'error');
    }
}

// RECOMMENDATION FUNCTIONALITY
function openRecommendationModal(itemId) {
    const item = adminState.items.find(i => i.id === itemId);
    
    if (!item) return;

    adminState.currentRecommendationItem = item;

    // Generate recommendations
    const recommendations = generateRecommendations(item);

    // Update modal content
    const itemSummary = document.getElementById('itemSummary');
    if (itemSummary) {
        itemSummary.innerHTML = `
            <h4>${item.name}</h4>
            <p><strong>Harga Saat Ini:</strong> Rp ${formatCurrency(item.price)}</p>
            <p><strong>Penjual:</strong> ${item.seller || 'Unknown'}</p>
            <p><strong>Status:</strong> ${item.status === 'active' ? 'Aktif' : 'Berakhir'}</p>
        `;
    }

    const recommendationText = document.getElementById('recommendationText');
    if (recommendationText) {
        recommendationText.innerHTML = recommendations.map(rec => `<li>${rec}</li>`).join('');
    }

    const modal = document.getElementById('recommendationModal');
    if (modal) {
        modal.classList.add('active');
    }
}

function closeRecommendationModal() {
    const modal = document.getElementById('recommendationModal');
    if (modal) {
        modal.classList.remove('active');
    }
    adminState.currentRecommendationItem = null;
}

function generateRecommendations(item) {
    const recommendations = [];

    if (item.categories && item.categories.length > 0) {
        recommendations.push(`✓ <strong>Tingkatkan Visibilitas:</strong> Item "${item.name}" termasuk kategori ${item.categories.join(', ')}. Pertimbangkan untuk menampilkannya di bagian atas kategori tersebut.`);
    }

    if (item.price > 50000000) {
        recommendations.push(`✓ <strong>Premium Item:</strong> Dengan harga Rp ${formatCurrency(item.price)}, item ini cocok untuk premium showcase.`);
    }


    if (item.status === 'ended') {
        recommendations.push(`⚠️ <strong>Item Berakhir:</strong> Pertimbangkan untuk mengarsipkan atau relisting item ini.`);
    } else {
        const endDate = new Date(item.endTime);
        const now = new Date();
        const hoursRemaining = Math.floor((endDate - now) / (1000 * 60 * 60));
        
        if (hoursRemaining < 12 && hoursRemaining > 0) {
            recommendations.push(`⏰ <strong>Waktu Habis Segera:</strong> Lelang berakhir dalam ${hoursRemaining} jam.`);
        }
    }

    return recommendations;
}

async function applyRecommendation() {
    if (!adminState.currentRecommendationItem) return;

    const item = adminState.currentRecommendationItem;

    try {
        const res = await fetch(`/api/admin/items/${item.id}/recommend`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-admin-id': ADMIN_ID
            },
            body: JSON.stringify({ priority: 1 })
        });
        const data = await res.json();

        if (!res.ok) {
            showToast(`❌ ${data.error || 'Gagal menerapkan rekomendasi'}`, 'error');
            return;
        }

        // Update local state
        item.isRecommended = true;
        item.recommendedDate = new Date();
        item.recommendedPriority = 1;

        showToast(`✅ "${item.name}" ditambahkan ke rekomendasi 🌟`, 'success');
        closeRecommendationModal();
        renderItems();
    } catch (err) {
        console.error('Recommend error:', err);
        showToast(`❌ Gagal menerapkan rekomendasi: ${err.message}`, 'error');
    }
}

// STATISTICS
async function loadStatistics() {
    try {
        const res = await fetch('/api/admin/stats', {
            headers: { 'x-admin-id': ADMIN_ID }
        });
        const data = await res.json();

        if (!res.ok) {
            console.warn('Fetch stats failed:', data.error);
            showToast(`❌ ${data.error}`, 'error');
            return;
        }

        const stats = data.stats;
        const totalItems = document.getElementById('totalItems');
        const totalBids = document.getElementById('totalBids');
        const totalUsers = document.getElementById('totalUsers');
        const activeAuctions = document.getElementById('activeAuctions');

        if (totalItems) totalItems.textContent = stats.items.total;
        if (totalBids) totalBids.textContent = stats.bids.total;
        if (totalUsers) totalUsers.textContent = stats.users.total;
        if (activeAuctions) activeAuctions.textContent = stats.items.active;
    } catch (err) {
        console.error('Load stats error:', err);
        showToast(`❌ Gagal memuat statistik: ${err.message}`, 'error');
    }
}

// USERS MANAGEMENT
async function loadUsersData() {
    try {
        const res = await fetch('/api/admin/users', {
            headers: { 'x-admin-id': ADMIN_ID }
        });
        const data = await res.json();

        if (!res.ok) {
            console.warn('Fetch users failed:', data.error);
            loadUsersFromStorage();
            return;
        }

        adminState.users = data.users || [];
        renderUsers();
    } catch (err) {
        console.error('Load users error:', err);
        loadUsersFromStorage();
    }
}

function loadUsersFromStorage() {
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

    if (!usersList) return;

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
    const initials = (user.name || 'U').split(' ').map(n => n[0]).join('').toUpperCase();
    const joinDate = user.createdAt ? new Date(user.createdAt).toLocaleDateString('id-ID') : 'N/A';

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
                <button class="btn btn-danger" style="align-self: flex-start; margin-left: auto;" onclick="deleteUser(${user.id}, '${user.name.replace(/'/g, "\\'")}')">
                    🗑️ Hapus
                </button>
            </div>
        </div>
    `;
}

async function deleteUser(userId, userName) {
    if (!confirm(`Hapus user "${userName}" dan semua data terkaitnya?`)) return;

    try {
        const res = await fetch(`/api/admin/users/${userId}`, {
            method: 'DELETE',
            headers: { 'x-admin-id': ADMIN_ID }
        });
        const data = await res.json();

        if (!res.ok) {
            showToast(`❌ ${data.error}`, 'error');
            return;
        }

        adminState.users = adminState.users.filter(u => u.id !== userId);
        showToast(`✅ User "${userName}" berhasil dihapus`, 'success');
        renderUsers();
    } catch (err) {
        console.error('Delete user error:', err);
        showToast(`❌ Gagal menghapus user: ${err.message}`, 'error');
    }
}

// TOAST NOTIFICATIONS
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    
    if (!toast) {
        // Create toast if doesn't exist
        const newToast = document.createElement('div');
        newToast.id = 'toast';
        newToast.className = `toast active ${type}`;
        newToast.textContent = message;
        document.body.appendChild(newToast);
        
        setTimeout(() => {
            newToast.classList.remove('active');
        }, 3000);
        return;
    }

    toast.textContent = message;
    toast.className = `toast active ${type}`;

    setTimeout(() => {
        toast.classList.remove('active');
    }, 3000);
}

// LOGOUT FUNCTIONALITY
function logoutAdmin() {
    if (confirm('Anda yakin ingin keluar dari panel admin?')) {
        localStorage.removeItem('isAdminLoggedIn');
        localStorage.removeItem('adminName');
        // Also clear the user session so index.html shows the login page
        localStorage.removeItem('user');
        localStorage.removeItem('isLoggedIn');

        showToast('✅ Anda telah logout dari admin panel', 'success');
        
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 800);
    }
}

// UTILITY FUNCTIONS
function getItemById(id) {
    return adminState.items.find(item => item.id === id);
}