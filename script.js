// Data structure to store application data
let appData = {
    currentUser: null,
    items: [],
    bids: [],
    wishlist: []
};

// DOM Elements
const navbar = document.getElementById('navbar');
const sections = document.querySelectorAll('.section');
const navLinks = document.querySelectorAll('.nav-link');
const loginModal = document.getElementById('login-modal');
const loginBtn = document.getElementById('login-btn');
const loginForm = document.getElementById('login-form');
const usernameDisplay = document.getElementById('username-display');
const addItemModal = document.getElementById('add-item-modal');
const addItemBtn = document.getElementById('add-item-btn');
const addItemForm = document.getElementById('add-item-form');
const itemDetailModal = document.getElementById('item-detail-modal');
const bidModal = document.getElementById('bid-modal');
const bidForm = document.getElementById('bid-form');
const closeButtons = document.querySelectorAll('.close');

// Initialize the application
function initApp() {
    // Check if there's saved data in localStorage
    const savedData = localStorage.getItem('luxBidData');
    if (savedData) {
        appData = JSON.parse(savedData);
        
        // If a user was logged in, show their username
        if (appData.currentUser) {
            usernameDisplay.textContent = appData.currentUser;
        }
    } else {
        // Load sample data if no saved data exists
        loadSampleData();
    }
    
    // Render items on the homepage
    renderHomepageItems();
    
    // Set up event listeners
    setupEventListeners();
}

// Load sample data for demonstration
function loadSampleData() {
    appData.items = [
        {
            id: 1,
            name: "Lukisan Masterpiece Abad ke-17",
            price: 125000000,
            description: "Lukisan langka dari pelukis maestro Eropa abad ke-17 dengan bingkai emas asli. Kondisi sangat terawat dan memiliki sertifikat keaslian.",
            image: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
            owner: "art_collector"
        },
        {
            id: 2,
            name: "Jam Tangan Rolex Vintage 1965",
            price: 85000000,
            description: "Rolex Submariner vintage tahun 1965, masih berfungsi sempurna. Dilengkapi dengan box dan sertifikat asli.",
            image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
            owner: "watch_enthusiast"
        },
        {
            id: 3,
            name: "Vas Cina Dinasti Ming",
            price: 210000000,
            description: "Vas keramik langka dari Dinasti Ming, dihiasi dengan motif naga dan phoenix. Tinggi 45 cm, kondisi sempurna tanpa retak.",
            image: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
            owner: "antique_lover"
        },
        {
            id: 4,
            name: "Koleksi Anggur Chateau Lafite 1982",
            price: 35000000,
            description: "Setengah lusin botol anggur Chateau Lafite Rothschild vintage tahun 1982, disimpan dalam kondisi optimal di wine cellar bersuhu terkontrol.",
            image: "https://www.google.com/url?sa=i&url=https%3A%2F%2Fwww.decanter.com%2Flearn%2Fwine-legend-chateau-lafite-rothschild-1982-374498%2F&psig=AOvVaw0LZpohAGXYGQr6V6C93SI7&ust=1756909960931000&source=images&cd=vfe&opi=89978449&ved=0CBUQjRxqFwoTCODL7Lyluo8DFQAAAAAdAAAAABAE",
            owner: "wine_collector"
        },
        {
            id: 5,
            name: "Black Diamond Engagement Ring",
            price: 185000000,
            description: "Permata Berlian hitam alami dengan berat 5 karat, dipotong dengan presisi oleh ahli permata terkenal. Disertai sertifikat GIA.",
            image: "https://www.google.com/url?sa=i&url=https%3A%2F%2Fpointnopointstudio.com%2Fproducts%2F1-72-carat-salt-and-pepper-oval-diamond-engagement-ring-ombre-jules-setting-platinum%3Fsrsltid%3DAfmBOoriZJWAnMKSisJg6K4jscU85Ucqon4cb6H-BDt0YZ9Rv2ZWtNm0&psig=AOvVaw1BCe4goqGWY90b7Hmy69t6&ust=1756909831245000&source=images&cd=vfe&opi=89978449&ved=0CBUQjRxqFwoTCOjauvykuo8DFQAAAAAdAAAAABAL",
            owner: "gem_enthusiast"
        },
        {
            id: 6,
            name: "Patung Perunggu Art Deco",
            price: 75000000,
            description: "Patung perunggu era Art Deco tahun 1920-an, tingginya 60 cm. Menggambarkan penari dengan detail yang sangat indah.",
            image: "https://images.unsplash.com/photo-1560493676-2ce13668e0e7?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
            owner: "art_deco_lover"
        }
    ];
    
    appData.bids = [
        {
            id: 1,
            itemId: 1,
            userId: "current_user",
            amount: 130000000,
            timestamp: new Date(2023, 5, 15).getTime(),
            status: "ongoing"
        },
        {
            id: 2,
            itemId: 3,
            userId: "current_user",
            amount: 215000000,
            timestamp: new Date(2023, 5, 10).getTime(),
            status: "won"
        }
    ];
    
    appData.wishlist = [1, 3, 5];
}

