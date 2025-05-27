// admin-new.js - Güncellenmiş admin panel JavaScript

// Global değişkenler
let authToken = null;
let posts = [];
let currentProfile = {};
let currentSettings = {};
let currentTheme = {};

// DOM yüklendiğinde
document.addEventListener('DOMContentLoaded', async () => {
    // Auth kontrolü
    if (!checkAuth()) {
        window.location.href = '/login';
        return;
    }

    // Kullanıcı adını göster
    const username = localStorage.getItem('adminUser') || sessionStorage.getItem('adminUser');
    document.getElementById('adminUsername').textContent = `👤 ${username}`;

    // Event listener'ları kur
    setupEventListeners();

    // Verileri yükle
    await loadAllData();

    // Dashboard'u göster
    showSection('dashboard');
});

// Auth kontrolü
function checkAuth() {
    authToken = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    return !!authToken;
}

// API istekleri için header
function getAuthHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
    };
}

// Event listener'ları kur
function setupEventListeners() {
    // Menü navigasyonu
    document.querySelectorAll('.nav-item[data-section]').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const section = item.dataset.section;
            showSection(section);

            // Aktif sınıfı güncelle
            document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
        });
    });

    // Çıkış butonu
    document.getElementById('logoutBtn').addEventListener('click', logout);

    // Yeni yazı butonu - Yeni editöre yönlendir
    document.getElementById('newPostBtn').addEventListener('click', () => {
        window.location.href = '/post-editor';
    });

    // Form submit'leri
    document.getElementById('profileForm').addEventListener('submit', handleProfileSubmit);
    document.getElementById('themeForm').addEventListener('submit', handleThemeSubmit);
    document.getElementById('settingsForm').addEventListener('submit', handleSettingsSubmit);

    // Profil resmi yükleme
    document.getElementById('profileImageInput').addEventListener('change', handleImageUpload);

    // Renk input senkronizasyonu
    setupColorInputs();

    // Tema sıfırlama
    document.getElementById('resetTheme').addEventListener('click', resetTheme);
}

