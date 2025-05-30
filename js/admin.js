// admin.js - Admin paneli için JavaScript kodu

// Global değişkenler
let posts = [];
let editingPostId = null;

// DOM elementleri
const postForm = document.getElementById('postForm');
const editForm = document.getElementById('editForm');
const adminPostsList = document.getElementById('adminPostsList');
const editModal = document.getElementById('editModal');
const clearFormBtn = document.getElementById('clearForm');
const closeModalBtn = document.getElementById('closeModal');
const cancelEditBtn = document.getElementById('cancelEdit');

// Sayfa yüklendiğinde başlat
document.addEventListener('DOMContentLoaded', async () => {
    await loadPosts();
    renderAdminPosts();
    setupEventListeners();
});

// Gönderileri yükle
async function loadPosts() {
    try {
        const API_BASE = window.location.origin.includes('localhost')
            ? 'http://localhost:3001'
            : window.location.origin;
        const response = await fetch(`${API_BASE}/api/posts`);

        if (!response.ok) {
            throw new Error('API yanıt vermedi');
        }

        const data = await response.json();
        posts = data.posts || [];
        console.log(`${posts.length} gönderi yüklendi`);
    } catch (error) {
        console.error('Gönderiler yüklenirken hata:', error);
        posts = [];
        showNotification('Gönderiler yüklenemedi. Backend sunucuyu kontrol edin.', 'error');
    }
}

// Event listener'ları kur
function setupEventListeners() {
    // Yeni gönderi formu
    postForm.addEventListener('submit', handleNewPost);

    // Düzenleme formu
    editForm.addEventListener('submit', handleEditPost);

    // Formu temizle butonu
    clearFormBtn.addEventListener('click', () => {
        postForm.reset();
    });

    // Modal kapat butonları
    closeModalBtn.addEventListener('click', closeEditModal);
    cancelEditBtn.addEventListener('click', closeEditModal);

    // Modal dışına tıklama
    editModal.addEventListener('click', (e) => {
        if (e.target === editModal) {
            closeEditModal();
        }
    });
}

// Yeni gönderi ekle
async function handleNewPost(e) {
    e.preventDefault();

    const formData = new FormData(postForm);
    const newPost = {
        title: formData.get('title'),
        summary: formData.get('summary'),
        content: formData.get('content'),
        tags: formData.get('tags').split(',').map(tag => tag.trim()).filter(tag => tag)
    };

    try {
        const response = await fetch('http://localhost:3001/api/posts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newPost)
        });

        if (!response.ok) {
            throw new Error('Gönderi eklenemedi');
        }

        const createdPost = await response.json();
        posts.unshift(createdPost);
        renderAdminPosts();
        postForm.reset();

        showNotification('Yeni gönderi başarıyla eklendi!', 'success');
    } catch (error) {
        console.error('Gönderi ekleme hatası:', error);
        showNotification('Gönderi eklenemedi. Hata: ' + error.message, 'error');
    }
}

// Gönderiyi düzenle
async function handleEditPost(e) {
    e.preventDefault();

    const formData = new FormData(editForm);
    const updatedPost = {
        title: formData.get('title'),
        summary: formData.get('summary'),
        content: formData.get('content'),
        tags: formData.get('tags').split(',').map(tag => tag.trim()).filter(tag => tag)
    };

    try {
        const response = await fetch(`http://localhost:3001/api/posts/${editingPostId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedPost)
        });

        if (!response.ok) {
            throw new Error('Gönderi güncellenemedi');
        }

        const updated = await response.json();
        const postIndex = posts.findIndex(p => p.id === editingPostId);

        if (postIndex !== -1) {
            posts[postIndex] = updated;
            renderAdminPosts();
            closeEditModal();
            showNotification('Gönderi başarıyla güncellendi!', 'success');
        }
    } catch (error) {
        console.error('Güncelleme hatası:', error);
        showNotification('Gönderi güncellenemedi. Hata: ' + error.message, 'error');
    }
}

// Admin gönderi listesini render et
function renderAdminPosts() {
    adminPostsList.innerHTML = '';

    if (posts.length === 0) {
        adminPostsList.innerHTML = '<p class="empty-message">Henüz gönderi bulunmuyor.</p>';
        return;
    }

    posts.forEach(post => {
        const postItem = createAdminPostItem(post);
        adminPostsList.appendChild(postItem);
    });
}

// Admin gönderi öğesi oluştur
function createAdminPostItem(post) {
    const item = document.createElement('div');
    item.className = 'admin-post-item';

    const date = new Date(post.date).toLocaleDateString('tr-TR');

    item.innerHTML = `
        <div class="admin-post-info">
            <h3>${escapeHtml(post.title)}</h3>
            <p>${escapeHtml(post.summary)}</p>
            <p class="post-meta">
                <small>Tarih: ${date} | Etiketler: ${post.tags.join(', ') || 'Yok'}</small>
            </p>
        </div>
        <div class="admin-post-actions">
            <button class="btn btn-secondary" onclick="openEditModal(${post.id})">Düzenle</button>
            <button class="btn btn-danger" onclick="deletePost(${post.id})">Sil</button>
        </div>
    `;

    return item;
}

// Düzenleme modalını aç
function openEditModal(postId) {
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    editingPostId = postId;

    // Form alanlarını doldur
    document.getElementById('editTitle').value = post.title;
    document.getElementById('editSummary').value = post.summary;
    document.getElementById('editContent').value = post.content;
    document.getElementById('editTags').value = post.tags.join(', ');

    // Modalı göster
    editModal.classList.add('show');
}

// Düzenleme modalını kapat
function closeEditModal() {
    editModal.classList.remove('show');
    editForm.reset();
    editingPostId = null;
}

// Gönderiyi sil
async function deletePost(postId) {
    if (!confirm('Bu gönderiyi silmek istediğinizden emin misiniz?')) {
        return;
    }

    try {
        const response = await fetch(`http://localhost:3001/api/posts/${postId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error('Gönderi silinemedi');
        }

        posts = posts.filter(p => p.id !== postId);
        renderAdminPosts();
        showNotification('Gönderi başarıyla silindi!', 'success');
    } catch (error) {
        console.error('Silme hatası:', error);
        showNotification('Gönderi silinemedi. Hata: ' + error.message, 'error');
    }
}

// Bildirim göster
function showNotification(message, type = 'info') {
    // Basit bir bildirim sistemi
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    // CSS ile stil verilebilir
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 2rem;
        background: ${type === 'success' ? '#48BB78' : '#ED8936'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 9999;
        animation: slideIn 0.3s ease;
    `;

    document.body.appendChild(notification);

    // 3 saniye sonra kaldır
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// HTML escape fonksiyonu
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

// Global fonksiyonlar (onclick için)
window.openEditModal = openEditModal;
window.deletePost = deletePost;

