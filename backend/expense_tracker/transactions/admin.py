from django.contrib import admin
from .domain.models.category import Category
from .domain.models.transaction import Transaction
from .domain.models.balance_checkpoint import BalanceCheckpoint

# Register your models here.
admin.site.register(Category)
admin.site.register(Transaction)
admin.site.register(BalanceCheckpoint)
