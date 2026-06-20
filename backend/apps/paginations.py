from rest_framework.pagination import PageNumberPagination


class LargePageNumberPagination(PageNumberPagination):
    """Ro'yxat API — frontend bir martada ko'proq yozuv oladi (kamroq HTTP so'rov)."""

    page_size = 500
    page_size_query_param = 'page_size'
    max_page_size = 5000
