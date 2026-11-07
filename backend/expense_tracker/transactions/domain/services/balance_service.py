from django.db.models import Min
from django.db.models.functions import Coalesce, TruncDate
from django.utils import timezone

from ..models.balance_checkpoint import BalanceCheckpoint
from ..models.transaction import Transaction


class Balance_Service:

    @staticmethod
    def get_checkpoints(user):
        return BalanceCheckpoint.objects.filter(user=user)

    @staticmethod
    def resolve_position(user, after_transaction_id=None, as_of_date=None,
                         is_opening=False):
        """
        Returns (as_of_date, after_transaction_id, is_opening) for a pin.

        - is_opening: the balance before all history. as_of_date is only
          informational (earliest transaction date, else the supplied date,
          else today).
        - after_transaction_id given: pin goes right after that transaction,
          and the date is taken from it.
        - neither: pin at the start of as_of_date (default today). Used for
          "my balance right now" on an account with no transactions yet.
        Raises ValueError for a transaction that is not the user's.
        """
        if is_opening:
            earliest = (
                Transaction.objects.filter(user=user)
                .annotate(eff=Coalesce('transaction_date', TruncDate('created_at')))
                .aggregate(first=Min('eff'))['first']
            )
            return (earliest or as_of_date or timezone.localdate(), 0, True)

        if after_transaction_id:
            txn = Transaction.objects.filter(
                user=user, transaction_id=after_transaction_id
            ).first()
            if txn is None:
                raise ValueError("Transaction not found.")
            return (txn.transaction_date or txn.created_at.date(),
                    txn.transaction_id, False)

        return (as_of_date or timezone.localdate(), 0, False)
