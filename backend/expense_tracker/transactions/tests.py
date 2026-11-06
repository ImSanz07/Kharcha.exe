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