// Set up all event listeners
function setupEventListeners() {
    // Navbar scroll effect
    window.addEventListener('scroll', handleNavbarScroll);
    
    // Navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetSection = e.target.getAttribute('href').substring(1);
            switchSection(targetSection);
            
            // Update active nav link
            navLinks.forEach(navLink => navLink.classList.remove('active'));
            e.target.classList.add('active');
        });
    });
    
    // Login button
    loginBtn.addEventListener('click', () => {
        loginModal.style.display = 'block';
    });
    
    // Login form submission
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value.trim();
        if (username) {
            loginUser(username);
            loginModal.style.display = 'none';
            loginForm.reset();
        }
    });
    
    // Add item button
    if (addItemBtn) {
        addItemBtn.addEventListener('click', () => {
            if (appData.currentUser) {
                addItemModal.style.display = 'block';
            } else {
                loginModal.style.display = 'block';
            }
        });
    }
    
    // Add item form submission
    if (addItemForm) {
        addItemForm.addEventListener('submit', (e) => {
            e.preventDefault();
            addNewItem();
        });
    }
    
    // Bid form submission
    if (bidForm) {
        bidForm.addEventListener('submit', (e) => {
            e.preventDefault();
            placeBid();
        });
    }
    
    // Close modals
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            const modal = button.closest('.modal');
            modal.style.display = 'none';
        });
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
    
    // Keyboard glamour effect
    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            e.target.classList.add('glow-effect');
            setTimeout(() => {
                e.target.classList.remove('glow-effect');
            }, 2000);
        }
    });
    
    document.addEventListener('click', function(e) {
        const wishlistBtn = e.target.closest('.item-wishlist');
        if (wishlistBtn) {
            e.preventDefault();
            e.stopPropagation();
            const itemId = parseInt(wishlistBtn.closest('.item-card').dataset.id);
            toggleWishlist(itemId);
        }
    });
}

// Handle navbar scroll effect
function handleNavbarScroll() {
    if (window.scrollY > 50) {
        navbar.style.background = 'rgba(255, 255, 255, 0.98)';
        navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
        navbar.style.padding = '0.5rem 0';
    } else {
        navbar.style.background = 'rgba(255, 255, 255, 0.95)';
        navbar.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
        navbar.style.padding = '0.8rem 0';
    }
}

// Switch between sections
function switchSection(sectionId) {
    sections.forEach(section => {
        section.classList.remove('active');
    });
    
    document.getElementById(sectionId).classList.add('active');
    
    // Load appropriate content based on section
    if (sectionId === 'beranda') {
        renderHomepageItems();
    } else if (sectionId === 'myitems') {
        renderMyItems();
        // Render beranda juga untuk memperbarui tampilan
        renderHomepageItems();
    } else if (sectionId === 'mybid') {
        renderMyBids();
    } else if (sectionId === 'wishlist') {
        renderWishlist();
    }
}

// Login user
function loginUser(username) {
    appData.currentUser = username;
    usernameDisplay.textContent = username;
    saveData();
    
    // Show user-specific sections if needed
    if (window.location.hash === '#myitems' || window.location.hash === '#mybid' || window.location.hash === '#wishlist') {
        switchSection(window.location.hash.substring(1));
    }
}

