// post-editor.js - Gelişmiş Post Editörü JavaScript (Quill.js ile)

// Global değişkenler
let authToken = null;
let currentPostId = null;
let quillEditor = null;
let cropperInstance = null;
let isDirty = false;
let autosaveTimer = null;
let currentPost = {};

// API Base URL
const API_BASE = window.location.origin.includes('localhost')
    ? 'http://localhost:3001'
    : window.location.origin;

// DOM elementleri
const elements = {
    // Header
    backBtn: document.getElementById('backBtn'),
    saveStatus: document.getElementById('saveStatus'),
    previewBtn: document.getElementById('previewBtn'),
    saveBtn: document.getElementById('saveBtn'),
    saveBtnText: document.getElementById('saveBtnText'),
    publishBtn: document.getElementById('publishBtn'),

    // Content
    postTitle: document.getElementById('postTitle'),
    postTags: document.getElementById('postTags'),
    postExcerpt: document.getElementById('postExcerpt'),
    postSlug: document.getElementById('postSlug'),
    postStatus: document.getElementById('postStatus'),

    // Image upload
    featuredImageArea: document.getElementById('featuredImageArea'),
    featuredImageInput: document.getElementById('featuredImageInput'),

    // Stats
    wordCount: document.getElementById('wordCount'),
    charCount: document.getElementById('charCount'),
    readTime: document.getElementById('readTime'),
    excerptCount: document.getElementById('excerptCount'),

    // SEO
    seoTitle: document.getElementById('seoTitle'),
    seoUrl: document.getElementById('seoUrl'),
    seoDescription: document.getElementById('seoDescription'),

    // Modals
    previewModal: document.getElementById('previewModal'),
    closePreview: document.getElementById('closePreview'),
    previewContent: document.getElementById('previewContent'),

    imageCropModal: document.getElementById('imageCropModal'),
    closeCrop: document.getElementById('closeCrop'),
    cropImage: document.getElementById('cropImage'),
    cropCancel: document.getElementById('cropCancel'),
    cropSave: document.getElementById('cropSave'),

    // Other
    loadingOverlay: document.getElementById('loadingOverlay'),
    autosaveIndicator: document.getElementById('autosaveIndicator')
};

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', async () => {
    // Auth kontrolü
    if (!checkAuth()) {
        window.location.href = '/login';
        return;
    }

    // URL'den post ID'sini al
    currentPostId = getPostIdFromUrl();

    // Quill editörünü başlat
    await initQuillEditor();

    // Event listener'ları kur
    setupEventListeners();

    // Eğer düzenleme modundaysa, post'u yükle
    if (currentPostId) {
        await loadPost();
        elements.saveBtnText.textContent = 'Güncelle';
        elements.publishBtn.style.display = 'inline-flex';
    } else {
        elements.saveBtnText.textContent = 'Kaydet';
        updateSEOPreview();
    }

    // Auto-save'i başlat
    startAutoSave();
});

// Auth kontrolü
function checkAuth() {
    authToken = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    return !!authToken;
}

// API header'ları
function getAuthHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
    };
}

// URL'den post ID'sini al
function getPostIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

