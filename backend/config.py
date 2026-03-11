import os
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

# ─── Database Configuration ───────────────────────────────────────────────────
DB_HOST     = os.getenv('DB_HOST', 'localhost')
DB_PORT     = int(os.getenv('DB_PORT', 3306))
DB_USER     = os.getenv('DB_USER', 'root')
DB_PASSWORD = os.getenv('DB_PASSWORD', '')
DB_NAME     = os.getenv('DB_NAME', 'tutorflow')

# SQLAlchemy connection string
DATABASE_URI = (
    f'mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}'
    '?charset=utf8mb4'
)

# Flask settings
SECRET_KEY  = os.getenv('SECRET_KEY', 'tutorflow-secret-2024')
DEBUG       = os.getenv('DEBUG', 'True') == 'True'

