import asyncio
from collections import defaultdict
from typing import Any

from fastapi import WebSocket


class RealtimeManager:
    def __init__(self):
        self.channels: dict[str, set[WebSocket]] = defaultdict(set)
        self.loop: asyncio.AbstractEventLoop | None = None

    def set_loop(self, loop: asyncio.AbstractEventLoop):
        self.loop = loop

    async def connect(self, websocket: WebSocket, channels: list[str]):
        await websocket.accept()
        for channel in channels:
            self.channels[channel].add(websocket)

    def disconnect(self, websocket: WebSocket):
        for subscribers in self.channels.values():
            subscribers.discard(websocket)

    async def broadcast(self, channels: list[str], event: str, payload: dict[str, Any]):
        message = {"event": event, "payload": payload}
        targets: set[WebSocket] = set()
        for channel in channels:
            targets.update(self.channels.get(channel, set()))
        for websocket in list(targets):
            try:
                await websocket.send_json(message)
            except Exception:
                self.disconnect(websocket)

    def publish(self, channels: list[str], event: str, payload: dict[str, Any]):
        if not self.loop:
            return
        asyncio.run_coroutine_threadsafe(self.broadcast(channels, event, payload), self.loop)


realtime_manager = RealtimeManager()
