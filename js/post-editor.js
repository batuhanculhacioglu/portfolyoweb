// post-editor.js - Düzeltilmiş Post Editörü

// Global değişkenler
let editor = null;
let currentPost = null;
let editingPostId = null;
let autoSaveInterval = null;
let authToken = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
let isEditorReady = false;

// DOM elementleri
const backBtn = document.getElementById('backBtn');
const saveBtn = document.getElementById('saveBtn');
const previewBtn = document.getElementById('previewBtn');
const publishBtn = document.getElementById('publishBtn');
const postTitle = document.getElementById('postTitle');
const postTags = document.getElementById('postTags');
const postExcerpt = document.getElementById('postExcerpt');
const postSlug = document.getElementById('postSlug');
const postStatus = document.getElementById('postStatus');
const saveStatus = document.getElementById('saveStatus');
const saveBtnText = document.getElementById('saveBtnText');
const previewModal = document.getElementById('previewModal');
const previewContent = document.getElementById('previewContent');
const closePreview = document.getElementById('closePreview');
const loadingOverlay = document.getElementById('loadingOverlay');
const autosaveIndicator = document.getElementById('autosaveIndicator');
const excerptCount = document.getElementById('excerptCount');
const wordCount = document.getElementById('wordCount');
const charCount = document.getElementById('charCount');
const readTime = document.getElementById('readTime');

// Auth kontrolü
function checkAuth() {
    if (!authToken) {
        window.location.href = '/login';
        return false;
    }
    return true;
}

// API istekleri için header
function getAuthHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
    };
}

// API Base URL'ini belirle
function getApiBase() {
    return window.location.origin.includes('localhost')
        ? 'http://localhost:3001'
        : window.location.origin;
}

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', async () => {
    if (!checkAuth()) return;

    // URL'den düzenleme modunu kontrol et
    const params = new URLSearchParams(window.location.search);
    editingPostId = params.get('id');

    // Event listener'ları kur
    setupEventListeners();

    // TinyMCE'yi başlat
    await initializeTinyMCE();

    // Düzenleme modunda gönderiyi yükle
    if (editingPostId) {
        await loadPost(editingPostId);
        saveBtnText.textContent = 'Güncelle';
        publishBtn.style.display = 'block';
    }

    // Auto-save'i başlat
    startAutoSave();

    // Title textarea auto-resize
    setupTitleAutoResize();
});

// Title auto-resize
function setupTitleAutoResize() {
    postTitle.addEventListener('input', function () {
        this.style.height = 'auto';
        this.style.height = this.scrollHeight + 'px';
    });
}

