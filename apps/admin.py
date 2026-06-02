from django.contrib import admin
from apps.models import User, Branch, Category, Product, Order, OrderItem, Agent, ProductBatch, Expense

admin.site.register(User)
admin.site.register(Branch)
admin.site.register(Category)
admin.site.register(Product)
admin.site.register(Order)
admin.site.register(OrderItem)
admin.site.register(Agent)
admin.site.register(ProductBatch)
admin.site.register(Expense)