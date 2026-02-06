"""
iHuman Python SDK
Official Python client library for iHuman platform
"""

import asyncio
import json
import aiohttp
import websockets
from typing import Optional, Dict, Any, List
from datetime import datetime
from enum import Enum


class ExecutionStatus(Enum):
    """Execution status enum"""
    QUEUED = "queued"
    IN_PROGRESS = "in-progress"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class IhumanClient:
    """
    Official iHuman Python SDK
    
    Usage:
        client = IhumanClient(base_url="http://localhost:5173")
        await client.authenticate("user@example.com", "password")
        result = await client.execute_skill("skill-name", {"param": "value"})
    """

    def __init__(
        self,
        base_url: str = "http://localhost:5173",
        api_key: Optional[str] = None,
        timeout: int = 30,
        auto_reconnect: bool = True
    ):
        """
        Initialize iHuman client
        
        Args:
            base_url: Base URL of iHuman server
            api_key: Optional API key for authentication
            timeout: Request timeout in seconds
            auto_reconnect: Auto-reconnect on WebSocket disconnect
        """
        self.base_url = base_url
        self.api_key = api_key
        self.token: Optional[str] = None
        self.timeout = timeout
        self.auto_reconnect = auto_reconnect
        self.session: Optional[aiohttp.ClientSession] = None
        self.ws: Optional[websockets.WebSocketClientProtocol] = None
        self.is_connected = False
        self.subscriptions: set = set()
        self._callbacks: Dict[str, List[callable]] = {}

    async def __aenter__(self):
        """Context manager entry"""
        await self.connect_session()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit"""
        await self.close()

    async def connect_session(self):
        """Create HTTP session"""
        if not self.session:
            self.session = aiohttp.ClientSession()

    async def close(self):
        """Close all connections"""
        if self.ws:
            await self.ws.close()
        if self.session:
            await self.session.close()

    def on(self, event: str, callback: callable):
        """Register event listener"""
        if event not in self._callbacks:
            self._callbacks[event] = []
        self._callbacks[event].append(callback)

    async def emit(self, event: str, data: Any):
        """Emit event to listeners"""
        if event in self._callbacks:
            for callback in self._callbacks[event]:
                if asyncio.iscoroutinefunction(callback):
                    await callback(data)
                else:
                    callback(data)

    async def request(
        self,
        method: str,
        path: str,
        json_data: Optional[Dict] = None,
        retries: int = 0
    ) -> Dict[str, Any]:
        """
        Make HTTP request
        
        Args:
            method: HTTP method (GET, POST, etc)
            path: API path
            json_data: Request body
            retries: Retry count
            
        Returns:
            Response JSON
        """
        await self.connect_session()

        headers = {"Content-Type": "application/json"}
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        elif self.api_key:
            headers["X-API-Key"] = self.api_key

        url = f"{self.base_url}{path}"

        try:
            async with self.session.request(
                method, url, json=json_data, headers=headers, timeout=self.timeout
            ) as response:
                if response.status >= 400:
                    error_data = await response.json()
                    raise Exception(error_data.get("message", f"HTTP {response.status}"))
                
                return await response.json()
        except Exception as error:
            if retries < 3:
                await asyncio.sleep(1 * (retries + 1))
                return await self.request(method, path, json_data, retries + 1)
            raise

    async def authenticate(self, email: str, password: str) -> Dict[str, Any]:
        """
        Authenticate with email and password
        
        Args:
            email: User email
            password: User password
            
        Returns:
            User information
        """
        response = await self.request("POST", "/api/auth/login", {
            "email": email,
            "password": password
        })

        self.token = response["accessToken"]
        await self.emit("authenticated", {"user_id": response["user"]["id"]})
        
        return response["user"]

    async def register(self, email: str, username: str, password: str) -> Dict[str, Any]:
        """
        Register new account
        
        Args:
            email: Email address
            username: Username
            password: Password
            
        Returns:
            User information
        """
        return await self.request("POST", "/api/auth/register", {
            "email": email,
            "username": username,
            "password": password
        })

    async def get_current_user(self) -> Dict[str, Any]:
        """Get current user info"""
        return await self.request("GET", "/api/auth/me")

    async def list_skills(
        self,
        category: Optional[str] = None,
        difficulty: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """
        List all skills
        
        Args:
            category: Filter by category
            difficulty: Filter by difficulty
            limit: Results limit
            offset: Results offset
            
        Returns:
            List of skills
        """
        params = f"?limit={limit}&offset={offset}"
        if category:
            params += f"&category={category}"
        if difficulty:
            params += f"&difficulty={difficulty}"

        return await self.request("GET", f"/api/skills{params}")

    async def search_skills(
        self,
        query: str,
        limit: int = 50,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """
        Search skills
        
        Args:
            query: Search query
            limit: Results limit
            offset: Results offset
            
        Returns:
            List of matching skills
        """
        params = f"?q={query}&limit={limit}&offset={offset}"
        return await self.request("GET", f"/api/skills/search{params}")

    async def get_skill(self, skill_id: str) -> Dict[str, Any]:
        """Get skill details"""
        return await self.request("GET", f"/api/skills/{skill_id}")

    async def execute_skill(self, skill_id: str, params: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Execute a skill
        
        Args:
            skill_id: Skill identifier
            params: Execution parameters
            
        Returns:
            Execution result
        """
        if params is None:
            params = {}

        response = await self.request("POST", "/api/executions", {
            "skillId": skill_id,
            "params": params
        })

        await self.emit("skill_executed", {"execution_id": response["executionId"]})
        return response

    async def get_execution(self, execution_id: str) -> Dict[str, Any]:
        """Get execution status and result"""
        return await self.request("GET", f"/api/executions/{execution_id}")

    async def get_execution_history(
        self,
        limit: int = 50,
        offset: int = 0,
        status: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Get execution history
        
        Args:
            limit: Results limit
            offset: Results offset
            status: Filter by status
            
        Returns:
            List of executions
        """
        params = f"?limit={limit}&offset={offset}"
        if status:
            params += f"&status={status}"

        return await self.request("GET", f"/api/executions{params}")

    async def cancel_execution(self, execution_id: str) -> Dict[str, Any]:
        """Cancel an execution"""
        return await self.request("POST", f"/api/executions/{execution_id}/cancel")

    async def connect_websocket(self, execution_id: Optional[str] = None) -> None:
        """
        Connect to WebSocket for real-time updates
        
        Args:
            execution_id: Optional execution to monitor
        """
        ws_url = self.base_url.replace("http", "ws")
        url = f"{ws_url}/ws?token={self.token}"
        if execution_id:
            url += f"&execution={execution_id}"

        self.ws = await websockets.connect(url)
        self.is_connected = True

        await self.emit("connected", {})

        try:
            async for message in self.ws:
                data = json.loads(message)
                await self._handle_message(data)
        except websockets.exceptions.ConnectionClosed:
            self.is_connected = False
            await self.emit("disconnected", {})

            if self.auto_reconnect:
                await asyncio.sleep(3)
                await self.connect_websocket(execution_id)

    async def _handle_message(self, message: Dict[str, Any]) -> None:
        """Handle incoming WebSocket message"""
        message_type = message.get("type")

        if message_type == "execution-progress":
            await self.emit("progress", {
                "execution_id": message["executionId"],
                "progress": message["progress"],
                "status": message["status"]
            })
        elif message_type == "execution-complete":
            await self.emit("complete", {
                "execution_id": message["executionId"],
                "result": message["result"],
                "duration": message["durationMs"]
            })
        elif message_type == "execution-error":
            await self.emit("error", {
                "execution_id": message["executionId"],
                "error": message["error"]
            })
        elif message_type == "execution-log":
            await self.emit("log", {
                "execution_id": message["executionId"],
                "level": message["level"],
                "message": message["message"]
            })

    async def subscribe(self, execution_id: str) -> None:
        """Subscribe to execution updates"""
        if not self.is_connected:
            raise Exception("WebSocket not connected")

        self.subscriptions.add(execution_id)
        await self.ws.send(json.dumps({
            "type": "subscribe",
            "executionId": execution_id
        }))

    async def unsubscribe(self, execution_id: str) -> None:
        """Unsubscribe from execution updates"""
        if not self.is_connected:
            return

        self.subscriptions.discard(execution_id)
        await self.ws.send(json.dumps({
            "type": "unsubscribe",
            "executionId": execution_id
        }))

    @staticmethod
    def version() -> str:
        """Get SDK version"""
        return "1.0.0"


# Export main class
__all__ = ["IhumanClient", "ExecutionStatus"]