// Bölüm gösterme
function showSection(sectionName) {
    document.querySelectorAll('.admin-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(sectionName).classList.add('active');

    // İlgili verileri güncelle
    if (sectionName === 'dashboard') {
        updateDashboard();
    } else if (sectionName === 'posts') {
        renderPostsTable();
    }
}

// Tüm verileri yükle
async function loadAllData() {
    try {
        // Paralel yükleme
        const [postsRes, profileRes, settingsRes] = await Promise.all([
            fetch('/api/posts'),
            fetch('/api/profile'),
            fetch('/api/settings')
        ]);

        const postsData = await postsRes.json();
        posts = postsData.posts || [];

        currentProfile = await profileRes.json();
        updateProfileForm();

        const settings = await settingsRes.json();
        currentTheme = settings.theme;
        currentSettings = settings.site;
        updateThemeForm();
        updateSettingsForm();

    } catch (error) {
        console.error('Veri yükleme hatası:', error);
        showNotification('Veriler yüklenirken hata oluştu', 'error');
    }
}

// Dashboard güncelleme
function updateDashboard() {
    // İstatistikler
    document.getElementById('totalPosts').textContent = posts.length;

    const totalViews = posts.reduce((sum, post) => sum + (post.views || 0), 0);
    document.getElementById('totalViews').textContent = totalViews;

    const lastPost = posts[0];
    if (lastPost) {
        const date = new Date(lastPost.date);
        document.getElementById('lastUpdate').textContent = date.toLocaleDateString('tr-TR');
    }

    // Son yazılar
    const recentPosts = posts.slice(0, 5);
    const recentPostsHtml = recentPosts.map(post => `
        <div class="recent-post-item">
            <div>
                <h4>${escapeHtml(post.title)}</h4>
                <small>${new Date(post.date).toLocaleDateString('tr-TR')} - ${post.views || 0} görüntülenme</small>
            </div>
            <button class="btn btn-sm btn-secondary" onclick="editPost(${post.id})">Düzenle</button>
        </div>
    `).join('');

    document.getElementById('recentPostsList').innerHTML = recentPostsHtml || '<p>Henüz yazı bulunmuyor.</p>';
}

// Yazılar tablosu
function renderPostsTable() {
    const tbody = document.getElementById('postsTableBody');

    if (posts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">Henüz yazı bulunmuyor.</td></tr>';
        return;
    }

    tbody.innerHTML = posts.map(post => `
        <tr>
            <td>
                <div style="display: flex; flex-direction: column;">
                    <strong>${escapeHtml(post.title)}</strong>
                    <small style="color: var(--text-secondary);">${escapeHtml(post.summary || '')}</small>
                </div>
            </td>
            <td>${new Date(post.date).toLocaleDateString('tr-TR')}</td>
            <td>
                <span style="display: flex; align-items: center; gap: 0.25rem;">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                    ${post.views || 0}
                </span>
            </td>
            <td>
                <div class="table-actions">
                    <button class="btn btn-sm btn-primary" onclick="viewPost(${post.id})" title="Görüntüle">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                    </button>
                    <button class="btn btn-sm btn-secondary" onclick="editPost(${post.id})" title="Düzenle">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deletePost(${post.id})" title="Sil">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Yazı görüntüle
window.viewPost = function (postId) {
    window.open(`/post/${postId}`, '_blank');
};

// Yazı düzenle - Yeni editöre yönlendir
window.editPost = function (postId) {
    window.location.href = `/post-editor?id=${postId}`;
};

// Yazı sil
window.deletePost = async function (postId) {
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const confirmMessage = `"${post.title}" başlıklı yazıyı silmek istediğinizden emin misiniz?\n\nBu işlem geri alınamaz.`;

    if (!confirm(confirmMessage)) return;

    try {
        const response = await fetch(`/api/posts/${postId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        if (response.ok) {
            showNotification('Yazı silindi!', 'success');
            await loadAllData();
            renderPostsTable();
            updateDashboard();
        } else {
            throw new Error('Silme işlemi başarısız');
        }
    } catch (error) {
        console.error('Yazı silme hatası:', error);
        showNotification('Yazı silinemedi', 'error');
    }
};

// Profil formu güncelle
function updateProfileForm() {
    document.getElementById('profileName').value = currentProfile.name || '';
    document.getElementById('profileTitle').value = currentProfile.title || '';
    document.getElementById('profileBio').value = currentProfile.bio || '';
    document.getElementById('profileEmail').value = currentProfile.email || '';
    document.getElementById('profileGithub').value = currentProfile.github || '';
    document.getElementById('profileLinkedin').value = currentProfile.linkedin || '';
    document.getElementById('profileImagePreview').src = currentProfile.image || '/assets/img/profile.jpg';
}

// Profil güncelle
async function handleProfileSubmit(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const profileData = {
        name: formData.get('name'),
        title: formData.get('title'),
        bio: formData.get('bio'),
        email: formData.get('email'),
        github: formData.get('github'),
        linkedin: formData.get('linkedin'),
        image: currentProfile.image
    };

    try {
        const response = await fetch('/api/profile', {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(profileData)
        });

        if (response.ok) {
            currentProfile = profileData;
            showNotification('Profil güncellendi!', 'success');
        } else {
            throw new Error('Güncelleme başarısız');
        }
    } catch (error) {
        console.error('Profil güncelleme hatası:', error);
        showNotification('Profil güncellenemedi', 'error');
    }
}

// Resim yükleme
async function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Dosya kontrolü
    if (!file.type.startsWith('image/')) {
        showNotification('Lütfen bir resim dosyası seçin', 'error');
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        showNotification('Dosya boyutu 5MB\'dan küçük olmalıdır', 'error');
        return;
    }

    const formData = new FormData();
    formData.append('image', file);

    try {
        const response = await fetch('/api/upload', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
            },
            body: formData
        });

        if (response.ok) {
            const data = await response.json();
            currentProfile.image = data.path;
            document.getElementById('profileImagePreview').src = data.path;
            showNotification('Resim yüklendi!', 'success');
        } else {
            throw new Error('Yükleme başarısız');
        }
    } catch (error) {
        console.error('Resim yükleme hatası:', error);
        showNotification('Resim yüklenemedi', 'error');
    }
}

// Tema formu güncelle
function updateThemeForm() {
    if (!currentTheme) return;

    document.getElementById('primaryColor').value = currentTheme.primaryColor;
    document.getElementById('primaryColorText').value = currentTheme.primaryColor;
    document.getElementById('secondaryColor').value = currentTheme.secondaryColor;
    document.getElementById('secondaryColorText').value = currentTheme.secondaryColor;
    document.getElementById('accentColor').value = currentTheme.accentColor;
    document.getElementById('accentColorText').value = currentTheme.accentColor;
    document.getElementById('bgPrimary').value = currentTheme.bgPrimary;
    document.getElementById('bgPrimaryText').value = currentTheme.bgPrimary;
    document.getElementById('bgSecondary').value = currentTheme.bgSecondary;
    document.getElementById('bgSecondaryText').value = currentTheme.bgSecondary;

    updateThemePreview();
}

// Tema önizleme güncelle
function updateThemePreview() {
    const preview = document.querySelector('.preview-card');
    if (preview) {
        preview.style.setProperty('--primary-color', document.getElementById('primaryColor').value);
        preview.style.setProperty('--secondary-color', document.getElementById('secondaryColor').value);
        preview.style.setProperty('--accent-color', document.getElementById('accentColor').value);
        preview.style.setProperty('--bg-primary', document.getElementById('bgPrimary').value);
        preview.style.setProperty('--bg-secondary', document.getElementById('bgSecondary').value);
    }
}

