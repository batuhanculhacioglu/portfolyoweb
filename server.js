// server.js - Express backend sunucu

const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Frontend dosyalarını sun

// JSON dosya yolu
const POSTS_FILE = path.join(__dirname, 'data', 'posts.json');
const PROFILE_FILE = path.join(__dirname, 'data', 'profile.json');

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

// API Endpoints

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

// Yeni gönderi ekle
app.post('/api/posts', async (req, res) => {
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

// Gönderi güncelle
app.put('/api/posts/:id', async (req, res) => {
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

// Gönderi sil
app.delete('/api/posts/:id', async (req, res) => {
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

// Profil bilgilerini güncelle
app.put('/api/profile', async (req, res) => {
    try {
        await fs.writeFile(PROFILE_FILE, JSON.stringify(req.body, null, 2));
        res.json(req.body);
    } catch (error) {
        res.status(500).json({ error: 'Profil güncellenemedi' });
    }
});

// Sunucuyu başlat
app.listen(PORT, () => {
    console.log(`
    🚀 Backend sunucu çalışıyor!
    
    API: http://localhost:${PORT}
    Frontend: http://localhost:${PORT}
    
    API Endpoints:
    - GET    /api/posts       - Tüm gönderiler
    - GET    /api/posts/:id   - Tek gönderi
    - POST   /api/posts       - Yeni gönderi ekle
    - PUT    /api/posts/:id   - Gönderi güncelle
    - DELETE /api/posts/:id   - Gönderi sil
    - GET    /api/profile     - Profil bilgileri
    - PUT    /api/profile     - Profil güncelle
    `);
});