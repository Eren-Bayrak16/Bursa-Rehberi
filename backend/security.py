import os
from cryptography.fernet import Fernet, InvalidToken
from dotenv import load_dotenv

load_dotenv()

_ENCRYPTION_KEY = os.environ.get("ENCRYPTION_KEY")

if not _ENCRYPTION_KEY:
    raise RuntimeError("ENCRYPTION_KEY ortam degiskeni tanimli degil.")

_fernet = Fernet(_ENCRYPTION_KEY.encode() if isinstance(_ENCRYPTION_KEY, str) else _ENCRYPTION_KEY)


def encrypt_api_key(plain_key: str) -> str:
    if not plain_key or not plain_key.strip():
        return ""
    return _fernet.encrypt(plain_key.strip().encode()).decode()


def decrypt_api_key(encrypted_key: str) -> str:
    if not encrypted_key or not encrypted_key.strip():
        return ""
    try:
        return _fernet.decrypt(encrypted_key.strip().encode()).decode()
    except (InvalidToken, ValueError):
        return ""
