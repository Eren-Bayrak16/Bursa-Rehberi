import os
import json
import sys
import socket
import csv
from datetime import datetime
import warnings
warnings.filterwarnings("ignore")
from openai import OpenAI

CONFIG_FILE = "config.json"
LOG_FILE = "sohbet_gecmisi.csv"

bursa_talimati = """
Sen Bursa şehri konusunda uzman, kibar ve yardımsever bir dijital rehbersin.
Görevin: Sadece Bursa'nın tarihi, turizmi, yemekleri ve kültürü hakkında bilgi vermek.

ÖNEMLİ KURALLAR:
1. Eğer kullanıcı anlamsız karakterler (örneğin: 'abc', 'asdf', '??') girerse:
   'Üzgünüm, yazdığınızı tam anlayamadım. Size Bursa'nın tarihi veya meşhur yemekleri hakkında yardımcı olabilirim. Ne sormak istersiniz?' de.
2. Eğer kullanıcı Bursa dışı bir şey sorarsa:
   'Ben sadece Bursa konusunda uzmanlaşmış bir rehberim. Size Bursa ile ilgili konularda yardımcı olmamı ister misiniz?' de.
3. Cevaplarını her zaman samimi bir Türkçe ile ver.
"""



def is_internet_available():
    try:
        socket.setdefaulttimeout(3)
        socket.socket(socket.AF_INET, socket.SOCK_STREAM).connect(("8.8.8.8", 53))
        return True
    except socket.error:
        return False


def setup_profile():
    profiles = {}
    
    if os.path.exists(CONFIG_FILE):
        with open(CONFIG_FILE, "r", encoding="utf-8") as file:
            profiles = json.load(file)
            
    if profiles:
        user_names = list(profiles.keys())
        
        while True:
            print("\n--- KULLANICI SEÇİMİ ---")
            for i, name in enumerate(user_names):
                print(f"{i+1}- {name}")
            print(f"{len(user_names)+1}- Yeni Profil Ekle")
            
            choice = input("\nLütfen bir numara seçin (Çıkış için 'q'): ").strip()
            
            if choice.isdigit() and 1 <= int(choice) <= len(user_names):
                selected_name = user_names[int(choice)-1]
                print(f"\nTekrar hoş geldin, {selected_name}! giriş yapılıyor...")
                return profiles[selected_name] 
                
            elif choice == str(len(user_names) + 1):
                print("\nYeni profil oluşturma ekranına yönlendiriliyorsunuz...")
                break 
                
            elif choice.lower() in ['q', 'çıkış', 'exit']:
                print("\nSistemden çıkılıyor. Görüşmek üzere!")
                sys.exit()
                
            else:
                print(f"\nHATA: '{choice}' geçerli bir seçenek değil.")
                print(f"Lütfen 1 ile {len(user_names) + 1} arasında bir sayı girin.")
                print("-" * 30)

    print("\n" + "="*40)
    print("--- SİSTEM GİRİŞİ VE YENİ KAYIT ---")
    print("UYARI: Bu program, gelişim amacıyla sohbet verilerinizi kaydedecektir.")
    
    while True:
        consent = input("Devam etmek için izin veriyor musunuz? (evet/hayır): ").strip().lower()
        
        if consent in ["e", "evet"]:
            break
        elif consent in ["h", "hayir", "hayır"]:
            print("Bilgi: Veri kayıt izni verilmediği için program sonlandırılıyor.")
            sys.exit()
        else:
            print("HATA: Geçersiz giriş! Lütfen sadece 'evet' veya 'hayır' yazın.\n")
            
    new_name = input("Profil isminiz nedir?: ").strip()
    new_settings = {"user_name": new_name, "selected_api": "", "router_model": "", "api_key": ""}
    
    profiles[new_name] = new_settings
    save_config(profiles)
    print(f"Bilgi: {new_name} profili başarıyla oluşturuldu.")
    return new_settings

def save_config(all_profiles_dict):
    with open(CONFIG_FILE, "w", encoding="utf-8") as file:
        json.dump(all_profiles_dict, file, indent=4, ensure_ascii=False)

def update_single_profile(profile_data):
    if os.path.exists(CONFIG_FILE):
        with open(CONFIG_FILE, "r", encoding="utf-8") as file:
            all_profiles = json.load(file)
        all_profiles[profile_data["user_name"]] = profile_data
        save_config(all_profiles)



