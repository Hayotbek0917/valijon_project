from apps.models.base_model import TimeStampedModel, BaseModel, CreatedModel, uzbek_phone_validator
from apps.models.markets import Market, Branch
from apps.models.users import User
from apps.models.credit import DebtCustomers, CreditTransaction
from apps.models.product import Category, Product
from apps.models.supplier import Supplier, SupplierCatalogItem, Agent, AgentOrder
from apps.models.inventory import Warehouse, InventoryItem
from apps.models.sale import Sale, SaleLine, PosCartDraft
from apps.models.purchase import PurchaseOrder, PurchaseOrderLine


