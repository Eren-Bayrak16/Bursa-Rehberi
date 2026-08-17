from typing import Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import mysql.connector
import os
from dotenv import load_dotenv
import requests
import time

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ADMIN_EMAIL = "bayrakeren228@gmail.com"

class PromptRequest(BaseModel):
    prompt: str
    kullanici_adi: str = "Misafir"
    user_api_key: Optional[str] = None
    model_secimi: str = "google/gemini-2.5-flash"

def get_db_connection():
    return mysql.connector.connect(
        host="127.0.0.1",
        user="root",
        password="",
        database="bursa_rehberi",
        charset="utf8mb4",
        collation="utf8mb4_unicode_ci"
    )

@app.post("/api/ask")
def ask_ai(request: PromptRequest):
    start_time = time.time()
    try:
        # Kullanıcı giriş yapmamışsa (ücretsiz mod)
        is_free_mode = not request.user_api_key or not request.user_api_key.strip()
        
        active_api_key = request.user_api_key if not is_free_mode else os.environ.get("OPENROUTER_API_KEY")
        
        if not active_api_key:
            raise HTTPException(
                status_code=400, 
                detail="API anahtarı bulunamadı! Lütfen giriş yapın veya ayarlardan kendi OpenRouter API anahtarınızı girin."
            )

        # Ücretsiz moddaysa senin anahtarını koruyan hafif ücretsiz model, giriş yaptıysa kullanıcının seçtiği model
        selected_model = "openai/gpt-oss-20b:free" if is_free_mode else (request.model_secimi or "google/gemini-2.5-flash")

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
                        "content": "Sen yalnızca Bursa şehri için uzman bir yapay zeka rehberisin. Görevin sadece Bursa'nın tarihi, kültürü, yemekleri, yerleri ve ulaşımı hakkında bilgi vermektir."
                    },
                    {"role": "user", "content": request.prompt}
                ]
            }
        )

        res_data = response.json()

        if "choices" not in res_data:
            raise HTTPException(status_code=500, detail=f"OpenRouter Hatası: {res_data}")

        ai_response_text = res_data["choices"][0]["message"]["content"]
        
        end_time = time.time()
        elapsed_time = round(end_time - start_time, 2)
        if elapsed_time <= 0:
            elapsed_time = 0.15

        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            # API anahtarı veritabanına asla kaydedilmez (Güvenlik)
            query = "INSERT INTO chat_history (prompt, response, kullanici_adi, model_adi, sure) VALUES (%s, %s, %s, %s, %s)"
            cursor.execute(query, (request.prompt, ai_response_text, request.kullanici_adi, selected_model, elapsed_time))
            conn.commit()
            cursor.close()
            conn.close()
        except Exception as db_error:
            print(f"VERİTABANI HATASI: {db_error}")

        return {"response": ai_response_text}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Bir hata oluştu: {str(e)}")

@app.get("/api/admin/stats")
def get_admin_stats(email: str):
    if email != ADMIN_EMAIL:
        raise HTTPException(status_code=403, detail="Bu sayfaya erişim yetkiniz yok!")
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT id, prompt, response, kullanici_adi, model_adi, sure, created_at FROM chat_history ORDER BY id DESC")
        history = cursor.fetchall()

        cursor.execute("SELECT COUNT(*) as total_today FROM chat_history WHERE DATE(created_at) = CURDATE()")
        today_count = cursor.fetchone()["total_today"]

        cursor.execute("SELECT COUNT(DISTINCT kullanici_adi) as unique_users_today FROM chat_history WHERE DATE(created_at) = CURDATE()")
        today_unique_users = cursor.fetchone()["unique_users_today"]

        cursor.execute("SELECT COUNT(DISTINCT kullanici_adi) as total_unique_users FROM chat_history")
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
