import dj_database_url
import os
from dotenv import load_dotenv

load_dotenv()

DATABASES = {
    'default': dj_database_url.config(
        default="postgresql://postgres:hmiqmfUvTeAOCxOr@db.irxwkwalwvihczfaqvkk.supabase.co:5432/postgres",
        conn_max_age=600,
        ssl_require=True
    )
}
