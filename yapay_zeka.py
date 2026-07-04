import requests
import araclar

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
            
            araclar.aktif_internet_kontrolü() 
            
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
        ],
        "max_tokens": 2000
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
