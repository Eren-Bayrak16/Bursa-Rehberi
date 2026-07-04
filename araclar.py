import os
import csv
import requests
import PyPDF2
from datetime import datetime

def aktif_internet_kontrolü():
    """Sistem internete ihtiyaç duyduğu anlarda anlık kontrol yapar."""
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

def save_chat_log(username, model_name, user_msg, ai_msg):
    LOG_FILE = "sohbet_loglari.csv"
    file_exists = os.path.exists(LOG_FILE)
    
    with open(LOG_FILE, mode="a", encoding="utf-8-sig", newline="") as file:
        writer = csv.writer(file, delimiter=";")
        if not file_exists:
            writer.writerow(["Tarih", "Kullanıcı Adı", "Kullanılan Model", "Kullanıcı Sorusu", "Yapay Zeka Cevabı"])
        
        zaman = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        writer.writerow([zaman, username, model_name, user_msg, ai_msg])

def read_bursa_pdf():
    pdf_yolu = "bursa_katalog.pdf"
    pdf_metni = ""
    
    if os.path.exists(pdf_yolu):
        print(f"\n[SİSTEM] '{pdf_yolu}' dosyası tespit edildi. Yapay zekaya yükleniyor...")
        try:
            with open(pdf_yolu, "rb") as file:
                okuyucu = PyPDF2.PdfReader(file)
                for sayfa in okuyucu.pages:
                    text = sayfa.extract_text()
                    if text:
                        pdf_metni += text + "\n"
            print("[BAŞARILI] PDF kataloğu hafızaya alındı! Yapay zeka artık bu dökümanı biliyor.")
        except Exception as e:
            print(f"[UYARI] PDF okunamadı: {e}")
    else:
        print(f"\n[BİLGİ] '{pdf_yolu}' klasörde bulunamadı. Standart modda devam ediliyor.")
        
    return pdf_metni
