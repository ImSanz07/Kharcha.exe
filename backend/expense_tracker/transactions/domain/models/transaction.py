from django.db import models
import datetime

from .category import Category

class Transaction(models.Model):
    transaction_id = models.AutoField(primary_key=True)  
    #This means that, if in case the Referenced User is deleted, this transaction will also be deleted
    user = models.ForeignKey('auth.User', on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=100,decimal_places=2)
    transaction_type = models.CharField(
        max_length=10,
        choices=[("expense","Expense"),("income","Income")],
        default="expense"
    )
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    transaction_date = models.DateField(null=True, blank=True)
    #Where the transaction was created: SMS or Manual
    source = models.CharField(
        max_length=10,
        choices=[
            ("SMS", "SMS"),
            ("MANUAL", "Manual")
        ],
        default="MANUAL"
    )
    #Bank name
    bank = models.CharField(
        max_length=50,
        null=True,
        blank=True
    )
    #Transaction Reference Number, Unique for each account
    reference_number = models.CharField(
        max_length=100,
        null=True,
        blank=True
    )


class Meta:
    # TODO: Revisit uniqueness scope when multiple bank accounts
    # per user are supported. Consider user + bank_account +
    # reference_number instead of user + reference_number.
    constraints = [
        models.UniqueConstraint(
            fields=["user", "reference_number"],
            condition=models.Q(
                source="SMS",
                reference_number__isnull=False
            ),
            name="unique_sms_reference_per_user"
        )
    ]
    
    