def get_api_setup(profile_data):
    if profile_data.get("api_key"):
        return profile_data
    while True: 
        print("\n--- HANGİ YAPAY ZEKAYI KULLANMAK İSTİYORSUNUZ? ---")
        print("1. Google Gemini (Çok Hızlı ve Akıcı)")
        print("2. Meta Llama 3.3 (Eski adıyla Groq - Ücretsiz ve Zeki)")
        print("3. OpenAI ChatGPT (En Popüler)")
        
        while True:
            choice = input("\nLütfen bir numara seçin (1/2/3): ").strip()
            
            if choice == "1":
                profile_data["selected_api"] = "Gemini"
                profile_data["router_model"] = "google/gemini-2.5-flash"
                break
            elif choice == "2":
                profile_data["selected_api"] = "Llama"
                profile_data["router_model"] = "meta-llama/llama-3.3-70b-instruct:free"
                break
            elif choice == "3":
                profile_data["selected_api"] = "ChatGPT"
                profile_data["router_model"] = "openai/gpt-3.5-turbo"
                break
            else:
                print("HATA: Geçersiz seçim! Lütfen 1, 2 veya 3 yazın.")

        print("\n" + "="*60)
        print(f" {profile_data['selected_api'].upper()} MOTORU İÇİN EVRENSEL KURULUM REHBERİ")
        print("="*60)
        print("Sistemimiz, tüm yapay zekaları tek şifreyle (OpenRouter) çalıştırır.")
        print("ADIM 1: Tarayıcınızdan şu linke gidin: https://openrouter.ai/keys")
        print("ADIM 2: 'Continue with Google' diyerek giriş yapın.")
        print("ADIM 3: Ekranda büyük 'Create Key' butonuna tıklayın.")
        print("ADIM 4: Şifrenize bir isim (örn: bursa_projesi) verip 'Create' deyin.")
        print("ADIM 5: Ekranda beliren 'sk-or-v1-' ile başlayan şifreyi KOPYALAYIN.")
        print("-" * 60)

        basarili_giris = False 

        while True:
            key = input(f"\nLütfen OpenRouter API Key'inizi yapıştırın (Menüye dönmek için 'geri' yazın): ").strip()
            
            
            if key.lower() in ["geri", "menü", "menu", "kapat", "iptal", "q", "çık"]:
                print("\n[SİSTEM]: İşlem iptal edildi. Ana menüye dönülüyor...")
                break 
            
            if not key.startswith("sk-or-v1-"):
                print("\nHATA: OpenRouter şifreniz 'sk-or-v1-' ile başlamalıdır!")
                print("Lütfen yukarıdaki rehberi takip ederek OpenRouter'dan şifre alın.")
                continue
                
            if " " in key:
                print("\nHATA: Şifrenin içinde boşluk olamaz! Lütfen temiz bir şekilde kopyalayın.")
                continue
                
            if len(key) < 73:
                print(f"\nHATA: Şifreyi EKSİK kopyaladınız!")
                print(f"OpenRouter şifreleri en az 73 karakterdir. Sizin girdiğiniz: {len(key)}")
                continue
                
            if len(key) > 73:
                print(f"\nHATA: Şifre FAZLA UZUN veya hatalı karakterler içeriyor!")
                print(f"Sizin girdiğiniz: {len(key)} karakter. (Boşlukları da kopyalamış olabilirsiniz)")
                continue
                
            print(f"\n[SİSTEM]: Şifre formatı ve uzunluğu doğru. {profile_data['selected_api']} motoru test ediliyor...")
            
            try:
                test_client = OpenAI(
                    base_url="https://openrouter.ai/api/v1",
                    api_key=key,
                )
                
                test_client.chat.completions.create(
                    model=profile_data["router_model"],
                    messages=[{"role": "user", "content": "ping"}],
                    max_tokens=1
                )
                
                print(f"BAŞARILI: {profile_data['selected_api']} motoruna başarıyla bağlandınız!")
                profile_data["api_key"] = key
                basarili_giris = True
                break 

            except Exception as e:
                hata = str(e).lower()
                
                if "401" in hata or "invalid" in hata:
                    print("\n[HATA]: Şifreniz sahte veya geçersiz. Lütfen OpenRouter'dan yeni şifre alın.")
                elif "429" in hata or "rate_limit" in hata or "too many" in hata:
                    print(f"\n[SUNUCU MEŞGUL]: Seçtiğiniz {profile_data['selected_api']} motorunda şu an dünya genelinde aşırı yoğunluk var.")
                    print("Çözüm: Lütfen 1-2 dakika bekleyip şifrenizi tekrar yapıştırın veya 'geri' yazarak başka motor seçin.")
                elif "402" in hata or "credit" in hata or "insufficient" in hata:
                    print(f"\n[BAKİYE YETERSİZ]: {profile_data['selected_api']} motoru ücretli ve OpenRouter bakiyeniz bitmiş.")
                    print("Çözüm: Lütfen 'geri' yazarak menüden ücretsiz motorları (Gemini veya Llama) seçin.")
                else:
                    print(f"\n[BAĞLANTI HATASI]: Sunucuya ulaşılamıyor. İnternetinizi kontrol edip tekrar deneyin.")
                continue

        
        if basarili_giris:
            break 

    update_single_profile(profile_data)
    return profile_data



