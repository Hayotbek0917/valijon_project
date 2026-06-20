from drf_spectacular.utils import extend_schema
from rest_framework.generics import GenericAPIView
from rest_framework.mixins import CreateModelMixin
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.viewsets import GenericViewSet
from rest_framework_simplejwt.tokens import RefreshToken

from apps.models import User
from apps.permission import user_has_global_branch_access
from apps.serializers.auth_serializers import RegisterModelSerializer, LoginModelSerializer


@extend_schema(tags=['auth'])
class RegisterModelViewSet(CreateModelMixin, GenericViewSet):
    queryset = User.objects.all()
    serializer_class = RegisterModelSerializer
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'auth'


@extend_schema(tags=['auth'])
class RegisterView(GenericAPIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth"
    serializer_class = RegisterModelSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Ro'yxatdan o'tdingiz!"}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(tags=["auth"])
class LoginView(GenericAPIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth"
    serializer_class = LoginModelSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data["user"]
            refresh = RefreshToken.for_user(user)
            return Response(
                {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                    'access_token': str(refresh.access_token),
                    'refresh_token': str(refresh),
                    'user': {
                        'id': str(user.id),
                        'username': user.username or user.phone,
                        'phone': user.phone,
                        'name': user.full_name,
                        'first_name': user.first_name,
                        'last_name': user.last_name or '',
                        'role': user.role,
                        'active': user.is_active,
                        'branch': str(user.branch_id) if user.branch_id else None,
                        'branch_name': user.branch.name if user.branch_id else None,
                        'is_global_admin': user_has_global_branch_access(user),
                    },
                },
                status=status.HTTP_200_OK,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


LoginAPIView = LoginView
