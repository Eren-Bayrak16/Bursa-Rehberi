import socket
from groq import Groq

def internet_var_mi():
    try:
        
        socket.setdefaulttimeout(1)
        socket.socket(socket.AF_INET, socket.SOCK_STREAM).connect(("8.8.8.8", 53))
        return True
    except socket.error:
        return False

print("*" * 75)
print(" SİSTEME GİRİŞ YAPABİLMEK İÇİN GROQ API ANAHTARI (KEY) GEREKLİDİR")
print("Eğer anahtarınız yoksa lütfen aşağıdaki adımları sırasıyla izleyin:\n")
print("ADIM 1: Tarayıcınızdan şu linke gidin: https://console.groq.com/keys")
print("ADIM 2: Kendi Google (Gmail) hesabınızla giriş yapın.")
print("ADIM 3: Ekrandaki 'Create API Key' butonuna tıklayın ve şifrenize bir isim verin.")
print("ADIM 4: ÇOK ÖNEMLİ! Ekranda beliren 'gsk_' ile başlayan şifreyi HEMEN KOPYALAYIN.")
print("(Güvenlik gereği sistem bu şifreyi size SADECE BİR KERE gösterecektir!)")
print("ADIM 5: Kopyaladığınız o şifreyi hemen aşağıya yapıştırıp Enter tuşuna basın.")
print("Sistem başlatılıyor, lütfen bekleyin...")

if not internet_var_mi():
    print("\n" + "!"*60)
    print(" KRİTİK HATA: İnternet bağlantısı algılanamadı!")
    print(" Programın çalışabilmesi için aktif bir internet bağlantısı şarttır.")
    print(" Lütfen bağlantınızı kontrol edip programı tekrar açın.")
    print("!"*60)
    input("\nKapatmak için Enter tuşuna basın...")
    exit() 

print("Bağlantı onaylandı. Hoş geldiniz!\n")
print("*" * 75 + "\n")

while True:
    MY_API_KEY = input("🔑 Lütfen 'gsk_' ile başlayan API Key'inizi Buraya Yapıştırın: ").strip()
    
    if not internet_var_mi():
        print("🌐 İNTERNET GİTTİ: Lütfen bağlantınızı kontrol edip şifreyi tekrar girin.")
        continue

    if MY_API_KEY == "":
        print("⚠️ UYARI: Hiçbir şifre girmediniz!")
        continue 
        
    elif " " in MY_API_KEY:
        print("⚠️ UYARI: Şifrenin içinde boşluk olamaz!")
        continue

    elif not MY_API_KEY.startswith("gsk_") or len(MY_API_KEY) != 56:
        print(f" HATA: Geçersiz şifre formatı!")
        print(f"İpucu: Şifreniz 'gsk_' ile başlamalı ve TAM 56 karakter olmalıdır.")
        print(f"Sizin girdiğiniz: {len(MY_API_KEY)} karakter.")
        continue
    print("⏳ Şifre sunucudan sorgulanıyor, lütfen bekleyin...")
    
    try:
        test_client = Groq(api_key=MY_API_KEY)
    
        test_client.models.list() 
        
       
        print("\n" + "="*40)
        print(" ŞİFRE ONAYLANDI: Bursa Rehberi Başarıyla Açıldı!")
        print("="*40 + "\n")
        client = test_client 
        break 

    except Exception as hata:
      
        hata_mesaji = str(hata).lower()
        
        if "401" in hata_mesaji or "auth" in hata_mesaji or "api_key" in hata_mesaji:
            print("\n GİRİŞ REDDEDİLDİ: Şifre formatı doğru ama anahtar GEÇERSİZ!")
            print("💡 Lütfen Groq Console'dan anahtarınızı tekrar kopyalayın.\n")
        else:
            print(f"️ BİR SORUN OLUŞTU: {hata_mesaji}\n")
        
    else:
        print("Şifre formatı ve uzunluğu doğrulandı! Bağlanılıyor...\n")
        break
    print("Şifreniz Groq sunucuları üzerinden doğrulanıyor, lütfen bekleyin...")
   

client = Groq(api_key=MY_API_KEY)

