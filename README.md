#  Bursa AI Keşif Rehberi

Bursa'nın tarihini, kültürünü, gezilecek yerlerini ve yerel lezzetlerini yapay zeka destekli bir sohbet asistanıyla keşfetmenizi sağlayan tam kapsamlı (full-stack) bir web uygulaması. Aynı zamanda çoklu LLM sağlayıcısını tek bir sistem üzerinden yönetmeyi gösteren bir portföy/demo projesidir.

## Özellikler

- **Yapay zeka rehberi:** Bursa hakkında serbest metinli sorulara doğal dilde yanıt veren, konuşma geçmişini hatırlayan bir sohbet arayüzü.
- **Çoklu LLM desteği:** OpenRouter üzerinden Google, Anthropic, OpenAI gibi farklı sağlayıcıların modelleri arasında anlık geçiş.
- **Misafir modu:** Giriş yapmadan, sistemin sunduğu ücretsiz bir modelle sınırlı sayıda soru sorabilme.
- **Google ile giriş:** Kullanıcılar kendi OpenRouter API anahtarlarını bağlayıp istedikleri modeli seçebilir.
- **Şifreli anahtar saklama:** Kullanıcıların API anahtarları veritabanında şifrelenmiş olarak tutulur.
- **Yönetici paneli:**
  - Günlük/haftalık/aylık kullanım istatistikleri, saatlik ve günlük trafik grafikleri
  - Model bazlı kullanım, token tüketimi ve verimlilik (token/saniye) sıralamaları
  - Aranabilir ve filtrelenebilir soru-cevap geçmişi
  - OpenRouter model kataloğundan yeni model ekleme, misafir modelini belirleme

##  Kullanılan Teknolojiler

| Katman | Teknoloji |
|---|---|
| Frontend | React (Vite), React Icons |
| Backend | Python, FastAPI |
| Veritabanı | MySQL |
| Yapay zeka | OpenRouter API (çoklu model routing) |
| Kimlik doğrulama | Google OAuth (sunucu tarafında doğrulanan access token) |

##  Güvenlik notları

- Admin ve kullanıcıya özel işlemler, istemcinin gönderdiği bir e-posta değil, `Authorization: Bearer <token>` başlığındaki Google access token'ının backend tarafından doğrulanmasıyla yetkilendirilir.
- API anahtarları veritabanında düz metin olarak değil, şifrelenmiş halde saklanır (`backend/security.py`).
- Veritabanı bilgileri, admin e-postası ve şifreleme anahtarı kod içine gömülü değildir; `.env` dosyasından okunur ve repoya dahil edilmez.


##  Geliştirme Ortamında Çalıştırma

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env          # .env dosyasını gerçek değerlerle doldurun
uvicorn main:app --reload
```

### Frontend

```bash
npm install
npm run dev
```

##  Ortam Değişkenleri (`backend/.env`)

| Değişken | Açıklama |
|---|---|
| `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | MySQL bağlantı bilgileri |
| `ADMIN_EMAIL` | Yönetici paneline erişebilecek Google hesabının e-postası |
| `ENCRYPTION_KEY` | API anahtarlarını şifrelemek için kullanılan Fernet anahtarı |
| `ALLOWED_ORIGINS` | Frontend'in yayında çalışacağı adres(ler), virgülle ayrılmış |

Tam liste ve örnek değerler için `backend/.env.example` dosyasına bakın.