// Quill editörünü başlat
async function initQuillEditor() {
    return new Promise((resolve) => {
        const ImageResize = window.ImageResize;
        // Quill modüllerini yapılandır
        const toolbarOptions = [
            [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
            [{ 'font': [] }],
            [{ 'size': ['small', false, 'large', 'huge'] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'script': 'sub' }, { 'script': 'super' }],
            ['blockquote', 'code-block'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            [{ 'indent': '-1' }, { 'indent': '+1' }],
            [{ 'direction': 'rtl' }],
            [{ 'align': [] }],
            ['link', 'image', 'video'],
            ['clean']
        ];

        quillEditor = new Quill('#quillEditor', {
            theme: 'snow',
            placeholder: 'Yazınızı buraya yazmaya başlayın...',
            modules: {
                toolbar: {
                    container: toolbarOptions,
                    handlers: {
                        image: imageHandler,
                        video: videoHandler
                    }
                },
                imageResize: {
                    modules: ['Resize', 'DisplaySize']
                },
                history: {
                    delay: 1000,
                    maxStack: 50,
                    userOnly: true
                }
            }
        });

        // Event listener'lar
        quillEditor.on('text-change', function (delta, oldDelta, source) {
            if (source === 'user') {
                isDirty = true;
                updateStats();
                updateSEOPreview();
                showAutosaving();
            }
        });

        // Başlatma tamamlandı
        setTimeout(() => {
            resolve();
            updateStats();
        }, 100);
    });
}

// Resim yükleme handler'ı
function imageHandler() {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
        const file = input.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            showNotification('Lütfen bir resim dosyası seçin', 'error');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            showNotification('Dosya boyutu 5MB\'dan küçük olmalıdır', 'error');
            return;
        }

        try {
            showLoading(true);

            const formData = new FormData();
            formData.append('image', file);

            const response = await fetch(`${API_BASE}/api/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                },
                body: formData
            });

            if (!response.ok) throw new Error('Yükleme başarısız');

            const data = await response.json();

            // Resmi editöre ekle
            const range = quillEditor.getSelection(true);
            quillEditor.insertEmbed(range.index, 'image', data.path);
            quillEditor.setSelection(range.index + 1);

            showNotification('Resim yüklendi!', 'success');
        } catch (error) {
            console.error('Resim yükleme hatası:', error);
            showNotification('Resim yüklenemedi', 'error');
        } finally {
            showLoading(false);
        }
    };
}

// Video yükleme handler'ı
function videoHandler() {
    const url = prompt('Video URL\'sini girin (YouTube, Vimeo, vb.):');
    if (url) {
        const range = quillEditor.getSelection(true);
        quillEditor.insertEmbed(range.index, 'video', url);
        quillEditor.setSelection(range.index + 1);
    }
}

// Event listener'ları kur
function setupEventListeners() {
    // Header butonları
    elements.backBtn.addEventListener('click', handleBack);
    elements.previewBtn.addEventListener('click', showPreview);
    elements.saveBtn.addEventListener('click', savePost);
    elements.publishBtn.addEventListener('click', publishPost);

    // Form değişiklikleri
    elements.postTitle.addEventListener('input', handleTitleChange);
    elements.postTags.addEventListener('input', updateSEOPreview);
    elements.postExcerpt.addEventListener('input', handleExcerptChange);
    elements.postSlug.addEventListener('input', updateSEOPreview);
    elements.postStatus.addEventListener('change', () => isDirty = true);

    // Resim yükleme
    elements.featuredImageArea.addEventListener('click', () => {
        elements.featuredImageInput.click();
    });
    elements.featuredImageInput.addEventListener('change', handleFeaturedImageUpload);

    // Modal kontrolleri
    elements.closePreview.addEventListener('click', () => {
        elements.previewModal.classList.remove('show');
    });

    elements.closeCrop.addEventListener('click', closeCropModal);
    elements.cropCancel.addEventListener('click', closeCropModal);
    elements.cropSave.addEventListener('click', applyCrop);

    // Modal dışına tıklama ile kapatma
    elements.previewModal.addEventListener('click', (e) => {
        if (e.target === elements.previewModal) {
            elements.previewModal.classList.remove('show');
        }
    });

    elements.imageCropModal.addEventListener('click', (e) => {
        if (e.target === elements.imageCropModal) {
            closeCropModal();
        }
    });

    // Klavye kısayolları
    document.addEventListener('keydown', handleKeyboardShortcuts);

    // Sayfa kapatma uyarısı
    window.addEventListener('beforeunload', handleBeforeUnload);
}

// Başlık değişikliği
function handleTitleChange() {
    isDirty = true;
    const title = elements.postTitle.value;

    // Slug'ı otomatik oluştur
    if (!currentPostId || !elements.postSlug.value) {
        const slug = generateSlug(title);
        elements.postSlug.value = slug;
    }

    updateSEOPreview();
    showAutosaving();
}

// Özet değişikliği
function handleExcerptChange() {
    isDirty = true;
    const excerpt = elements.postExcerpt.value;
    const count = excerpt.length;

    elements.excerptCount.textContent = count;

    // Karakter sınırı uyarısı
    if (count > 160) {
        elements.excerptCount.classList.add('char-limit-warning');
    } else {
        elements.excerptCount.classList.remove('char-limit-warning');
    }

    updateSEOPreview();
    showAutosaving();
}

// Slug oluştur
function generateSlug(title) {
    return title
        .toLowerCase()
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ş/g, 's')
        .replace(/ı/g, 'i')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}

// İstatistikleri güncelle
function updateStats() {
    if (!quillEditor) return;

    const text = quillEditor.getText();
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const chars = text.length;
    const readTime = Math.ceil(words / 200); // 200 kelime/dakika

    elements.wordCount.textContent = words.toLocaleString();
    elements.charCount.textContent = chars.toLocaleString();
    elements.readTime.textContent = `${readTime} dk`;
}

// SEO önizlemesini güncelle
function updateSEOPreview() {
    const title = elements.postTitle.value || 'Yazı Başlığı';
    const slug = elements.postSlug.value || 'yazinin-url-adresi';
    const excerpt = elements.postExcerpt.value || 'Yazı özeti burada görünecek...';

    elements.seoTitle.textContent = title;
    elements.seoUrl.textContent = `${window.location.origin}/post/${slug}`;
    elements.seoDescription.textContent = excerpt;
}

// Otomatik kaydetmeyi başlat
function startAutoSave() {
    autosaveTimer = setInterval(() => {
        if (isDirty && (elements.postTitle.value.trim() || (quillEditor && quillEditor.getText().trim()))) {
            autoSave();
        }
    }, 30000); // 30 saniyede bir
}

// Otomatik kaydetme
async function autoSave() {
    if (!isDirty) return;

    try {
        showAutosaving();
        await savePost(true);
        showSaveStatus('Otomatik kaydedildi', 'saved');
    } catch (error) {
        console.error('Otomatik kaydetme hatası:', error);
        showSaveStatus('Kaydetme hatası', 'error');
    }
}

// Kaydetme durumunu göster
function showAutosaving() {
    elements.autosaveIndicator.classList.add('show');
    setTimeout(() => {
        elements.autosaveIndicator.classList.remove('show');
    }, 2000);
}

// Kaydetme durumu
function showSaveStatus(message, type) {
    elements.saveStatus.textContent = message;
    elements.saveStatus.className = `save-status ${type}`;
}

// Post'u yükle (düzenleme modu)
async function loadPost() {
    try {
        showLoading(true);

        const response = await fetch(`${API_BASE}/api/posts/${currentPostId}`);
        if (!response.ok) throw new Error('Post bulunamadı');

        currentPost = await response.json();

        // Form alanlarını doldur
        elements.postTitle.value = currentPost.title || '';
        elements.postTags.value = currentPost.tags ? currentPost.tags.join(', ') : '';
        elements.postExcerpt.value = currentPost.summary || '';
        elements.postSlug.value = currentPost.slug || generateSlug(currentPost.title || '');
        elements.postStatus.value = currentPost.status || 'draft';

        // Quill editörüne içeriği yükle
        if (quillEditor) {
            quillEditor.root.innerHTML = currentPost.content || '';
        }

        // Öne çıkan görseli göster
        if (currentPost.featuredImage) {
            showFeaturedImage(currentPost.featuredImage);
        }

        updateStats();
        updateSEOPreview();
        isDirty = false;

        showSaveStatus('Yüklendi', 'saved');

    } catch (error) {
        console.error('Post yükleme hatası:', error);
        showNotification('Post yüklenemedi: ' + error.message, 'error');
        handleBack();
    } finally {
        showLoading(false);
    }
}

// Post'u kaydet
async function savePost(isAutoSave = false) {
    try {
        if (!isAutoSave) showLoading(true);

        const postData = {
            title: elements.postTitle.value.trim(),
            summary: elements.postExcerpt.value.trim(),
            content: quillEditor ? quillEditor.root.innerHTML : '',
            tags: elements.postTags.value.split(',').map(tag => tag.trim()).filter(tag => tag),
            slug: elements.postSlug.value.trim(),
            status: elements.postStatus.value,
            featuredImage: currentPost.featuredImage || null
        };

        // Validasyon
        if (!postData.title) {
            throw new Error('Başlık gereklidir');
        }

        let response;
        if (currentPostId) {
            // Güncelleme
            response = await fetch(`${API_BASE}/api/posts/${currentPostId}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(postData)
            });
        } else {
            // Yeni post
            response = await fetch(`${API_BASE}/api/posts`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(postData)
            });
        }

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Kaydetme başarısız');
        }

        const savedPost = await response.json();

        // Yeni post ise ID'yi güncelle
        if (!currentPostId) {
            currentPostId = savedPost.id;
            // URL'yi güncelle
            window.history.replaceState({}, '', `/post-editor?id=${currentPostId}`);
            elements.publishBtn.style.display = 'inline-flex';
        }

        currentPost = savedPost;
        isDirty = false;

        if (!isAutoSave) {
            showNotification(currentPostId ? 'Post güncellendi!' : 'Post kaydedildi!', 'success');
            showSaveStatus('Kaydedildi', 'saved');
        }

    } catch (error) {
        console.error('Kaydetme hatası:', error);
        if (!isAutoSave) {
            showNotification('Kaydetme hatası: ' + error.message, 'error');
        }
        showSaveStatus('Hata', 'error');
        throw error;
    } finally {
        if (!isAutoSave) showLoading(false);
    }
}

