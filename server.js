// server.js - Express backend sunucu

const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');

const app = express();
const PORT = 3001;

// Güvenlik için secret key (production'da environment variable kullanın)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

// Dosya yükleme için multer ayarları
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'assets/img/')
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: function (req, file, cb) {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Sadece resim dosyaları yüklenebilir!'));
        }
    }
});

// Admin kullanıcı bilgileri (production'da veritabanı kullanın)
const ADMIN_CREDENTIALS = {
    username: 'admin',
    // Şifre: "Admin123!" (bcrypt ile hashlenmiş)
    passwordHash: '$2a$10$YourHashHere' // Bu değer aşağıda oluşturulacak
};

// Middleware
app.use(cors());
app.use(express.json());

// URL rewriting için özel middleware
app.use((req, res, next) => {
    // Ana sayfa
    if (req.path === '/' || req.path === '/index') {
        req.url = '/index.html';
    }
    // Login sayfası
    else if (req.path === '/login') {
        req.url = '/login.html';
    }
    // Admin sayfası
    else if (req.path === '/admin') {
        req.url = '/admin.html';
    }
    // Post editör sayfası - YENİ EKLENEN
    else if (req.path === '/post-editor') {
        req.url = '/post-editor.html';
    }
    // Post detay sayfası
    else if (req.path.match(/^\/post\/\d+$/)) {
        req.url = '/post.html';
    }
    next();
});

app.use(express.static('.')); // Frontend dosyalarını sun

// JSON dosya yolu
const POSTS_FILE = path.join(__dirname, 'data', 'posts.json');
const PROFILE_FILE = path.join(__dirname, 'data', 'profile.json');
const ADMIN_FILE = path.join(__dirname, 'data', 'admin.json');
const SETTINGS_FILE = path.join(__dirname, 'data', 'settings.json');

// Admin dosyasını oluştur (ilk kurulumda)
async function initializeAdmin() {
    try {
        await fs.access(ADMIN_FILE);
    } catch {
        // Dosya yoksa oluştur
        const hashedPassword = await bcrypt.hash('Admin123!', 10);
        const adminData = {
            username: 'admin',
            passwordHash: hashedPassword,
            createdAt: new Date().toISOString()
        };

        await fs.writeFile(ADMIN_FILE, JSON.stringify(adminData, null, 2));
        console.log('Admin kullanıcısı oluşturuldu:');
        console.log('Kullanıcı Adı: admin');
        console.log('Şifre: Admin123!');
    }
}

// Ayarlar dosyasını oluştur
async function initializeSettings() {
    try {
        await fs.access(SETTINGS_FILE);
    } catch {
        const defaultSettings = {
            theme: {
                primaryColor: '#6B73FF',
                secondaryColor: '#FF6B9D',
                accentColor: '#4ECDC4',
                bgPrimary: '#FAF9F7',
                bgSecondary: '#FFFFFF',
                darkMode: false
            },
            site: {
                title: 'Gömülü Yazılım Portfolyom',
                description: 'Mikrodenetleyiciler, RTOS ve IoT sistemleri üzerine çalışıyorum.',
                keywords: 'gömülü yazılım, embedded, IoT, STM32, ESP32'
            }
        };

        await fs.writeFile(SETTINGS_FILE, JSON.stringify(defaultSettings, null, 2));
    }
}

// Yardımcı fonksiyonlar
async function readPosts() {
    try {
        const data = await fs.readFile(POSTS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Gönderiler okunamadı:', error);
        return { posts: [] };
    }
}

async function writePosts(data) {
    try {
        await fs.writeFile(POSTS_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Gönderiler yazılamadı:', error);
        return false;
    }
}

// JWT token oluştur
function generateToken(username) {
    return jwt.sign(
        { username, isAdmin: true },
        JWT_SECRET,
        { expiresIn: '24h' }
    );
}

// Auth middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Yetkilendirme gerekli' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Geçersiz token' });
        }
        req.user = user;
        next();
    });
}

