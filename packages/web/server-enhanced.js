/**
 * Enhanced iHuman Server with WebSocket, Webhooks, and Scheduling
 * Integrates all Phase 2 and Phase 3 features
 */

const http = require('http');
const express = require('express');
const path = require('path');

// Import new systems
const WebSocketManager = require('./websocket');
const webhookManager = require('./webhooks');
const schedulerManager = require('./scheduler');

const app = express();
const server = http.createServer(app);

// Port configuration
const PORT = process.env.PORT || 5173;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));

/**
 * Initialize all systems
 */
async function initializeSystems() {
  console.log('\n🚀 iHuman Platform - Full Stack Initialization\n');

  try {
    // 1. Initialize WebSocket Manager
    const wsManager = new WebSocketManager(server);
    console.log('✅ WebSocket Manager initialized');

    // 2. Initialize Webhook Manager
    await webhookManager.initialize();
    console.log('✅ Webhook Manager initialized');

    // 3. Initialize Scheduler
    await schedulerManager.initialize();
    console.log('✅ Scheduler initialized');

    // Attach managers to app for use in routes
    app.locals.wsManager = wsManager;
    app.locals.webhookManager = webhookManager;
    app.locals.schedulerManager = schedulerManager;

    console.log('\n📊 System Status:\n');
    console.log(`  WebSocket: Ready for real-time updates`);
    console.log(`  Webhooks: Ready to deliver events`);
    console.log(`  Scheduler: ${schedulerManager.getStats().totalSchedules} active schedules`);
    console.log('');

    return { wsManager, webhookManager, schedulerManager };
  } catch (error) {
    console.error('❌ System initialization failed:', error);
    process.exit(1);
  }
}

/**
 * Setup API routes
 */
function setupRoutes() {
  // WebSocket stats endpoint
  app.get('/api/websocket/stats', (req, res) => {
    const wsManager = app.locals.wsManager;
    res.json(wsManager.getStats());
  });

  // Webhook management endpoints
  app.get('/api/webhooks', async (req, res) => {
    try {
      const userId = req.user?.id;
      const webhooks = await app.locals.webhookManager.getUserWebhooks(userId);
      res.json(webhooks);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/webhooks', async (req, res) => {
    try {
      const { eventType, url, secret, customHeaders } = req.body;
      const userId = req.user?.id;
      const webhook = await app.locals.webhookManager.createWebhook(
        userId,
        eventType,
        url,
        secret,
        customHeaders
      );
      res.status(201).json(webhook);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/webhooks/:id/deliveries', async (req, res) => {
    try {
      const { id } = req.params;
      const { limit, offset } = req.query;
      const deliveries = await app.locals.webhookManager.getDeliveryHistory(
        id,
        parseInt(limit) || 50,
        parseInt(offset) || 0
      );
      res.json(deliveries);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/webhooks/stats', async (req, res) => {
    try {
      const stats = await app.locals.webhookManager.getStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Scheduler endpoints
  app.get('/api/schedules', async (req, res) => {
    try {
      const userId = req.user?.id;
      const schedules = await app.locals.schedulerManager.listSchedules(userId);
      res.json(schedules);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/schedules', async (req, res) => {
    try {
      const { workflowId, cronExpression, description, params } = req.body;
      const schedule = await app.locals.schedulerManager.createSchedule(
        workflowId,
        cronExpression,
        description,
        params
      );
      res.status(201).json(schedule);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/schedules/stats', (req, res) => {
    try {
      const stats = app.locals.schedulerManager.getStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/schedules/:id/pause', async (req, res) => {
    try {
      await app.locals.schedulerManager.pauseSchedule(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/schedules/:id/resume', async (req, res) => {
    try {
      await app.locals.schedulerManager.resumeSchedule(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // System status endpoint
  app.get('/api/system/status', (req, res) => {
    const wsManager = app.locals.wsManager;
    const schedulerManager = app.locals.schedulerManager;

    res.json({
      status: 'operational',
      timestamp: new Date().toISOString(),
      systems: {
        websocket: {
          active: true,
          connections: wsManager.getStats().totalConnections,
          executionMonitoring: wsManager.getStats().totalExecutions
        },
        webhooks: {
          active: true,
          activeDeliveries: wsManager.getStats().totalConnections
        },
        scheduler: {
          active: true,
          schedules: schedulerManager.getStats().totalSchedules,
          executions: schedulerManager.getStats().totalExecutions
        }
      }
    });
  });

  console.log('✅ API routes configured');
}

/**
 * Setup graceful shutdown
 */
function setupGracefulShutdown() {
  process.on('SIGTERM', async () => {
    console.log('\n⏹️ SIGTERM received - shutting down gracefully...\n');

    // Stop scheduler
    if (app.locals.schedulerManager) {
      app.locals.schedulerManager.shutdown();
    }

    // Close WebSocket
    if (app.locals.wsManager) {
      app.locals.wsManager.close();
    }

    // Close server
    server.close(() => {
      console.log('✅ Server shut down gracefully');
      process.exit(0);
    });

    // Force exit after 30 seconds
    setTimeout(() => {
      console.error('❌ Forced shutdown due to timeout');
      process.exit(1);
    }, 30000);
  });

  process.on('SIGINT', async () => {
    console.log('\n⏹️ SIGINT received - shutting down gracefully...\n');
    process.emit('SIGTERM');
  });
}

/**
 * Start server
 */
async function start() {
  try {
    // Initialize all systems
    const { wsManager, webhookManager, schedulerManager } = await initializeSystems();

    // Setup routes
    setupRoutes();

    // Setup graceful shutdown
    setupGracefulShutdown();

    // Start server
    server.listen(PORT, () => {
      console.log(`\n🎯 iHuman Server running on http://localhost:${PORT}\n`);
      console.log('Features:');
      console.log('  ✅ Real-time WebSocket monitoring');
      console.log('  ✅ Event-driven webhooks with retry logic');
      console.log('  ✅ Cron-based task scheduling');
      console.log('  ✅ Full-stack API endpoints');
      console.log('\nAPI Endpoints:');
      console.log('  GET  /api/websocket/stats');
      console.log('  GET  /api/webhooks');
      console.log('  GET  /api/schedules');
      console.log('  GET  /api/system/status');
      console.log('\n💡 WebSocket: ws://localhost:' + PORT + '/ws?token=YOUR_TOKEN\n');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start server
start();

module.exports = { app, server };
