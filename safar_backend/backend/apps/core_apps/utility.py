import uuid

def generate_unique_username(self, email):
    # Current implementation could lead to long usernames
    base_username = email.split('@')[0][:20]
    base_username = ''.join(c for c in base_username if c.isalnum())
    username = base_username.lower()
    counter = 1
    while self.model.objects.filter(username=username).exists():
        username = f"{base_username}{counter}"
        counter += 1
        if counter > 100:
            username = f"user{uuid.uuid4().hex[:8]}"
            break
    return username

def generate_unique_code():
    from apps.safar.models import Discount
    while True:
        code = uuid.uuid4().hex[:8].upper()
        if not Discount.objects.filter(code=code).exists():
            return code