// Auth API Endpoints

// Giriş endpoint'i
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Admin bilgilerini oku
        const adminData = JSON.parse(await fs.readFile(ADMIN_FILE, 'utf8'));

        // Kullanıcı adı kontrolü
        if (username !== adminData.username) {
            return res.status(401).json({ error: 'Hatalı kullanıcı adı veya şifre' });
        }

        // Şifre kontrolü
        const validPassword = await bcrypt.compare(password, adminData.passwordHash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Hatalı kullanıcı adı veya şifre' });
        }

        // Token oluştur
        const token = generateToken(username);

        res.json({
            token,
            username,
            message: 'Giriş başarılı'
        });
    } catch (error) {
        console.error('Giriş hatası:', error);
        res.status(500).json({ error: 'Giriş işlemi başarısız' });
    }
});

// Token doğrulama
app.get('/api/auth/verify', authenticateToken, (req, res) => {
    res.json({ valid: true, user: req.user });
});

// Çıkış endpoint'i
app.post('/api/auth/logout', (req, res) => {
    // Client tarafında token silinmeli
    res.json({ message: 'Çıkış başarılı' });
});

// API Endpoints (Korumalı)

// Tüm gönderileri getir
app.get('/api/posts', async (req, res) => {
    try {
        const data = await readPosts();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Gönderiler yüklenemedi' });
    }
});

// Tek gönderi getir
app.get('/api/posts/:id', async (req, res) => {
    try {
        const data = await readPosts();
        const post = data.posts.find(p => p.id === parseInt(req.params.id));

        if (!post) {
            return res.status(404).json({ error: 'Gönderi bulunamadı' });
        }

        res.json(post);
    } catch (error) {
        res.status(500).json({ error: 'Gönderi yüklenemedi' });
    }
});

// Yeni gönderi ekle (Korumalı)
app.post('/api/posts', authenticateToken, async (req, res) => {
    try {
        const data = await readPosts();

        // Yeni gönderi oluştur
        const newPost = {
            id: Date.now(),
            title: req.body.title,
            summary: req.body.summary,
            content: req.body.content,
            tags: req.body.tags || [],
            date: new Date().toISOString(),
            views: 0
        };

        // Gönderiyi ekle
        data.posts.unshift(newPost);

        // Dosyaya yaz
        const success = await writePosts(data);

        if (success) {
            res.status(201).json(newPost);
        } else {
            res.status(500).json({ error: 'Gönderi kaydedilemedi' });
        }
    } catch (error) {
        console.error('Gönderi ekleme hatası:', error);
        res.status(500).json({ error: 'Gönderi eklenemedi' });
    }
});

// Gönderi güncelle (Korumalı)
app.put('/api/posts/:id', authenticateToken, async (req, res) => {
    try {
        const data = await readPosts();
        const postIndex = data.posts.findIndex(p => p.id === parseInt(req.params.id));

        if (postIndex === -1) {
            return res.status(404).json({ error: 'Gönderi bulunamadı' });
        }

        // Gönderiyi güncelle
        data.posts[postIndex] = {
            ...data.posts[postIndex],
            title: req.body.title,
            summary: req.body.summary,
            content: req.body.content,
            tags: req.body.tags || [],
            views: req.body.views !== undefined ? req.body.views : data.posts[postIndex].views,
            updatedDate: new Date().toISOString()
        };

        // Dosyaya yaz
        const success = await writePosts(data);

        if (success) {
            res.json(data.posts[postIndex]);
        } else {
            res.status(500).json({ error: 'Gönderi güncellenemedi' });
        }
    } catch (error) {
        console.error('Güncelleme hatası:', error);
        res.status(500).json({ error: 'Gönderi güncellenemedi' });
    }
});

