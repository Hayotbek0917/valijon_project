"""Ruxsatlar — platform egasi va filial cheklovi."""

from rest_framework.permissions import BasePermission

GLOBAL_ADMIN_USERNAMES = frozenset({'superadmin'})


def user_has_global_branch_access(user) -> bool:
    """Platform egasi — barcha filiallarni ko'radi, ?branch= bilan filtrlash mumkin."""
    if not user or not user.is_authenticated:
        return False
    if user.is_superuser:
        return True
    un = (getattr(user, 'username', None) or '').lower()
    if un in GLOBAL_ADMIN_USERNAMES:
        return True
    return user.role == user.Role.ADMIN and not user.branch_id


class PlatformReadOnlyPermission(BasePermission):
    """Platform egasi POST/PUT/PATCH/DELETE qila olmaydi."""

    def has_permission(self, request, view):
        if request.method in ('GET', 'HEAD', 'OPTIONS'):
            return True
        user = request.user
        if user and user.is_authenticated and user_has_global_branch_access(user):
            return False
        return True
