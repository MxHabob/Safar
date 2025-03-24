import uuid
import requests

def send_push_notification(expo_push_token, title, message):
    url = "https://exp.host/--/api/v2/push/send"
    headers = {
        "Accept": "application/json",
        "Content-Type": "application/json",
    }
    data = {
        "to": expo_push_token,
        "title": title,
        "body": message,
        "sound": "default",
    }
    response = requests.post(url, headers=headers, json=data)
    if response.status_code == 200:
        return True
    else:
        print(f"Failed to send notification: {response.text}")
        return False


def generate_unique_username(self, email):
    # Current implementation could lead to long usernames
    base_username = email.split('@')[0][:20]  # Limit base username length
    base_username = ''.join(c for c in base_username if c.isalnum())  # Remove special chars
    username = base_username.lower()
    counter = 1
    while self.model.objects.filter(username=username).exists():
        username = f"{base_username}{counter}"
        counter += 1
        if counter > 100:  # Safety check
            username = f"user{uuid.uuid4().hex[:8]}"
            break
    return username

def generate_unique_code():
    from apps.safar.models import Discount
    while True:
        code = uuid.uuid4().hex[:8].upper()
        if not Discount.objects.filter(code=code).exists():
            return code