// TinyMCE Başlatma - Düzeltilmiş
async function initializeTinyMCE() {
    return new Promise((resolve, reject) => {
        tinymce.init({
            selector: '#editor',
            height: '100%',

            // Temel plugin'ler
            plugins: [
                'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                'insertdatetime', 'media', 'table', 'help', 'wordcount', 'emoticons',
                'template', 'codesample', 'pagebreak', 'nonbreaking', 'quickbars',
                'save', 'autosave', 'directionality'
            ],

            // Toolbar - 2 satır
            toolbar: [
                'undo redo | blocks fontsize | bold italic underline strikethrough | forecolor backcolor | align lineheight',
                'numlist bullist indent outdent | link image media table codesample | charmap emoticons | fullscreen preview code help'
            ],

            // Hızlı araçlar
            quickbars_selection_toolbar: 'bold italic | quicklink h2 h3 blockquote',
            quickbars_insert_toolbar: 'quickimage quicktable',
            contextmenu: 'link image table',

            // Font ayarları
            font_size_formats: '8pt 10pt 12pt 14pt 16pt 18pt 24pt 36pt 48pt',

            // Blok formatları
            block_formats: 'Paragraf=p; Başlık 1=h1; Başlık 2=h2; Başlık 3=h3; Başlık 4=h4; Başlık 5=h5; Başlık 6=h6; Kod=pre',

            // Resim özellikleri
            image_advtab: true,
            image_caption: true,
            image_title: true,
            image_class_list: [
                { title: 'Normal', value: '' },
                { title: 'Sol hizala', value: 'img-left' },
                { title: 'Sağ hizala', value: 'img-right' },
                { title: 'Ortala', value: 'img-center' }
            ],

            // Tablo özellikleri
            table_responsive_width: true,
            table_default_attributes: { border: '1' },
            table_default_styles: { 'border-collapse': 'collapse', width: '100%' },

            // Link özellikleri
            link_assume_external_targets: true,
            link_context_toolbar: true,

            // Code sample dilleri - embedded odaklı
            codesample_languages: [
                { text: 'HTML/XML', value: 'markup' },
                { text: 'JavaScript', value: 'javascript' },
                { text: 'CSS', value: 'css' },
                { text: 'Python', value: 'python' },
                { text: 'C', value: 'c' },
                { text: 'C++', value: 'cpp' },
                { text: 'Arduino', value: 'arduino' },
                { text: 'JSON', value: 'json' },
                { text: 'Bash', value: 'bash' }
            ],

            // Content style
            content_style: `
                body { 
                    font-family: Inter, -apple-system, BlinkMacSystemFont, sans-serif; 
                    font-size: 16px; 
                    line-height: 1.7; 
                    color: #2D3748;
                    padding: 20px;
                    max-width: none;
                }
                h1, h2, h3, h4, h5, h6 { 
                    font-weight: 600; 
                    margin-top: 2rem; 
                    margin-bottom: 1rem; 
                    line-height: 1.2;
                }
                h1 { font-size: 2.5rem; }
                h2 { font-size: 2rem; }
                h3 { font-size: 1.75rem; }
                p { margin-bottom: 1.5rem; }
                img { 
                    max-width: 100%; 
                    height: auto; 
                    border-radius: 8px; 
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                }
                .img-left { float: left; margin: 0 1.5rem 1rem 0; }
                .img-right { float: right; margin: 0 0 1rem 1.5rem; }
                .img-center { display: block; margin: 2rem auto; }
                blockquote { 
                    border-left: 4px solid #6B73FF; 
                    padding-left: 1.5rem; 
                    margin: 2rem 0; 
                    font-style: italic; 
                    background: #F8F5F2; 
                    padding: 1.5rem 2rem; 
                    border-radius: 8px; 
                }
                code { 
                    background: #f1f3f4; 
                    padding: 0.2rem 0.4rem; 
                    border-radius: 4px; 
                    font-family: 'Courier New', monospace; 
                }
                pre { 
                    background: #2d2d2d; 
                    color: #f8f8f2; 
                    padding: 1.5rem; 
                    border-radius: 8px; 
                    overflow-x: auto; 
                    margin: 2rem 0; 
                }
                table { 
                    border-collapse: collapse; 
                    width: 100%; 
                    margin: 2rem 0; 
                    background: white; 
                    border-radius: 8px; 
                    overflow: hidden; 
                }
                table th, table td { 
                    padding: 0.75rem; 
                    text-align: left; 
                    border-bottom: 1px solid #E2E8F0; 
                }
                table th { 
                    background: #F8F5F2; 
                    font-weight: 600; 
                }
                a { color: #6B73FF; text-decoration: none; }
                a:hover { text-decoration: underline; }
            `,

            // Diğer ayarlar
            menubar: false,
            branding: false,
            statusbar: true,
            elementpath: false,
            resize: false,

            // Auto save
            autosave_ask_before_unload: false,
            autosave_interval: '30s',
            autosave_restore_when_empty: false,

            // File picker
            file_picker_callback: function (cb, value, meta) {
                const input = document.createElement('input');
                input.setAttribute('type', 'file');
                input.setAttribute('accept', meta.filetype === 'image' ? 'image/*' : '*/*');

                input.onchange = function () {
                    const file = this.files[0];
                    if (file) {
                        uploadFile(file, cb);
                    }
                };

                input.click();
            },

            // Paste işlemleri
            paste_data_images: true,
            paste_as_text: false,
            smart_paste: true,

            // Setup callback - Düzeltilmiş
            setup: function (ed) {
                editor = ed;

                ed.on('init', function () {
                    console.log('TinyMCE initialized');
                    isEditorReady = true;

                    // Eğer önceden yüklenmiş içerik varsa, şimdi set et
                    if (currentPost && currentPost.content) {
                        console.log('Setting content after init:', currentPost.title);
                        ed.setContent(currentPost.content);
                    }

                    updateStats();
                    resolve();
                });

                ed.on('input keyup', function () {
                    updateStats();
                    setSaveStatus('unsaved');
                });

                ed.on('paste', function () {
                    setTimeout(updateStats, 100);
                    setSaveStatus('unsaved');
                });

                ed.on('change', function () {
                    updateStats();
                    setSaveStatus('unsaved');
                });
            },

            // Error handler
            init_instance_callback: function (editor) {
                console.log('Editor initialized: ' + editor.id);
            }
        }).catch(error => {
            console.error('TinyMCE initialization error:', error);
            reject(error);
        });
    });
}

