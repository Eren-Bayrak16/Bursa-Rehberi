from typing import Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import mysql.connector
import os
import requests
import time
import uuid
from security import encrypt_api_key, decrypt_api_key

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ADMIN_EMAIL = "bayrakeren228@gmail.com"
SYSTEM_GUEST_EMAIL = "system_guest_shared_key@bursa.local"

class PromptRequest(BaseModel):
    prompt: str
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
        host="127.0.0.1",
        user="root",
        password="",
        database="bursa_rehberi",
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
    
    cursor.execute("""
        INSERT IGNORE INTO models (model_key, model_name, is_default_free) VALUES 
        ('google/gemini-2.5-flash', 'Gemini Flash', TRUE),
        ('deepseek/deepseek-chat', 'DeepSeek V3', FALSE),
        ('openai/gpt-4o-mini', 'GPT-4o-mini', FALSE)
    """)
    
    conn.commit()
    cursor.close()
    conn.close()

init_db()

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
def set_system_key(request: SystemKeyRequest, email: str):
    if email != ADMIN_EMAIL:
        raise HTTPException(status_code=403, detail="Bu işlem için yetkiniz yok!")
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
        return {"message": "Sistem misafir API anahtarı güvenle şifrelenip kaydedildi."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Anahtar kaydedilemedi: {str(e)}")

@app.post("/api/models")
def add_model(request: ModelRequest, email: str):
    if email != ADMIN_EMAIL:
        raise HTTPException(status_code=403, detail="Bu işlem için yetkiniz yok!")
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        if request.is_default_free:
            cursor.execute("UPDATE models SET is_default_free = FALSE")
        cursor.execute(
            "INSERT INTO models (model_key, model_name, is_default_free) VALUES (%s, %s, %s)", 
            (request.model_key, request.model_name, request.is_default_free)
        )
        conn.commit()
        cursor.close()
        conn.close()
        return {"message": "Model başarıyla eklendi."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Model eklenirken hata oluştu: {str(e)}")

@app.post("/api/models/set-free/{model_id}")
def set_default_free_model(model_id: int, email: str):
    if email != ADMIN_EMAIL:
        raise HTTPException(status_code=403, detail="Bu işlem için yetkiniz yok!")
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("UPDATE models SET is_default_free = FALSE")
        cursor.execute("UPDATE models SET is_default_free = TRUE WHERE id = %s", (model_id,))
        conn.commit()
        cursor.close()
        conn.close()
        return {"message": "Misafirler için varsayılan ücretsiz model güncellendi."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Güncellenemedi: {str(e)}")

@app.delete("/api/models/{model_id}")
def delete_model(model_id: int, email: str):
    if email != ADMIN_EMAIL:
        raise HTTPException(status_code=403, detail="Bu işlem için yetkiniz yok!")
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("SELECT model_key FROM models WHERE id = %s", (model_id,))
        model_row = cursor.fetchone()
        if model_row and model_row["model_key"] == "openrouter/free":
            cursor.close()
            conn.close()
            raise HTTPException(status_code=400, detail="OpenRouter Free modeli sistem testi ve misafir erişimi için zorunludur, silinemez!")

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
def get_user_key(email: str):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT encrypted_api_key FROM users WHERE email = %s", (email,))
        user_row = cursor.fetchone()
        cursor.close()
        conn.close()
        if user_row and user_row["encrypted_api_key"]:
            return {"api_key": decrypt_api_key(user_row["encrypted_api_key"])}
        return {"api_key": ""}
    except Exception as e:
        return {"api_key": ""}

@app.post("/api/clear-key")
def clear_user_key(email: str):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("UPDATE users SET encrypted_api_key = NULL WHERE email = %s", (email,))
        conn.commit()
        cursor.close()
        conn.close()
        return {"message": "API anahtarı veritabanından tamamen silindi."}
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
def ask_ai(request: PromptRequest):
    start_time = time.time()
    try:
        is_guest = not request.kullanici_adi or request.kullanici_adi == "Misafir"
        active_api_key = None

        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        if not is_guest:
            if request.user_api_key and request.user_api_key.strip() != "":
                clean_key = request.user_api_key.strip()
                expected_length = 73
                if not clean_key.startswith("sk-or-v1-"):
                    raise HTTPException(status_code=400, detail="Girdiğiniz API anahtarı 'sk-or-v1-' ile başlamalıdır.")
                if len(clean_key) != expected_length:
                    raise HTTPException(status_code=400, detail=f"API anahtarı uzunluğu hatalı ({len(clean_key)}/{expected_length}).")

                enc_key = encrypt_api_key(clean_key)
                cursor.execute("""
                    INSERT INTO users (email, encrypted_api_key) VALUES (%s, %s)
                    ON DUPLICATE KEY UPDATE encrypted_api_key = VALUES(encrypted_api_key)
                """, (request.kullanici_adi, enc_key))
                conn.commit()
                active_api_key = clean_key
            else:
                cursor.execute("SELECT encrypted_api_key FROM users WHERE email = %s", (request.kullanici_adi,))
                user_row = cursor.fetchone()
                if user_row and user_row["encrypted_api_key"]:
                    active_api_key = decrypt_api_key(user_row["encrypted_api_key"])

            if not active_api_key or active_api_key.strip() == "":
                cursor.close()
                conn.close()
                raise HTTPException(
                    status_code=400, 
                    detail="API anahtarınız bulunamadı veya silinmiş. Lütfen geçerli bir OpenRouter API anahtarı girin."
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
            selected_model = free_model_row["model_key"] if free_model_row else "google/gemini-2.5-flash"
        else:
            selected_model = request.model_secimi or "google/gemini-2.5-flash"

        cursor.close()
        conn.close()

        if not active_api_key or active_api_key.strip() == "":
            raise HTTPException(
                status_code=400, 
                detail="API anahtarınız bulunamadı veya silinmiş. Lütfen geçerli bir OpenRouter API anahtarı girin."
            )

        response = requests.post(
            url="https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {active_api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": selected_model,
                "messages": [
                    {
                        "role": "system", 
                        "content": "Sen yalnızca Bursa şehri için uzman bir yapay zeka rehberisin. Görevin sadece Bursa'nın tarihi, kültürü, yemekleri, yerleri hakkında bilgi vermektir. Kullanıcı hangi dilde soru sorarsa sorsun daima akıcı ve eksiksiz bir şekilde TÜRKÇE yanıt vermelisin."
                    },
                    {"role": "user", "content": request.prompt}
                ]
            }
        )

        res_data = response.json()

        if response.status_code != 200 or "choices" not in res_data:
            error_detail = res_data.get("error", {})
            error_msg = error_detail.get("message", "Bilinmeyen AI servis hatası")
            lower_msg = error_msg.lower()

            if response.status_code in [401, 403] or "user not found" in lower_msg or "key" in lower_msg or "unauthorized" in lower_msg or "invalid" in lower_msg or "auth" in lower_msg or "not found" in lower_msg:
                if not is_guest and request.kullanici_adi:
                    try:
                        c = get_db_connection()
                        cur = c.cursor()
                        cur.execute("UPDATE users SET encrypted_api_key = NULL WHERE email = %s", (request.kullanici_adi,))
                        c.commit()
                        cur.close()
                        c.close()
                    except Exception:
                        pass
                raise HTTPException(
                    status_code=400, 
                    detail="API anahtarınız bulunamadı, silinmiş veya geçersiz hale gelmiş. Lütfen geçerli bir OpenRouter API anahtarı girin."
                )
            elif response.status_code == 402 or "requires more credits" in lower_msg or "can only afford" in lower_msg or "credits" in lower_msg or "balance" in lower_msg or "insufficient" in lower_msg:
                raise HTTPException(
                    status_code=400, 
                    detail="OpenRouter hesabınızda bu model/işlem için yeterli bakiye veya kredi kalmadı. Lütfen hesabınızı kontrol edin."
                )
            
            raise HTTPException(status_code=400, detail=f"Yapay Zeka Servis Hatası: {error_msg}")

        ai_response_text = res_data["choices"][0]["message"]["content"]
        usage_info = res_data.get("usage", {})
        total_tokens_used = usage_info.get("total_tokens", 0) or max(1, len(request.prompt) + len(ai_response_text)) // 4

        elapsed_time = round(time.time() - start_time, 2)
        if elapsed_time <= 0:
            elapsed_time = 0.15

        chat_id = request.chat_id if request.chat_id else str(uuid.uuid4())[:8]
        request_id = "req_" + str(uuid.uuid4())[:10]

        if request.prompt.strip() != "Test":
            try:
                conn = get_db_connection()
                cursor = conn.cursor()
                cursor.execute(
                    "INSERT INTO chat_history_v3 (chat_id, request_id, prompt, response, kullanici_adi, model_adi, sure, total_tokens) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)", 
                    (chat_id, request_id, request.prompt, ai_response_text, request.kullanici_adi, selected_model, elapsed_time, total_tokens_used)
                )
                conn.commit()
                cursor.close()
                conn.close()
            except Exception as db_error:
                print(f"VERİTABANI HATASI: {db_error}")

        return {"response": ai_response_text}

    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Beklenmeyen bir hata oluştu: {str(e)}")

@app.get("/api/admin/stats")
def get_admin_stats(email: str):
    if email != ADMIN_EMAIL:
        raise HTTPException(status_code=403, detail="Bu sayfaya erişim yetkiniz yok!")
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
