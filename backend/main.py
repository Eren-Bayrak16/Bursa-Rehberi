from typing import Optional, List
from fastapi import FastAPI, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import mysql.connector
import os
import requests
import time
import uuid
from security import encrypt_api_key, decrypt_api_key

load_dotenv()

app = FastAPI()

# ALLOWED_ORIGINS .env icinde virgulle ayrilmis liste olarak tanimlanmali,
# ornek: ALLOWED_ORIGINS=https://bursarehberi.com,https://www.bursarehberi.com
_allowed_origins_raw = os.environ.get("ALLOWED_ORIGINS", "*")
ALLOWED_ORIGINS = [o.strip() for o in _allowed_origins_raw.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Ortam degiskenleri (.env) ---
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL")
if not ADMIN_EMAIL:
    raise RuntimeError("ADMIN_EMAIL ortam degiskeni tanimli degil (.env dosyasina ekleyin).")

DB_HOST = os.environ.get("DB_HOST", "127.0.0.1")
DB_USER = os.environ.get("DB_USER")
DB_PASSWORD = os.environ.get("DB_PASSWORD", "")
DB_NAME = os.environ.get("DB_NAME", "bursa_rehberi")
if not DB_USER:
    raise RuntimeError("DB_USER ortam degiskeni tanimli degil (.env dosyasina ekleyin).")

SYSTEM_GUEST_EMAIL = "system_guest_shared_key@bursa.local"
MAX_CONTEXT_TOKENS = 8000


class MessageItem(BaseModel):
    role: str
    content: str

class PromptRequest(BaseModel):
    prompt: Optional[str] = None
    messages: Optional[List[MessageItem]] = None
    kullanici_adi: str = "Misafir"
    user_api_key: Optional[str] = None
    model_secimi: Optional[str] = None
    chat_id: Optional[str] = None

class ModelRequest(BaseModel):
    model_key: str
    model_name: str
    is_default_free: Optional[bool] = False

class SystemKeyRequest(BaseModel):
    system_api_key: str

class TestKeyRequest(BaseModel):
    api_key: str


def get_db_connection():
    conn = mysql.connector.connect(
        host=DB_HOST,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME,
        charset="utf8mb4",
        collation="utf8mb4_unicode_ci"
    )
    cursor = conn.cursor()
    cursor.execute("SET NAMES utf8mb4")
    cursor.execute("SET CHARACTER SET utf8mb4")
    cursor.execute("SET character_set_connection=utf8mb4")
    cursor.close()
    return conn


def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            encrypted_api_key TEXT
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS models (
            id INT AUTO_INCREMENT PRIMARY KEY,
            model_key VARCHAR(255) UNIQUE NOT NULL,
            model_name VARCHAR(255) NOT NULL,
            is_active BOOLEAN DEFAULT TRUE,
            is_default_free BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS chat_history_v3 (
            id INT AUTO_INCREMENT PRIMARY KEY,
            chat_id VARCHAR(100),
            request_id VARCHAR(100),
            prompt TEXT,
            response TEXT,
            kullanici_adi VARCHAR(255),
            model_adi VARCHAR(255),
            sure FLOAT,
            total_tokens INT DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    """)

    conn.commit()
    cursor.close()
    conn.close()


init_db()


# --- Gercek kimlik dogrulama ---
# Istemcinin "ben buyum" diye gonderdigi bir e-posta string'ine ASLA guvenilmez.
# Bunun yerine, istemcinin Authorization: Bearer <google_access_token> basligiyla
# gonderdigi jeton dogrudan Google'a soruluyor ve gercek e-posta sunucu
# tarafinda tespit ediliyor.
def verify_google_access_token(authorization: Optional[str] = Header(None)) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Giris yapmaniz gerekiyor.")
    token = authorization.split(" ", 1)[1].strip()
    if not token:
        raise HTTPException(status_code=401, detail="Giris yapmaniz gerekiyor.")
    try:
        resp = requests.get(
            "https://www.googleapis.com/oauth2/v3/tokeninfo",
            params={"access_token": token},
            timeout=5,
        )
    except requests.RequestException:
        raise HTTPException(status_code=503, detail="Kimlik dogrulama servisine ulasilamadi.")
    if resp.status_code != 200:
        raise HTTPException(status_code=401, detail="Oturumunuz gecersiz veya suresi dolmus. Lutfen tekrar giris yapin.")
    data = resp.json()
    email = data.get("email")
    email_verified = data.get("email_verified") in (True, "true", "1")
    if not email or not email_verified:
        raise HTTPException(status_code=401, detail="Google hesabi dogrulanamadi.")
    return email


def require_admin(verified_email: str = Depends(verify_google_access_token)) -> str:
    if verified_email != ADMIN_EMAIL:
        raise HTTPException(status_code=403, detail="Bu islem icin yetkiniz yok!")
    return verified_email


@app.get("/api/models")
def get_models():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT id, model_key, model_name, is_default_free FROM models WHERE is_active = TRUE ORDER BY id ASC")
        models = cursor.fetchall()
        cursor.close()
        conn.close()
        return {"models": models}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Modeller getirilemedi: {str(e)}")


@app.post("/api/admin/set-system-key")
def set_system_key(request: SystemKeyRequest, admin_email: str = Depends(require_admin)):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        enc_key = encrypt_api_key(request.system_api_key)
        cursor.execute("""
            INSERT INTO users (email, encrypted_api_key) VALUES (%s, %s)
            ON DUPLICATE KEY UPDATE encrypted_api_key = VALUES(encrypted_api_key)
        """, (SYSTEM_GUEST_EMAIL, enc_key))
        conn.commit()
        cursor.close()
        conn.close()
        return {"message": "Sistem misafir API anahtarı güvenle kaydedildi."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Anahtar kaydedilemedi: {str(e)}")


@app.post("/api/models")
def add_model(request: ModelRequest, admin_email: str = Depends(require_admin)):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO models (model_key, model_name, is_default_free) VALUES (%s, %s, FALSE)",
            (request.model_key, request.model_name)
        )
        conn.commit()
        cursor.close()
        conn.close()
        return {"message": "Model başarıyla eklendi."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Model eklenirken hata oluştu: {str(e)}")


@app.post("/api/models/set-free/{model_id}")
def set_default_free_model(model_id: int, admin_email: str = Depends(require_admin)):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT is_default_free FROM models WHERE id = %s", (model_id,))
        current = cursor.fetchone()

        cursor.execute("UPDATE models SET is_default_free = FALSE")

        if current and not current["is_default_free"]:
            cursor.execute("UPDATE models SET is_default_free = TRUE WHERE id = %s", (model_id,))
            msg = "Model misafir modeli olarak seçildi."
        else:
            msg = "Misafir modeli seçimi kaldırıldı."

        conn.commit()
        cursor.close()
        conn.close()
        return {"message": msg}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Güncellenemedi: {str(e)}")


@app.delete("/api/models/{model_id}")
def delete_model(model_id: int, admin_email: str = Depends(require_admin)):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT COUNT(*) as total FROM models WHERE is_active = TRUE")
        count_res = cursor.fetchone()
        if count_res["total"] <= 1:
            cursor.close()
            conn.close()
            raise HTTPException(status_code=400, detail="Sistemde en az 1 model kalması zorunludur. Son model silinemez!")

        cursor.execute("DELETE FROM models WHERE id = %s", (model_id,))

        conn.commit()
        cursor.close()
        conn.close()
        return {"message": "Model başarıyla silindi."}
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Model silinemedi: {str(e)}")


@app.get("/api/get-key")
def get_user_key(verified_email: str = Depends(verify_google_access_token)):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT encrypted_api_key FROM users WHERE email = %s", (verified_email,))
        user_row = cursor.fetchone()
        cursor.close()
        conn.close()
        if user_row and user_row["encrypted_api_key"]:
            return {"api_key": decrypt_api_key(user_row["encrypted_api_key"])}
        return {"api_key": ""}
    except Exception:
        return {"api_key": ""}


@app.post("/api/clear-key")
def clear_user_key(verified_email: str = Depends(verify_google_access_token)):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("UPDATE users SET encrypted_api_key = NULL WHERE email = %s", (verified_email,))
        conn.commit()
        cursor.close()
        conn.close()
        return {"message": "API anahtarı veritabanından silindi."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Anahtar silinemedi: {str(e)}")


@app.post("/api/test-key")
def test_user_api_key(request: TestKeyRequest):
    clean_key = request.api_key.strip()
    if not clean_key.startswith("sk-or-v1-") or len(clean_key) != 73:
        raise HTTPException(status_code=400, detail="Hatalı Format: Anahtar 'sk-or-v1-' ile başlamalı ve 73 karakter olmalıdır.")

    response = requests.get(
        url="https://openrouter.ai/api/v1/auth/key",
        headers={"Authorization": f"Bearer {clean_key}"}
    )
    if response.status_code != 200:
        raise HTTPException(status_code=400, detail="Geçersiz API Anahtarı! OpenRouter bu anahtarı reddetti.")

    res_data = response.json()
    if "data" not in res_data:
        raise HTTPException(status_code=400, detail="Anahtar doğrulanamadı.")

    return {"message": "API anahtarı başarıyla doğrulandı!", "data": res_data.get("data")}


@app.post("/api/ask")
def ask_ai(request: PromptRequest, authorization: Optional[str] = Header(None)):
    start_time = time.time()
    try:
        raw_identity = request.kullanici_adi or "Misafir"
        is_guest = raw_identity == "Misafir"

        # Misafir degilse, istemcinin iddia ettigi e-postaya degil,
        # Google'in az once dogruladigi GERCEK e-postaya guveniyoruz.
        verified_identity = "Misafir"
        if not is_guest:
            verified_identity = verify_google_access_token(authorization)

        active_api_key = None

        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        if not is_guest:
            if request.user_api_key and request.user_api_key.strip() != "":
                clean_key = request.user_api_key.strip()
                if not clean_key.startswith("sk-or-v1-") or len(clean_key) != 73:
                    raise HTTPException(status_code=400, detail="API anahtarı formatı veya uzunluğu hatalı.")

                enc_key = encrypt_api_key(clean_key)
                cursor.execute("""
                    INSERT INTO users (email, encrypted_api_key) VALUES (%s, %s)
                    ON DUPLICATE KEY UPDATE encrypted_api_key = VALUES(encrypted_api_key)
                """, (verified_identity, enc_key))
                conn.commit()
                active_api_key = clean_key
            else:
                cursor.execute("SELECT encrypted_api_key FROM users WHERE email = %s", (verified_identity,))
                user_row = cursor.fetchone()
                if user_row and user_row["encrypted_api_key"]:
                    active_api_key = decrypt_api_key(user_row["encrypted_api_key"])

            if not active_api_key or active_api_key.strip() == "":
                cursor.close()
                conn.close()
                raise HTTPException(
                    status_code=401,
                    detail="OpenRouter API anahtarınız silinmiş veya geçersiz hale gelmiş. Lütfen yeni bir anahtar girin."
                )
        else:
            cursor.execute("SELECT encrypted_api_key FROM users WHERE email = %s", (SYSTEM_GUEST_EMAIL,))
            sys_row = cursor.fetchone()
            if sys_row and sys_row["encrypted_api_key"]:
                active_api_key = decrypt_api_key(sys_row["encrypted_api_key"])

        selected_model = None
        if is_guest:
            cursor.execute("SELECT model_key FROM models WHERE is_default_free = TRUE LIMIT 1")
            free_model_row = cursor.fetchone()
            if free_model_row:
                selected_model = free_model_row["model_key"]
            else:
                cursor.close()
                conn.close()
                raise HTTPException(
                    status_code=400,
                    detail="Sistemde misafirler için seçilmiş bir model bulunmuyor. Lütfen admin panelinden bir modeli 'Misafir Modeli Yap' olarak belirleyin."
                )
        else:
            selected_model = request.model_secimi
            if not selected_model:
                cursor.execute("SELECT model_key FROM models WHERE is_active = TRUE LIMIT 1")
                fallback_row = cursor.fetchone()
                if fallback_row:
                    selected_model = fallback_row["model_key"]
                else:
                    cursor.close()
                    conn.close()
                    raise HTTPException(status_code=400, detail="Sistemde aktif model bulunmuyor.")

        cursor.close()
        conn.close()

        if not active_api_key or active_api_key.strip() == "":
            raise HTTPException(
                status_code=401,
                detail="OpenRouter API anahtarınız silinmiş veya geçersiz hale gelmiş. Lütfen yeni bir anahtar girin."
            )

        check_res = requests.get(
            url="https://openrouter.ai/api/v1/auth/key",
            headers={"Authorization": f"Bearer {active_api_key}"}
        )
        if check_res.status_code != 200:
            if not is_guest:
                try:
                    c = get_db_connection()
                    cur = c.cursor()
                    cur.execute("UPDATE users SET encrypted_api_key = NULL WHERE email = %s", (verified_identity,))
                    c.commit()
                    cur.close()
                    c.close()
                except Exception:
                    pass
            raise HTTPException(
                status_code=401,
                detail="OpenRouter API anahtarınız silinmiş veya geçersiz hale gelmiş. Lütfen yeni bir anahtar girin."
            )

        messages_payload = [
            {
                "role": "system",
                "content": "Sen yalnızca Bursa şehri için uzman bir yapay zeka rehberisin. Görevin sadece Bursa'nın tarihi, kültürü, yemekleri, yerleri hakkında bilgi vermektir. Kullanıcı hangi dilde soru sorarsa sorsun daima akıcı ve eksiksiz bir şekilde TÜRKÇE yanıt vermelisin."
            }
        ]

        if request.messages and len(request.messages) > 0:
            for msg in request.messages:
                messages_payload.append({"role": msg.role, "content": msg.content})
        elif request.prompt:
            messages_payload.append({"role": "user", "content": request.prompt})

        response = requests.post(
            url="https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {active_api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": selected_model,
                "messages": messages_payload
            }
        )

        res_data = response.json()

        if response.status_code != 200 or "choices" not in res_data:
            error_detail = res_data.get("error", {})
            error_msg = error_detail.get("message", "Bilinmeyen AI servis hatası")
            lower_msg = error_msg.lower()

            if response.status_code == 402 or "requires more credits" in lower_msg or "can only afford" in lower_msg or "credit" in lower_msg or "balance" in lower_msg or "insufficient" in lower_msg:
                raise HTTPException(
                    status_code=402,
                    detail="OpenRouter hesabınızda bu işlem için yeterli bakiye veya kredi kalmadı. Lütfen hesabınızı kontrol edin."
                )

            if response.status_code in [401, 403] or "user not found" in lower_msg or "invalid api key" in lower_msg or "unauthorized" in lower_msg or "key" in lower_msg or "auth" in lower_msg or "not found" in lower_msg:
                if not is_guest:
                    try:
                        c = get_db_connection()
                        cur = c.cursor()
                        cur.execute("UPDATE users SET encrypted_api_key = NULL WHERE email = %s", (verified_identity,))
                        c.commit()
                        cur.close()
                        c.close()
                    except Exception:
                        pass
                raise HTTPException(
                    status_code=401,
                    detail="OpenRouter API anahtarınız silinmiş veya geçersiz hale gelmiş. Lütfen yeni bir anahtar girin."
                )

            raise HTTPException(status_code=400, detail=f"Yapay Zeka Servis Hatası: {error_msg}")

        ai_response_text = res_data["choices"][0]["message"]["content"]
        usage_info = res_data.get("usage", {})
        total_tokens_used = usage_info.get("total_tokens", 0) or max(1, len(messages_payload[-1]["content"]) + len(ai_response_text)) // 4

        usage_ratio = total_tokens_used / MAX_CONTEXT_TOKENS
        context_percentage = int(usage_ratio * 100)
        if context_percentage > 100:
            context_percentage = 100

        context_warning = context_percentage >= 80

        elapsed_time = round(time.time() - start_time, 2)
        if elapsed_time <= 0:
            elapsed_time = 0.15

        chat_id = request.chat_id if request.chat_id else str(uuid.uuid4())[:8]
        request_id = "req_" + str(uuid.uuid4())[:10]

        last_prompt_text = messages_payload[-1]["content"]
        if last_prompt_text.strip() != "Test":
            try:
                conn = get_db_connection()
                cursor = conn.cursor()
                cursor.execute(
                    "INSERT INTO chat_history_v3 (chat_id, request_id, prompt, response, kullanici_adi, model_adi, sure, total_tokens) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)",
                    (chat_id, request_id, last_prompt_text, ai_response_text, verified_identity, selected_model, elapsed_time, total_tokens_used)
                )
                conn.commit()
                cursor.close()
                conn.close()
            except Exception as db_error:
                print(f"VERİTABANI HATASI: {db_error}")

        return {
            "response": ai_response_text,
            "total_tokens": total_tokens_used,
            "context_percentage": context_percentage,
            "context_warning": context_warning
        }

    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Beklenmeyen bir hata oluştu: {str(e)}")


@app.get("/api/admin/stats")
def get_admin_stats(admin_email: str = Depends(require_admin)):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT id, chat_id, request_id, prompt, response, kullanici_adi, model_adi, sure, total_tokens, created_at FROM chat_history_v3 ORDER BY id DESC")
        history = cursor.fetchall()
        cursor.execute("SELECT COUNT(*) as total_today FROM chat_history_v3 WHERE DATE(created_at) = CURDATE()")
        today_count = cursor.fetchone()["total_today"]
        cursor.execute("SELECT COUNT(DISTINCT kullanici_adi) as unique_users_today FROM chat_history_v3 WHERE DATE(created_at) = CURDATE()")
        today_unique_users = cursor.fetchone()["unique_users_today"]
        cursor.execute("SELECT COUNT(DISTINCT kullanici_adi) as total_unique_users FROM chat_history_v3")
        total_unique_users = cursor.fetchone()["total_unique_users"]
        cursor.close()
        conn.close()
        return {
            "today_count": today_count,
            "today_unique_users": today_unique_users,
            "total_unique_users": total_unique_users,
            "history": history
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Veritabanı hatası: {str(e)}")
