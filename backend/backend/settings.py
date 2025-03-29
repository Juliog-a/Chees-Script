from dotenv import load_dotenv
import os
from pathlib import Path
from datetime import timedelta
from rest_framework.settings import api_settings
from django.conf import settings
from django.conf.urls.static import static

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Load environment variables from .env file
load_dotenv()

# Django settings for backend project
SECRET_KEY = os.getenv('SECRET_KEY', 'default-key-for-dev')
DEBUG = os.getenv('DEBUG', 'false').lower() == 'true'
ALLOWED_HOSTS = ['*'] if DEBUG else ['chees-script.onrender.com']
ROOT_URLCONF = 'backend.urls'

TAILWIND_APP_NAME = 'theme'

STATIC_URL = '/static/'
STATICFILES_DIRS = [
    os.path.join(BASE_DIR, "static"),  # Archivos estáticos del frontend
]
STATIC_ROOT = os.path.join(BASE_DIR, "staticfiles") 

# REST Framework configuration
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',  # Sesiones

    ),
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',  # Output in JSON
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',  # Asegúrarnos de que la autenticación sea obligatoria
    ]
}

# Authentication configuration
AUTHENTICATION_BACKENDS = [
    'api.backends.CustomUserAuthBackend',  # Habilita login con email o username
    'django.contrib.auth.backends.ModelBackend',  # Necesario para Django Admin
]

# Template configuration
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],  # Ruta correcta a las plantillas
        'APP_DIRS': True,  # Habilitamos app_dirs para que busque plantillas dentro de las aplicaciones
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(hours=1),  # Token de acceso dura 1 hora
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),  # Token de refresco dura 7 días
    "ROTATE_REFRESH_TOKENS": True,                # Se renueva el token de refresco automáticamente
    "BLACKLIST_AFTER_ROTATION": True,
    "AUTH_HEADER_TYPES": ("Bearer",),
}

# Email configuration
EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_HOST = "smtp.gmail.com"
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = os.getenv("EMAIL_HOST_USER")
EMAIL_HOST_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD")
DEFAULT_FROM_EMAIL = EMAIL_HOST_USER

INSTALLED_APPS = [
    'defender',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework_simplejwt',
    'rest_framework',
    'corsheaders',
    'api',
    'tailwind',
    'django_otp',
    'django_otp.plugins.otp_totp',
    'django_otp.plugins.otp_static',
    #'two_factor', #Da fallos en la interfaz predeterminada de Django de admin al usarlo, por lo que no descomentar
    'rest_framework_simplejwt.token_blacklist',
    'django_password_validators.password_history',
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
    #'django_otp.middleware.OTPMiddleware', #Da fallos en la interfaz predeterminada de Django de admin al usarlo, por lo que no descomentar
    'csp.middleware.CSPMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
]

os.environ["DEFENDER_REDIS_URL"] = "memory://"

DEFENDER_STORE_ACCESS_ATTEMPTS = True
DEFENDER_LOCKOUT_URL = "/locked/"
DEFENDER_USERNAME_FORM_FIELD = "username"
DEFENDER_ENABLE_COOLOFF = True
DEFENDER_COOLOFF_TIME = 300
DEFENDER_LOGIN_FAILURE_LIMIT = 5
DEFENDER_LOCKOUT_TEMPLATE = "defender/lockout.html"
DEFENDER_USE_CELERY = False
DEFENDER_REDIS_PREFIX = "defender"

if not DEBUG:
    SECURE_SSL_REDIRECT = True
    SECURE_HSTS_SECONDS = 5256000  # 2 meses en producción
else:
    SECURE_SSL_REDIRECT = False
    SECURE_HSTS_SECONDS = 0  # No activarlo en desarrollo

# URLs configuration
ROOT_URLCONF = 'backend.urls'
WSGI_APPLICATION = 'backend.wsgi.application'

# Database configuration
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / "db.sqlite3",
    }
}




MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# Password validation configuration
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
    {
        'NAME': 'django_password_validators.password_history.password_validation.UniquePasswordsValidator',
        'OPTIONS': {
            'last_passwords': 5
    }
    }
]

# Localization configuration
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# CORS configuration
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:8000",
    "http://localhost:8000",
    "https://chees-script.vercel.app",
]
CORS_ALLOW_ALL_ORIGINS = True
CSRF_TRUSTED_ORIGINS = ["http://localhost:5173", "http://127.0.0.1:8000"]

CORS_ALLOW_METHODS = [
    "GET",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
    "OPTIONS",
]

CORS_ALLOW_CREDENTIALS = True

# Seguridad de Cookies en Django
SESSION_COOKIE_SECURE = not DEBUG  # Solo permite cookies en HTTPS (poner en producción)
SESSION_COOKIE_HTTPONLY = True  # Evita que las cookies sean accesibles por JavaScript
SESSION_COOKIE_SAMESITE = 'Lax'  # Evita envío de cookies en peticiones de otros sitios
CSRF_COOKIE_SECURE = not DEBUG  # Protege la cookie de CSRF en HTTPS
CSRF_COOKIE_HTTPONLY = True  # No accesible por JavaScript
CSRF_COOKIE_SAMESITE = 'Lax'  # Protege contra ataques CSRF

SECURE_BROWSER_XSS_FILTER = True  # Protección contra XSS en navegadores
SECURE_CONTENT_TYPE_NOSNIFF = True  # Previene ataques de MIME sniffing
X_FRAME_OPTIONS = 'DENY'  # Evita que la página se cargue en iframes (Clickjacking)

SECURE_REFERRER_POLICY = "same-origin"  # Evita que el navegador envíe referrers a sitios externos
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")  # Para proxies reversos (NGINX)


# CSP (Content Security Policy) -> Para mitigar ataques XSS.
# CSP CONFIGURACIÓN ADAPTADA A REACT + TAILWIND
CSP_DEFAULT_SRC = ("'self'",)  # Solo permite recursos del mismo dominio

CSP_SCRIPT_SRC = ("'self'", "'unsafe-inline'") if not DEBUG else ("'self'", "'unsafe-inline'", "'unsafe-eval'")# React usa 'unsafe-eval' en desarrollo, pero quítalo en producción

CSP_STYLE_SRC = ("'self'", "'unsafe-inline'", "fonts.googleapis.com")  # Tailwind usa estilos inline, por eso permitimos 'unsafe-inline'

CSP_FONT_SRC = ("'self'", "fonts.gstatic.com", "fonts.googleapis.com")  # Para cargar fuentes desde Google Fonts

CSP_IMG_SRC = ("'self'", "data:", "blob:")  # Permitir imágenes en base64 y blobs

CSP_CONNECT_SRC = (
    "'self'",
    "https://chees-script.onrender.com",
    "https://chees-script-jwxnx28mz-julios-projects-679e56eb.vercel.app/",
    "https://api.vercel.app"
)
CSP_FRAME_SRC = ("'self'", "youtube.com", "vimeo.com")  # Para permitir iframes de videos embebidos

CSP_OBJECT_SRC = ("'none'",)  # Bloquea Flash y otros objetos inseguros

CSP_FORM_ACTION = ("'self'",
    'http://localhost:5173',
    )  # Evita envíos de formularios a dominios externos

CSP_WORKER_SRC = ("'self'", "blob:")  # Permite Web Workers y Service Workers (importante para PWA)

CSP_MANIFEST_SRC = ("'self'",)  # Permite cargar manifest.json en React PWA