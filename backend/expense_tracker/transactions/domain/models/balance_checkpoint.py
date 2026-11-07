from django.db import models


class BalanceCheckpoint(models.Model):
    """
    "My balance was X at this point in my transaction timeline."

    Two kinds of pin:
      - is_opening=True: the balance BEFORE your first transaction. It sits
        before all of history, so every transaction counts, including older
        ones you add or import later.
      - is_opening=False: the balance at a point in time. Transactions dated
        before that point are treated as already included in it.

    For a point-in-time pin the position is a sort key made of
    (as_of_date, after_transaction_id):
      - after_transaction_id = N means the pin sits right after transaction N
        among the transactions of that date (ordered by id).
      - after_transaction_id = 0 means the pin sits before every transaction
        of that date (an opening balance).
    The key is stored as plain values, not a foreign key, so deleting the
    transaction it was placed after does not move or delete the pin.
    """
    user = models.ForeignKey('auth.User', on_delete=models.CASCADE)
    # Balance at the pin. Can be negative (overdraft, credit card).
    amount = models.DecimalField(max_digits=100, decimal_places=2)
    as_of_date = models.DateField()
    after_transaction_id = models.PositiveBigIntegerField(default=0)
    is_opening = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-as_of_date', '-after_transaction_id', '-id']
