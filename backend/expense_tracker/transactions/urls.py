from django.urls import path
from .views import BulkSMSIngestView, TransactionListCreateView, TransactionDetailView,\
    BalanceCheckpointListCreateView, BalanceCheckpointDetailView

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
    path(
        'balance-checkpoints/',
        BalanceCheckpointListCreateView.as_view(),
        name='balance-checkpoints'
    ),
    path(
        'balance-checkpoints/<int:pk>/',
        BalanceCheckpointDetailView.as_view(),
        name='balance-checkpoint-detail'
    ),
]
