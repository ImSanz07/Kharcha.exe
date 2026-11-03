from rest_framework import serializers
from django.contrib.auth.models import User

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True,  min_length=8)

    class Meta:
        model = User
        fields = ['username', 'password']


    def create(self, validated_data):
        user = User(
            username=validated_data['username']
        )
        ## set_password() will automatically hash the password (provided by Django)
        user.set_password(validated_data['password'])
        user.save()
        return user