// Add new item to auction
function addNewItem() {
    const name = document.getElementById('item-name').value;
    const price = parseInt(document.getElementById('item-price').value);
    const description = document.getElementById('item-description').value;
    const imageInput = document.getElementById('item-image');
    
    // For demo purposes, we'll use a placeholder image if none is provided
    let imageUrl = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80';
    
    if (imageInput.files && imageInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            // Convert image to base64 string
            imageUrl = e.target.result;
            
            // Create and save the new item
            const newItem = {
                id: Date.now(),
                name,
                price,
                description,
                image: imageUrl,
                owner: appData.currentUser
            };
            
            appData.items.push(newItem);
            saveData();
            
            // Update the UI
            renderMyItems();
            renderHomepageItems();
            
            // Close the modal and reset the form
            addItemModal.style.display = 'none';
            addItemForm.reset();
            
            // Show success message
            alert('Barang berhasil ditambahkan!');
        };
        reader.readAsDataURL(imageInput.files[0]);
        return; // Exit early as we'll handle everything in the onload callback
    }
    
    // This block only runs if no file was selected (using default image)
    const newItem = {
        id: Date.now(), // Simple unique ID
        name,
        price,
        description,
        image: imageUrl,
        owner: appData.currentUser
    };
    
    appData.items.push(newItem);
    saveData();
    
    // Update the UI
    renderMyItems();
    renderHomepageItems();
    
    // Close the modal and reset the form
    addItemModal.style.display = 'none';
    addItemForm.reset();
    
    // Show success message
    alert('Barang berhasil ditambahkan!');
}

// Place a bid on an item
function placeBid() {
    const itemId = parseInt(document.getElementById('bid-item-id').value);
    const amount = parseInt(document.getElementById('bid-amount').value);
    
    const item = appData.items.find(item => item.id === itemId);
    if (!item) return;
    
    // Check if bid is higher than current price
    if (amount <= item.price) {
        alert('Tawaran harus lebih tinggi dari harga saat ini!');
        return;
    }
    
    // Create new bid
    const newBid = {
        id: Date.now(),
        itemId,
        userId: appData.currentUser,
        amount,
        timestamp: Date.now(),
        status: 'ongoing'
    };
    
    // Update item price
    item.price = amount;
    
    // Add to bids array
    appData.bids.push(newBid);
    saveData();
    
    // Close modal and reset form
    bidModal.style.display = 'none';
    bidForm.reset();
    
    // Show success message
    alert('Tawaran berhasil diajukan!');
}

// Toggle item in wishlist
function toggleWishlist(itemId) {
    if (!appData.currentUser) {
        alert('Silakan login terlebih dahulu untuk menambahkan ke wishlist');
        return;
    }
    
    const item = appData.items.find(item => item.id === itemId);
    if (!item) return;

    const index = appData.wishlist.indexOf(itemId);
    if (index === -1) {
        // Add to wishlist
        appData.wishlist.push(itemId);
        // Update heart icon
        const wishlistButtons = document.querySelectorAll(`.item-wishlist[data-id="${itemId}"]`);
        wishlistButtons.forEach(button => button.classList.add('active'));
        // Show success message
        alert(`"${item.name}" berhasil ditambahkan ke wishlist!`);
    } else {
        // Remove from wishlist
        appData.wishlist.splice(index, 1);
        // Update heart icon
        const wishlistButtons = document.querySelectorAll(`.item-wishlist[data-id="${itemId}"]`);
        wishlistButtons.forEach(button => button.classList.remove('active'));
        // Show success message
        alert(`"${item.name}" berhasil dihapus dari wishlist!`);
    }
    
    saveData();
    
    // Update all relevant sections
    if (document.getElementById('wishlist').classList.contains('active')) {
        renderWishlist();
    }
    renderHomepageItems(); // Update beranda to reflect wishlist changes
}

