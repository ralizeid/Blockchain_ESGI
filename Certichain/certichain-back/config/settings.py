import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent

load_dotenv(BASE_DIR / '.env')

SECRET_KEY = os.getenv('SECRET_KEY', 'django-insecure-@m@sg%r^l%#o80lo1ve04fumoybk%p#m(4-_o-(__&04#oy%(#')

# DEBUG à changer en False pour la prod 
DEBUG = os.getenv('DEBUG', 'True') == 'True'

# A changer pour le nom de domaine en prod
ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', '*').split(',')

# --- CONFIGURATION EMAIL ---
# Si EMAIL_HOST_USER est défini dans .env → vrai SMTP Gmail
# Sinon → backend console (les emails s'affichent dans le terminal Django)
_email_user = os.getenv('EMAIL_HOST_USER', '').strip()
_email_pass = os.getenv('EMAIL_HOST_PASSWORD', '').strip()

if _email_user and _email_pass:
    EMAIL_BACKEND      = 'django.core.mail.backends.smtp.EmailBackend'
    EMAIL_HOST         = 'smtp.gmail.com'
    EMAIL_PORT         = 587
    EMAIL_USE_TLS      = True
    EMAIL_HOST_USER    = _email_user
    EMAIL_HOST_PASSWORD = _email_pass
else:
    # Développement local : les emails s'affichent dans le terminal
    EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
    EMAIL_HOST_USER = ''
    EMAIL_HOST_PASSWORD = ''

DEFAULT_FROM_EMAIL = _email_user or 'noreply@certichain.local'
FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:3000')
# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'diplomas',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# CORS & CSRF
CORS_ALLOW_ALL_ORIGINS = True
CSRF_TRUSTED_ORIGINS = ['https://*.trycloudflare.com', 'https://certichain.pmvix.com']

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'



# BASE DE DONNÉES 
# --- BASE DE DONNÉES INTELLIGENTE ---

# On vérifie si une variable d'environnement POSTGRES_HOST existe.
# En local, elle n'existe pas (None). En Docker, elle vaudra 'db'.
DB_HOST = os.getenv('POSTGRES_HOST')

if DB_HOST:
    # SI ON EST EN PROD (DOCKER) -> ON UTILISE POSTGRESQL
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': os.getenv('POSTGRES_DB', 'certichain_db'),
            'USER': os.getenv('POSTGRES_USER', 'admin'),
            'PASSWORD': os.getenv('POSTGRES_PASSWORD', 'super_password_a_changer'),
            'HOST': DB_HOST, 
            'PORT': os.getenv('POSTGRES_PORT', '5432'),
        }
    }
else:
    # SI ON EST EN LOCAL (POWERSHELL) -> ON UTILISE SQLITE
    print("Mode Local detecte : Utilisation de SQLite")
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }


# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True



# FICHIERS STATIQUES 

STATIC_URL = 'static/'

STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Configurations des sessions (12h + expiration navigateur)
SESSION_COOKIE_AGE = 43200  # 12 heures en secondes
SESSION_EXPIRE_AT_BROWSER_CLOSE = True

