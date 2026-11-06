from rest_framework import generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import PermissionDenied
from django.shortcuts import get_object_or_404

from .domain.services.rule_engine.engine import SmsParserRuleEngine
from .domain.services.transaction_service import Transaction_Service
from .domain.models.transaction import Transaction
from .serializers import TransactionSerializer
from rest_framework.permissions import IsAuthenticated
from rest_framework.authentication import TokenAuthentication
##View class is suppoes to handle HTTP requests, process and return responses
class BulkSMSIngestView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        data = request.data

        if isinstance(data, dict):
            sms_list = data.get("messages", [])
        else:
            sms_list = data

        engine = SmsParserRuleEngine()
        results = engine.process_sms_list(sms_list)

        summary = Transaction_Service.add_transactions(
            request.user,
            results
        )

        return Response({
            "received": len(sms_list),
            "parsed": len(results),
            **summary
        }, status=status.HTTP_201_CREATED)


class TransactionListCreateView(generics.GenericAPIView):
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Only return transactions of the logged-in user
        return Transaction_Service.get_all_transactions(self.request.user)

    ##GET Request to get all transactions: URL: /api/transactions
    def get(self,request):
        transactions = self.get_queryset()
        serializer = self.serializer_class(transactions, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    ##POST Request to create a new transaction: URL: /api/transactions
    def post(self,request):
        serializer = self.serializer_class(
            data=request.data,
            context={'request': request}
            )
        serializer.is_valid(raise_exception=True)
        transaction = serializer.save() # Serializer creates the transaction
        return Response(
            self.serializer_class(transaction).data,
            status=status.HTTP_201_CREATED
        )


class TransactionDetailView(generics.GenericAPIView):
    """
    PATCH /api/transactions/<id>/  edit a manual transaction
    DELETE /api/transactions/<id>/ delete a manual transaction
    SMS imported transactions are read only, otherwise re-ingesting would recreate them.
    """
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Scoped to the logged-in user, so other users' ids return 404
        return Transaction_Service.get_all_transactions(self.request.user)

    def get_manual_transaction(self, pk):
        transaction = get_object_or_404(self.get_queryset(), pk=pk)
        if transaction.source != 'MANUAL':
            raise PermissionDenied("Only manually added transactions can be changed.")
        return transaction

    def patch(self, request, pk):
        transaction = self.get_manual_transaction(pk)
        serializer = self.serializer_class(
            transaction, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        transaction = serializer.save()
        return Response(
            self.serializer_class(transaction).data,
            status=status.HTTP_200_OK
        )

    def delete(self, request, pk):
        transaction = self.get_manual_transaction(pk)
        transaction.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