// Render items on homepage
function renderHomepageItems() {
    const container = document.getElementById('beranda-items');
    if (!container) return;
    
    // Tampilkan semua items
    const itemsToShow = appData.items;
    
    container.innerHTML = itemsToShow.map(item => `
        <div class="item-card" data-id="${item.id}">
            <img src="${item.image}" alt="${item.name}" class="item-image">
            <div class="item-wishlist ${appData.wishlist.includes(item.id) ? 'active' : ''}" 
                 data-id="${item.id}">
                <i class="fas fa-heart"></i>
                <span class="wishlist-tooltip">${appData.wishlist.includes(item.id) ? 'Hapus dari Wishlist' : 'Tambah ke Wishlist'}</span>
            </div>
            <div class="item-info">
                <h3 class="item-name">${item.name}</h3>
                <p class="item-price">Rp ${formatPrice(item.price)}</p>
                <p class="item-description">${item.description}</p>
                <div class="item-actions">
                    <button class="btn-bid" onclick="openBidModal(${item.id})">Bid</button>
                    <button class="btn-detail" onclick="showItemDetail(${item.id})">Detail</button>
                </div>
            </div>
        </div>
    `).join('');
}

// Render user's items
function renderMyItems() {
    if (!appData.currentUser) {
        // Show login prompt if not logged in
        document.getElementById('my-items-container').innerHTML = `
            <div class="login-prompt">
                <p>Silakan login untuk melihat barang Anda</p>
                <button class="btn-primary" onclick="loginModal.style.display='block'">Login</button>
            </div>
        `;
        return;
    }
    
    const container = document.getElementById('my-items-container');
    if (!container) return;
    
    const myItems = appData.items.filter(item => item.owner === appData.currentUser);
    
    if (myItems.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>Anda belum menambahkan barang apa pun</p>
                <button class="btn-primary" onclick="addItemModal.style.display='block'">Tambah Barang</button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = myItems.map(item => `
        <div class="item-card" data-id="${item.id}">
            <img src="${item.image}" alt="${item.name}" class="item-image">
            <div class="item-info">
                <h3 class="item-name">${item.name}</h3>
                <p class="item-price">Rp ${formatPrice(item.price)}</p>
                <p class="item-description">${item.description}</p>
                <div class="item-actions">
                    <button class="btn-delete" onclick="deleteItem(${item.id})">Hapus</button>
                </div>
            </div>
        </div>
    `).join('');
}

// Render user's bids
function renderMyBids() {
    if (!appData.currentUser) {
        // Show login prompt if not logged in
        document.getElementById('bid-history-container').innerHTML = `
            <div class="login-prompt">
                <p>Silakan login untuk melihat riwayat bid Anda</p>
                <button class="btn-primary" onclick="loginModal.style.display='block'">Login</button>
            </div>
        `;
        return;
    }
    
    const container = document.getElementById('bid-history-container');
    if (!container) return;
    
    const myBids = appData.bids.filter(bid => bid.userId === appData.currentUser);
    
    if (myBids.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>Anda belum melakukan bid pada barang apa pun</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = myBids.map(bid => {
        const item = appData.items.find(i => i.id === bid.itemId);
        if (!item) return '';
        
        return `
            <div class="bid-item">
                <img src="${item.image}" alt="${item.name}" class="bid-item-image">
                <div class="bid-item-info">
                    <h3 class="bid-item-name">${item.name}</h3>
                    <p class="bid-item-price">Tawaran Anda: Rp ${formatPrice(bid.amount)}</p>
                </div>
                <span class="bid-status status-${bid.status}">
                    ${bid.status === 'won' ? 'Menang' : bid.status === 'lost' ? 'Kalah' : 'Berlangsung'}
                </span>
            </div>
        `;
    }).join('');
}

// Render user's wishlist
function renderWishlist() {
    if (!appData.currentUser) {
        // Show login prompt if not logged in
        document.getElementById('wishlist-container').innerHTML = `
            <div class="login-prompt">
                <p>Silakan login untuk melihat wishlist Anda</p>
                <button class="btn-primary" onclick="loginModal.style.display='block'">Login</button>
            </div>
        `;
        return;
    }
    
    const container = document.getElementById('wishlist-container');
    if (!container) return;
    
    const wishlistItems = appData.items.filter(item => appData.wishlist.includes(item.id));
    
    if (wishlistItems.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>Wishlist Anda kosong</p>
                <p>Klik ikon hati pada barang untuk menambahkannya ke wishlist</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = wishlistItems.map(item => `
        <div class="item-card" data-id="${item.id}">
            <img src="${item.image}" alt="${item.name}" class="item-image">
            <div class="item-wishlist active" onclick="toggleWishlist(${item.id})">
                <i class="fas fa-heart"></i>
            </div>
            <div class="item-info">
                <h3 class="item-name">${item.name}</h3>
                <p class="item-price">Rp ${formatPrice(item.price)}</p>
                <p class="item-description">${item.description}</p>
                <div class="item-actions">
                    <button class="btn-bid" onclick="openBidModal(${item.id})">Bid</button>
                    <button class="btn-detail" onclick="showItemDetail(${item.id})">Detail</button>
                </div>
            </div>
        </div>
    `).join('');
}


function openBidModal(itemId) {
    if (!appData.currentUser) {
        loginModal.style.display = 'block';
        return;
    }
    
    const item = appData.items.find(i => i.id === itemId);
    if (!item) return;
    
    document.getElementById('bid-item-id').value = item.id;
    document.getElementById('bid-item-name').textContent = `Tawar "${item.name}"`;
    document.getElementById('current-bid-value').textContent = `Rp ${formatPrice(item.price)}`;
    
 
    const bidsForItem = appData.bids.filter(bid => bid.itemId === itemId);
    if (bidsForItem.length > 0) {
        const highestBid = bidsForItem.reduce((max, bid) => bid.amount > max.amount ? bid : max, bidsForItem[0]);
        document.getElementById('current-bidder').textContent = highestBid.userId;
    } else {
        document.getElementById('current-bidder').textContent = 'Belum ada penawar';
    }
    
    bidModal.style.display = 'block';
}


function showItemDetail(itemId) {
    const item = appData.items.find(i => i.id === itemId);
    if (!item) return;
    
    const modalContent = document.querySelector('.item-detail');
    modalContent.innerHTML = `
        <span class="close">&times;</span>
        <img src="${item.image}" alt="${item.name}" class="item-detail-image">
        <div class="item-detail-info">
            <h2>${item.name}</h2>
            <p class="item-detail-price">Rp ${formatPrice(item.price)}</p>
            <p class="item-detail-description">${item.description}</p>
            <p><strong>Pemilik:</strong> ${item.owner}</p>
        </div>
    `;

    modalContent.querySelector('.close').addEventListener('click', () => {
        itemDetailModal.style.display = 'none';
    });
    
    itemDetailModal.style.display = 'block';
}

function formatPrice(price) {
    return new Intl.NumberFormat('id-ID').format(price);
}

function deleteItem(itemId) {
    if (!confirm('Apakah Anda yakin ingin menghapus barang ini?')) {
        return;
    }
    
    const itemIndex = appData.items.findIndex(item => item.id === itemId);
    if (itemIndex > -1) {
        appData.items.splice(itemIndex, 1);
    }
    
    appData.bids = appData.bids.filter(bid => bid.itemId !== itemId);
    
    const wishlistIndex = appData.wishlist.indexOf(itemId);
    if (wishlistIndex > -1) {
        appData.wishlist.splice(wishlistIndex, 1);
    }
    
    saveData();
    renderMyItems();
    renderHomepageItems();
    
    alert('Barang berhasil dihapus');
}

function saveData() {
    localStorage.setItem('luxBidData', JSON.stringify(appData));
}

document.addEventListener('DOMContentLoaded', initApp);

document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('theme-toggle');
    
    
    const savedTheme = localStorage.getItem('theme') || 'light';
    
    
    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeToggle.checked = true;
    }
    
    
    themeToggle.addEventListener('change', () => {
        if (themeToggle.checked) {
           
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
        } else {
           
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('theme', 'light');
        }
    });
});