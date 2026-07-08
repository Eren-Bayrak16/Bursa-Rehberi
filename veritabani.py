import json
import os
import sys
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_FILE = os.path.join(BASE_DIR, "user_database.json")
CONFIG_FILE = os.path.join(BASE_DIR,"config" "sistem_ayarlari.json")

def load_database():
    if os.path.exists(DB_FILE):
        with open(DB_FILE, "r", encoding="utf-8") as file:
            return json.load(file)
    return {}

def save_database(data):
    with open(DB_FILE, "w", encoding="utf-8") as file:
        json.dump(data, file, ensure_ascii=False, indent=4)

def welcome_and_consent():
    print("BURSA DİJİTAL REHBERİ'NE HOŞ GELDİNİZ\n")
    
    while True:
        username = input("Lütfen kullanıcı adınızı giriniz: ").strip()
        harf_sayisi = sum(karakter.isalpha() for karakter in username)
        
        if harf_sayisi >= 2:
            break 
        else:
            print("[UYARI] Geçersiz kullanıcı adı! Lütfen içinde en az 2 'harf' bulunan bir isim giriniz (Sadece rakam kabul edilmez).\n")

    db = load_database()

    if username in db:
        if db[username].get("consent_status") == True:
            print(f"\n[SİSTEM] Tekrar hoş geldiniz, {username}! Onayınız sistemde zaten kayıtlı.")
            print("Sözleşme adımları atlanarak doğrudan giriş yapılıyor...\n")
            return username 

    print("\n" + "-"*50)
    print("        VERİ İŞLEME VE ŞEFFAFLIK BİLGİLENDİRMESİ")
    print("-"*50)
    print("Size daha iyi bir deneyim sunabilmek için sistemimizi ")
    print("şeffaflıkla yönetiyoruz. Lütfen aşağıdaki metni okuyunuz:\n")
    
    print("📌 HANGİ VERİLER İŞLENİYOR?")
    print(" • Kullanıcı adınız ve sisteme giriş tarihiniz.")
    print(" • Bize sorduğunuz sorular ve rehberin verdiği cevaplar.")
    
    print("\n📌 BU VERİLER NEDEN İŞLENİYOR?")
    print(" • Sistemdeki hataları tespit edip kaliteyi artırmak,")
    print(" • Rehberin verdiği cevapların doğruluğunu test etmek amacıyla.")
    
    print("\n🔒 GÜVENLİK NOTU:")
    print(" Sisteme gireceğiniz API (Bağlantı) şifreleri KESİNLİKLE")
    print(" kaydedilmez, sadece o anki oturumda geçici olarak kullanılır.")
    print("-"*50)
    
    while True:
        answer = input("\nBu şeffaflık ilkeleri doğrultusunda, verilerinizin işlenmesini onaylıyor musunuz? (Evet/Hayır): ").strip().lower()

        if answer in ['evet']:
            consent_status = True
            break 
        elif answer in ['hayır']:
            consent_status = False
            break
        else:
            print("[UYARI] Anlaşılmadı! Lütfen sadece 'Evet' veya 'Hayır' olarak net bir cevap veriniz.")

    db[username] = {
        "consent_status": consent_status,
        "registration_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }
    save_database(db)

    if not consent_status:
        print("\n[GÜVENLİK UYARISI] Onay vermediğiniz için sistem başlatılamıyor.")
        print("Ret kararınız veritabanına işlendi. Oturum güvenle sonlandırılıyor...")
        sys.exit() 
    
    print(f"\nTeşekkürler {username}, onayınız alındı. Sisteme giriş yapılıyor...\n")
    return username

def load_config():
    if not os.path.exists(CONFIG_FILE):
        print(f"\n[SİSTEM HATASI] {os.path.basename(CONFIG_FILE)} dosyası bulunamadı!")
        print("Lütfen ayar dosyasının Python koduyla aynı klasörde olduğundan emin olun.")
        sys.exit() 
        
    with open(CONFIG_FILE, "r", encoding="utf-8") as file:
        return json.load(file)
