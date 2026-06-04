from rest_framework import status, mixins, viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.viewsets import ModelViewSet, GenericViewSet
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate

from apps.models.users import User, Branch

from apps.serializers import UserSerializer, BranchSerializer


class RegisterModelViewSet(mixins.CreateModelMixin, GenericViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        password = data.get('password')
        if not password or len(password) < 4:
            return Response({"password": "Parol kamida 4 ta belgidan iborat bo'lishi shart."},
                            status=status.HTTP_400_BAD_REQUEST)

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)

        user = User.objects.create_user(**serializer.validated_data)
        user.set_password(password)
        user.save()

        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)


class LoginAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        phone = request.data.get("phone")
        password = request.data.get("password")

        if not phone or not password:
            return Response({"error": "Telefon raqam va parolni kiritish majburiy."},
                            status=status.HTTP_400_BAD_REQUEST)

        user = authenticate(phone=phone, password=password)
        if not user:
            return Response({"error": "Telefon raqam yoki parol noto'g'ri."},
                            status=status.HTTP_401_UNAUTHORIZED)

        if not user.is_active:
            return Response({"error": "Ushbu foydalanuvchi faol emas."},
                            status=status.HTTP_403_FORBIDDEN)

        refresh = RefreshToken.for_user(user)
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': UserSerializer(user).data
        }, status=status.HTTP_200_OK)


class UserViewSet(ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]


class BranchModelViewSet(ModelViewSet):
    queryset = Branch.objects.all()
    serializer_class = BranchSerializer
    permission_classes = [IsAuthenticated]