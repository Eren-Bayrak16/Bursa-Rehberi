print("Hoş geldiniz")
kka = input("Kullanıcı Adı Belirleyiniz:")
kpa = input("Parola Belirleyiniz:")

defkka = kka
defkpa = kpa

while(True):
    gka = input("Kullanıcı Adı Giriniz:")
    gpa = input("Parolanızı Giriniz:")
    if(defkka==gka) and (defkpa==gpa):
        print("Başarıyla Kaydoldunuz")
        break
    elif(defkka!=gka) and (defkpa==gpa):
        print("Kullanıcı Adı Yanlış")
        print("Bidaha Deneyiniz")
    elif(defkka==gka) and (defkpa!=gpa):
        print("Parolanız Yanlış")
        print("Bidaha Deneyiniz")
    else:
        print("Kullanıcı adı ve Parola yanlış")
    

    
