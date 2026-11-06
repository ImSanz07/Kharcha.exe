from datetime import date

from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from .domain.models.transaction import Transaction


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
