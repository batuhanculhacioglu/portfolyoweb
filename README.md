# Gömülü Yazılım Portfolyo Blog

Modern, tam özellikli ve güvenli bir portfolyo/blog web sitesi. Gelişmiş admin paneli ile her şeyi yönetebilirsiniz.

## 🚀 Özellikler

### Frontend Özellikleri
- ✅ **Modern Responsive Tasarım**: Tüm cihazlarda mükemmel görünüm
- ✅ **Temiz URL Yapısı**: SEO dostu URL'ler (/, /login, /admin, /post/123)
- ✅ **Dinamik Tema Sistemi**: Admin panelinden renk ayarları
- ✅ **Markdown Desteği**: Rich text editör ve syntax highlighting
- ✅ **Infinite Scroll**: Sayfalama olmadan akıcı gezinme
- ✅ **Etiket Bazlı Filtreleme**: İçerik kategorilendirme
- ✅ **Arama Fonksiyonu**: Gerçek zamanlı arama
- ✅ **Mobil Uyumlu**: Responsive tasarım

### Admin Panel Özellikleri
- ✅ **Güvenli Giriş**: JWT tabanlı authentication
- ✅ **Dashboard**: İstatistikler ve özet bilgiler
- ✅ **Rich Text Editör**: Quill.js ile gelişmiş yazı editörü
- ✅ **Yazı Yönetimi**: CRUD işlemleri
- ✅ **Profil Yönetimi**: Kişisel bilgiler ve resim yükleme
- ✅ **Tema Editörü**: Canlı önizlemeli renk ayarları
- ✅ **Site Ayarları**: SEO ve genel ayarlar
- ✅ **Dosya Yükleme**: Güvenli resim yükleme sistemi

### Backend Özellikleri
- ✅ **RESTful API**: Tam REST uyumlu API
- ✅ **JSON Veritabanı**: Dosya tabanlı veri saklama
- ✅ **JWT Authentication**: Güvenli oturum yönetimi
- ✅ **Password Hashing**: bcrypt ile şifre güvenliği
- ✅ **File Upload**: Multer ile güvenli dosya yükleme
- ✅ **CORS Support**: Cross-origin istekleri
- ✅ **Input Validation**: Güvenlik önlemleri
- ✅ **Error Handling**: Kapsamlı hata yönetimi

## 📋 Gereksinimler

- **Node.js** (v14 veya üzeri)
- **npm** veya **yarn**

## 🛠️ Kurulum

### 1. Projeyi İndirin
```bash
git clone [repository-url]
cd portfolio-blog
```

### 2. Bağımlılıkları Yükleyin
```bash
npm install
```

### 3. Backend Sunucuyu Başlatın
```bash
# Production modu
npm start

# Development modu (otomatik yenileme)
npm run dev
```

### 4. Tarayıcıda Açın
```
http://localhost:3001
```

## 🔐 Admin Girişi

**Varsayılan Admin Bilgileri:**
```
URL: http://localhost:3001/login
Kullanıcı Adı: admin
Şifre: Admin123!
```

⚠️ **Güvenlik Uyarısı**: Production'da mutlaka şifreyi değiştirin!

## 📁 Proje Yapısı

```
portfolio-blog/
├── server.js              # Backend sunucu (Express.js)
├── package.json           # Bağımlılıklar ve scriptler
├── README.md              # Bu dosya
│
├── Frontend Sayfaları:
├── index.html             # Ana sayfa
├── login.html             # Admin giriş sayfası
├── admin.html             # Admin paneli
├── post.html              # Yazı detay sayfası
│
├── Stil Dosyaları:
├── css/
│   ├── style.css          # Ana stil dosyası
│   ├── login.css          # Giriş sayfası stilleri
│   ├── admin.css          # Admin panel stilleri
│   └── post-detail.css    # Yazı detay stilleri
│
├── JavaScript Dosyaları:
├── js/
│   ├── main.js            # Ana sayfa işlevleri
│   ├── login.js           # Giriş sayfası işlevleri
│   ├── admin-new.js       # Admin panel işlevleri
│   ├── admin.js           # Eski admin panel (yedek)
│   └── post-detail.js     # Yazı detay işlevleri
│
├── Veri Dosyaları:
├── data/
│   ├── posts.json         # Blog yazıları
│   ├── profile.json       # Profil bilgileri
│   ├── admin.json         # Admin kullanıcı bilgileri
│   └── settings.json      # Site ve tema ayarları
│
└── Medya Dosyaları:
└── assets/
    └── img/               # Yüklenen resimler
        └── profile.jpg    # Varsayılan profil resmi
```

## 🔧 API Endpoints

