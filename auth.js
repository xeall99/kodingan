document.addEventListener('DOMContentLoaded', () => {
  
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const isAdminLoggedIn = localStorage.getItem('isAdminLoggedIn');
    
    if (isLoggedIn) {
        const userEmail = localStorage.getItem('userEmail');
        setCurrentUser(userEmail); // Restore user on page load
        showMainContent();
    } else if (isAdminLoggedIn) {
        setAdminUser(); // Restore admin on page load
        // Don't show main content, wait for next action
    }

    // USER LOGIN
    document.getElementById('loginForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        if (email && password) {
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('userEmail', email);
            localStorage.removeItem('isAdminLoggedIn'); // Clear admin status
            setCurrentUser(email); // Set current user in script.js
            showMainContent();
        }
    });
    
    // ADMIN LOGIN
    document.getElementById('adminLoginForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const adminId = document.getElementById('adminIdInput').value;
        const ADMIN_ID = 'ADMIN2024'; // Match dengan script.js
        
        if (!adminId) {
            alert('Silakan masukkan Admin ID');
            return;
        }
        
        if (adminId === ADMIN_ID) {
            localStorage.setItem('isAdminLoggedIn', 'true');
            localStorage.removeItem('isLoggedIn'); // Clear user login
            localStorage.removeItem('userEmail');
            setAdminUser();
            showMainContent();
            showNotification('✓ Selamat datang Admin!');
        } else {
            alert('Admin ID salah!');
            document.getElementById('adminIdInput').value = '';
        }
    });

    document.getElementById('registerForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('registerName').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        
        showLoginPage();
    });

    
    document.getElementById('showRegister').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('loginPage').style.display = 'none';
        document.getElementById('registerPage').style.display = 'flex';
    });

    document.getElementById('showLogin').addEventListener('click', (e) => {
        e.preventDefault();
        showLoginPage();
    });

    
    document.querySelectorAll('.toggle-password').forEach(icon => {
        icon.addEventListener('click', (e) => {
            const input = e.target.previousElementSibling;
            input.type = input.type === 'password' ? 'text' : 'password';
            e.target.classList.toggle('fa-eye');
            e.target.classList.toggle('fa-eye-slash');
        });
    });
});

function showMainContent() {
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('registerPage').style.display = 'none';
    document.getElementById('mainContent').style.display = 'block';
    loadProfile(); // Load profile data when showing main content
}

function showLoginPage() {
    document.getElementById('loginPage').style.display = 'flex';
    document.getElementById('registerPage').style.display = 'none';
    document.getElementById('mainContent').style.display = 'none';
}

function logout() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('isAdminLoggedIn');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userProfile');
    currentUser = null; // Clear current user
    isAdmin = false; // Also clear admin status
    showLoginPage();
    // Reset forms
    document.getElementById('loginEmail').value = '';
    document.getElementById('loginPassword').value = '';
    document.getElementById('adminIdInput').value = '';
}

// Add profile management
document.getElementById('profileForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const profile = {
        name: document.getElementById('profileName').value,
        email: document.getElementById('profileEmail').value,
        phone: document.getElementById('profilePhone').value,
        address: document.getElementById('profileAddress').value,
        instagram: document.getElementById('profileInstagram').value,
        twitter: document.getElementById('profileTwitter').value
    };
    
    localStorage.setItem('userProfile', JSON.stringify(profile));
    showAlert('Profil berhasil diperbarui!', 'success');
});

// Profile photo handling
document.getElementById('profilePhoto').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('profilePhotoPreview').src = e.target.result;
            localStorage.setItem('userProfilePhoto', e.target.result);
        };
        reader.readAsDataURL(file);
    }
});

// Set admin user
function setAdminUser() {
    currentUser = 'ADMIN';
    isAdmin = true;
    localStorage.setItem('isAdminLoggedIn', 'true');
    localStorage.setItem('adminName', 'Admin');
    
    // Show main content untuk akses logo
    showMainContent();
}

// Load profile data
function loadProfile() {
    const profile = JSON.parse(localStorage.getItem('userProfile')) || {};
    const profilePhoto = localStorage.getItem('userProfilePhoto');
    
    if (profilePhoto) {
        document.getElementById('profilePhotoPreview').src = profilePhoto;
    }
    
    document.getElementById('profileName').value = profile.name || '';
    document.getElementById('profileEmail').value = localStorage.getItem('userEmail') || '';
    document.getElementById('profilePhone').value = profile.phone || '';
    document.getElementById('profileAddress').value = profile.address || '';
    document.getElementById('profileInstagram').value = profile.instagram || '';
    document.getElementById('profileTwitter').value = profile.twitter || '';
}

// Show alert function
function showAlert(message, type = 'info') {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    document.body.appendChild(alert);
    
    setTimeout(() => {
        alert.remove();
    }, 3000);
}
