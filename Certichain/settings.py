import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

STATIC_URL = 'static/'
STATICFILES_DIRS = [
    os.path.join(BASE_DIR, 'static'),
]


TEMPLATES = [
    {
        # On verra plus tard hein
        'DIRS': [os.path.join(BASE_DIR, 'templates')],
    },
]