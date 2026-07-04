from google import genai

client = genai.Client(api_key="AIzaSyClIy59T8Gf3aLRj1UXQI7yhIQx5ISGCP0")

print("--- YAPAY ZEKA ASİSTANI BAŞLATILDI ---")
print("Çıkmak için 'q' yazabilirsiniz.\n")

while True:
    soru = input("Siz: ")

    if soru.lower() == "q":
        print("Çıkış Yapılıyor")
        break
    
    if soru == "":
        continue

    print("Yapay Zeka düşünüyor")

    cevap = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=soru
    )
    
    print("Cevap:", cevap.text)
    print("-" * 30)