// Renk input senkronizasyonu
function setupColorInputs() {
    const colorInputs = ['primaryColor', 'secondaryColor', 'accentColor', 'bgPrimary', 'bgSecondary'];

    colorInputs.forEach(id => {
        const colorInput = document.getElementById(id);
        const textInput = document.getElementById(id + 'Text');

        if (colorInput && textInput) {
            colorInput.addEventListener('input', (e) => {
                textInput.value = e.target.value;
                updateThemePreview();
            });

            textInput.addEventListener('input', (e) => {
                if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                    colorInput.value = e.target.value;
                    updateThemePreview();
                }
            });
        }
    });
}

// Tema güncelle
async function handleThemeSubmit(e) {
    e.preventDefault();

    const themeData = {
        primaryColor: document.getElementById('primaryColor').value,
        secondaryColor: document.getElementById('secondaryColor').value,
        accentColor: document.getElementById('accentColor').value,
        bgPrimary: document.getElementById('bgPrimary').value,
        bgSecondary: document.getElementById('bgSecondary').value,
        darkMode: false
    };

    try {
        const settingsData = {
            theme: themeData,
            site: currentSettings
        };

        const response = await fetch('/api/settings', {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(settingsData)
        });

        if (response.ok) {
            currentTheme = themeData;
            showNotification('Tema ayarları güncellendi!', 'success');
            applyTheme(themeData);
        } else {
            throw new Error('Güncelleme başarısız');
        }
    } catch (error) {
        console.error('Tema güncelleme hatası:', error);
        showNotification('Tema güncellenemedi', 'error');
    }
}

// Temayı uygula
function applyTheme(theme) {
    const root = document.documentElement;
    root.style.setProperty('--primary-color', theme.primaryColor);
    root.style.setProperty('--secondary-color', theme.secondaryColor);
    root.style.setProperty('--accent-color', theme.accentColor);
    root.style.setProperty('--bg-primary', theme.bgPrimary);
    root.style.setProperty('--bg-secondary', theme.bgSecondary);
}

// Tema sıfırla
function resetTheme() {
    const defaultTheme = {
        primaryColor: '#6B73FF',
        secondaryColor: '#FF6B9D',
        accentColor: '#4ECDC4',
        bgPrimary: '#FAF9F7',
        bgSecondary: '#FFFFFF'
    };

    currentTheme = defaultTheme;
    updateThemeForm();
    showNotification('Tema varsayılan değerlere döndürüldü', 'info');
}

// Site ayarları formu güncelle
function updateSettingsForm() {
    if (!currentSettings) return;

    document.getElementById('siteTitle').value = currentSettings.title || '';
    document.getElementById('siteDescription').value = currentSettings.description || '';
    document.getElementById('siteKeywords').value = currentSettings.keywords || '';
}

// Site ayarları güncelle
async function handleSettingsSubmit(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const siteData = {
        title: formData.get('title'),
        description: formData.get('description'),
        keywords: formData.get('keywords')
    };

    try {
        const settingsData = {
            theme: currentTheme,
            site: siteData
        };

        const response = await fetch('/api/settings', {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(settingsData)
        });

        if (response.ok) {
            currentSettings = siteData;
            showNotification('Site ayarları güncellendi!', 'success');
        } else {
            throw new Error('Güncelleme başarısız');
        }
    } catch (error) {
        console.error('Ayar güncelleme hatası:', error);
        showNotification('Ayarlar güncellenemedi', 'error');
    }
}

// Çıkış
function logout() {
    if (confirm('Çıkış yapmak istediğinizden emin misiniz?')) {
        localStorage.removeItem('authToken');
        sessionStorage.removeItem('authToken');
        localStorage.removeItem('adminUser');
        sessionStorage.removeItem('adminUser');
        window.location.href = '/login';
    }
}

// Bildirim göster
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 2rem;
        background: ${type === 'success' ? '#48BB78' : type === 'error' ? '#F56565' : '#4299E1'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 9999;
        animation: slideIn 0.3s ease;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// HTML escape
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// Animasyonlar için CSS ekle
const style = document.createElement('style');
style.textContent = `
@keyframes slideIn {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

@keyframes slideOut {
    from {
        transform: translateX(0);
        opacity: 1;
    }
    to {
        transform: translateX(100%);
        opacity: 0;
    }
}

.btn-sm {
    padding: 0.25rem 0.75rem;
    font-size: 0.875rem;
}

.btn-danger {
    background: #F56565;
    color: white;
}

.btn-danger:hover {
    background: #E53E3E;
}

.table-actions {
    display: flex;
    gap: 0.5rem;
    align-items: center;
}

.table-actions button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    padding: 0;
    border-radius: 6px;
}
`;
document.head.appendChild(style);