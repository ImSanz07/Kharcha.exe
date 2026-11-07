from decimal import Decimal
from django.utils import timezone
from rest_framework import serializers
from .domain.models.transaction import Transaction
from .domain.models.category import Category
from .domain.models.balance_checkpoint import BalanceCheckpoint
from .domain.services.balance_service import Balance_Service
from .domain.services.category_service import Category_Service

class TransactionSerializer(serializers.ModelSerializer):
    # Accept category as string on input
    category = serializers.CharField(write_only=True, max_length=100)
    # Optional: return category name in response
    category_name = serializers.CharField(
        source='category.name', read_only=True)

    class Meta:
        model = Transaction
        fields = [
            'transaction_id',
            'amount',
            'transaction_type',
            'category',       # input
            'category_name',  # output
            'transaction_date',
            'source',
            'created_at'
        ]
        read_only_fields = ['source']
        extra_kwargs = {
            # Optional on input; defaults to today in create()
            'transaction_date': {'required': False, 'allow_null': True},
        }

    def validate_amount(self, value):
        if value <= Decimal('0'):
            raise serializers.ValidationError("Amount must be greater than 0.")
        return value

    # Older Create Code 
    # def create(self, validated_data):
    #     request = self.context['request']
    #     category_name = validated_data.pop('category')

    #     category = Category_Service.create_category_if_not_present(
    #         category_name.strip().lower()
    #     )

    #     return Transaction.objects.create(
    #         user=request.user,
    #         category=category,
    #         **validated_data
    #     )

    def create(self, validated_data):
        """
        Handles category normalization and assigns logged-in user.
        """

        request = self.context.get('request')
        if request is None or not hasattr(request,'user'):
            raise serializers.ValidationError(
                "User must be provided in context"
                )
        
        category_str = validated_data.pop('category')
        if not validated_data.get('transaction_date'):
            validated_data['transaction_date'] = timezone.localdate()
        # Normalize the category name
        category_obj = Category_Service.create_category_if_not_present(
            category_str.strip().lower()
        )
        #Create Transaction
        transaction = Transaction.objects.create(
            user=request.user,
            category=category_obj,
            **validated_data
        )
        return transaction

    def update(self, instance, validated_data):
        """
        Handles partial edits. Category is normalized the same way as on create.
        """
        category_str = validated_data.pop('category', None)
        if category_str is not None:
            instance.category = Category_Service.create_category_if_not_present(
                category_str.strip().lower()
            )
        # An explicit null date means keep the existing one
        if validated_data.get('transaction_date', 0) is None:
            validated_data.pop('transaction_date')
        return super().update(instance, validated_data)


class BalanceCheckpointSerializer(serializers.ModelSerializer):
    # Input: place the pin right after this transaction. Null/0 = opening balance.
    after_transaction_id = serializers.IntegerField(
        required=False, allow_null=True, min_value=0
    )
    # Input: only used for an opening balance on an account with no transactions.
    as_of_date = serializers.DateField(required=False)

    class Meta:
        model = BalanceCheckpoint
        fields = ['id', 'amount', 'as_of_date', 'after_transaction_id', 'created_at']

    def _resolve(self, user, validated_data):
        try:
            return Balance_Service.resolve_position(
                user,
                validated_data.pop('after_transaction_id', None),
                validated_data.pop('as_of_date', None),
            )
        except ValueError as exc:
            raise serializers.ValidationError({'after_transaction_id': str(exc)})

    def create(self, validated_data):
        user = self.context['request'].user
        as_of_date, after_id = self._resolve(user, validated_data)
        return BalanceCheckpoint.objects.create(
            user=user,
            as_of_date=as_of_date,
            after_transaction_id=after_id,
            **validated_data
        )

    def update(self, instance, validated_data):
        # Only move the pin if the client actually sent a position
        if 'after_transaction_id' in validated_data or 'as_of_date' in validated_data:
            instance.as_of_date, instance.after_transaction_id = self._resolve(
                instance.user, validated_data
            )
        return super().update(instance, validated_data)