// Post'u yayınla
async function publishPost() {
    try {
        await savePost();

        // Durumu published yap
        elements.postStatus.value = 'published';
        await savePost();

        showNotification('Post yayınlandı!', 'success');

    } catch (error) {
        console.error('Yayınlama hatası:', error);
        showNotification('Yayınlama hatası: ' + error.message, 'error');
    }
}

// Önizleme göster
function showPreview() {
    const title = elements.postTitle.value || 'Başlık Girilmedi';
    const content = quillEditor ? quillEditor.root.innerHTML : '';
    const tags = elements.postTags.value.split(',').map(tag => tag.trim()).filter(tag => tag);
    const excerpt = elements.postExcerpt.value;

    const previewHtml = `
        <h1>${escapeHtml(title)}</h1>
        <div class="preview-meta">
            <span>📅 ${new Date().toLocaleDateString('tr-TR')}</span>
            <span>👁️ 0 görüntülenme</span>
            <span>⏱️ ${elements.readTime.textContent} okuma</span>
        </div>
        ${excerpt ? `<div class="preview-excerpt"><strong>Özet:</strong> ${escapeHtml(excerpt)}</div>` : ''}
        ${tags.length ? `<div class="preview-tags">${tags.map(tag => `<span class="preview-tag">${escapeHtml(tag)}</span>`).join('')}</div>` : ''}
        <hr style="margin: 2rem 0; border: none; height: 2px; background: var(--border-color);">
        <div class="preview-content-body">${content}</div>
    `;

    elements.previewContent.innerHTML = previewHtml;
    elements.previewModal.classList.add('show');

    // Highlight.js ile kod bloklarını vurgula
    if (typeof hljs !== 'undefined') {
        elements.previewContent.querySelectorAll('pre code').forEach((block) => {
            hljs.highlightElement(block);
        });
    }
}

