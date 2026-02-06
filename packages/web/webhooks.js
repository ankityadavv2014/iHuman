/**
 * Webhook Management System
 * Handles webhook events, delivery, and retry logic
 */

const db = require('./db/connection');
const fetch = require('node-fetch');

class WebhookManager {
  constructor() {
    this.maxRetries = 3;
    this.retryDelays = [1000, 5000, 15000]; // 1s, 5s, 15s
    this.defaultTimeout = 30000;
    this.eventQueues = new Map(); // eventType -> queue
    this.activeDeliveries = new Map();
  }

  /**
   * Initialize webhook system
   */
  async initialize() {
    console.log('🪝 Initializing webhook system...');
    
    // Start delivery worker
    this.startDeliveryWorker();
    
    console.log('✅ Webhook system initialized');
  }

  /**
   * Register event listener
   */
  on(eventType, handler) {
    if (!this.eventQueues.has(eventType)) {
      this.eventQueues.set(eventType, []);
    }
    this.eventQueues.get(eventType).push(handler);
  }

  /**
   * Emit webhook event
   */
  async emit(eventType, data, userId = null) {
    try {
      // Get all webhooks for this event type
      const webhooks = await db.select(
        'webhooks',
        'event_type = $1 AND is_active = true',
        [eventType]
      );

      if (webhooks.length === 0) {
        return;
      }

      // Queue deliveries for each webhook
      for (const webhook of webhooks) {
        await this.queueDelivery(webhook, eventType, data, userId);
      }

      console.log(`📤 Queued ${webhooks.length} webhook deliveries for event: ${eventType}`);
    } catch (error) {
      console.error('Webhook emit error:', error);
    }
  }

  /**
   * Queue webhook delivery
   */
  async queueDelivery(webhook, eventType, data, userId) {
    try {
      const payload = {
        event: eventType,
        timestamp: new Date().toISOString(),
        data,
        userId,
        webhookId: webhook.id
      };

      // Create delivery record
      const delivery = await db.insert('webhook_deliveries', {
        webhook_id: webhook.id,
        event_type: eventType,
        payload: JSON.stringify(payload),
        status: 'pending',
        attempt: 0,
        next_retry_at: new Date(),
        created_at: new Date()
      });

      console.log(`📋 Webhook delivery queued: ${webhook.id} | ${eventType}`);

      // Immediately attempt delivery
      setImmediate(() => this.deliverWebhook(delivery.id, webhook, payload, 0));
    } catch (error) {
      console.error('Queue delivery error:', error);
    }
  }

