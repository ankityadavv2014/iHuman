/**
 * WebSocket Server for Real-time Execution Monitoring
 * Provides live progress updates, event streaming, and connection management
 */

const WebSocket = require('ws');
const { EventEmitter } = require('events');
const db = require('./db/connection');

class WebSocketManager extends EventEmitter {
  constructor(httpServer) {
    super();
    this.wss = new WebSocket.Server({ server: httpServer });
    this.clients = new Map(); // userId -> Set of WebSocket connections
    this.executionSockets = new Map(); // executionId -> Set of WebSocket connections
    this.reconnectAttempts = new Map(); // clientId -> attempt count
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000;

    this.setupWSS();
    this.setupEventListeners();
    this.startHeartbeat();
  }

  /**
   * Setup WebSocket Server
   */
  setupWSS() {
    this.wss.on('connection', (ws, req) => {
      const clientId = this.generateClientId();
      const url = new URL(req.url, `http://${req.headers.host}`);
      const token = url.searchParams.get('token');
      const executionId = url.searchParams.get('execution');

      ws.clientId = clientId;
      ws.token = token;
      ws.executionId = executionId;
      ws.userId = null;
      ws.isAlive = true;
      ws.messageCount = 0;
      ws.connectedAt = Date.now();

      // Authenticate client
      this.authenticateClient(ws, token, (error, userId) => {
        if (error) {
          ws.close(4001, 'Authentication failed');
          return;
        }

        ws.userId = userId;
        this.registerClient(ws, userId, executionId);

        // Send welcome message
        ws.send(JSON.stringify({
          type: 'connected',
          clientId,
          userId,
          executionId,
          timestamp: new Date().toISOString(),
          serverVersion: '1.0.0'
        }));

        // Setup message handlers
        ws.on('message', (message) => this.handleMessage(ws, message));
        ws.on('pong', () => { ws.isAlive = true; });
        ws.on('close', () => this.handleClose(ws));
        ws.on('error', (error) => this.handleError(ws, error));
      });
    });

    console.log('✅ WebSocket server initialized');
  }

  /**
   * Authenticate WebSocket client using JWT token
   */
  authenticateClient(ws, token, callback) {
    if (!token) {
      return callback(new Error('No token provided'));
    }

    try {
      const jwt = require('./auth/jwt');
      const decoded = jwt.verifyToken(token);
      
      if (!decoded || !decoded.sub) {
        return callback(new Error('Invalid token'));
      }

      callback(null, decoded.sub);
    } catch (error) {
      callback(error);
    }
  }

  /**
   * Register client connection
   */
  registerClient(ws, userId, executionId) {
    // Add to user clients
    if (!this.clients.has(userId)) {
      this.clients.set(userId, new Set());
    }
    this.clients.get(userId).add(ws);

    // Add to execution clients
    if (executionId) {
      if (!this.executionSockets.has(executionId)) {
        this.executionSockets.set(executionId, new Set());
      }
      this.executionSockets.get(executionId).add(ws);
    }

    // Clear reconnect attempts
    this.reconnectAttempts.delete(ws.clientId);

    console.log(`✅ Client ${ws.clientId} connected | User: ${userId} | Execution: ${executionId || 'monitoring'}`);
  }

  /**
   * Handle incoming WebSocket messages
   */
  handleMessage(ws, data) {
    try {
      ws.messageCount++;
      const message = JSON.parse(data);

      switch (message.type) {
        case 'subscribe':
          this.handleSubscribe(ws, message);
          break;
        case 'unsubscribe':
          this.handleUnsubscribe(ws, message);
          break;
        case 'ping':
          ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
          break;
        case 'request-update':
          this.handleUpdateRequest(ws, message);
          break;
        default:
          console.warn(`Unknown message type: ${message.type}`);
      }
    } catch (error) {
      console.error('WebSocket message error:', error.message);
      ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
    }
  }

  /**
   * Subscribe to execution updates
   */
  handleSubscribe(ws, message) {
    const { executionId } = message;

    if (!executionId) {
      ws.send(JSON.stringify({ type: 'error', message: 'Execution ID required' }));
      return;
    }

    if (!this.executionSockets.has(executionId)) {
      this.executionSockets.set(executionId, new Set());
    }

    this.executionSockets.get(executionId).add(ws);
    ws.subscriptions = ws.subscriptions || new Set();
    ws.subscriptions.add(executionId);

    ws.send(JSON.stringify({
      type: 'subscribed',
      executionId,
      timestamp: new Date().toISOString()
    }));

    console.log(`📡 Client ${ws.clientId} subscribed to execution ${executionId}`);
  }

  /**
   * Unsubscribe from execution updates
   */
  handleUnsubscribe(ws, message) {
    const { executionId } = message;

    if (this.executionSockets.has(executionId)) {
      this.executionSockets.get(executionId).delete(ws);
    }

    if (ws.subscriptions) {
      ws.subscriptions.delete(executionId);
    }

    ws.send(JSON.stringify({
      type: 'unsubscribed',
      executionId,
      timestamp: new Date().toISOString()
    }));
  }

