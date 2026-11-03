from rest_framework import serializers
from .domain.models.transaction import Transaction
from .domain.models.category import Category
from .domain.services.category_service import Category_Service

class TransactionSerializer(serializers.ModelSerializer):
    # Accept category as string on input
    category = serializers.CharField(write_only=True)
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
            'created_at'
        ]

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
