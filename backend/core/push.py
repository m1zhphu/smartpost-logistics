import httpx
import logging

logger = logging.getLogger(__name__)

async def send_expo_push_notification(push_token: str, title: str, body: str, data: dict = None):
    """
    Gửi push notification thông qua Expo Push API.
    Sử dụng httpx để gọi bất đồng bộ.
    """
    if not push_token or not str(push_token).startswith("ExponentPushToken"):
        logger.warning(f"Invalid Expo push token format: {push_token}")
        return

    url = "https://exp.host/--/api/v2/push/send"
    payload = {
        "to": push_token,
        "title": title,
        "body": body,
        "sound": "default"
    }
    if data:
        payload["data"] = data

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload, timeout=5.0)
            if response.status_code != 200:
                logger.error(f"Failed to send Expo push notification: {response.text}")
            else:
                logger.info(f"Successfully sent push notification to {push_token}")
                
    except Exception as e:
        logger.error(f"Error sending push notification: {e}")
