import veritabani
import yapay_zeka
import araclar

if __name__ == "__main__":
    araclar.aktif_internet_kontrolü()
    
    active_user = veritabani.welcome_and_consent()
    
    araclar.aktif_internet_kontrolü()
    
    system_config = veritabani.load_config()
    user_api_key, chosen_model = yapay_zeka.get_api_key_and_model(system_config)
    
    system_prompt = system_config.get("sistem_komutu", "Sen yardımcı bir asistansın.")
    
    katalog_metni = araclar.read_bursa_pdf()
    if katalog_metni:
        system_prompt += f"\n\nDİKKAT! Aşağıda sana sağlanan 'Bursa Kataloğu' bilgilerini BİRİNCİL KAYNAK olarak kullan. Kullanıcı sana bir şey sorduğunda, cevap katalogda varsa mutlaka bu detayları ver. Ancak eğer sorunun cevabı katalogda YOKSA, o zaman kendi genel kültürünü ve eğitim verilerini kullanarak mantıklı bir cevap ver.\n\n--- BURSA KATALOĞU İÇERİĞİ ---\n{katalog_metni[:15000]}\n----------------------"
        
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
            
        araclar.aktif_internet_kontrolü()
            
        print(f"[{chosen_model['isim']}] Düşünüyor...")
        
        cevap = yapay_zeka.ask_openrouter(
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
        
        araclar.save_chat_log(active_user, chosen_model['isim'], user_input, cevap)
