// login.js - Admin giriş sayfası JavaScript

// DOM elementleri
const loginForm = document.getElementById('loginForm');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const togglePasswordBtn = document.getElementById('togglePassword');
const rememberMeCheckbox = document.getElementById('rememberMe');
const loginError = document.getElementById('loginError');
const errorMessage = document.getElementById('errorMessage');

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', () => {
    // Zaten giriş yapmış mı kontrol et
    checkExistingAuth();

    // Event listener'lar
    setupEventListeners();
});

// Mevcut oturum kontrolü
function checkExistingAuth() {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');

    if (token) {
        // Token'ı doğrula
        verifyToken(token);
    }
}

// Token doğrulama
async function verifyToken(token) {
    try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/api/auth/verify`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            // Token geçerli, admin paneline yönlendir
            window.location.href = 'admin.html';
        }
    } catch (error) {
        // Token geçersiz, temizle
        localStorage.removeItem('authToken');
        sessionStorage.removeItem('authToken');
    }
}

// Event listener'ları kur
function setupEventListeners() {
    // Form gönderimi
    loginForm.addEventListener('submit', handleLogin);

    // Şifre göster/gizle
    togglePasswordBtn.addEventListener('click', togglePassword);

    // Enter tuşu ile gönderim
    [usernameInput, passwordInput].forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleLogin(e);
            }
        });
    });
}

// Giriş işlemi
async function handleLogin(e) {
    e.preventDefault();

    // Hata mesajını gizle
    loginError.style.display = 'none';

    // Form verilerini al
    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    const rememberMe = rememberMeCheckbox.checked;

    // Validasyon
    if (!username || !password) {
        showError('Kullanıcı adı ve şifre gereklidir.');
        return;
    }

    // Butonu devre dışı bırak
    const submitBtn = loginForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.classList.add('loading');
    submitBtn.textContent = 'Giriş yapılıyor...';

    try {
        // API'ye giriş isteği gönder
        const response = await fetch(`${API_CONFIG.BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            // Başarılı giriş
            const storage = rememberMe ? localStorage : sessionStorage;
            storage.setItem('authToken', data.token);
            storage.setItem('adminUser', username);

            // Admin paneline yönlendir
            window.location.href = 'admin.html';
        } else {
            // Hatalı giriş
            showError(data.error || 'Giriş başarısız. Lütfen tekrar deneyin.');
        }
    } catch (error) {
        console.error('Giriş hatası:', error);
        showError('Sunucu bağlantısı kurulamadı. Backend\'in çalıştığından emin olun.');
    } finally {
        // Butonu aktif et
        submitBtn.disabled = false;
        submitBtn.classList.remove('loading');
        submitBtn.textContent = 'Giriş Yap';
    }
}

// Şifre göster/gizle
function togglePassword() {
    const type = passwordInput.type === 'password' ? 'text' : 'password';
    passwordInput.type = type;

    // İkonu güncelle
    togglePasswordBtn.innerHTML = type === 'password'
        ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>`
        : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
            <line x1="1" y1="1" x2="23" y2="23"></line>
          </svg>`;
}

// Hata mesajını göster
function showError(message) {
    errorMessage.textContent = message;
    loginError.style.display = 'flex';

    // Input'lara focus efekti
    usernameInput.classList.add('error');
    passwordInput.classList.add('error');

    setTimeout(() => {
        usernameInput.classList.remove('error');
        passwordInput.classList.remove('error');
    }, 3000);
}

// CSS için hata sınıfı
const style = document.createElement('style');
style.textContent = `
    input.error {
        border-color: #DC2626 !important;
        animation: shake 0.5s ease;
    }
    
    input.error:focus {
        box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1) !important;
    }
`;
document.head.appendChild(style);