// Dosya yükleme fonksiyonu
async function uploadFile(file, callback) {
    // Dosya boyutu kontrolü (5MB)
    if (file.size > 5 * 1024 * 1024) {
        showNotification('Dosya boyutu 5MB\'dan küçük olmalıdır', 'error');
        return;
    }

    const formData = new FormData();
    formData.append('image', file);

    try {
        const response = await fetch(`${getApiBase()}/api/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
            },
            body: formData
        });

        if (response.ok) {
            const data = await response.json();
            callback(data.path, { alt: file.name });
            showNotification('Dosya yüklendi!', 'success');
        } else {
            throw new Error('Yükleme başarısız');
        }
    } catch (error) {
        console.error('Dosya yükleme hatası:', error);
        showNotification('Dosya yüklenemedi', 'error');
    }
}

// Event listener'ları kur
function setupEventListeners() {
    // Geri butonu
    backBtn.addEventListener('click', () => {
        if (saveStatus.textContent === 'Kaydedilmedi') {
            if (confirm('Kaydedilmemiş değişiklikler var. Çıkmak istediğinizden emin misiniz?')) {
                window.location.href = '/admin';
            }
        } else {
            window.location.href = '/admin';
        }
    });

    // Kaydet butonu
    saveBtn.addEventListener('click', savePost);

    // Önizleme butonu
    previewBtn.addEventListener('click', showPreview);

    // Yayınla butonu
    publishBtn.addEventListener('click', publishPost);

    // Modal kapatma
    closePreview.addEventListener('click', () => {
        previewModal.classList.remove('show');
    });

    previewModal.addEventListener('click', (e) => {
        if (e.target === previewModal) {
            previewModal.classList.remove('show');
        }
    });

    // Başlık değişimi
    postTitle.addEventListener('input', (e) => {
        generateSlug(e.target.value);
        setSaveStatus('unsaved');
    });

    // Özet karakter sayısı
    postExcerpt.addEventListener('input', (e) => {
        const count = e.target.value.length;
        excerptCount.textContent = count;
        excerptCount.className = count > 160 ? 'char-limit-warning' : '';
        setSaveStatus('unsaved');
    });

    // Diğer form elemanları
    [postTags, postSlug, postStatus].forEach(element => {
        element.addEventListener('input', () => setSaveStatus('unsaved'));
        element.addEventListener('change', () => setSaveStatus('unsaved'));
    });

    // Klavye kısayolları
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey || e.metaKey) {
            if (e.key === 's') {
                e.preventDefault();
                savePost();
            } else if (e.key === 'p') {
                e.preventDefault();
                showPreview();
            }
        }

        if (e.key === 'Escape') {
            previewModal.classList.remove('show');
        }
    });
}

// Mevcut gönderiyi yükle - Düzeltilmiş
async function loadPost(postId) {
    try {
        console.log('Loading post:', postId);

        const response = await fetch(`${getApiBase()}/api/posts/${postId}`);

        if (response.ok) {
            currentPost = await response.json();
            console.log('Post loaded:', currentPost.title);

            // Formu doldur
            populateForm();
        } else {
            const errorText = await response.text();
            console.error('Failed to load post:', response.status, errorText);
            showNotification('Gönderi yüklenemedi: ' + response.status, 'error');
        }
    } catch (error) {
        console.error('Gönderi yükleme hatası:', error);
        showNotification('Gönderi yüklenemedi: ' + error.message, 'error');
    }
}

// Formu doldur - Düzeltilmiş
function populateForm() {
    if (!currentPost) {
        console.log('No current post to populate');
        return;
    }

    console.log('Populating form with:', currentPost.title);

    // Form alanlarını doldur
    postTitle.value = currentPost.title || '';
    postTags.value = currentPost.tags ? currentPost.tags.join(', ') : '';
    postExcerpt.value = currentPost.summary || '';
    postSlug.value = currentPost.slug || generateSlug(currentPost.title) || '';
    postStatus.value = currentPost.status || 'draft';

    // Title auto-resize
    postTitle.style.height = 'auto';
    postTitle.style.height = postTitle.scrollHeight + 'px';

    // TinyMCE içeriğini ayarla - Editör hazır olana kadar bekle
    if (isEditorReady && editor) {
        console.log('Setting editor content immediately');
        editor.setContent(currentPost.content || '');
    } else {
        console.log('Editor not ready, content will be set when ready');
        // İçerik editör hazır olduğunda setup callback'inde set edilecek
    }

    // Özet karakterini güncelle
    const excerptLength = (currentPost.summary || '').length;
    excerptCount.textContent = excerptLength;
    excerptCount.className = excerptLength > 160 ? 'char-limit-warning' : '';

    setSaveStatus('saved');
    updateStats();
}

// URL slug oluştur
function generateSlug(title) {
    if (!title) return '';

    const turkishChars = {
        'ç': 'c', 'Ç': 'C', 'ğ': 'g', 'Ğ': 'G',
        'ı': 'i', 'I': 'I', 'İ': 'i', 'ş': 's',
        'Ş': 'S', 'ü': 'u', 'Ü': 'U', 'ö': 'o', 'Ö': 'O'
    };

    let slug = title.toLowerCase();

    // Türkçe karakterleri değiştir
    for (let char in turkishChars) {
        slug = slug.replace(new RegExp(char, 'g'), turkishChars[char]);
    }

    slug = slug
        .replace(/[^a-z0-9\s-]/g, '') // Özel karakterleri kaldır
        .replace(/\s+/g, '-') // Boşlukları tire ile değiştir
        .replace(/-+/g, '-') // Çoklu tireleri tek tire yap
        .replace(/^-|-$/g, '') // Başlangıç ve bitiş tirelerini kaldır
        .substring(0, 50); // Maksimum 50 karakter

    if (postSlug) {
        postSlug.value = slug;
    }
    return slug;
}

// İstatistikleri güncelle
function updateStats() {
    if (!editor || !isEditorReady) return;

    const content = editor.getContent({ format: 'text' });
    const words = content.trim().split(/\s+/).filter(word => word.length > 0).length;
    const chars = content.length;
    const readingTime = Math.max(1, Math.ceil(words / 175)); // 175 kelime/dakika

    wordCount.textContent = words.toLocaleString('tr-TR');
    charCount.textContent = chars.toLocaleString('tr-TR');
    readTime.textContent = `${readingTime} dk`;
}

// Kaydet durumunu ayarla
function setSaveStatus(status) {
    const statusElement = document.getElementById('saveStatus');
    if (!statusElement) return;

    statusElement.className = `save-status ${status}`;

    const statusTexts = {
        'saving': 'Kaydediliyor...',
        'saved': 'Kaydedildi',
        'unsaved': 'Kaydedilmedi',
        'error': 'Hata!'
    };

    statusElement.textContent = statusTexts[status] || status;

    // Save butonunu güncelle
    if (saveBtn) {
        saveBtn.disabled = status === 'saving';
    }
}

// Auto-save başlat
function startAutoSave() {
    if (autoSaveInterval) {
        clearInterval(autoSaveInterval);
    }

    autoSaveInterval = setInterval(() => {
        const statusText = document.getElementById('saveStatus')?.textContent;
        if (statusText === 'Kaydedilmedi' && postTitle.value.trim()) {
            autoSave();
        }
    }, 30000); // 30 saniye
}

// Otomatik kaydet
async function autoSave() {
    if (!postTitle.value.trim()) return;

    const indicator = document.getElementById('autosaveIndicator');
    if (indicator) {
        indicator.classList.add('show');
    }

    try {
        await savePost(true);
        setTimeout(() => {
            if (indicator) {
                indicator.classList.remove('show');
            }
        }, 2000);
    } catch (error) {
        if (indicator) {
            indicator.classList.remove('show');
        }
        console.error('Auto-save hatası:', error);
    }
}

// Gönderiyi kaydet - Düzeltilmiş
async function savePost(isAutoSave = false) {
    // Validasyon
    if (!postTitle.value.trim()) {
        if (!isAutoSave) {
            showNotification('Başlık gereklidir', 'error');
            postTitle.focus();
        }
        return;
    }

    if (!postExcerpt.value.trim()) {
        if (!isAutoSave) {
            showNotification('Özet gereklidir', 'error');
            postExcerpt.focus();
        }
        return;
    }

    if (!isAutoSave) {
        setSaveStatus('saving');
        loadingOverlay.classList.add('show');
    }

    const postData = {
        title: postTitle.value.trim(),
        summary: postExcerpt.value.trim(),
        content: editor && isEditorReady ? editor.getContent() : '',
        tags: postTags.value.split(',').map(tag => tag.trim()).filter(tag => tag),
        status: postStatus.value,
        slug: postSlug.value.trim() || generateSlug(postTitle.value)
    };

    try {
        const url = editingPostId
            ? `${getApiBase()}/api/posts/${editingPostId}`
            : `${getApiBase()}/api/posts`;
        const method = editingPostId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method,
            headers: getAuthHeaders(),
            body: JSON.stringify(postData)
        });

        if (response.ok) {
            const savedPost = await response.json();
            currentPost = savedPost;

            if (!editingPostId) {
                editingPostId = savedPost.id;
                saveBtnText.textContent = 'Güncelle';
                publishBtn.style.display = 'block';
                // URL'yi güncelle
                history.replaceState({}, '', `/post-editor?id=${savedPost.id}`);
            }

            setSaveStatus('saved');

            if (!isAutoSave) {
                showNotification('Gönderi kaydedildi!', 'success');
            }
        } else {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Kaydetme başarısız');
        }
    } catch (error) {
        console.error('Kaydetme hatası:', error);
        setSaveStatus('error');

        if (!isAutoSave) {
            showNotification(`Gönderi kaydedilemedi: ${error.message}`, 'error');
        }
    } finally {
        if (!isAutoSave) {
            loadingOverlay.classList.remove('show');
        }
    }
}

// Gönderiyi yayınla
async function publishPost() {
    // Validasyon
    if (!postTitle.value.trim() || !postExcerpt.value.trim()) {
        showNotification('Başlık ve özet gereklidir', 'error');
        return;
    }

    const wordCountNum = parseInt(wordCount.textContent.replace(/\./g, ''));
    if (wordCountNum < 100) {
        if (!confirm('Yazı çok kısa görünüyor (100 kelimeden az). Yayınlamak istediğinizden emin misiniz?')) {
            return;
        }
    }

    postStatus.value = 'published';
    await savePost();

    if (currentPost && currentPost.id) {
        showNotification('Gönderi yayınlandı!', 'success');

        // Yayınlanan yazıyı görmek ister misiniz?
        setTimeout(() => {
            if (confirm('Yayınlanan yazıyı görüntülemek ister misiniz?')) {
                window.open(`/post/${currentPost.id}`, '_blank');
            }
        }, 1000);
    }
}

// Önizleme göster - Düzeltilmiş
function showPreview() {
    if (!editor || !isEditorReady) {
        showNotification('Editör henüz hazır değil', 'warning');
        return;
    }

    const title = postTitle.value || 'Başlıksız Yazı';
    const content = editor.getContent();
    const tags = postTags.value.split(',').map(tag => tag.trim()).filter(tag => tag);
    const excerpt = postExcerpt.value;
    const currentDate = new Date().toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // Önizleme içeriğini oluştur
    previewContent.innerHTML = `
        <article class="preview-content">
            <!-- Başlık ve Meta Bilgiler -->
            <header style="margin-bottom: 3rem; padding-bottom: 2rem; border-bottom: 2px solid #E2E8F0;">
                <h1 style="font-size: 2.5rem; font-weight: 700; margin-bottom: 1rem; color: #2D3748; line-height: 1.2;">
                    ${escapeHtml(title)}
                </h1>
                
                <div class="preview-meta">
                    <span style="display: flex; align-items: center; gap: 0.5rem;">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12,6 12,12 16,14"></polyline>
                        </svg>
                        ${currentDate}
                    </span>
                    <span style="display: flex; align-items: center; gap: 0.5rem;">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14,2 14,8 20,8"></polyline>
                        </svg>
                        ${wordCount.textContent} kelime
                    </span>
                    <span style="display: flex; align-items: center; gap: 0.5rem;">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12,6 12,12 16,14"></polyline>
                        </svg>
                        ${readTime.textContent} okuma
                    </span>
                    <span style="color: ${postStatus.value === 'published' ? '#48BB78' : '#F56565'}; font-weight: 500;">
                        ${postStatus.value === 'published' ? '✓ Yayında' : '⚠ Taslak'}
                    </span>
                </div>

                ${excerpt ? `
                    <div class="preview-excerpt">
                        <div style="font-weight: 600; color: #6B73FF; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.5rem;">
                            Özet
                        </div>
                        <p style="margin: 0; font-style: italic; font-size: 1.05rem; color: #4A5568;">
                            ${escapeHtml(excerpt)}
                        </p>
                    </div>
                ` : ''}

                ${tags.length > 0 ? `
                    <div class="preview-tags">
                        ${tags.map(tag => `
                            <span class="preview-tag">#${escapeHtml(tag)}</span>
                        `).join('')}
                    </div>
                ` : ''}
            </header>

            <!-- İçerik -->
            <div class="preview-content-body">
                ${content || '<p style="color: #718096; font-style: italic;">İçerik henüz yazılmamış...</p>'}
            </div>

            <!-- Footer -->
            <footer style="margin-top: 4rem; padding-top: 2rem; border-top: 1px solid #E2E8F0; color: #718096; font-size: 0.9rem;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span>Son güncelleme: ${new Date().toLocaleString('tr-TR')}</span>
                    <span>URL: /post/${editingPostId || 'yeni'}</span>
                </div>
            </footer>
        </article>
    `;

    previewModal.classList.add('show');
}

// Bildirim göster
function showNotification(message, type = 'info', duration = 3000) {
    // Mevcut bildirimleri temizle
    document.querySelectorAll('.notification').forEach(notif => notif.remove());

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;

    const icons = {
        success: '✓',
        error: '✗',
        warning: '⚠',
        info: 'ⓘ'
    };

    const colors = {
        success: '#48BB78',
        error: '#F56565',
        warning: '#ED8936',
        info: '#4299E1'
    };

    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.75rem;">
            <span style="
                display: flex;
                align-items: center;
                justify-content: center;
                width: 24px;
                height: 24px;
                background: rgba(255,255,255,0.2);
                border-radius: 50%;
                font-weight: bold;
            ">${icons[type] || icons.info}</span>
            <span>${message}</span>
        </div>
    `;

    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: ${colors[type] || colors.info};
        color: white;
        border-radius: 12px;
        box-shadow: 0 8px 25px rgba(0,0,0,0.15);
        z-index: 9999;
        animation: slideInNotification 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        font-family: Inter, sans-serif;
        font-size: 0.9rem;
        font-weight: 500;
        max-width: 350px;
        word-wrap: break-word;
        cursor: pointer;
    `;

    document.body.appendChild(notification);

    // Otomatik kaldırma
    setTimeout(() => {
        notification.style.animation = 'slideOutNotification 0.3s ease-in';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, duration);

    // Tıklayarak kapat
    notification.addEventListener('click', () => {
        notification.style.animation = 'slideOutNotification 0.3s ease-in';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    });
}

// HTML escape fonksiyonu
function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// Sayfa kapatılırken uyar
window.addEventListener('beforeunload', (e) => {
    const statusText = document.getElementById('saveStatus')?.textContent;
    if (statusText === 'Kaydedilmedi') {
        e.preventDefault();
        e.returnValue = 'Kaydedilmemiş değişiklikler var. Sayfayı kapatmak istediğinizden emin misiniz?';
        return e.returnValue;
    }
});

// Sayfa görünürlük değiştiğinde auto-save
document.addEventListener('visibilitychange', () => {
    if (document.hidden && document.getElementById('saveStatus')?.textContent === 'Kaydedilmedi') {
        autoSave();
    }
});

// Debounce fonksiyonu
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Animasyonlar için CSS ekleme
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInNotification {
        from {
            transform: translateX(100%) translateY(-50px);
            opacity: 0;
        }
        to {
            transform: translateX(0) translateY(0);
            opacity: 1;
        }
    }

    @keyframes slideOutNotification {
        from {
            transform: translateX(0) translateY(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%) translateY(-50px);
            opacity: 0;
        }
    }

    /* Title textarea auto-resize */
    .title-input {
        min-height: 60px;
        max-height: 200px;
        overflow-y: hidden;
        resize: none;
    }

    /* Custom scrollbar for preview */
    .modal-preview .modal-content {
        scrollbar-width: thin;
        scrollbar-color: #6B73FF #F1F3F4;
    }

    .modal-preview .modal-content::-webkit-scrollbar {
        width: 8px;
    }

    .modal-preview .modal-content::-webkit-scrollbar-track {
        background: #F1F3F4;
        border-radius: 4px;
    }

    .modal-preview .modal-content::-webkit-scrollbar-thumb {
        background: #6B73FF;
        border-radius: 4px;
    }

    .modal-preview .modal-content::-webkit-scrollbar-thumb:hover {
        background: #5a62e6;
    }
`;

document.head.appendChild(style);

// Performance monitoring (development only)
if (window.location.hostname === 'localhost') {
    window.addEventListener('load', () => {
        setTimeout(() => {
            const loadTime = performance.now();
            console.log(`Post editor loaded in ${loadTime.toFixed(2)}ms`);
        }, 100);
    });
}