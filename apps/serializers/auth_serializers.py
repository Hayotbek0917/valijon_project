from rest_framework import serializers
from rest_framework.fields import CharField
from rest_framework.serializers import ModelSerializer

from apps.models.users import User, Branch

class BranchSerializer(ModelSerializer):
    class Meta:
        model = Branch
        fields = ['id', 'name', 'address', 'phone']

class UserSerializer(ModelSerializer):
    branch_detail = BranchSerializer(source='branch', read_only=True)
    full_name = CharField(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'phone', 'email', 'first_name', 'last_name', 'full_name', 'role', 'avatar', 'branch', 'branch_detail', 'is_active']