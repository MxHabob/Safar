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