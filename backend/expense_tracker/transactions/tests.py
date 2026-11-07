from datetime import date

from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from .domain.models.transaction import Transaction
from .domain.models.balance_checkpoint import BalanceCheckpoint


class ManualTransactionTests(APITestCase):
    url = "/api/transactions/"

    def setUp(self):
        self.user = User.objects.create_user("alice", password="password123")
        token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

    def test_create_expense(self):
        res = self.client.post(self.url, {
            "amount": "250.50",
            "transaction_type": "expense",
            "category": "  Food ",
            "transaction_date": "2026-11-01",
        }, format="json")
        self.assertEqual(res.status_code, 201)
        self.assertEqual(res.data["category_name"], "food")
        self.assertEqual(res.data["transaction_date"], "2026-11-01")
        txn = Transaction.objects.get()
        self.assertEqual(txn.user, self.user)
        self.assertEqual(txn.source, "MANUAL")

    def test_date_defaults_to_today(self):
        res = self.client.post(self.url, {
            "amount": "10", "transaction_type": "income", "category": "salary",
        }, format="json")
        self.assertEqual(res.status_code, 201)
        self.assertIsNotNone(res.data["transaction_date"])

    def test_rejects_non_positive_amount(self):
        for bad in ("0", "-5"):
            res = self.client.post(self.url, {
                "amount": bad, "transaction_type": "expense", "category": "x",
            }, format="json")
            self.assertEqual(res.status_code, 400)

    def test_rejects_bad_type_and_blank_category(self):
        res = self.client.post(self.url, {
            "amount": "5", "transaction_type": "debit", "category": "x",
        }, format="json")
        self.assertEqual(res.status_code, 400)
        res = self.client.post(self.url, {
            "amount": "5", "transaction_type": "expense", "category": "   ",
        }, format="json")
        self.assertEqual(res.status_code, 400)

    def test_requires_auth(self):
        self.client.credentials()
        res = self.client.post(self.url, {}, format="json")
        self.assertEqual(res.status_code, 401)

    def test_list_only_returns_own(self):
        other = User.objects.create_user("bob", password="password123")
        Transaction.objects.create(user=other, amount=1, transaction_date=date.today())
        res = self.client.get(self.url)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.data), 0)


class EditDeleteTransactionTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user("alice", password="password123")
        token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")
        res = self.client.post("/api/transactions/", {
            "amount": "100.00", "transaction_type": "expense",
            "category": "food", "transaction_date": "2026-11-01",
        }, format="json")
        self.txn_id = res.data["transaction_id"]
        self.url = f"/api/transactions/{self.txn_id}/"

    def test_response_includes_source(self):
        res = self.client.get("/api/transactions/")
        self.assertEqual(res.data[0]["source"], "MANUAL")

    def test_patch_updates_fields_and_category(self):
        res = self.client.patch(self.url, {
            "amount": "150.25", "category": " Travel ",
            "transaction_type": "income", "transaction_date": "2026-11-05",
        }, format="json")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["category_name"], "travel")
        self.assertEqual(res.data["amount"], "150.25")
        self.assertEqual(res.data["transaction_type"], "income")
        self.assertEqual(res.data["transaction_date"], "2026-11-05")

    def test_partial_patch_keeps_other_fields(self):
        res = self.client.patch(self.url, {"amount": "5"}, format="json")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["category_name"], "food")
        self.assertEqual(res.data["transaction_date"], "2026-11-01")

    def test_patch_validates(self):
        res = self.client.patch(self.url, {"amount": "-1"}, format="json")
        self.assertEqual(res.status_code, 400)
        res = self.client.patch(self.url, {"category": "  "}, format="json")
        self.assertEqual(res.status_code, 400)

    def test_delete(self):
        res = self.client.delete(self.url)
        self.assertEqual(res.status_code, 204)
        self.assertFalse(Transaction.objects.filter(pk=self.txn_id).exists())

    def test_sms_transactions_are_read_only(self):
        sms = Transaction.objects.create(
            user=self.user, amount=10, source="SMS", bank="SBI",
            reference_number="R1", transaction_date=date.today(),
        )
        url = f"/api/transactions/{sms.pk}/"
        self.assertEqual(self.client.patch(url, {"amount": "1"}, format="json").status_code, 403)
        self.assertEqual(self.client.delete(url).status_code, 403)
        self.assertTrue(Transaction.objects.filter(pk=sms.pk).exists())

    def test_cannot_touch_other_users_transaction(self):
        other = User.objects.create_user("bob", password="password123")
        theirs = Transaction.objects.create(
            user=other, amount=10, transaction_date=date.today()
        )
        url = f"/api/transactions/{theirs.pk}/"
        self.assertEqual(self.client.patch(url, {"amount": "1"}, format="json").status_code, 404)
        self.assertEqual(self.client.delete(url).status_code, 404)

    def test_requires_auth(self):
        self.client.credentials()
        self.assertEqual(self.client.delete(self.url).status_code, 401)


