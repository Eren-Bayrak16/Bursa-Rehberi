import json
import os
import sys
import csv
import requests
from datetime import datetime

def aktif_internet_kontrolü():
    """Sistem internete ihtiyaç duyduğu anlarda anlık kontrol yapar. 
    Bağlantı yoksa programı kapatmaz, internet gelene kadar kullanıcıyı bekletir."""
    while True:
        try:
            
            requests.get("https://openrouter.ai", timeout=3)
            return True 
        except (requests.ConnectionError, requests.Timeout):
            print("\n" + "!"*60)
            print(" [BAĞLANTI KOPMASI] Şu anda internet bağlantınız anlık olarak kesildi!")
            print(" Lütfen bilgisayarınızın ağ ayarlarını veya kablosunu kontrol edin.")
            print("!"*60)
            input("\nBağlantıyı tekrar sağladıktan sonra devam etmek için ENTER'a basın...")
            print("[SİSTEM] Bağlantı yeniden test ediliyor...\n")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_FILE = os.path.join(BASE_DIR, "user_database.json")
CONFIG_FILE = os.path.join(BASE_DIR, "sistem_ayarlari.json")
LOG_FILE = os.path.join(BASE_DIR, "sohbet_loglari.csv")


def load_database():
    if os.path.exists(DB_FILE):
        with open(DB_FILE, "r", encoding="utf-8") as file:
            return json.load(file)
    return {}

def save_database(data):
    with open(DB_FILE, "w", encoding="utf-8") as file:
        json.dump(data, file, ensure_ascii=False, indent=4)

def welcome_and_consent():
    print("="*50)
    print("      BURSA DİJİTAL REHBERİ'NE HOŞ GELDİNİZ")
    print("="*50)
    
    while True:
        username = input("Lütfen kullanıcı adınızı giriniz: ").strip()
        
        
        harf_sayisi = sum(karakter.isalpha() for karakter in username)
        
        if harf_sayisi >= 2:
            break 
        else:
            print("[UYARI] Geçersiz kullanıcı adı! Lütfen içinde en az 2 'harf' bulunan bir isim giriniz (Sadece rakam kabul edilmez).\n")
    # --------------------------------------------

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
    # ----------------------------------

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

def get_api_key_and_model(config_data):
    print("-" * 50)
    print("                SİSTEM BAĞLANTISI")
    print("-" * 50)
    
    print("\n[Bilgilendirme: API Anahtarı (API Key) Nasıl Alınır?]")
    print("1. Tarayıcınızdan https://openrouter.ai/ adresine gidin.")
    print("2. Üye girişi yapın (Google hesabınızla kolayca girebilirsiniz).")
    print("3. Profil menüsünden 'Keys' sekmesine tıklayın.")
    print("4. 'Create Key' butonuna basarak yeni bir anahtar oluşturun ve kopyalayın.")
    print("-" * 50)
    
   
    while True:
        api_key = input("\nLütfen kopyaladığınız OpenRouter API Anahtarını yapıştırın: ").strip()
        
        
        if not api_key:
            print("[UYARI] API anahtarı boş bırakılamaz!")
            continue
            
        
        if not api_key.startswith("sk-or-v1-"):
            print("[UYARI] Hatalı başlangıç! OpenRouter anahtarları her zaman 'sk-or-v1-' ile başlar.")
            continue
            
       
        if len(api_key) != 73:
            print(f"[UYARI] Geçersiz uzunluk! Girdiğiniz anahtar {len(api_key)} karakter. (73 Olmalı)")
            continue
            
       
        print("\n[SİSTEM] Anahtar formatı doğru. OpenRouter sunucusunda geçerliliği test ediliyor...")
        try:
            
            test_url = "https://openrouter.ai/api/v1/auth/key"
            headers = {"Authorization": f"Bearer {api_key}"}
            response = requests.get(test_url, headers=headers, timeout=5)
            
            if response.status_code == 401:
                print("[UYARI REDDEDİLDİ] Anahtarın boyutu doğru ama İÇERİĞİ YANLIŞ veya SAHTE!")
                print("OpenRouter sunucusu bu anahtarı tanımadı. Lütfen harfleri değiştirmeden orijinal anahtarı yapıştırın.")
                continue
            elif response.status_code == 200:
                print("[BAŞARILI] API Anahtarı ONAYLANDI! Gerçek ve aktif bir anahtar girdiniz.")
            else:
                
                print(f"[BİLGİ] Sunucu yanıtı: {response.status_code}. Doğrulamaya güvenilip devam ediliyor.")
                
        except (requests.ConnectionError, requests.Timeout):
            print("\n" + "!"*60)
            print(" [KRİTİK HATA] İnternet bağlantısı olmadığı için API anahtarı doğrulanamıyor!")
            print(" Sistemin çevrimdışı çalışması mümkün değildir.")
            print("!"*60)
            
            
            aktif_internet_kontrolü() 
            
            print("\n[SİSTEM] Bağlantı sağlandı! Güvenlik için lütfen şifrenizi tekrar yapıştırın.\n")
            continue 
        break 
    
    print("\n[Aktif Yapay Zeka Modelleri]")
    models = config_data.get("aktif_modeller", [])
    
    for index, model in enumerate(models):
        print(f"{index + 1}. {model['isim']}")
        
    while True:
        try:
            choice = int(input(f"\nLütfen bir model seçiniz (1-{len(models)}): "))
            if 1 <= choice <= len(models):
                selected_model = models[choice - 1]
                print(f"\n[BAŞARILI] {selected_model['isim']} motoru seçildi.")
                return api_key, selected_model
            else:
                print(f"[UYARI] Lütfen 1 ile {len(models)} arasında bir rakam giriniz.")
        except ValueError:
            print("[UYARI] Hatalı giriş! Lütfen sadece rakam kullanınız.")


