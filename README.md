# Gömülü Yazılım Portfolyo Blog

Modern ve kullanıcı dostu bir portfolyo/blog web sitesi. Backend API ile çalışan tam fonksiyonel bir sistem.

## 📋 Gereksinimler

- Node.js (v14 veya üzeri)
- npm veya yarn

## 🚀 Kurulum

### 1. Projeyi indirin ve klasöre gidin
```bash
cd portfolio-blog
```

### 2. Bağımlılıkları yükleyin
```bash
npm install
```

### 3. Backend sunucuyu başlatın
```bash
npm start
# veya geliştirme modu için (otomatik yenileme)
npm run dev
```

### 4. Tarayıcıda açın
```
http://localhost:3001
```

## 📁 Klasör Yapısı

```
portfolio-blog/
├── index.html          # Ana sayfa
├── admin.html          # Admin paneli
├── server.js           # Backend sunucu
├── package.json        # Node.js bağımlılıkları
├── css/
│   └── style.css      # Stil dosyası
├── js/
│   ├── main.js        # Ana sayfa JS
│   └── admin.js       # Admin panel JS
├── data/
│   ├── posts.json     # Gönderi veritabanı
│   └── profile.json   # Profil bilgileri
└── assets/
    └── img/           # Resimler
```

## 🔧 API Endpoints

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/posts` | Tüm gönderileri getir |
| GET | `/api/posts/:id` | Tek gönderi getir |
| POST | `/api/posts` | Yeni gönderi ekle |
| PUT | `/api/posts/:id` | Gönderi güncelle |
| DELETE | `/api/posts/:id` | Gönderi sil |
| GET | `/api/profile` | Profil bilgilerini getir |
| PUT | `/api/profile` | Profil güncelle |

## 💡 Kullanım

1. **Ana Sayfa**: Gönderileri görüntüleyin, arayın ve filtreleyin
2. **Admin Paneli**: `http://localhost:3001/admin.html` adresinden veya profil kartındaki linkten erişin
3. **Gönderi Ekleme**: Admin panelinden yeni gönderi ekleyin
4. **Düzenleme/Silme**: Admin panelinde mevcut gönderileri yönetin

## ⚙️ Özellikler

- ✅ RESTful API backend
- ✅ JSON dosya tabanlı veritabanı
- ✅ Gerçek zamanlı CRUD işlemleri
- ✅ Responsive tasarım
- ✅ Markdown desteği
- ✅ Etiket bazlı filtreleme
- ✅ Arama fonksiyonu
- ✅ Infinite scroll

## 🛠️ Geliştirme

Backend değişikliklerinde otomatik yenileme için:
```bash
npm run dev
```

## 📝 Notlar

- Gönderiler `data/posts.json` dosyasında saklanır
- Backend kapalıyken site çalışmaz
- Tüm değişiklikler anında JSON dosyasına yazılır
- Yedekleme için `data` klasörünü düzenli olarak kopyalayın

## 🔒 Güvenlik

Production'da kullanmadan önce:
- Authentication ekleyin
- Rate limiting ekleyin
- Input validation güçlendirin
- HTTPS kullanın