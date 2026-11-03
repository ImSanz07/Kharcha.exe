from django.contrib import admin
from .domain.models.category import Category
from .domain.models.transaction import Transaction

# Register your models here.
admin.site.register(Category)
admin.site.register(Transaction)