// Öne çıkan görsel yükleme
function handleFeaturedImageUpload(e) {
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

    // Kırpma modalını aç
    const reader = new FileReader();
    reader.onload = function (e) {
        elements.cropImage.src = e.target.result;
        elements.imageCropModal.classList.add('show');

        // Cropper'ı başlat
        if (cropperInstance) {
            cropperInstance.destroy();
        }

        cropperInstance = new Cropper(elements.cropImage, {
            aspectRatio: 16 / 9,
            viewMode: 2,
            dragMode: 'move',
            autoCropArea: 1,
            cropBoxMovable: true,
            cropBoxResizable: true,
            toggleDragModeOnDblclick: false,
            responsive: true,
            restore: false,
            checkCrossOrigin: false,
            checkOrientation: false,
            modal: true,
            guides: true,
            center: true,
            highlight: true,
            background: true,
            rotatable: true,
            scalable: true,
            zoomable: true,
            zoomOnTouch: true,
            zoomOnWheel: true,
            wheelZoomRatio: 0.1,
            cropBoxData: null,
            canvasData: null,
        });
    };
    reader.readAsDataURL(file);
}

// Kırpma modal kapat
function closeCropModal() {
    elements.imageCropModal.classList.remove('show');
    if (cropperInstance) {
        cropperInstance.destroy();
        cropperInstance = null;
    }
    // Input'u temizle
    elements.featuredImageInput.value = '';
}

