// auth.js
document.addEventListener('DOMContentLoaded', () => {
    const showRegisterLink = document.getElementById('showRegister');
    const showLoginLink = document.getElementById('showLogin');
    const loginPage = document.getElementById('loginPage');
    const registerPage = document.getElementById('registerPage');

    if (showRegisterLink) {
        showRegisterLink.addEventListener('click', (e) => {
            e.preventDefault();
            loginPage.style.display = 'none';
            registerPage.style.display = 'flex';
        });
    }

    if (showLoginLink) {
        showLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            loginPage.style.display = 'none';
            registerPage.style.display = 'flex';
            registerPage.style.display = 'none';
            loginPage.style.display = 'flex';
        });
    }

    // Toggle password visibility for any field with adjacent .toggle-password
    document.querySelectorAll('.toggle-password').forEach(toggle => {
        toggle.addEventListener('click', (e) => {
            e.preventDefault();
            // find nearest input (within .password-input container if present)
            let input = null;
            const parent = toggle.closest('.password-input');
            if (parent) input = parent.querySelector('input[type="password"], input[type="text"]');
            if (!input) {
                // fallback: look for previous sibling input
                input = toggle.previousElementSibling && (toggle.previousElementSibling.tagName === 'INPUT') ? toggle.previousElementSibling : null;
            }
            if (!input) return;
            const isPwd = input.getAttribute('type') === 'password';
            input.setAttribute('type', isPwd ? 'text' : 'password');
            toggle.classList.toggle('fa-eye');
            toggle.classList.toggle('fa-eye-slash');
            toggle.setAttribute('aria-pressed', String(!isPwd));
        });
    });

          // <<< ADDED: muat profile & items segera saat sesi dipulihkan >>>
          if (typeof loadProfile === 'function') {
              try { loadProfile(); } catch (e) { console.error('loadProfile on restore failed', e); }
          }
          if (typeof loadItemsFromServer === 'function') {
              // trigger refresh; tidak di-await agar tidak blok UI
              loadItemsFromServer().catch(err => console.error('loadItemsFromServer on restore failed', err));
          }
        
      if (loginForm) {
          loginForm.addEventListener('submit', async (e) => {
              e.preventDefault();
              const email = document.getElementById('loginEmail').value;
              const password = document.getElementById('loginPassword').value;
              try {
                  const res = await fetch('/api/login', { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email, password })});
                  const body = await res.json();
                  if (!res.ok) return alert(body.error || 'Login gagal');
                  localStorage.setItem('user', JSON.stringify(body.user));
                  localStorage.setItem('isLoggedIn', 'true');
                  document.getElementById('loginPage').style.display = 'none';
                  document.getElementById('mainContent').style.display = 'block';
                  setCurrentUser(body.user);
                  // fetch and populate profile from backend
                  loadProfile();
                  await loadItemsFromServer();
              } catch (err) { console.error(err); alert('Gagal terhubung ke server'); }
          });
      }

      if (registerForm) {
          registerForm.addEventListener('submit', async (e) => {
              e.preventDefault();
              const name = document.getElementById('registerName').value;
              const email = document.getElementById('registerEmail').value;
              const password = document.getElementById('registerPassword').value;
              try {
                  const res = await fetch('/api/register', { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ name, email, password })});
                  const body = await res.json();
                  if (!res.ok) return alert(body.error || 'Register gagal');
                  // For mini-project UX: do not auto-login — send user to login page to authenticate
                  document.getElementById('registerPage').style.display = 'none';
                  document.getElementById('loginPage').style.display = 'flex';
                  // prefill and focus the email field to help the user login
                  const emailInput = document.getElementById('loginEmail'); if (emailInput) { emailInput.value = email; emailInput.focus(); }
                  // clear register form fields
                  document.getElementById('registerName').value = '';
                  document.getElementById('registerEmail').value = '';
                  document.getElementById('registerPassword').value = '';
                  showAlert('Registrasi berhasil. Silakan login.', 'success');
              } catch (err) { console.error(err); alert('Gagal terhubung ke server'); }
          });
      }

      if (adminLoginForm) {
          adminLoginForm.addEventListener('submit', (e) => {
              e.preventDefault();
              const val = document.getElementById('adminIdInput').value;
              const ADMIN_ID = 'ADMIN2024';
              if (val === ADMIN_ID) {
                  localStorage.setItem('isAdminLoggedIn','true');
                  localStorage.setItem('user', JSON.stringify({ id: 'ADMIN', name: 'Admin', email: 'admin@local' }));
                  document.getElementById('loginPage').style.display = 'none';
                  document.getElementById('mainContent').style.display = 'block';
                  setAdminUser();
              } else alert('Admin ID salah');
          });
      }

      // secret admin logo triggers modal (hidden/low-key on login page)
      const adminSecretLogo = document.getElementById('adminSecretLogo');
      const adminAccessLogo = document.getElementById('adminAccessLogo');

      function openAdminLoginModal() {
          const modal = document.getElementById('adminLoginModal');
          if (!modal) return;
          modal.classList.add('active');
          document.body.classList.add('modal-open');
          const input = document.getElementById('adminId');
          if (input) input.focus();
      }
      // expose globally for inline onclick usage
      window.openAdminLoginModal = openAdminLoginModal;

      function closeAdminLoginModal() {
          const modal = document.getElementById('adminLoginModal');
          if (!modal) return;
          modal.classList.remove('active');
          document.body.classList.remove('modal-open');
          const input = document.getElementById('adminId');
          if (input) input.value = '';
      }
      window.closeAdminLoginModal = closeAdminLoginModal;

      function verifyAdminId() {
          const val = document.getElementById('adminId') ? document.getElementById('adminId').value : '';
          const ADMIN_ID = 'ADMIN2024';
          if (val === ADMIN_ID) {
              localStorage.setItem('isAdminLoggedIn','true');
              localStorage.setItem('user', JSON.stringify({ id: 'ADMIN', name: 'Admin', email: 'admin@local' }));
              closeAdminLoginModal();
              // Redirect to admin panel
              setAdminUser();
          } else alert('Admin ID salah');
      }
      window.verifyAdminId = verifyAdminId;

      if (adminSecretLogo) adminSecretLogo.addEventListener('click', (e) => { e.preventDefault(); openAdminLoginModal(); });
      if (adminAccessLogo) adminAccessLogo.addEventListener('click', (e) => { e.preventDefault(); openAdminLoginModal(); });

      // Forgot / Reset password modal handlers
      const forgotPasswordLink = document.getElementById('forgotPasswordLink');
      function openForgotPasswordModal() {
          const m = document.getElementById('forgotPasswordModal'); if (!m) return; m.classList.add('active'); document.body.classList.add('modal-open');
          const emailInput = document.getElementById('forgotEmail'); if (emailInput) emailInput.focus();
      }
      function closeForgotPasswordModal() { const m = document.getElementById('forgotPasswordModal'); if (!m) return; m.classList.remove('active'); document.body.classList.remove('modal-open'); document.getElementById('forgotEmail').value=''; }
      window.openForgotPasswordModal = openForgotPasswordModal; window.closeForgotPasswordModal = closeForgotPasswordModal;

      async function submitForgotPassword() {
          const email = (document.getElementById('forgotEmail')||{}).value;
          if (!email) { alert('Masukkan email'); return; }
          try {
              const res = await fetch('/api/forgot-password', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ email }) });
              const body = await res.json();
              if (!res.ok) return alert(body.error || 'Gagal mengirim instruksi reset');
              closeForgotPasswordModal();
              showAlert(body.message || 'Jika email terdaftar, link reset telah dikirim.', 'success');
                      // For mini-project: auto-open reset modal and prefill email so user can set new password immediately
              if (body) {
                  const prefillEmail = email;
                  openResetPasswordModal(prefillEmail);
                  showAlert('Silakan masukkan password baru untuk email yang Anda masukkan.', 'info');
              }
          } catch (err) { console.error(err); alert('Gagal terhubung ke server'); }
      }
      window.submitForgotPassword = submitForgotPassword;

      function openResetPasswordModal(prefillEmail) {
          const m = document.getElementById('resetPasswordModal'); if (!m) return; m.classList.add('active'); document.body.classList.add('modal-open');
          const emailInput = document.getElementById('resetEmailInput'); if (emailInput && prefillEmail) emailInput.value = prefillEmail;
          const pwInput = document.getElementById('resetNewPassword'); if (pwInput) pwInput.focus();
      }
      function closeResetPasswordModal() { const m = document.getElementById('resetPasswordModal'); if (!m) return; m.classList.remove('active'); document.body.classList.remove('modal-open'); document.getElementById('resetEmailInput').value=''; document.getElementById('resetNewPassword').value=''; }
      window.openResetPasswordModal = openResetPasswordModal; window.closeResetPasswordModal = closeResetPasswordModal;

      async function submitResetPassword() {
          const email = (document.getElementById('resetEmailInput')||{}).value;
          const password = (document.getElementById('resetNewPassword')||{}).value;
          if (!email || !password) { alert('Email dan password baru diperlukan'); return; }
          try {
              const res = await fetch('/api/reset-password', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ email, password }) });
              const body = await res.json();
              if (!res.ok) return alert(body.error || 'Gagal mereset password');
              closeResetPasswordModal();
              showAlert(body.message || 'Password direset. Silakan login.', 'success');
          } catch (err) { console.error(err); alert('Gagal terhubung ke server'); }
      }
      window.submitResetPassword = submitResetPassword;

      if (forgotPasswordLink) forgotPasswordLink.addEventListener('click', (e) => { e.preventDefault(); openForgotPasswordModal(); });

      // Auto-open reset modal if URL contains resetToken param
      const urlParams = new URLSearchParams(window.location.search);
      const resetTokenParam = urlParams.get('resetToken');
      if (resetTokenParam) { openResetPasswordModal(resetTokenParam); }

      if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const userRaw = localStorage.getItem('user');
            if (!userRaw) { alert('Harus login'); return; }
            const user = JSON.parse(userRaw);

            const formData = new FormData();
            formData.append('name', document.getElementById('profileName').value);
            formData.append('phone', document.getElementById('profilePhone').value);
            formData.append('address', document.getElementById('profileAddress').value);
            formData.append('instagram', document.getElementById('profileInstagram').value);
            formData.append('twitter', document.getElementById('profileTwitter').value);
            const photoInput = document.getElementById('profilePhoto');
            if (photoInput.files[0]) formData.append('photo', photoInput.files[0]);

            try {
                const res = await fetch(`/api/users/${user.id}`, { method: 'PUT', body: formData });
                const body = await res.json();
                if (!res.ok) return alert(body.error || 'Gagal menyimpan profile');
                localStorage.setItem('user', JSON.stringify(body.user));
                showAlert('Profil berhasil diperbarui!', 'success');
                loadProfile();
            } catch (err) {
                console.error('profile save error', err);
                alert('Gagal terhubung ke server');
            }
        });
    }
});

  // Load profile from backend
  async function loadProfile() {
      const userRaw = localStorage.getItem('user');
      if (!userRaw) return;
      const user = JSON.parse(userRaw);
      try {
          const res = await fetch(`/api/users/${user.id}`);
          if (!res.ok) return;
          const body = await res.json();
          const profile = body.user || {};
          if (profile.photo) document.getElementById('profilePhotoPreview').src = profile.photo;
          document.getElementById('profileName').value = profile.name || '';
          document.getElementById('profileEmail').value = profile.email || '';
          document.getElementById('profilePhone').value = profile.phone || '';
          document.getElementById('profileAddress').value = profile.address || '';
          document.getElementById('profileInstagram').value = profile.instagram || '';
          document.getElementById('profileTwitter').value = profile.twitter || '';
      } catch (err) { console.error('loadProfile error', err); }
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
