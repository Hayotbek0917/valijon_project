from io import BytesIO

from PIL import Image
from django.core.files.base import ContentFile


def save_product_image_as_webp(product, uploaded_file):
    img = Image.open(uploaded_file)
    if img.mode in ('RGBA', 'P'):
        img = img.convert('RGB')
    img.thumbnail((512, 512), Image.Resampling.LANCZOS)
    buf = BytesIO()
    img.save(buf, format='WEBP', quality=82, method=6)
    buf.seek(0)
    if product.image:
        product.image.delete(save=False)
    product.image.save(f'product_{product.pk}.webp', ContentFile(buf.read()), save=True)
    return product