bursa_talimati = """
Sen Bursa şehri konusunda uzman, kibar ve yardımsever bir dijital rehbersin.
Görevin: Sadece Bursa'nın tarihi, turizmi, yemekleri ve kültürü hakkında bilgi vermek.

ÖNEMLİ KURALLAR:
1. Eğer kullanıcı anlamsız karakterler (örneğin: 'abc', 'asdf', '??', 'a b c') girerse:
   'Üzgünüm, yazdığınızı tam anlayamadım. Size Bursa'nın tarihi, gezilecek yerleri veya meşhur yemekleri hakkında yardımcı olabilirim. Ne sormak istersiniz?' de.

2. Eğer kullanıcı Bursa dışı (başka şehir, genel kültür, yazılım vb.) bir şey sorursa:
   'Ben sadece Bursa konusunda uzmanlaşmış bir rehberim. Size Bursa ile ilgili konularda (Örn: Ulu Cami, İskender Kebap, Cumalıkızık) yardımcı olmamı ister misiniz?' de.

3. Cevaplarını her zaman samimi bir Türkçe ile ver.
"""


print("\n--- BURSA DİJİTAL REHBERİ BAŞLATILDI (GROQ MOTORU)  ---")
print("Bursa hakkında her şeyi sorabilirsiniz. Kapatmak için 'çıkış' veya 'kapat' yazıp enter tuşuna basmanız yeterlidir.\n")

client = Groq(api_key=MY_API_KEY, timeout=3.0)

while True:
    soru = input(" Siz: ").strip()
    if soru.lower() in ["çık", "çıkış", "kapat", "exit", "baybay", "q"]:
        print("\n" + "="*50)
        print("Bursa Rehberi: Görüşmek üzere! Yeşil Bursa'ya yine bekleriz.")
        print("="*50)
        break
    if not soru or len(soru) <= 2:
        print("⚠ Uyarı: Lütfen Bursa hakkında tam bir soru sorun.")
        print( Örnek: 'Ulu Cami nerede?' veya 'İskender kebap meşhur mu?'")
        continue
    if not internet_var_mi():
        print(" BAĞLANTI HATASI: Şu an internete erişemiyorum!")
        print(" Lütfen modeminizi kontrol edip tekrar deneyin.\n")
        print("-" * 60)
        continue
    print("Bilgiler derleniyor, size en doğru cevabı hazırlıyorum...")

    try:
        cevap = client.chat.completions.create(
            messages=[
                {"role": "system", "content": bursa_talimati},
                {"role": "user", "content": soru}
            ],
            model="llama-3.3-70b-versatile", 
            temperature=0.6,
            max_tokens=800,
            timeout=3.0 
        )
        
        print("Rehber:", cevap.choices[0].message.content)
        print("-" * 60)

    except Exception as hata:
        hata_mesaji = str(hata).lower()
        
        if any(kelimE in hata_mesaji for kelime in ["connection", "network", "timeout", "resolution", "unreachable"]):
            print(" BAĞLANTI HATASI: Şu an internete erişemiyorum!")
            print(" Lütfen Wi-Fi/Ethernet bağlantınızı açıp 3 saniye sonra tekrar deneyin.")
        
        elif "401" in hata_mesaji or "invalid_api_key" in hata_mesaji:
            print(" ŞİFRE HATASI: Groq anahtarınız geçersiz.")
        
        else:
            print(f"️ BİR SORUN OLUŞTU: {hata_mesaji}")
            
        print("-" * 60)

    except Exception as hata:
        hata_mesaji = str(hata).lower()
        
        if "connection" in hata_mesaji or "network" in hata_mesaji or "unreachable" in hata_mesaji:
            print(" İNTERNET HATASI: Şu an bulut sunucularına bağlanamıyorum.")
            print(" Lütfen Wi-Fi veya Ethernet bağlantınızı kontrol edip tekrar deneyin.")
        
        elif "401" in hata_mesaji or "invalid_api_key" in hata_mesaji:
            print(" ŞİFRE HATASI: Groq sistemi bu API anahtarını kabul etmedi.")
            print(" Çözüm: Şifreyi doğru kopyaladığınızdan ve 56 karakter olduğundan emin olun.")
        
        else:
            print("️ BİR SORUN OLUŞTU:")
            print(f"Teknik detay: {hata_mesaji}")
            
        print("-" * 60)
    except Exception as hata:
        hata_mesaji = str(hata)
       
        if "401" in hata_mesaji or "invalid_api_key" in hata_mesaji.lower():
            print("HATA: Groq sistemi şifrenizi reddetti.")
            print(" Sebep: Şifrenin bir harfi eksik kopyalanmış veya şifre iptal edilmiş olabilir.")
            print(" Çözüm: Programı kapatıp açın ve şifreyi eksiksiz yapıştırdığınızdan emin olun.")
        
        else:
            print("️ BEKLENMEYEN BİR DURUM OLUŞTU:")
            print(f"Teknik detay: {hata_mesaji}")
            
        print("-" * 60)

input("\nProgramı kapatmak için lütfen Enter tuşuna basın...")