def ask_ai(question, profile_data):
    api_key = profile_data["api_key"]
    router_model = profile_data.get("router_model", "google/gemini-2.5-flash")
    try:
        client = OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=api_key,
        )
        
        response = client.chat.completions.create(
            model=router_model,
            messages=[
                {"role": "system", "content": bursa_talimati},
                {"role": "user", "content": question}
            ],
            max_tokens=1000
        )
        
        return response.choices[0].message.content, router_model

    except Exception as e:
        return f"[BAĞLANTI HATASI]: Sunucuya ulaşılamıyor. Detay: {e}", "Hata Modu"

def log_to_csv(profile_data, question, answer, model_name):
    file_exists = os.path.exists(LOG_FILE)
    try:
        with open(LOG_FILE, "a", newline="", encoding="utf-8-sig") as file:
            writer = csv.writer(file, delimiter=';')
            
            if not file_exists:
                writer.writerow(["Tarih", "Kullanıcı", "Soru", "Cevap", "Sağlayıcı", "Model"])
            
            zaman = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            temiz_cevap = answer.replace("\n", " ").replace(";", ",")
            
            writer.writerow([zaman, profile_data["user_name"], question, temiz_cevap, profile_data["selected_api"], model_name])
    except Exception as e:
        print(f"[UYARI]: Kayıt yapılamadı: {e}")




if __name__ == "__main__":
    
    current_profile = setup_profile()
    
    current_profile = get_api_setup(current_profile)
    
    print("\n" + "*" * 60)
    print("SİSTEM BAĞLANTISI KONTROL EDİLİYOR...")
    if not is_internet_available():
        print("KRİTİK HATA: İnternet bağlantısı algılanamadı!")
        print("Lütfen bağlantınızı kontrol edip programı tekrar açın.")
        input("\nKapatmak için Enter tuşuna basın...")
        sys.exit()
    print("Bağlantı başarılı!")
    print("*" * 60 + "\n")

    print("="*60)
    print(f"    BURSA DİJİTAL REHBERİ BAŞLATILDI ({current_profile['selected_api']} Motoru)")
    print("="*60)
    print("Bursa hakkında her şeyi sorabilirsiniz. Kapatmak için 'çıkış' veya 'kapat' yazın.\n")

    while True:
        soru = input("Siz: ").strip()
        
        if soru.lower() in ["çık", "çıkış", "kapat", "exit", "baybay", "q"]:
            print("\n" + "="*50)
            print("Bursa Rehberi: Görüşmek üzere! Yeşil Bursa'ya yine bekleriz.")
            print("="*50)
            break
            
        if len(soru) <= 2:
            print("Uyarı: Lütfen Bursa hakkında tam bir soru sorun.")
            continue
            
        print("Bilgiler derleniyor, size en doğru cevabı hazırlıyorum...")
        cevap, kullanılan_model = ask_ai(soru, current_profile)
        
        print(f"\nRehber: {cevap}")
        print(f"(Kullanılan Model: {kullanılan_model})")

        log_to_csv(current_profile, soru, cevap, kullanılan_model)
