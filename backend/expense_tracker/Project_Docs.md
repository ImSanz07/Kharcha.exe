backend/
├── manage.py
├── requirements/
│   ├── base.txt
│   ├── dev.txt
│   ├── prod.txt
│   └── test.txt
├── .env
├── .gitignore
├── docker/
│   ├── Dockerfile
│   └── docker-compose.yml
├── scripts/
│   ├── create_superuser.py
│   └── db_backup.sh
├── core/                         ← Main project configuration
│   ├── __init__.py
│   ├── asgi.py
│   ├── wsgi.py
│   ├── urls.py
│   ├── settings/
│   │   ├── __init__.py
│   │   ├── base.py
│   │   ├── dev.py
│   │   ├── prod.py
│   │   └── test.py
│   ├── middleware/
│   │   ├── __init__.py
│   │   ├── audit_log.py
│   │   └── cors_middleware.py
│   ├── utils/
│   │   ├── jwt_utils.py
│   │   ├── email_service.py
│   │   └── pagination.py
│   └── logging.yaml
├── apps/
│   ├── users/
│   │   ├── __init__.py
│   │   ├── admin.py
│   │   ├── apps.py
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── urls.py
│   │   ├── tests/
│   │   │   ├── test_models.py
│   │   │   └── test_views.py
│   │   ├── signals.py
│   │   └── permissions.py
│   ├── transactions/
│   │   ├── __init__.py
│   │   ├── admin.py
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views/
│   │   │   ├── __init__.py
│   │   │   ├── transaction_views.py
│   │   │   └── report_views.py
│   │   ├── urls.py
│   │   └── services/
│   │       ├── __init__.py
│   │       ├── transaction_service.py
│   │       └── analytics_service.py
│   └── notifications/
│       ├── models.py
│       ├── views.py
│       ├── serializers.py
│       ├── urls.py
│       └── tasks.py
├── static/
│   ├── css/
│   ├── js/
│   └── images/
├── media/
│   └── user_uploads/
└── tests/
    ├── conftest.py
    └── integration/
