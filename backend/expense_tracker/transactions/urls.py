from django.urls import path
from .views import BulkSMSIngestView, TransactionListCreateView

urlpatterns = [
    path(
        'transactions/bulk-sms-ingest/',
        BulkSMSIngestView.as_view(),
        name='bulk-sms-ingest'
    ),
    path(
        'transactions/',
        TransactionListCreateView.as_view(),
        name='transactions'
    ),
]