class BalanceCheckpointTests(APITestCase):
    url = "/api/balance-checkpoints/"

    def setUp(self):
        self.user = User.objects.create_user("alice", password="password123")
        token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

    def _txn(self, day, user=None):
        return Transaction.objects.create(
            user=user or self.user, amount=10, transaction_date=day
        )

    def test_balance_right_now_on_empty_account_uses_client_date(self):
        res = self.client.post(self.url, {
            "amount": "5000", "as_of_date": "2026-11-02",
        }, format="json")
        self.assertEqual(res.status_code, 201)
        self.assertEqual(res.data["as_of_date"], "2026-11-02")
        self.assertEqual(res.data["after_transaction_id"], 0)
        self.assertFalse(res.data["is_opening"])
        self.assertEqual(res.data["amount"], "5000.00")

    def test_zero_and_negative_balances_are_allowed(self):
        for amount in ("0", "-250.50"):
            res = self.client.post(self.url, {"amount": amount}, format="json")
            self.assertEqual(res.status_code, 201)

    def test_opening_balance_is_flagged_and_dated_to_earliest_transaction(self):
        self._txn(date(2026, 10, 5))
        self._txn(date(2026, 10, 1))
        res = self.client.post(self.url, {
            "amount": "100", "is_opening": True, "as_of_date": "2026-11-07",
        }, format="json")
        self.assertEqual(res.status_code, 201)
        self.assertTrue(res.data["is_opening"])
        self.assertEqual(res.data["as_of_date"], "2026-10-01")
        self.assertEqual(res.data["after_transaction_id"], 0)

    def test_opening_balance_on_empty_account(self):
        res = self.client.post(self.url, {
            "amount": "100", "is_opening": True, "as_of_date": "2026-11-02",
        }, format="json")
        self.assertTrue(res.data["is_opening"])
        self.assertEqual(res.data["as_of_date"], "2026-11-02")

    def test_opening_ignores_after_transaction_id(self):
        t = self._txn(date(2026, 10, 5))
        res = self.client.post(self.url, {
            "amount": "100", "is_opening": True,
            "after_transaction_id": t.transaction_id,
        }, format="json")
        self.assertTrue(res.data["is_opening"])
        self.assertEqual(res.data["after_transaction_id"], 0)

    def test_pin_after_a_transaction_takes_its_date_and_id(self):
        t = self._txn(date(2026, 10, 5))
        res = self.client.post(self.url, {
            "amount": "100", "after_transaction_id": t.transaction_id,
        }, format="json")
        self.assertEqual(res.status_code, 201)
        self.assertEqual(res.data["as_of_date"], "2026-10-05")
        self.assertEqual(res.data["after_transaction_id"], t.transaction_id)
        self.assertFalse(res.data["is_opening"])

    def test_cannot_pin_after_someone_elses_transaction(self):
        other = User.objects.create_user("bob", password="password123")
        theirs = self._txn(date(2026, 10, 5), user=other)
        res = self.client.post(self.url, {
            "amount": "100", "after_transaction_id": theirs.transaction_id,
        }, format="json")
        self.assertEqual(res.status_code, 400)

    def test_rejects_missing_or_bad_amount(self):
        self.assertEqual(self.client.post(self.url, {}, format="json").status_code, 400)
        res = self.client.post(self.url, {"amount": "abc"}, format="json")
        self.assertEqual(res.status_code, 400)

    def test_pin_survives_deleting_its_transaction(self):
        t = self._txn(date(2026, 10, 5))
        pin = self.client.post(self.url, {
            "amount": "100", "after_transaction_id": t.transaction_id,
        }, format="json").data
        t.delete()
        res = self.client.get(self.url)
        self.assertEqual(len(res.data), 1)
        self.assertEqual(res.data[0]["id"], pin["id"])
        self.assertEqual(res.data[0]["after_transaction_id"], pin["after_transaction_id"])

    def test_list_is_per_user_and_newest_first(self):
        other = User.objects.create_user("bob", password="password123")
        BalanceCheckpoint.objects.create(user=other, amount=1, as_of_date=date(2026, 1, 1))
        BalanceCheckpoint.objects.create(user=self.user, amount=1, as_of_date=date(2026, 1, 1))
        BalanceCheckpoint.objects.create(user=self.user, amount=2, as_of_date=date(2026, 3, 1))
        res = self.client.get(self.url)
        self.assertEqual([c["as_of_date"] for c in res.data], ["2026-03-01", "2026-01-01"])

    def test_patch_amount_keeps_position(self):
        t = self._txn(date(2026, 10, 5))
        pin = self.client.post(self.url, {
            "amount": "100", "after_transaction_id": t.transaction_id,
        }, format="json").data
        res = self.client.patch(f"{self.url}{pin['id']}/", {"amount": "999.5"}, format="json")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["amount"], "999.50")
        self.assertEqual(res.data["after_transaction_id"], t.transaction_id)

    def test_patch_can_move_the_pin(self):
        a = self._txn(date(2026, 10, 1))
        b = self._txn(date(2026, 10, 9))
        pin = self.client.post(self.url, {
            "amount": "100", "after_transaction_id": a.transaction_id,
        }, format="json").data
        res = self.client.patch(f"{self.url}{pin['id']}/", {
            "after_transaction_id": b.transaction_id,
        }, format="json")
        self.assertEqual(res.data["as_of_date"], "2026-10-09")
        self.assertEqual(res.data["after_transaction_id"], b.transaction_id)

    def test_delete_and_isolation(self):
        pin = self.client.post(self.url, {"amount": "1"}, format="json").data
        other = User.objects.create_user("bob", password="password123")
        theirs = BalanceCheckpoint.objects.create(
            user=other, amount=1, as_of_date=date(2026, 1, 1)
        )
        self.assertEqual(self.client.delete(f"{self.url}{theirs.pk}/").status_code, 404)
        self.assertEqual(self.client.delete(f"{self.url}{pin['id']}/").status_code, 204)
        self.assertEqual(BalanceCheckpoint.objects.filter(user=self.user).count(), 0)

    def test_requires_auth(self):
        self.client.credentials()
        self.assertEqual(self.client.get(self.url).status_code, 401)
        self.assertEqual(self.client.post(self.url, {}, format="json").status_code, 401)

    def test_patch_can_switch_between_opening_and_point_in_time(self):
        t = self._txn(date(2026, 10, 5))
        pin = self.client.post(self.url, {
            "amount": "100", "after_transaction_id": t.transaction_id,
        }, format="json").data
        res = self.client.patch(f"{self.url}{pin['id']}/", {"is_opening": True}, format="json")
        self.assertTrue(res.data["is_opening"])
        self.assertEqual(res.data["after_transaction_id"], 0)
        res = self.client.patch(f"{self.url}{pin['id']}/", {
            "is_opening": False, "after_transaction_id": t.transaction_id,
        }, format="json")
        self.assertFalse(res.data["is_opening"])
        self.assertEqual(res.data["after_transaction_id"], t.transaction_id)


class OpeningPinMigrationTests(APITestCase):
    def test_existing_position_zero_pins_become_opening(self):
        from importlib import import_module
        from django.apps import apps as django_apps
        mod = import_module("transactions.migrations.0004_balancecheckpoint_is_opening")
        user = User.objects.create_user("carol", password="password123")
        zero = BalanceCheckpoint.objects.create(user=user, amount=1, as_of_date=date(2026, 1, 1))
        later = BalanceCheckpoint.objects.create(
            user=user, amount=2, as_of_date=date(2026, 1, 2), after_transaction_id=7
        )
        mod.mark_existing_opening_pins(django_apps, None)
        zero.refresh_from_db(); later.refresh_from_db()
        self.assertTrue(zero.is_opening)
        self.assertFalse(later.is_opening)