// Kırpma uygula
async function applyCrop() {
    if (!cropperInstance) return;

    try {
        showLoading(true);

        // Kırpılmış resmi al
        const canvas = cropperInstance.getCroppedCanvas({
            width: 1200,
            height: 675,
            imageSmoothingQuality: 'high'
        });

        // Canvas'ı blob'a çevir
        canvas.toBlob(async (blob) => {
            try {
                // Dosyayı yükle
                const formData = new FormData();
                formData.append('image', blob, 'featured-image.jpg');

                const response = await fetch(`${API_BASE}/api/upload`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${authToken}`
                    },
                    body: formData
                });

                if (!response.ok) throw new Error('Yükleme başarısız');

                const data = await response.json();
                currentPost.featuredImage = data.path;

                showFeaturedImage(data.path);
                closeCropModal();
                isDirty = true;

                showNotification('Öne çıkan görsel yüklendi!', 'success');

            } catch (error) {
                console.error('Görsel yükleme hatası:', error);
                showNotification('Görsel yüklenemedi: ' + error.message, 'error');
            } finally {
                showLoading(false);
            }
        }, 'image/jpeg', 0.9);

    } catch (error) {
        console.error('Kırpma hatası:', error);
        showNotification('Görsel işlenemedi', 'error');
        showLoading(false);
    }
}

// Öne çıkan görseli göster
function showFeaturedImage(imagePath) {
    elements.featuredImageArea.innerHTML = `
        <div class="image-preview">
            <img src="${imagePath}" alt="Öne çıkan görsel">
            <div class="image-actions">
                <button class="btn-edit" onclick="editFeaturedImage()">Değiştir</button>
                <button class="btn-remove" onclick="removeFeaturedImage()">Kaldır</button>
            </div>
        </div>
    `;
}

// Öne çıkan görseli düzenle
window.editFeaturedImage = function () {
    elements.featuredImageInput.click();
};

// Öne çıkan görseli kaldır
window.removeFeaturedImage = function () {
    if (confirm('Öne çıkan görseli kaldırmak istediğinizden emin misiniz?')) {
        currentPost.featuredImage = null;
        elements.featuredImageArea.innerHTML = `
            <div class="image-placeholder">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                    <polyline points="21 15 16 10 5 21"></polyline>
                </svg>
                <p>Görsel yüklemek için tıklayın</p>
                <small>JPG, PNG, GIF (Max 5MB)</small>
            </div>
        `;
        isDirty = true;
        showNotification('Öne çıkan görsel kaldırıldı', 'info');
    }
};

// Klavye kısayolları
function handleKeyboardShortcuts(e) {
    // Ctrl+S - Kaydet
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        savePost();
    }

    // Ctrl+Shift+P - Önizleme
    if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        showPreview();
    }

    // ESC - Modal kapat
    if (e.key === 'Escape') {
        if (elements.previewModal.classList.contains('show')) {
            elements.previewModal.classList.remove('show');
        }
        if (elements.imageCropModal.classList.contains('show')) {
            closeCropModal();
        }
    }
}

// Geri dön
function handleBack() {
    if (isDirty) {
        if (confirm('Kaydedilmemiş değişiklikler var. Çıkmak istediğinizden emin misiniz?')) {
            window.location.href = '/admin';
        }
    } else {
        window.location.href = '/admin';
    }
}

// Sayfa kapatma uyarısı
function handleBeforeUnload(e) {
    if (isDirty) {
        const message = 'Kaydedilmemiş değişiklikler var. Sayfayı kapatmak istediğinizden emin misiniz?';
        e.returnValue = message;
        return message;
    }
}

// Yardımcı fonksiyonlar
function showLoading(show) {
    elements.loadingOverlay.style.display = show ? 'flex' : 'none';
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 2rem;
        background: ${type === 'success' ? '#48BB78' : type === 'error' ? '#F56565' : type === 'info' ? '#4299E1' : '#ED8936'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 9999;
        animation: slideIn 0.3s ease;
        max-width: 400px;
        word-wrap: break-word;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

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

.modal.show {
    display: flex;
}

.btn-edit {
    background: var(--primary-color);
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.9rem;
    transition: all 0.3s ease;
}

.btn-edit:hover {
    background: #5a62e6;
}

.btn-remove {
    background: #F56565;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.9rem;
    transition: all 0.3s ease;
}

.btn-remove:hover {
    background: #E53E3E;
}

/* Quill Snow Theme Overrides */
.ql-snow .ql-tooltip {
    background: white;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.ql-snow .ql-tooltip input[type=text] {
    border: 1px solid var(--border-color);
    border-radius: 4px;
    padding: 0.5rem;
}

.ql-snow .ql-tooltip a.ql-action,
.ql-snow .ql-tooltip a.ql-remove {
    background: var(--primary-color);
    color: white;
    border-radius: 4px;
    padding: 0.25rem 0.5rem;
    text-decoration: none;
    margin-left: 0.5rem;
}

.ql-snow .ql-tooltip a.ql-remove {
    background: #F56565;
}

/* Loading spinner */
.loading-spinner {
    width: 40px;
    height: 40px;
    border: 4px solid var(--border-color);
    border-top-color: var(--primary-color);
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

/* Preview modal scrollbar */
.modal-preview .modal-body::-webkit-scrollbar {
    width: 8px;
}

.modal-preview .modal-body::-webkit-scrollbar-track {
    background: #f1f1f1;
}

.modal-preview .modal-body::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 4px;
}

.modal-preview .modal-body::-webkit-scrollbar-thumb:hover {
    background: #555;
}
`;
document.head.appendChild(style);

// Temizlik
window.addEventListener('beforeunload', () => {
    if (autosaveTimer) {
        clearInterval(autosaveTimer);
    }
    if (quillEditor) {
        // Quill otomatik temizlik yapıyor
    }
    if (cropperInstance) {
        cropperInstance.destroy();
    }
});