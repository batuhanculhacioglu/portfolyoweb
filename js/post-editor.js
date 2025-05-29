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

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', async () => {
    if (!checkAuth()) return;

    const params = new URLSearchParams(window.location.search);
    editingPostId = params.get('id');

    setupEventListeners();
    await initializeTinyMCE();

    if (editingPostId) {
        await loadPost(editingPostId);
        saveBtnText.textContent = 'Güncelle';
        publishBtn.style.display = 'block';
    }

    startAutoSave();
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
            plugins: [
                'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                'insertdatetime', 'media', 'table', 'help', 'wordcount', 'emoticons',
                'template', 'codesample', 'pagebreak', 'nonbreaking', 'quickbars',
                'save', 'autosave', 'directionality'
            ],
            toolbar: [
                'undo redo | blocks fontsize | bold italic underline strikethrough | forecolor backcolor | align lineheight',
                'numlist bullist indent outdent | link image media table codesample | charmap emoticons | fullscreen preview code help'
            ],
            quickbars_selection_toolbar: 'bold italic | quicklink h2 h3 blockquote',
            quickbars_insert_toolbar: 'quickimage quicktable',
            contextmenu: 'link image table',
            font_size_formats: '8pt 10pt 12pt 14pt 16pt 18pt 24pt 36pt 48pt',
            block_formats: 'Paragraf=p; Başlık 1=h1; Başlık 2=h2; Başlık 3=h3; Başlık 4=h4; Başlık 5=h5; Başlık 6=h6; Kod=pre',
            image_advtab: true,
            image_caption: true,
            image_title: true,
            image_class_list: [
                { title: 'Normal', value: '' },
                { title: 'Sol hizala', value: 'img-left' },
                { title: 'Sağ hizala', value: 'img-right' },
                { title: 'Ortala', value: 'img-center' }
            ],
            table_responsive_width: true,
            table_default_attributes: { border: '1' },
            table_default_styles: { 'border-collapse': 'collapse', width: '100%' },
            link_assume_external_targets: true,
            link_context_toolbar: true,
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
            menubar: false,
            branding: false,
            statusbar: true,
            elementpath: false,
            resize: false,
            autosave_ask_before_unload: false,
            autosave_interval: '30s',
            autosave_restore_when_empty: false,
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
            paste_data_images: true,
            paste_as_text: false,
            smart_paste: true,
            setup: function (ed) {
                editor = ed;

                ed.on('init', function () {
                    console.log('TinyMCE initialized');
                    isEditorReady = true;

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
    if (file.size > 5 * 1024 * 1024) {
        UTILS.showNotification('Dosya boyutu 5MB\'dan küçük olmalıdır', 'error');
        return;
    }

    const formData = new FormData();
    formData.append('image', file);

    try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/api/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
            },
            body: formData
        });

        if (response.ok) {
            const data = await response.json();
            callback(data.path, { alt: file.name });
            UTILS.showNotification('Dosya yüklendi!', 'success');
        } else {
            throw new Error('Yükleme başarısız');
        }
    } catch (error) {
        console.error('Dosya yükleme hatası:', error);
        UTILS.showNotification('Dosya yüklenemedi', 'error');
    }
}

// Event listener'ları kur
function setupEventListeners() {
    backBtn.addEventListener('click', () => {
        if (saveStatus.textContent === 'Kaydedilmedi') {
            if (confirm('Kaydedilmemiş değişiklikler var. Çıkmak istediğinizden emin misiniz?')) {
                window.location.href = '/admin';
            }
        } else {
            window.location.href = '/admin';
        }
    });

    saveBtn.addEventListener('click', savePost);
    previewBtn.addEventListener('click', showPreview);
    publishBtn.addEventListener('click', publishPost);

    closePreview.addEventListener('click', () => {
        previewModal.classList.remove('show');
    });

    previewModal.addEventListener('click', (e) => {
        if (e.target === previewModal) {
            previewModal.classList.remove('show');
        }
    });

    postTitle.addEventListener('input', (e) => {
        generateSlug(e.target.value);
        setSaveStatus('unsaved');
    });

    postExcerpt.addEventListener('input', (e) => {
        const count = e.target.value.length;
        excerptCount.textContent = count;
        excerptCount.className = count > 160 ? 'char-limit-warning' : '';
        setSaveStatus('unsaved');
    });

    [postTags, postSlug, postStatus].forEach(element => {
        element.addEventListener('input', () => setSaveStatus('unsaved'));
        element.addEventListener('change', () => setSaveStatus('unsaved'));
    });

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

        const response = await fetch(`${API_CONFIG.BASE_URL}/api/posts/${postId}`);

        if (response.ok) {
            currentPost = await response.json();
            console.log('Post loaded:', currentPost.title);
            populateForm();
        } else {
            const errorText = await response.text();
            console.error('Failed to load post:', response.status, errorText);
            UTILS.showNotification('Gönderi yüklenemedi: ' + response.status, 'error');
        }
    } catch (error) {
        console.error('Gönderi yükleme hatası:', error);
        UTILS.showNotification('Gönderi yüklenemedi: ' + error.message, 'error');
    }
}

