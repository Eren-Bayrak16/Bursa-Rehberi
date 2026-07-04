print ("Bursa Gezi Rehberi")
def yemekrehberi():
    print(">>> BURSA LEZZET DURAKLARI:")
    print("1. İskender Kebap (Mavi Dükkan veya Uludağ Kebapçısı)")
    print("2. Pideli Köfte (Kayhan Çarşısı)")
    print("3. Cantık (Pidecioğlu)")
    print("4. Tatlı: Kestane Şekeri (Kafkas) veya Süt Helvası")
def gezirehberi():
    print(">>> GEZİLECEK YERLER LİSTESİ:")
    print("1. Ulu Cami (Mutlaka görülmeli)")
    print("2. Kozahan (İpekçiler Çarşısı - Çay molası)")
    print("3. Tophane (Şehir manzarası)")
    print("4. Cumalıkızık Köyü (Tarihi evler)")
def ulaşım():
    print(">>> ULAŞIM BİLGİLERİ:")
    print("- Şehir içi: Bursaray (Metro) ve Sarı Otobüsler.")
    print("- İstanbul'a: BUDO veya İDO feribotları.")
    print("- Uludağ'a: Teleferik ile çıkabilirsiniz.")
    print("- Ödeme için 'BursaKart' almanız gerekir.")
def tarih():
    print(">>> TARİHİ BİLGİLER:")
    print("- Bursa, Osmanlı Devleti'nin ilk başkentidir.")
    print("- Osman Gazi ve Orhan Gazi türbeleri Tophane'dedir.")
    print("- Yeşil Türbe, şehrin simgelerinden biridir.")
while True:
    print("Merak ettiğiniz konuyu yazın: (Yemek, Gezi, Ulaşım, Tarih)\n")
    rehber = input("Seçiminiz (Çıkmak için 'q' basın): ")
    if rehber == "q":
     print("Programdam Çıkılıyor.")
     print("İyi Günler")
     break
    elif "Yemek" in rehber or "yiyebilirim" in rehber or "yemek" in rehber:
        yemekrehberi()
    elif "Ulaşım" in rehber or "tren" in rehber or "otobüs" in rehber or "nasıl gidebilirim" in rehber or "ulaşım" in rehber:
        ulaşım()
    elif "Cami" in rehber or "köy" in rehber or "nereye gidebilirim" in rehber or "Gezi" in rehber or "gezi" in rehber:
        gezirehberi()
    elif "Tarih" in rehber or "başkent" in rehber or "osmanlı" in rehber or "tarih" in rehber:
        tarih()
    else:
        print("Dediğinizi anlayamadım yemek,ulaşım,tarih,gezi kelimelerinden birini kullanırsanız yardımcı olabilirim.")    
