// post-detail.js - Gönderi detay sayfası için JavaScript

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
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

// Gönderiyi yükle
async function loadPost(postId) {
    try {
        const response = await fetch(`http://localhost:3001/api/posts/${postId}`);

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
        const response = await fetch('http://localhost:3001/api/posts');
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

    // İçerik (Markdown'ı HTML'e çevir)
    if (typeof marked !== 'undefined') {
        // Marked ayarları
        marked.setOptions({
            highlight: function (code, lang) {
                if (typeof Prism !== 'undefined' && Prism.languages[lang]) {
                    return Prism.highlight(code, Prism.languages[lang], lang);
                }
                return code;
            },
            breaks: true,
            gfm: true
        });

        postContent.innerHTML = marked.parse(currentPost.content);
    } else {
        // Marked yoksa düz metin olarak göster
        postContent.innerHTML = `<pre>${escapeHtml(currentPost.content)}</pre>`;
    }

    // Loading'i gizle, içeriği göster
    postLoading.style.display = 'none';
    postDetail.style.display = 'block';

    // Kod bloklarını highlight et
    if (typeof Prism !== 'undefined') {
        Prism.highlightAll();
    }
}

// Görüntülenme sayısını artır
async function updateViewCount() {
    try {
        // Görüntülenme sayısını artır
        const updatedPost = {
            ...currentPost,
            views: (currentPost.views || 0) + 1
        };

        await fetch(`http://localhost:3001/api/posts/${currentPost.id}`, {
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
            <a href="post.html?id=${post.id}" class="related-post-item">
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
            window.location.href = `post.html?id=${prevPost.id}`;
        };
    }

    // Sonraki gönderi
    if (currentIndex > 0) {
        const nextPost = allPosts[currentIndex - 1];
        nextPostBtn.style.display = 'flex';
        nextPostBtn.onclick = () => {
            window.location.href = `post.html?id=${nextPost.id}`;
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