### Public Endpoints (Authentication Gerekmez)
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/posts` | Tüm gönderileri listele |
| GET | `/api/posts/:id` | Belirli bir gönderiyi getir |
| GET | `/api/profile` | Profil bilgilerini getir |
| GET | `/api/settings` | Site ayarlarını getir |

### Authentication Endpoints
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | `/api/auth/login` | Admin girişi |
| GET | `/api/auth/verify` | Token doğrulama |
| POST | `/api/auth/logout` | Çıkış |

### Protected Endpoints (JWT Token Gerekir)
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | `/api/posts` | Yeni gönderi oluştur |
| PUT | `/api/posts/:id` | Gönderi güncelle |
| DELETE | `/api/posts/:id` | Gönderi sil |
| PUT | `/api/profile` | Profil güncelle |
| PUT | `/api/settings` | Ayarları güncelle |
| POST | `/api/upload` | Resim yükle |

## 🎨 Admin Panel Kullanımı

### 1. Dashboard
- **Toplam Yazı Sayısı**: Sisteme eklenmiş yazı adedi
- **Toplam Görüntülenme**: Tüm yazıların görüntülenme toplamı
- **Son Güncelleme**: En son eklenen yazının tarihi
- **Son Yazılar**: En yeni 5 yazının listesi

### 2. Yazı Yönetimi
**Rich Text Editör Özellikleri:**
- Başlık formatları (H1, H2, H3)
- Metin biçimlendirme (kalın, italik, altı çizili)
- Listeler (sıralı ve sırasız)
- Kod blokları ve satır içi kod
- Linkler ve resimler
- Alıntılar (blockquote)

**Yazı Özellikleri:**
- Başlık ve özet
- Etiket sistemi (virgülle ayırarak)
- Görüntülenme sayacı (otomatik)
- Tarih damgası (otomatik)

### 3. Profil Ayarları
- **Kişisel Bilgiler**: Ad, soyad, ünvan
- **Hakkımda Metni**: Kısa biyografi
- **Profil Resmi**: Max 5MB (JPG/PNG/GIF)
- **İletişim**: E-posta adresi
- **Sosyal Medya**: GitHub ve LinkedIn linkleri

### 4. Tema Editörü
**Renk Ayarları:**
- Ana Renk (Primary)
- İkincil Renk (Secondary)
- Vurgu Rengi (Accent)
- Arkaplan Renkleri (Primary & Secondary)

**Özellikler:**
- Canlı önizleme
- Hex renk kodu desteği
- Varsayılan tema geri yükleme

### 5. Site Ayarları
- **Site Başlığı**: Tarayıcı sekmesinde görünen
- **Site Açıklaması**: Meta description
- **Anahtar Kelimeler**: SEO için (virgülle ayırın)

## 🔒 Güvenlik Özellikleri

### Authentication & Authorization
- **JWT Token**: 24 saat geçerlilik süresi
- **bcrypt**: Şifre hashleme (salt rounds: 10)
- **Session Management**: localStorage veya sessionStorage

### Input Validation
- **File Upload**: Sadece resim dosyaları (5MB limit)
- **XSS Protection**: HTML escaping
- **CORS**: Cross-origin güvenliği

### Best Practices
- Environment variables desteği
- Rate limiting önerileri
- HTTPS zorunluluğu (production)

## 🌐 Deployment (Production)

### Environment Variables
```bash
# .env dosyası oluşturun
JWT_SECRET=your-super-secret-jwt-key-change-this
NODE_ENV=production
PORT=3001
```

### Production Checklist
- [ ] JWT_SECRET environment variable olarak ayarlayın
- [ ] HTTPS kullanın
- [ ] Rate limiting ekleyin
- [ ] Veritabanı entegrasyonu (MongoDB/PostgreSQL)
- [ ] CDN kullanın (resimler için)
- [ ] Backup sistemi kurun
- [ ] Log yönetimi ekleyin
- [ ] Admin şifresini değiştirin

### Recommended Server Setup
```bash
# PM2 ile production
npm install -g pm2
pm2 start server.js --name "portfolio-blog"
pm2 startup
pm2 save
```

## ⚙️ Geliştirme

### Development Mode
```bash
npm run dev
```
Nodemon ile otomatik yenileme aktif olur.

### Debugging
- Backend logları konsola yazdırılır
- Frontend hatalar browser console'da görülür
- Network sekmesinde API istekleri kontrol edilebilir

### Veri Yedekleme
```bash
# Data klasörünü düzenli olarak yedekleyin
cp -r data/ backup/data-$(date +%Y%m%d)/
```

## 🐛 Bilinen Sorunlar ve Çözümler

### 1. Backend Bağlantı Hatası
**Sorun**: "API yanıt vermedi" hatası
**Çözüm**: 
```bash
# Backend'in çalıştığını kontrol edin
curl http://localhost:3001/api/posts
```

### 2. Dosya Yolu Sorunları
**Sorun**: CSS/JS dosyaları yüklenmiyor
**Çözüm**: Mutlak yolları (`/css/style.css`) kullanın

### 3. Admin Paneli Açılmıyor
**Sorun**: Giriş yapıldıktan sonra yönlendirme problemi
**Çözüm**: Local storage'daki token'ı kontrol edin

### 4. Resim Yükleme Hatası
**Sorun**: Resim yüklenemiyor
**Çözüm**: `assets/img/` klasörünün yazılabilir olduğunu kontrol edin

## 📝 Güncellemeler ve Versiyon Notları

### v1.0.0 (Mevcut)
- ✅ Temel blog sistemi
- ✅ Admin paneli
- ✅ JWT authentication
- ✅ Responsive tasarım
- ✅ Rich text editör

### Planlanan Özellikler (v2.0.0)
- [ ] Yorum sistemi
- [ ] Kategori yönetimi
- [ ] RSS feed
- [ ] SEO optimizasyonları
- [ ] Performance iyileştirmeleri
- [ ] Dark mode desteği
- [ ] Multi-language support

## 🤝 Katkıda Bulunma

1. Bu repoyu fork edin
2. Yeni bir branch oluşturun (`git checkout -b feature/yeni-ozellik`)
3. Değişikliklerinizi commit edin (`git commit -am 'Yeni özellik eklendi'`)
4. Branch'inizi push edin (`git push origin feature/yeni-ozellik`)
5. Pull Request oluşturun

## 📄 Lisans

MIT License - Detaylar için `LICENSE` dosyasına bakın.

## 📞 Destek

Sorunlar için GitHub Issues kullanın veya [email@example.com] adresine ulaşın.

---

**⭐ Bu projeyi beğendiyseniz yıldızlamayı unutmayın!**