  /**
   * Handle update requests (get current status)
   */
  async handleUpdateRequest(ws, message) {
    const { executionId } = message;

    try {
      const execution = await db.selectOne('executions', 'execution_id = $1', [executionId]);

      if (!execution) {
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Execution not found'
        }));
        return;
      }

      ws.send(JSON.stringify({
        type: 'execution-update',
        execution: {
          id: execution.id,
          executionId: execution.execution_id,
          status: execution.status,
          progress: execution.progress,
          startedAt: execution.started_at,
          completedAt: execution.completed_at,
          durationMs: execution.duration_ms,
          inputParams: execution.input_params,
          outputResult: execution.output_result,
          errorMessage: execution.error_message
        },
        timestamp: new Date().toISOString()
      }));
    } catch (error) {
      console.error('Update request error:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Failed to fetch execution status'
      }));
    }
  }

  /**
   * Handle client close
   */
  handleClose(ws) {
    // Remove from user clients
    if (ws.userId && this.clients.has(ws.userId)) {
      this.clients.get(ws.userId).delete(ws);
      if (this.clients.get(ws.userId).size === 0) {
        this.clients.delete(ws.userId);
      }
    }

    // Remove from execution clients
    if (ws.subscriptions) {
      ws.subscriptions.forEach(executionId => {
        if (this.executionSockets.has(executionId)) {
          this.executionSockets.get(executionId).delete(ws);
        }
      });
    }

    console.log(`❌ Client ${ws.clientId} disconnected | Messages sent: ${ws.messageCount}`);
  }

  /**
   * Handle WebSocket errors
   */
  handleError(ws, error) {
    console.error(`WebSocket error for client ${ws.clientId}:`, error.message);
  }

  /**
   * Broadcast execution progress update
   */
  broadcastProgressUpdate(executionId, progress, status, metadata = {}) {
    const sockets = this.executionSockets.get(executionId);

    if (!sockets || sockets.size === 0) {
      return;
    }

    const message = JSON.stringify({
      type: 'execution-progress',
      executionId,
      progress: Math.min(100, Math.max(0, progress)),
      status,
      timestamp: new Date().toISOString(),
      ...metadata
    });

    sockets.forEach(socket => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(message);
      }
    });

    console.log(`📊 Broadcast progress to ${sockets.size} clients: ${executionId} (${progress}%)`);
  }

  /**
   * Broadcast execution completion
   */
  broadcastExecutionComplete(executionId, result, durationMs) {
    const sockets = this.executionSockets.get(executionId);

    if (!sockets || sockets.size === 0) {
      return;
    }

    const message = JSON.stringify({
      type: 'execution-complete',
      executionId,
      result,
      durationMs,
      timestamp: new Date().toISOString()
    });

    sockets.forEach(socket => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(message);
      }
    });

    console.log(`✅ Execution ${executionId} completed | Notified ${sockets.size} clients`);

    // Cleanup after 1 minute
    setTimeout(() => {
      this.executionSockets.delete(executionId);
    }, 60000);
  }

  /**
   * Broadcast execution error
   */
  broadcastExecutionError(executionId, error, durationMs) {
    const sockets = this.executionSockets.get(executionId);

    if (!sockets || sockets.size === 0) {
      return;
    }

    const message = JSON.stringify({
      type: 'execution-error',
      executionId,
      error: error.message || error,
      durationMs,
      timestamp: new Date().toISOString()
    });

    sockets.forEach(socket => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(message);
      }
    });

    console.log(`❌ Execution ${executionId} failed | Error notified to ${sockets.size} clients`);
  }

  /**
   * Broadcast log message
   */
  broadcastLog(executionId, logLevel, message, metadata = {}) {
    const sockets = this.executionSockets.get(executionId);

    if (!sockets || sockets.size === 0) {
      return;
    }

    const wsMessage = JSON.stringify({
      type: 'execution-log',
      executionId,
      level: logLevel,
      message,
      timestamp: new Date().toISOString(),
      ...metadata
    });

    sockets.forEach(socket => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(wsMessage);
      }
    });
  }

  /**
   * Broadcast to user's all connections
   */
  broadcastToUser(userId, message) {
    const sockets = this.clients.get(userId);

    if (!sockets || sockets.size === 0) {
      return;
    }

    const wsMessage = JSON.stringify(message);

    sockets.forEach(socket => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(wsMessage);
      }
    });

    console.log(`📣 Broadcast to user ${userId}: ${message.type || 'message'}`);
  }

  /**
   * Start heartbeat to detect dead connections
   */
  startHeartbeat() {
    setInterval(() => {
      this.wss.clients.forEach((ws) => {
        if (ws.isAlive === false) {
          return ws.terminate();
        }

        ws.isAlive = false;
        ws.ping();
      });
    }, 30000); // 30 second heartbeat

    console.log('💓 WebSocket heartbeat started (30s interval)');
  }

  /**
   * Get connection statistics
   */
  getStats() {
    return {
      totalConnections: this.wss.clients.size,
      totalUsers: this.clients.size,
      totalExecutions: this.executionSockets.size,
      connections: Array.from(this.wss.clients).map(ws => ({
        clientId: ws.clientId,
        userId: ws.userId,
        executionId: ws.executionId,
        messageCount: ws.messageCount,
        connectedFor: Date.now() - ws.connectedAt,
        connectedAt: new Date(ws.connectedAt).toISOString()
      }))
    };
  }

  /**
   * Cleanup and close
   */
  close() {
    this.wss.clients.forEach((ws) => {
      ws.close(1000, 'Server shutting down');
    });
    this.wss.close();
    console.log('WebSocket server closed');
  }

  /**
   * Generate unique client ID
   */
  generateClientId() {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = WebSocketManager;