  /**
   * Deliver webhook with retry logic
   */
  async deliverWebhook(deliveryId, webhook, payload, attemptNumber = 0) {
    const deliveryKey = `${webhook.id}_${deliveryId}`;

    // Prevent duplicate deliveries
    if (this.activeDeliveries.has(deliveryKey)) {
      return;
    }

    this.activeDeliveries.set(deliveryKey, true);

    try {
      const startTime = Date.now();

      // Prepare request
      const headers = {
        'Content-Type': 'application/json',
        'X-Webhook-ID': webhook.id,
        'X-Webhook-Signature': this.generateSignature(webhook.secret, payload),
        'X-Delivery-ID': deliveryId,
        'X-Attempt': attemptNumber + 1
      };

      // Add custom headers
      if (webhook.custom_headers) {
        Object.assign(headers, webhook.custom_headers);
      }

      const response = await fetch(webhook.url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        timeout: this.defaultTimeout
      });

      const durationMs = Date.now() - startTime;
      const responseBody = await response.text();

      if (response.ok) {
        // Success
        await db.update(
          'webhook_deliveries',
          {
            status: 'delivered',
            response_status: response.status,
            response_body: responseBody,
            duration_ms: durationMs,
            delivered_at: new Date()
          },
          'id = $1',
          [deliveryId]
        );

        console.log(`✅ Webhook delivered: ${webhook.id} | Status: ${response.status} | Duration: ${durationMs}ms`);
      } else {
        // Non-2xx response - will retry
        throw new Error(`HTTP ${response.status}: ${responseBody}`);
      }
    } catch (error) {
      console.error(`❌ Webhook delivery failed (attempt ${attemptNumber + 1}):`, error.message);

      if (attemptNumber < this.maxRetries - 1) {
        // Schedule retry
        const retryDelay = this.retryDelays[attemptNumber];
        const nextRetry = new Date(Date.now() + retryDelay);

        await db.update(
          'webhook_deliveries',
          {
            status: 'pending',
            attempt: attemptNumber + 1,
            error_message: error.message,
            next_retry_at: nextRetry
          },
          'id = $1',
          [deliveryId]
        );

        console.log(`⏳ Retry scheduled for ${nextRetry.toISOString()} (${retryDelay}ms delay)`);

        // Schedule retry
        setTimeout(() => {
          const delivery = db.selectOne('webhook_deliveries', 'id = $1', [deliveryId]);
          if (delivery) {
            const payload = JSON.parse(delivery.payload);
            this.deliverWebhook(deliveryId, webhook, payload, attemptNumber + 1);
          }
        }, retryDelay);
      } else {
        // Max retries exceeded
        await db.update(
          'webhook_deliveries',
          {
            status: 'failed',
            attempt: attemptNumber + 1,
            error_message: error.message,
            failed_at: new Date()
          },
          'id = $1',
          [deliveryId]
        );

        console.log(`💀 Webhook delivery permanently failed: ${webhook.id}`);
      }
    } finally {
      this.activeDeliveries.delete(deliveryKey);
    }
  }

  /**
   * Generate webhook signature for verification
   */
  generateSignature(secret, payload) {
    const crypto = require('crypto');
    const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);
    return crypto.createHmac('sha256', secret).update(payloadString).digest('hex');
  }

  /**
   * Start background delivery worker
   */
  startDeliveryWorker() {
    setInterval(async () => {
      try {
        // Find pending deliveries that are ready for retry
        const pendingDeliveries = await db.select(
          'webhook_deliveries',
          'status = \'pending\' AND next_retry_at <= NOW()',
          []
        );

        for (const delivery of pendingDeliveries) {
          const webhook = await db.selectOne('webhooks', 'id = $1', [delivery.webhook_id]);
          if (webhook) {
            const payload = JSON.parse(delivery.payload);
            this.deliverWebhook(delivery.id, webhook, payload, delivery.attempt);
          }
        }
      } catch (error) {
        console.error('Delivery worker error:', error);
      }
    }, 10000); // Check every 10 seconds

    console.log('👷 Webhook delivery worker started (10s intervals)');
  }

  /**
   * Create webhook subscription
   */
  async createWebhook(userId, eventType, url, secret, customHeaders = {}) {
    try {
      const webhook = await db.insert('webhooks', {
        user_id: userId,
        event_type: eventType,
        url,
        secret,
        custom_headers: JSON.stringify(customHeaders),
        is_active: true,
        created_at: new Date()
      });

      console.log(`✅ Webhook created: ${webhook.id} | Event: ${eventType} | URL: ${url}`);

      return webhook;
    } catch (error) {
      console.error('Create webhook error:', error);
      throw error;
    }
  }

  /**
   * Get user webhooks
   */
  async getUserWebhooks(userId) {
    return db.select('webhooks', 'user_id = $1', [userId]);
  }

  /**
   * Get webhook delivery history
   */
  async getDeliveryHistory(webhookId, limit = 50, offset = 0) {
    return db.select(
      'webhook_deliveries',
      'webhook_id = $1',
      [webhookId],
      `ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [limit, offset]
    );
  }

  /**
   * Disable webhook
   */
  async disableWebhook(webhookId) {
    await db.update(
      'webhooks',
      { is_active: false },
      'id = $1',
      [webhookId]
    );
    console.log(`🔇 Webhook disabled: ${webhookId}`);
  }

  /**
   * Delete webhook
   */
  async deleteWebhook(webhookId) {
    await db.deleteRecord('webhooks', 'id = $1', [webhookId]);
    console.log(`🗑️ Webhook deleted: ${webhookId}`);
  }

  /**
   * Get statistics
   */
  async getStats() {
    const total = await db.count('webhook_deliveries', '');
    const delivered = await db.count('webhook_deliveries', 'status = \'delivered\'');
    const pending = await db.count('webhook_deliveries', 'status = \'pending\'');
    const failed = await db.count('webhook_deliveries', 'status = \'failed\'');

    return {
      total,
      delivered,
      pending,
      failed,
      successRate: total > 0 ? ((delivered / total) * 100).toFixed(2) + '%' : '0%'
    };
  }
}

module.exports = new WebhookManager();
