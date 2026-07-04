"""
dairealanı=float(3.14*3.14**2)
dairecevresi=float(3*3.14*3.14)
print("Daire Alanınız= ",dairealanı)
print("Daire Çevreniz= ",dairecevresi)
"""
website = "http://www.sadikturan.com"
course = "Python Kursu: Baştan Sona Python Programlama Rehberiniz (40 saat)"
"""
message=" Hello World "
message=message.strip()
print(message)
"""
"""
course=course.lower()
print(course)
"""
"""
x,y,z = 2,5,10
numbers =1,5,7,10,6
kullanici=int(input("birinci sayıyı giriniz:"))
kullanici1=int(input("ikinci sayıyı giriniz:"))
sonuc=kullanici*kullanici1
sonuc1=float(sonuc-(x+y+z))
print("Sonuç=",sonuc1)
"""
"""
kullanici=int(input("Vize notunuzu giriniz:"))
kullanici1=int(input("Final notunuzu giriniz:"))
vize=kullanici*(40/100)
final=kullanici1*(60/100)
sonuc=float(vize+final)
print(f"Sonucunuz={sonuc},ve geçme durumunuz={sonuc>=50}")
"""
"""
parola="1234"
ad="eren"
kp=input("şifreniz=")
ka=input("isminiz=")
sonuc= kp==parola
sonuc1= ka==ad
print(f"isminiz={sonuc1} ve parolanız={sonuc}
"""
"""
input("Adınızı giriniz=")
kilo=float(input("Kilonuzu giriniz="))
boy=float(input("Boyunuzu giriniz="))
formül=((kilo)/(boy ** 2))
zayıf=(formül>=0) and (formül<=18.4)
print("Zayif",zayıf)
"""
#if Örnekleri
"""
İsim = input("İsminizi Giriniz:")
Yas = int(input("Yaşınızı Giriniz:"))
Egitim = input("Eğitim Durumunuz Nedir:")
if(Yas>=18 and Egitim == "lise" or Egitim == "üniversite"):
    print("Eğliyet alabilirsin")
    
else:
    print("Eğliyet Alamassınız")
"""
"""
yazılı1 = int(input("1.Yazılınızı Giirniz="))
yazılı2 = int(input("2.Yazılınızı Giirniz="))
sözlü = int(input("Sözlü Notunuzu Giriniz="))
toplam = (yazılı1*0.3)+(yazılı2*0.6)+(sözlü*0.1)
if(toplam>=0) and (toplam<=24):
    print(f"ortlamanız = {toplam} Notunuz = 0")
elif(toplam>=24) and (toplam<=45):
    print(f"ortlamanız = {toplam} Notunuz = 1")

else:
    print("Bidaha Giriniz")
"""
"""
email= input("Maillinizi Giriniz:")
sifre= input("Sifrenizi Giriniz:")
print("Giriş Ekranı")
yeniemail= input("Tekrar Maillinizi Giriniz:")
yenisifre = input("Tekrar Sifrenizi Giriniz:")

if(email==yeniemail):
    if(sifre==yenisifre):
        print("Tebrikler Giriş Yaptınız")
    else:
        print("Şifreniz Yanlış.")
else:
    print("Mail Adresiniz Yanlış")
"""
"""
# For Döngüsü Örnekleri
sayilar = [1,3,5,7,9,12,19,21]
toplam = 0
for sayi in sayilar:
    toplam = toplam + sayi
print(toplam)      
"""
"""
#While Döngüsü Örnekleri
while True:
    k1=int(input("İlk sayiyı seçiniz"))
    k2=int(input("İkinci sayiyı seçiniz"))
    k3=int(input("Üçüncü sayiyı seçiniz"))
    
    if k1>k2:
        print("İlk sayı ikinciden büyük")
    if k2>k1:
        print("İkinci sayı birinciden büyük")
    if k1>k3:
        print("İlk sayı üçüncüden büyük")
    if k3>k1:
        print("Üçüncü sayı birinciden büyük")
    if k2>k3:
        print("ikinci sayı üçüncüden büyük")
    if k3>k2:
        print("üçüncü sayı ikinciden büyük")
    else:
        print("Tekrar deneyiniz")
    break
"""
# class
class Person:
    pass
    #class attributes
    address = "no information"
    #constructor (yapıcı metod)
    def_init_(self,name ,year):
        #object attributes
        self.name = name
        self.year = year
        print('init metodu çalıştı')

#object (instance)
p1 = Person('ali',1990)


print(f'name:{p1.name} year:{p1.year}')

    





























