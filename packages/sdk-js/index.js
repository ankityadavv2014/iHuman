/**
 * iHuman JavaScript SDK
 * @ihuman/sdk - Official JavaScript client library
 */

const EventEmitter = require('events');
const fetch = require('node-fetch');
const WebSocket = require('ws');

class IhumanClient extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.baseUrl = options.baseUrl || 'http://localhost:5173';
    this.apiKey = options.apiKey;
    this.token = options.token;
    this.timeout = options.timeout || 30000;
    this.autoReconnect = options.autoReconnect !== false;
    this.maxRetries = options.maxRetries || 3;
    
    this.ws = null;
    this.isConnected = false;
    this.subscriptions = new Set();
    this.requestQueue = [];
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  /**
   * Authenticate with credentials
   */
  async authenticate(email, password) {
    try {
      const response = await this.request('POST', '/api/auth/login', {
        email,
        password
      });

      this.token = response.accessToken;
      this.emit('authenticated', { userId: response.user.id, role: response.user.role });
      
      return response.user;
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Register new account
   */
  async register(email, username, password) {
    try {
      const response = await this.request('POST', '/api/auth/register', {
        email,
        username,
        password
      });

      return response;
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Get current user info
   */
  async getCurrentUser() {
    return this.request('GET', '/api/auth/me');
  }

  /**
   * List all skills
   */
  async listSkills(options = {}) {
    const params = new URLSearchParams();
    
    if (options.category) params.append('category', options.category);
    if (options.difficulty) params.append('difficulty', options.difficulty);
    if (options.limit) params.append('limit', options.limit);
    if (options.offset) params.append('offset', options.offset);

    return this.request('GET', `/api/skills?${params.toString()}`);
  }

  /**
   * Search skills
   */
  async searchSkills(query, options = {}) {
    const params = new URLSearchParams({ q: query });
    
    if (options.limit) params.append('limit', options.limit);
    if (options.offset) params.append('offset', options.offset);

    return this.request('GET', `/api/skills/search?${params.toString()}`);
  }

  /**
   * Get skill details
   */
  async getSkill(skillId) {
    return this.request('GET', `/api/skills/${skillId}`);
  }

  /**
   * Execute skill
   */
  async executeSkill(skillId, params = {}) {
    try {
      const response = await this.request('POST', '/api/executions', {
        skillId,
        params
      });

      this.emit('skillExecuted', { executionId: response.executionId, skillId });
      
      return response;
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Get execution status
   */
  async getExecution(executionId) {
    return this.request('GET', `/api/executions/${executionId}`);
  }

  /**
   * Get execution history
   */
  async getExecutionHistory(options = {}) {
    const params = new URLSearchParams();
    
    if (options.limit) params.append('limit', options.limit);
    if (options.offset) params.append('offset', options.offset);
    if (options.status) params.append('status', options.status);

    return this.request('GET', `/api/executions?${params.toString()}`);
  }

  /**
   * Cancel execution
   */
  async cancelExecution(executionId) {
    return this.request('POST', `/api/executions/${executionId}/cancel`);
  }

  /**
   * Connect to real-time WebSocket
   */
  connect(executionId = null) {
    return new Promise((resolve, reject) => {
      try {
        const wsUrl = new URL(this.baseUrl);
        wsUrl.protocol = wsUrl.protocol === 'https:' ? 'wss:' : 'ws:';
        wsUrl.pathname = '/ws';
        wsUrl.searchParams.append('token', this.token);
        
        if (executionId) {
          wsUrl.searchParams.append('execution', executionId);
        }

        this.ws = new WebSocket(wsUrl.toString());

        this.ws.addEventListener('open', () => {
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.emit('connected');
          
          // Process queued requests
          while (this.requestQueue.length > 0) {
            const request = this.requestQueue.shift();
            this.ws.send(JSON.stringify(request));
          }

          resolve();
        });

        this.ws.addEventListener('message', (event) => {
          this.handleMessage(JSON.parse(event.data));
        });

        this.ws.addEventListener('close', () => {
          this.isConnected = false;
          this.emit('disconnected');

          if (this.autoReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            setTimeout(() => this.connect(executionId), 3000 * this.reconnectAttempts);
          }
        });

        this.ws.addEventListener('error', (error) => {
          this.emit('error', error);
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Subscribe to execution updates
   */
  subscribe(executionId) {
    if (!this.isConnected) {
      throw new Error('WebSocket not connected. Call connect() first.');
    }

    const message = {
      type: 'subscribe',
      executionId
    };

    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      this.requestQueue.push(message);
    }

    this.subscriptions.add(executionId);
    this.emit('subscribed', { executionId });
  }

  /**
   * Unsubscribe from execution updates
   */
  unsubscribe(executionId) {
    if (!this.isConnected) {
      return;
    }

    const message = {
      type: 'unsubscribe',
      executionId
    };

    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }

    this.subscriptions.delete(executionId);
    this.emit('unsubscribed', { executionId });
  }

  /**
   * Request execution update
   */
  requestUpdate(executionId) {
    if (!this.isConnected) {
      throw new Error('WebSocket not connected. Call connect() first.');
    }

    const message = {
      type: 'request-update',
      executionId
    };

    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      this.requestQueue.push(message);
    }
  }

  /**
   * Handle incoming WebSocket messages
   */
  handleMessage(message) {
    switch (message.type) {
      case 'connected':
        this.emit('message:connected', message);
        break;
      case 'execution-progress':
        this.emit('progress', {
          executionId: message.executionId,
          progress: message.progress,
          status: message.status
        });
        break;
      case 'execution-complete':
        this.emit('complete', {
          executionId: message.executionId,
          result: message.result,
          duration: message.durationMs
        });
        break;
      case 'execution-error':
        this.emit('error', {
          executionId: message.executionId,
          error: message.error
        });
        break;
      case 'execution-log':
        this.emit('log', {
          executionId: message.executionId,
          level: message.level,
          message: message.message
        });
        break;
      default:
        this.emit('message', message);
    }
  }

  /**
   * Disconnect WebSocket
   */
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.isConnected = false;
    }
  }

  /**
   * Make HTTP request
   */
  async request(method, path, body = null, retries = 0) {
    try {
      const options = {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: this.timeout
      };

      if (this.token) {
        options.headers['Authorization'] = `Bearer ${this.token}`;
      } else if (this.apiKey) {
        options.headers['X-API-Key'] = this.apiKey;
      }

      if (body) {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(`${this.baseUrl}${path}`, options);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      if (retries < this.maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (retries + 1)));
        return this.request(method, path, body, retries + 1);
      }
      throw error;
    }
  }

  /**
   * Get client version
   */
  static getVersion() {
    return '1.0.0';
  }
}

module.exports = IhumanClient;