// Formu doldur - Düzeltilmiş
function populateForm() {
    if (!currentPost) {
        console.log('No current post to populate');
        return;
    }

    console.log('Populating form with:', currentPost.title);

    postTitle.value = currentPost.title || '';
    postTags.value = currentPost.tags ? currentPost.tags.join(', ') : '';
    postExcerpt.value = currentPost.summary || '';
    postSlug.value = currentPost.slug || generateSlug(currentPost.title) || '';
    postStatus.value = currentPost.status || 'draft';

    postTitle.style.height = 'auto';
    postTitle.style.height = postTitle.scrollHeight + 'px';

    if (isEditorReady && editor) {
        console.log('Setting editor content immediately');
        editor.setContent(currentPost.content || '');
    } else {
        console.log('Editor not ready, content will be set when ready');
    }

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

    for (let char in turkishChars) {
        slug = slug.replace(new RegExp(char, 'g'), turkishChars[char]);
    }

    slug = slug
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 50);

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
    const readingTime = Math.max(1, Math.ceil(words / 175));

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
    }, 30000);
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
    if (!postTitle.value.trim()) {
        if (!isAutoSave) {
            UTILS.showNotification('Başlık gereklidir', 'error');
            postTitle.focus();
        }
        return;
    }

    if (!postExcerpt.value.trim()) {
        if (!isAutoSave) {
            UTILS.showNotification('Özet gereklidir', 'error');
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
            ? `${API_CONFIG.BASE_URL}/api/posts/${editingPostId}`
            : `${API_CONFIG.BASE_URL}/api/posts`;
        const method = editingPostId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method,
            headers: API_CONFIG.getAuthHeaders(),
            body: JSON.stringify(postData)
        });

        if (response.ok) {
            const savedPost = await response.json();
            currentPost = savedPost;

            if (!editingPostId) {
                editingPostId = savedPost.id;
                saveBtnText.textContent = 'Güncelle';
                publishBtn.style.display = 'block';
                history.replaceState({}, '', `/post-editor?id=${savedPost.id}`);
            }

            setSaveStatus('saved');

            if (!isAutoSave) {
                UTILS.showNotification('Gönderi kaydedildi!', 'success');
            }
        } else {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Kaydetme başarısız');
        }
    } catch (error) {
        console.error('Kaydetme hatası:', error);
        setSaveStatus('error');

        if (!isAutoSave) {
            UTILS.showNotification(`Gönderi kaydedilemedi: ${error.message}`, 'error');
        }
    } finally {
        if (!isAutoSave) {
            loadingOverlay.classList.remove('show');
        }
    }
}

// Gönderiyi yayınla
async function publishPost() {
    if (!postTitle.value.trim() || !postExcerpt.value.trim()) {
        UTILS.showNotification('Başlık ve özet gereklidir', 'error');
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
        UTILS.showNotification('Gönderi yayınlandı!', 'success');

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
        UTILS.showNotification('Editör henüz hazır değil', 'warning');
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

    previewContent.innerHTML = `
        <article class="preview-content">
            <header style="margin-bottom: 3rem; padding-bottom: 2rem; border-bottom: 2px solid #E2E8F0;">
                <h1 style="font-size: 2.5rem; font-weight: 700; margin-bottom: 1rem; color: #2D3748; line-height: 1.2;">
                    ${UTILS.escapeHtml(title)}
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
                            ${UTILS.escapeHtml(excerpt)}
                        </p>
                    </div>
                ` : ''}

                ${tags.length > 0 ? `
                    <div class="preview-tags">
                        ${tags.map(tag => `
                            <span class="preview-tag">#${UTILS.escapeHtml(tag)}</span>
                        `).join('')}
                    </div>
                ` : ''}
            </header>

            <div class="preview-content-body">
                ${content || '<p style="color: #718096; font-style: italic;">İçerik henüz yazılmamış...</p>'}
            </div>

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

// Performance monitoring (development only)
if (window.location.hostname === 'localhost') {
    window.addEventListener('load', () => {
        setTimeout(() => {
            const loadTime = performance.now();
            console.log(`Post editor loaded in ${loadTime.toFixed(2)}ms`);
        }, 100);
    });
}