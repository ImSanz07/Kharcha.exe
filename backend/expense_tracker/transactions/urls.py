from django.urls import path
from .views import BulkSMSIngestView, TransactionListCreateView, TransactionDetailView

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
    path(
        'transactions/<int:pk>/',
        TransactionDetailView.as_view(),
        name='transaction-detail'
    ),
]
