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
        // Gerçek uygulamada fetch('/data/posts.json') kullanılır
        // Demo için örnek veri
        const response = await fetch('/data/posts.json').catch(() => {
            // Eğer dosya yoksa örnek veri döndür
            return {
                ok: true,
                json: async () => demoPostsData
            };
        });

        const data = await response.json();
        allPosts = data.posts || [];
        filteredPosts = [...allPosts];

        // Etiketleri topla ve filtre menüsünü oluştur
        createTagFilters();
    } catch (error) {
        console.error('Gönderiler yüklenirken hata:', error);
        allPosts = demoPostsData.posts;
        filteredPosts = [...allPosts];
        createTagFilters();
    }
}

// Profil bilgilerini yükle
async function loadProfile() {
    try {
        const response = await fetch('/data/profile.json').catch(() => {
            return { ok: false };
        });

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

// Demo veri - gerçek uygulamada posts.json'dan gelecek
const demoPostsData = {
    posts: [
        {
            id: 1,
            title: "STM32 ile RTOS Kullanımı",
            summary: "FreeRTOS kullanarak STM32 mikrodenetleyicilerde çoklu görev yönetimi nasıl yapılır?",
            content: "# STM32 ve FreeRTOS\n\nBu yazıda STM32F4 serisi mikrodenetleyicilerde FreeRTOS kullanımını inceleyeceğiz...",
            tags: ["STM32", "RTOS", "FreeRTOS", "C"]
        },
        {
            id: 2,
            title: "ESP32 ile IoT Projesi",
            summary: "ESP32 kullanarak bulut tabanlı sıcaklık ve nem takip sistemi geliştirme",
            content: "# ESP32 IoT Sensör Projesi\n\nESP32'nin WiFi özelliklerini kullanarak sensör verilerini buluta gönderme...",
            tags: ["ESP32", "IoT", "MQTT", "C++"]
        },
        {
            id: 3,
            title: "Embedded Linux ile GPIO Kontrolü",
            summary: "Raspberry Pi üzerinde C dilinde GPIO pin kontrolü ve kesme yönetimi",
            content: "# Linux GPIO Programlama\n\nEmbedded Linux sistemlerde GPIO kontrolü için sysfs ve libgpiod kullanımı...",
            tags: ["Linux", "GPIO", "Raspberry Pi", "C"]
        },
        {
            id: 4,
            title: "CAN Bus Protokolü Uygulaması",
            summary: "Otomotiv projelerinde CAN bus haberleşme protokolünün implementasyonu",
            content: "# CAN Bus Haberleşme\n\nController Area Network (CAN) protokolünün gömülü sistemlerde kullanımı...",
            tags: ["CAN", "Automotive", "Protocol", "C"]
        },
        {
            id: 5,
            title: "Low Power Design Teknikleri",
            summary: "Pil ile çalışan gömülü sistemlerde güç tüketimi optimizasyonu",
            content: "# Düşük Güç Tasarımı\n\nMikrodenetleyicilerde sleep modları ve güç yönetimi teknikleri...",
            tags: ["Low Power", "Battery", "STM32", "Optimization"]
        },
        {
            id: 6,
            title: "I2C ve SPI Protokol Karşılaştırması",
            summary: "Gömülü sistemlerde yaygın kullanılan I2C ve SPI protokollerinin avantaj ve dezavantajları",
            content: "# I2C vs SPI\n\nİki popüler seri haberleşme protokolünün detaylı karşılaştırması...",
            tags: ["I2C", "SPI", "Protocol", "Communication"]
        }
    ]
};