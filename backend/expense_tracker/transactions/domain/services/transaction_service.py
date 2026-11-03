from decimal import Decimal
from django.db import transaction, IntegrityError

from ..models.category import Category
from ..models.transaction import Transaction


class Transaction_Service:

    @staticmethod
    def get_all_transactions(user):
        return Transaction.objects.select_related('category').filter(user=user)

    @staticmethod
    def get_transaction_by_id(transaction_id):
        return Transaction.objects.filter(transaction_id=transaction_id).first()

    @staticmethod
    @transaction.atomic
    def add_transactions(user, transactions):

        summary = {
            "created": 0,
            "duplicates": 0,
            "rejected": 0
        }

        valid_transactions = []
        seen_references = set()

        # Step 1: Validate and normalize incoming transactions
        for txn in transactions:

            reference = txn.get('reference_number')
            bank = txn.get('bank')

            # Reject missing or invalid reference numbers
            if not isinstance(reference, str) or not reference.strip():
                summary["rejected"] += 1
                continue

            reference = reference.strip()

            # Reject incomplete or unmatched SMS messages
            if (
                not txn.get('amount')
                or txn.get('type') not in ['expense', 'income']
                or not txn.get('date')
                or not txn.get('merchant')
                or not bank
                or bank == 'GENERIC'
            ):
                summary["rejected"] += 1
                continue

            # Handle duplicate references within the same batch
            if reference in seen_references:
                summary["duplicates"] += 1
                continue

            seen_references.add(reference)

            valid_transactions.append({
                **txn,
                'reference_number': reference
            })

        if not valid_transactions:
            return summary

        # Step 2: Find references already present in the database
        references = [
            txn['reference_number']
            for txn in valid_transactions
        ]

        existing_references = set(
            Transaction.objects.filter(
                user=user,
                source='SMS',
                reference_number__in=references
            ).values_list('reference_number', flat=True)
        )

        new_transactions = []

        for txn in valid_transactions:
            if txn['reference_number'] in existing_references:
                summary["duplicates"] += 1
            else:
                new_transactions.append(txn)

        if not new_transactions:
            return summary

        # Step 3: Normalize merchant names
        merchant_names = {
            txn['merchant'].strip().lower()
            for txn in new_transactions
        }

        existing_categories = {
            cat.name: cat
            for cat in Category.objects.filter(name__in=merchant_names)
        }

        new_categories = [
            Category(name=name)
            for name in merchant_names
            if name not in existing_categories
        ]

        if new_categories:
            Category.objects.bulk_create(new_categories)

        all_categories = {
            cat.name: cat
            for cat in Category.objects.filter(name__in=merchant_names)
        }

        # Step 4: Prepare transaction objects
        transaction_objs = []

        for txn in new_transactions:
            merchant = txn['merchant'].strip().lower()

            transaction_objs.append(
                Transaction(
                    user=user,
                    amount=Decimal(str(txn['amount'])),
                    transaction_type=txn['type'],
                    category=all_categories[merchant],
                    transaction_date=txn['date'],
                    source='SMS',
                    bank=txn['bank'],
                    reference_number=txn['reference_number']
                )
            )

        # Step 5: Bulk insert, with concurrency fallback
        try:
            with transaction.atomic():
                Transaction.objects.bulk_create(transaction_objs)

            summary["created"] += len(transaction_objs)

        #TODO: try to understand this later
        except IntegrityError:
            # Another request may have inserted the same reference
            # between our initial duplicate check and bulk insert.

            for obj in transaction_objs:
                try:
                    with transaction.atomic():
                        obj.pk = None
                        obj._state.adding = True
                        obj.save()

                    summary["created"] += 1

                except IntegrityError:
                    duplicate_exists = Transaction.objects.filter(
                        user=user,
                        source='SMS',
                        reference_number=obj.reference_number
                    ).exists()

                    if duplicate_exists:
                        summary["duplicates"] += 1
                    else:
                        raise

        return summary