def ask_openrouter(api_key, api_url, model_code, system_prompt, user_message):
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": model_code,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message}
        ]
    }
    
    try:
        response = requests.post(api_url, headers=headers, json=payload, timeout=7)
        response.raise_for_status() 
        
        data = response.json()
        return data['choices'][0]['message']['content']
        
    except requests.exceptions.ConnectionError:
        return "[SİSTEM UYARISI] İnternet bağlantısı kurulamadı! Lütfen bilgisayarınızın ağ bağlantısını kontrol edip tekrar deneyin."
    except requests.exceptions.Timeout:
        return "[SİSTEM UYARISI] Sunucuya bağlanırken süre aşıldı! Bilgisayarınızın internet hızı yavaşlamış olabilir, lütfen tekrar deneyin."
    except requests.exceptions.HTTPError as e:
        return f"[SİSTEM UYARISI] OpenRouter İsteği Reddetti (Kod: {e.response.status_code})\nSunucu Diyor ki: {e.response.text}"
    except Exception as e:
        return f"[SİSTEM UYARISI] Beklenmeyen bir hata oluştu: {str(e)}"

def save_chat_log(username, model_name, user_msg, ai_msg):
    import os, csv
    from datetime import datetime
    
    LOG_FILE = "sohbet_loglari.csv"
    file_exists = os.path.exists(LOG_FILE)
    
    with open(LOG_FILE, mode="a", encoding="utf-8-sig", newline="") as file:
        writer = csv.writer(file, delimiter=";")
        if not file_exists:
            writer.writerow(["Tarih", "Kullanıcı Adı", "Kullanılan Model", "Kullanıcı Sorusu", "Yapay Zeka Cevabı"])
        
        zaman = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        writer.writerow([zaman, username, model_name, user_msg, ai_msg])


if __name__ == "__main__":
    aktif_internet_kontrolü()
    
    active_user = welcome_and_consent()
    
    aktif_internet_kontrolü()
    
    system_config = load_config()
    user_api_key, chosen_model = get_api_key_and_model(system_config)
    
    system_prompt = system_config.get("sistem_komutu", "Sen yardımcı bir asistansın.")
    api_url = system_config.get("api_url", "https://openrouter.ai/api/v1/chat/completions")
    
    print("\n" + "="*50)
    print(f"     {chosen_model['isim'].upper()} İLE SOHBET BAŞLADI")
    print("     (Çıkmak için 'çıkış', model değiştirmek için 'menü' yazın)")
    print("="*50)
    
    while True:
        user_input = input(f"\n[{active_user}] Sen: ").strip()
        
        if user_input.lower() in ['çıkış', 'q', 'exit', 'quit']:
            print("\nBursa Dijital Rehberi'ni kullandığınız için teşekkürler. İyi günler!")
            break
            
        if user_input.lower() in ['menü', 'değiştir', 'geri']:
            print("\n[SİSTEM] Model Seçim Menüsüne Dönülüyor (Şifreniz hafızada korundu)...")
            models = system_config.get("aktif_modeller", [])
            for index, model in enumerate(models):
                print(f"{index + 1}. {model['isim']}")
                
            while True:
                try:
                    choice = int(input(f"\nLütfen yeni bir motor seçiniz (1-{len(models)}): "))
                    if 1 <= choice <= len(models):
                        chosen_model = models[choice - 1]
                        print(f"\n[BAŞARILI] {chosen_model['isim']} motoruna geçiş yapıldı!")
                        print("Kaldığınız yerden sohbete devam edebilirsiniz.")
                        break
                    else:
                        print(f"[UYARI] Lütfen 1 ile {len(models)} arasında bir rakam giriniz.")
                except ValueError:
                    print("[UYARI] Lütfen sadece rakam kullanınız.")
            continue 
            
        if not user_input:
            continue
            
        if len(user_input) < 3:
            print("\n[UYARI] Çok kısa veya anlamsız bir giriş yaptınız!")
            print("Lütfen sisteme en az 3 harften oluşan, anlamlı bir soru veya kelime giriniz.")
            continue
            
        aktif_internet_kontrolü()
            
        print(f"[{chosen_model['isim']}] Düşünüyor...")
        
        cevap = ask_openrouter(
            api_key=user_api_key,
            api_url=api_url,
            model_code=chosen_model['kod'],
            system_prompt=system_prompt,
            user_message=user_input
        )
        
        print(f"\nRehber: {cevap}")
        
        if "[SİSTEM UYARISI]" in cevap or "HATA" in cevap:
            print("\n" + "*"*60)
            print(" 💡 AKILLI İPUCU: Bu motor şu an OpenRouter'da arızalı!")
            print(" Programı kapatmanıza gerek yok. Sadece 'menü' yazarak")
            print(" anında çalışan yedek motorlardan birine geçin.")
            print("*"*60)
        
        save_chat_log(active_user, chosen_model['isim'], user_input, cevap)
