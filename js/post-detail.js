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
        const API_BASE = window.location.origin.includes('localhost')
            ? 'http://localhost:3001'
            : window.location.origin;

        const response = await fetch(`${API_BASE}/api/posts/${postId}`);

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
        const API_BASE = window.location.origin.includes('localhost')
            ? 'http://localhost:3001'
            : window.location.origin;
        const response = await fetch(`${API_BASE}/api/posts`);
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
            `<span class="post-tag">${escapeHtml(tag)}</span>`
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
    // HTML içeriği olduğunu varsayarak işle
    let processedContent = content;

    // Markdown benzeri işaretleri HTML'e çevir (eski içerikler için)
    processedContent = convertMarkdownToHtml(processedContent);

    // Resim yollarını düzelt
    processedContent = fixImagePaths(processedContent);

    // Boş paragrafları temizle
    processedContent = cleanEmptyParagraphs(processedContent);

    return processedContent;
}

// Markdown benzeri işaretleri HTML'e çevir (eski içerikler için)
function convertMarkdownToHtml(content) {
    // Bu fonksiyon sadece mevcut markdown işaretlerini temizlemek için
    return content
        // Başlıkları çevir
        .replace(/^### (.*$)/gm, '<h3>$1</h3>')
        .replace(/^## (.*$)/gm, '<h2>$1</h2>')
        .replace(/^# (.*$)/gm, '<h1>$1</h1>')

        // Kalın ve italik
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')

        // Kod blokları
        .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>')
        .replace(/`([^`]+)`/g, '<code>$1</code>')

        // Linkler
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')

        // Paragrafları ayır
        .split('\n\n')
        .map(paragraph => {
            paragraph = paragraph.trim();
            if (!paragraph) return '';

            // Eğer zaten HTML tag'i varsa olduğu gibi bırak
            if (paragraph.startsWith('<')) return paragraph;

            // Aksi halde paragraf tag'i ekle
            return `<p>${paragraph}</p>`;
        })
        .join('\n');
}

// Resim yollarını düzelt
function fixImagePaths(content) {
    const API_BASE = window.location.origin.includes('localhost')
        ? 'http://localhost:3001'
        : window.location.origin;

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

// Boş paragrafları temizle
function cleanEmptyParagraphs(content) {
    return content
        .replace(/<p>\s*<\/p>/g, '')
        .replace(/<p>&nbsp;<\/p>/g, '')
        .replace(/\n\s*\n/g, '\n');
}

// Görüntülenme sayısını artır
async function updateViewCount() {
    try {
        const API_BASE = window.location.origin.includes('localhost')
            ? 'http://localhost:3001'
            : window.location.origin;

        // Görüntülenme sayısını artır
        const updatedPost = {
            ...currentPost,
            views: (currentPost.views || 0) + 1
        };

        await fetch(`${API_BASE}/api/posts/${currentPost.id}`, {
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
                <div class="related-post-title">${escapeHtml(post.title)}</div>
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