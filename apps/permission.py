from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsAdminOrOwner(BasePermission):
    def has_permission(self, request, view):
        return (
                request.user and
                request.user.is_authenticated and
                request.user.role in ['admin', 'owner']
        )


class IsManagerOrAbove(BasePermission):
    def has_permission(self, request, view):
        return (
                request.user and
                request.user.is_authenticated and
                request.user.role in ['admin', 'owner', 'manager']
        )


class IsSalesAllowed(BasePermission):
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.method == 'POST':
            return True
        return request.user.role in ['admin', 'owner', 'manager']
