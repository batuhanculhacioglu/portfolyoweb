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
        // Gerçek uygulamada localStorage veya backend API kullanılabilir
        const savedPosts = localStorage.getItem('blogPosts');
        if (savedPosts) {
            posts = JSON.parse(savedPosts);
        } else {
            // Demo veri kullan
            posts = getDemoPosts();
            savePosts();
        }
    } catch (error) {
        console.error('Gönderiler yüklenirken hata:', error);
        posts = getDemoPosts();
    }
}

// Gönderileri kaydet (localStorage'a)
function savePosts() {
    try {
        localStorage.setItem('blogPosts', JSON.stringify(posts));
        console.log('Gönderiler kaydedildi');
    } catch (error) {
        console.error('Kaydetme hatası:', error);
        alert('Gönderiler kaydedilemedi. Tarayıcı depolama alanı dolu olabilir.');
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
function handleNewPost(e) {
    e.preventDefault();

    const formData = new FormData(postForm);
    const newPost = {
        id: Date.now(), // Basit ID oluşturma
        title: formData.get('title'),
        summary: formData.get('summary'),
        content: formData.get('content'),
        tags: formData.get('tags').split(',').map(tag => tag.trim()).filter(tag => tag),
        date: new Date().toISOString(),
        views: 0
    };

    posts.unshift(newPost); // En başa ekle
    savePosts();
    renderAdminPosts();
    postForm.reset();

    // Başarı mesajı
    showNotification('Yeni gönderi başarıyla eklendi!', 'success');
}

// Gönderiyi düzenle
function handleEditPost(e) {
    e.preventDefault();

    const formData = new FormData(editForm);
    const postIndex = posts.findIndex(p => p.id === editingPostId);

    if (postIndex !== -1) {
        posts[postIndex] = {
            ...posts[postIndex],
            title: formData.get('title'),
            summary: formData.get('summary'),
            content: formData.get('content'),
            tags: formData.get('tags').split(',').map(tag => tag.trim()).filter(tag => tag),
            updatedDate: new Date().toISOString()
        };

        savePosts();
        renderAdminPosts();
        closeEditModal();
        showNotification('Gönderi başarıyla güncellendi!', 'success');
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
function deletePost(postId) {
    if (!confirm('Bu gönderiyi silmek istediğinizden emin misiniz?')) {
        return;
    }

    posts = posts.filter(p => p.id !== postId);
    savePosts();
    renderAdminPosts();
    showNotification('Gönderi başarıyla silindi!', 'success');
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

// Demo gönderiler
function getDemoPosts() {
    return [
        {
            id: 1,
            title: "STM32 ile RTOS Kullanımı",
            summary: "FreeRTOS kullanarak STM32 mikrodenetleyicilerde çoklu görev yönetimi nasıl yapılır?",
            content: `# STM32 ve FreeRTOS

Bu yazıda STM32F4 serisi mikrodenetleyicilerde FreeRTOS kullanımını inceleyeceğiz.

## Kurulum

1. STM32CubeIDE'yi açın
2. Yeni proje oluşturun
3. Middleware sekmesinden FreeRTOS'u aktif edin

## Örnek Kod

\`\`\`c
void StartDefaultTask(void const * argument) {
    for(;;) {
        HAL_GPIO_TogglePin(LED_GPIO_Port, LED_Pin);
        osDelay(1000);
    }
}
\`\`\`

Detaylı bilgi için...`,
            tags: ["STM32", "RTOS", "FreeRTOS", "C"],
            date: new Date().toISOString(),
            views: 156
        },
        {
            id: 2,
            title: "ESP32 ile IoT Projesi",
            summary: "ESP32 kullanarak bulut tabanlı sıcaklık ve nem takip sistemi geliştirme",
            content: `# ESP32 IoT Sensör Projesi

ESP32'nin WiFi özelliklerini kullanarak sensör verilerini buluta gönderme...`,
            tags: ["ESP32", "IoT", "MQTT", "C++"],
            date: new Date(Date.now() - 86400000).toISOString(),
            views: 234
        }
    ];
}

// Global fonksiyonlar (onclick için)
window.openEditModal = openEditModal;
window.deletePost = deletePost;

// Animasyon için CSS ekle
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

.empty-message {
    text-align: center;
    color: var(--text-secondary);
    padding: 2rem;
}

.post-meta {
    color: var(--text-secondary);
    margin-top: 0.5rem;
}
`;
document.head.appendChild(style);