// Gönderi sil (Korumalı)
app.delete('/api/posts/:id', authenticateToken, async (req, res) => {
    try {
        const data = await readPosts();
        const initialLength = data.posts.length;

        // Gönderiyi filtrele
        data.posts = data.posts.filter(p => p.id !== parseInt(req.params.id));

        if (data.posts.length === initialLength) {
            return res.status(404).json({ error: 'Gönderi bulunamadı' });
        }

        // Dosyaya yaz
        const success = await writePosts(data);

        if (success) {
            res.json({ message: 'Gönderi silindi' });
        } else {
            res.status(500).json({ error: 'Gönderi silinemedi' });
        }
    } catch (error) {
        console.error('Silme hatası:', error);
        res.status(500).json({ error: 'Gönderi silinemedi' });
    }
});

// Profil bilgilerini getir
app.get('/api/profile', async (req, res) => {
    try {
        const data = await fs.readFile(PROFILE_FILE, 'utf8');
        res.json(JSON.parse(data));
    } catch (error) {
        res.status(500).json({ error: 'Profil yüklenemedi' });
    }
});

// Profil bilgilerini güncelle (Korumalı)
app.put('/api/profile', authenticateToken, async (req, res) => {
    try {
        await fs.writeFile(PROFILE_FILE, JSON.stringify(req.body, null, 2));
        res.json(req.body);
    } catch (error) {
        res.status(500).json({ error: 'Profil güncellenemedi' });
    }
});

// Ayarları getir
app.get('/api/settings', async (req, res) => {
    try {
        const settings = await fs.readFile(SETTINGS_FILE, 'utf8');
        res.json(JSON.parse(settings));
    } catch (error) {
        res.status(500).json({ error: 'Ayarlar yüklenemedi' });
    }
});

// Ayarları güncelle (Korumalı)
app.put('/api/settings', authenticateToken, async (req, res) => {
    try {
        await fs.writeFile(SETTINGS_FILE, JSON.stringify(req.body, null, 2));
        res.json(req.body);
    } catch (error) {
        res.status(500).json({ error: 'Ayarlar güncellenemedi' });
    }
});

// Resim yükleme (Korumalı)
app.post('/api/upload', authenticateToken, upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'Dosya yüklenmedi' });
    }

    res.json({
        filename: req.file.filename,
        path: `/assets/img/${req.file.filename}`,
        size: req.file.size
    });
});

// Sunucuyu başlat
app.listen(PORT, async () => {
    // Admin kullanıcısını oluştur
    await initializeAdmin();
    await initializeSettings();

    console.log(`
    🚀 Backend sunucu çalışıyor!

    API: http://localhost:${PORT}
    Frontend: http://localhost:${PORT}
    Admin Paneli: http://localhost:${PORT}/login
    Post Editörü: http://localhost:${PORT}/post-editor

    🔐 Admin Bilgileri:
    Kullanıcı Adı: admin
    Şifre: Admin123!

    📁 URL Yapısı:
    - Ana Sayfa: http://localhost:${PORT}/
    - Giriş: http://localhost:${PORT}/login
    - Admin: http://localhost:${PORT}/admin
    - Post Editörü: http://localhost:${PORT}/post-editor
    - Post Editörü (Düzenleme): http://localhost:${PORT}/post-editor?id=1
    - Post: http://localhost:${PORT}/post/1
    
    API Endpoints:
    - POST   /api/auth/login     - Admin girişi
    - GET    /api/auth/verify    - Token doğrulama
    - POST   /api/auth/logout    - Çıkış
    - GET    /api/posts          - Tüm gönderiler
    - GET    /api/posts/:id      - Tek gönderi
    - POST   /api/posts          - Yeni gönderi ekle (Auth)
    - PUT    /api/posts/:id      - Gönderi güncelle (Auth)
    - DELETE /api/posts/:id      - Gönderi sil (Auth)
    - GET    /api/profile        - Profil bilgileri
    - PUT    /api/profile        - Profil güncelle (Auth)
    - GET    /api/settings       - Site ayarları
    - PUT    /api/settings       - Ayarları güncelle (Auth)
    - POST   /api/upload         - Resim yükle (Auth)
    `);
});