// main.js - Ana sayfa için JavaScript kodu

// Global değişkenler
let allPosts = [];
let filteredPosts = [];
let currentPage = 0;
const postsPerPage = 6;
let isLoading = false;
let selectedTag = 'all';
let searchQuery = '';

// DOM elementleri
const postsContainer = document.getElementById('postsContainer');
const tagFilter = document.getElementById('tagFilter');
const searchBox = document.getElementById('searchBox');
const loading = document.getElementById('loading');

// Sayfa yüklendiğinde başlat
document.addEventListener('DOMContentLoaded', async () => {
    await loadPosts();
    await loadProfile();
    setupEventListeners();
    renderPosts();
});

// Gönderileri yükle
async function loadPosts() {
    try {
        // Backend API'den gönderileri çek
        const response = await fetch('http://localhost:3001/api/posts');

        if (!response.ok) {
            throw new Error('API yanıt vermedi');
        }

        const data = await response.json();
        allPosts = data.posts || [];
        filteredPosts = [...allPosts];
        console.log(`${allPosts.length} gönderi yüklendi`);

        // Etiketleri topla ve filtre menüsünü oluştur
        createTagFilters();
    } catch (error) {
        console.error('Gönderiler yüklenirken hata:', error);

        // Hata durumunda kullanıcıya bilgi ver
        postsContainer.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 2rem;">
                <h3>Gönderiler yüklenemedi</h3>
                <p>Backend sunucunun çalıştığından emin olun.</p>
                <small>Hata: ${error.message}</small>
                <br><br>
                <button onclick="location.reload()" style="padding: 0.5rem 1rem; background: #6B73FF; color: white; border: none; border-radius: 8px; cursor: pointer;">
                    Tekrar Dene
                </button>
            </div>
        `;

        allPosts = [];
        filteredPosts = [];
    }
}

// Profil bilgilerini yükle
async function loadProfile() {
    try {
        const response = await fetch('http://localhost:3001/api/profile');

        if (response.ok) {
            const profile = await response.json();
            updateProfileUI(profile);
        }
    } catch (error) {
        console.error('Profil yüklenirken hata:', error);
    }
}

// Profil arayüzünü güncelle
function updateProfileUI(profile) {
    if (profile.name) {
        document.querySelector('.profile-name').textContent = profile.name;
    }
    if (profile.title) {
        document.querySelector('.profile-title').textContent = profile.title;
    }
    if (profile.bio) {
        document.querySelector('.profile-bio').textContent = profile.bio;
    }
    if (profile.image) {
        document.querySelector('.profile-image').src = profile.image;
    }

    // Sosyal medya linklerini güncelle
    const socialLinks = document.querySelectorAll('.social-link');
    if (profile.email) {
        socialLinks[0].href = `mailto:${profile.email}`;
    }
    if (profile.github) {
        socialLinks[1].href = profile.github;
    }
    if (profile.linkedin) {
        socialLinks[2].href = profile.linkedin;
    }
}

// Etiket filtrelerini oluştur
function createTagFilters() {
    const allTags = new Set();

    // Tüm etiketleri topla
    allPosts.forEach(post => {
        if (post.tags && Array.isArray(post.tags)) {
            post.tags.forEach(tag => allTags.add(tag));
        }
    });

    // Mevcut etiket butonlarını temizle (Tümü hariç)
    const existingTags = tagFilter.querySelectorAll('.tag-btn:not([data-tag="all"])');
    existingTags.forEach(tag => tag.remove());

    // Etiket butonlarını oluştur
    allTags.forEach(tag => {
        const tagBtn = document.createElement('button');
        tagBtn.className = 'tag-btn';
        tagBtn.textContent = tag;
        tagBtn.dataset.tag = tag;
        tagFilter.appendChild(tagBtn);
    });
}

// Event listener'ları kur
function setupEventListeners() {
    // Etiket filtreleme
    tagFilter.addEventListener('click', (e) => {
        if (e.target.classList.contains('tag-btn')) {
            // Aktif sınıfını güncelle
            tagFilter.querySelectorAll('.tag-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            e.target.classList.add('active');

            // Filtreleme yap
            selectedTag = e.target.dataset.tag;
            filterPosts();
        }
    });

    // Arama kutusu
    searchBox.addEventListener('input', debounce((e) => {
        searchQuery = e.target.value.toLowerCase();
        filterPosts();
    }, 300));

    // Infinite scroll
    window.addEventListener('scroll', () => {
        if (!isLoading && hasMorePosts()) {
            const scrollPosition = window.innerHeight + window.scrollY;
            const threshold = document.body.offsetHeight - 200;

            if (scrollPosition >= threshold) {
                loadMorePosts();
            }
        }
    });
}

// Gönderileri filtrele
function filterPosts() {
    filteredPosts = allPosts.filter(post => {
        // Etiket filtresi
        const tagMatch = selectedTag === 'all' ||
            (post.tags && post.tags.includes(selectedTag));

        // Arama filtresi
        const searchMatch = searchQuery === '' ||
            post.title.toLowerCase().includes(searchQuery) ||
            post.summary.toLowerCase().includes(searchQuery);

        return tagMatch && searchMatch;
    });

    // Sayfayı sıfırla ve yeniden render et
    currentPage = 0;
    postsContainer.innerHTML = '';
    renderPosts();
}

// Gönderileri render et
function renderPosts() {
    const start = currentPage * postsPerPage;
    const end = start + postsPerPage;
    const postsToRender = filteredPosts.slice(start, end);

    postsToRender.forEach(post => {
        const postCard = createPostCard(post);
        postsContainer.appendChild(postCard);
    });

    currentPage++;
}

// Gönderi kartı oluştur
function createPostCard(post) {
    const card = document.createElement('div');
    card.className = 'post-card';

    // Markdown içeriği HTML'e çevir (marked.js varsa)
    const contentPreview = typeof marked !== 'undefined'
        ? marked.parse(post.content).substring(0, 200) + '...'
        : post.content.substring(0, 200) + '...';

    card.innerHTML = `
        <h3 class="post-title">${escapeHtml(post.title)}</h3>
        <p class="post-summary">${escapeHtml(post.summary)}</p>
        <div class="post-tags">
            ${post.tags ? post.tags.map(tag =>
        `<span class="post-tag">${escapeHtml(tag)}</span>`
    ).join('') : ''}
        </div>
    `;

    // Tıklama olayı - detay sayfası veya modal açılabilir
    card.addEventListener('click', () => {
        showPostDetail(post);
    });

    return card;
}

// Gönderi detayını göster (ileride modal veya yeni sayfa olabilir)
function showPostDetail(post) {
    // Şimdilik console'a yazdır
    console.log('Gönderi detayı:', post);
    // İleride modal veya yeni sayfa implementasyonu eklenebilir
    alert(`"${post.title}" gönderisi açılıyor...`);
}

// Daha fazla gönderi yükle
function loadMorePosts() {
    if (!hasMorePosts()) return;

    isLoading = true;
    loading.classList.add('show');

    // Gerçek yükleme simülasyonu
    setTimeout(() => {
        renderPosts();
        isLoading = false;
        loading.classList.remove('show');
    }, 500);
}

// Daha fazla gönderi var mı kontrol et
function hasMorePosts() {
    return currentPage * postsPerPage < filteredPosts.length;
}

// Debounce fonksiyonu - performans için
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

// HTML escape fonksiyonu - güvenlik için
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