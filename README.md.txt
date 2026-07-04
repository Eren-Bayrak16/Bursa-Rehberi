# Bursa Rehberi - Yapay Zeka Destekli Şehir Asistanı

Bu proje, terminal üzerinden çalışan, çoklu dil modeli (OpenAI, Claude, Gemini) destekli dinamik bir Bursa dijital rehberidir. Kullanıcı güvenliği ve veri bütünlüğü, özel olarak tasarlanmış bir kayıt mekanizması ile güvence altına alınmıştır.

## 🚀 Proje Özellikleri

* **Gelişmiş Kullanıcı Yetkilendirmesi:** Sisteme doğrudan giriş (login) kapalıdır. Kullanıcıların öncelikle sisteme kayıt olmaları gerekmektedir. Kayıt olmayan hiçbir kullanıcı asistan arayüzüne erişemez.
* **Veri Doğrulama (Validation):** Hatalı veya spam girişleri engellemek adına, kayıt esnasında belirlenecek kullanıcı adları için "en az iki harf" zorunluluğu sisteme hard-coded olarak entegre edilmiştir.
* **Çoklu Yapay Zeka Modeli:** Kullanıcılar, API üzerinden OpenAI GPT-4o Mini, Claude 3 Haiku veya Google Gemini 2.5 Flash modellerinden birini seçerek asistanla etkileşime geçebilir.
* **Yerel Veri Yönetimi:** Kullanıcı verileri dışarıya kapalı, yerel mimaride saklanır ve asenkron olarak okunur.

## 🛠️ Kurulum Gereksinimleri

Bu sistemin bilgisayarınızda çalışması için aşağıdaki adımları izleyin:

1. Bilgisayarınızda **Python 3.x** sürümünün kurulu olduğundan emin olun.
2. Gerekli kütüphaneleri yüklemek için terminalde şu komutu çalıştırın:
   ```bash
   pip install requests