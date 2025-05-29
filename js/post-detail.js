// post-detail.js - Düzeltilmiş Gönderi detay sayfası için JavaScript

// Global değişkenler
let currentPost = null;
let allPosts = [];

// DOM elementleri
const postLoading = document.getElementById('postLoading');
const postDetail = document.getElementById('postDetail');
const errorMessage = document.getElementById('errorMessage');
const postTitle = document.getElementById('postTitle');
const postDate = document.getElementById('postDate');
const postViews = document.getElementById('postViews');
const viewCount = document.getElementById('viewCount');
const postTags = document.getElementById('postTags');
const postContent = document.getElementById('postContent');
const relatedPosts = document.getElementById('relatedPosts');
const prevPostBtn = document.getElementById('prevPost');
const nextPostBtn = document.getElementById('nextPost');

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', async () => {
    const postId = getPostIdFromUrl();

    if (!postId) {
        showError();
        return;
    }

    await loadPost(postId);
    await loadAllPosts();
    setupNavigation();
});

// URL'den post ID'sini al
function getPostIdFromUrl() {
    // URL formatı: /post/123
    const pathParts = window.location.pathname.split('/');
    if (pathParts[1] === 'post' && pathParts[2]) {
        return pathParts[2];
    }

    // Eski format desteği: ?id=123
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

// Gönderiyi yükle
async function loadPost(postId) {
    try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/api/posts/${postId}`);

        if (!response.ok) {
            throw new Error('Gönderi bulunamadı');
        }

        currentPost = await response.json();
        displayPost();
        updateViewCount();
    } catch (error) {
        console.error('Gönderi yüklenirken hata:', error);
        showError();
    }
}

// Tüm gönderileri yükle (navigasyon için)
async function loadAllPosts() {
    try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/api/posts`);
        const data = await response.json();
        allPosts = data.posts || [];

        displayRelatedPosts();
    } catch (error) {
        console.error('Gönderiler yüklenirken hata:', error);
    }
}

// Gönderiyi göster
function displayPost() {
    // Başlık
    postTitle.textContent = currentPost.title;
    document.title = `${currentPost.title} - Portfolyo`;

    // Tarih
    const date = new Date(currentPost.date);
    postDate.textContent = date.toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // Görüntülenme
    viewCount.textContent = currentPost.views || 0;

    // Etiketler
    if (currentPost.tags && currentPost.tags.length > 0) {
        postTags.innerHTML = currentPost.tags.map(tag =>
            `<span class="post-tag">${UTILS.escapeHtml(tag)}</span>`
        ).join('');
    }

    // İçerik - TinyMCE HTML içeriğini direkt kullan
    if (currentPost.content) {
        // HTML içeriğini güvenli bir şekilde temizle ve resim yollarını düzelt
        let processedContent = processPostContent(currentPost.content);
        postContent.innerHTML = processedContent;
    } else {
        postContent.innerHTML = '<p>İçerik bulunamadı.</p>';
    }

    // Loading'i gizle, içeriği göster
    postLoading.style.display = 'none';
    postDetail.style.display = 'block';

    // Kod bloklarını highlight et (eğer Prism varsa)
    if (typeof Prism !== 'undefined') {
        setTimeout(() => {
            Prism.highlightAll();
        }, 100);
    }
}

// Post içeriğini işle ve resim yollarını düzelt
function processPostContent(content) {
    if (!content) return '<p>İçerik bulunamadı.</p>';

    // Sadece resim yollarını düzelt (TinyMCE zaten HTML üretiyor)
    return fixImagePaths(content);
}

// Resim yollarını düzelt
function fixImagePaths(content) {
    const API_BASE = API_CONFIG.BASE_URL;

    return content.replace(
        /<img([^>]*?)src=["']([^"']*?)["']([^>]*?)>/g,
        (match, beforeSrc, src, afterSrc) => {
            // Eğer src zaten tam URL ise dokunma
            if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:')) {
                return match;
            }

            // Eğer / ile başlıyorsa base URL ekle
            if (src.startsWith('/')) {
                return `<img${beforeSrc}src="${API_BASE}${src}"${afterSrc}>`;
            }

            // Eğer assets/ ile başlıyorsa önüne / ekle
            if (src.startsWith('assets/')) {
                return `<img${beforeSrc}src="${API_BASE}/${src}"${afterSrc}>`;
            }

            // Diğer durumlar için olduğu gibi bırak
            return match;
        }
    );
}

// Görüntülenme sayısını artır
async function updateViewCount() {
    try {
        // Görüntülenme sayısını artır
        const updatedPost = {
            ...currentPost,
            views: (currentPost.views || 0) + 1
        };

        await fetch(`${API_CONFIG.BASE_URL}/api/posts/${currentPost.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedPost)
        });
    } catch (error) {
        console.error('Görüntülenme güncellenemedi:', error);
    }
}

// İlgili gönderileri göster
function displayRelatedPosts() {
    // Mevcut gönderi hariç, aynı etikete sahip veya rastgele 5 gönderi
    const filtered = allPosts
        .filter(post => post.id !== currentPost.id)
        .sort((a, b) => {
            // Aynı etikete sahip olanları öne al
            const aHasCommonTag = a.tags?.some(tag => currentPost.tags?.includes(tag));
            const bHasCommonTag = b.tags?.some(tag => currentPost.tags?.includes(tag));

            if (aHasCommonTag && !bHasCommonTag) return -1;
            if (!aHasCommonTag && bHasCommonTag) return 1;

            // Tarih sırasına göre
            return new Date(b.date) - new Date(a.date);
        })
        .slice(0, 5);

    relatedPosts.innerHTML = filtered.map(post => {
        const date = new Date(post.date).toLocaleDateString('tr-TR');
        return `
            <a href="/post/${post.id}" class="related-post-item">
                <div class="related-post-title">${UTILS.escapeHtml(post.title)}</div>
                <div class="related-post-date">${date}</div>
            </a>
        `;
    }).join('');
}

// Navigasyon butonlarını ayarla
function setupNavigation() {
    const currentIndex = allPosts.findIndex(post => post.id === currentPost.id);

    // Önceki gönderi
    if (currentIndex < allPosts.length - 1) {
        const prevPost = allPosts[currentIndex + 1];
        prevPostBtn.style.display = 'flex';
        prevPostBtn.onclick = () => {
            window.location.href = `/post/${prevPost.id}`;
        };
    }

    // Sonraki gönderi
    if (currentIndex > 0) {
        const nextPost = allPosts[currentIndex - 1];
        nextPostBtn.style.display = 'flex';
        nextPostBtn.onclick = () => {
            window.location.href = `/post/${nextPost.id}`;
        };
    }
}

// Hata mesajını göster
function showError() {
    postLoading.style.display = 'none';
    postDetail.style.display = 'none';
    errorMessage.style.display = 'block';
}