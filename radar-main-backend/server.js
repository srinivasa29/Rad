const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const { Server } = require("socket.io");
const cors = require('cors');
const logger = require('./src/config/logger');
const { connectDB, getDbStatus } = require('./src/config/db');
require('dotenv').config();

if (!process.env.JWT_SECRET || !process.env.MONGO_URI) {
    logger.error("FATAL ERROR: Missing required environment variables (JWT_SECRET or MONGO_URI).");
    process.exit(1);
}

const { initRealtimeService } = require('./src/services/realtimeService');
const { startAlertEngine, stopAlertEngine } = require('./src/services/alertEngine');
const { notFound, errorHandler } = require('./src/middleware/errorMiddleware');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});
const parsePort = (value, fallback) => {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const BASE_PORT = parsePort(process.env.PORT, 5000);
const SHOULD_AUTO_FALLBACK_PORT =
    process.env.NODE_ENV !== 'production' &&
    process.env.PORT_STRICT !== 'true' &&
    process.env.PORT_AUTO_FALLBACK !== 'false';
const DB_RETRY_INTERVAL_MS = 60000;

let alertEngineStarted = false;
let reconnectTimer = null;
let currentPort = BASE_PORT;

app.use(cors());
app.use(express.json());

const maybeStartAlertEngine = () => {
    if (alertEngineStarted || !getDbStatus()) {
        return;
    }

    startAlertEngine();
    alertEngineStarted = true;
    logger.info('Alert Engine started');
};

const clearReconnectTimer = () => {
    if (reconnectTimer) {
        clearInterval(reconnectTimer);
        reconnectTimer = null;
    }
};

const scheduleDbReconnect = () => {
    if (reconnectTimer || getDbStatus()) {
        return;
    }

    logger.warn(`MongoDB unavailable. Retrying connection every ${DB_RETRY_INTERVAL_MS / 1000}s.`);

    reconnectTimer = setInterval(async () => {
        const connected = await connectDB();
        if (connected) {
            clearReconnectTimer();
            maybeStartAlertEngine();
        }
    }, DB_RETRY_INTERVAL_MS);
};

io.on('connection', (socket) => {
    logger.info(`User connected: ${socket.id}`);
    socket.join('ticker');
    socket.on('disconnect', () => {
        logger.info(`User disconnected: ${socket.id}`);
    });
});

initRealtimeService(io);

mongoose.connection.on('connected', () => {
    clearReconnectTimer();
    maybeStartAlertEngine();
});

mongoose.connection.on('disconnected', () => {
    if (alertEngineStarted) {
        stopAlertEngine();
        alertEngineStarted = false;
    }
    scheduleDbReconnect();
});
app.get('/', (req, res) => {
    res.json({
        status: 'ok',
        db: getDbStatus() ? 'connected' : 'disconnected',
        alertEngine: alertEngineStarted ? 'running' : 'stopped',
    });
});
app.use('/api/auth',          require('./src/routes/authRoutes'));
app.use('/api/user',          require('./src/routes/userRoutes'));
app.use('/api/market',        require('./src/routes/marketRoutes'));
app.use('/api/watchlist',     require('./src/routes/watchlistRoutes'));
app.use('/api/portfolio',     require('./src/routes/portfolioRoutes'));
app.use('/api/alerts',        require('./src/routes/alertRoutes'));
app.use('/api/analytics',     require('./src/routes/analyticsRoutes'));
app.use('/api/technical',     require('./src/routes/technicalRoutes'));
app.use('/api/fno',           require('./src/routes/fnoRoutes'));
app.use('/api/fundamental',   require('./src/routes/fundamentalRoutes'));
app.use('/api/calendar',      require('./src/routes/calendarRoutes'));
app.use('/api/earnings',      require('./src/routes/earningsRoutes'));
app.use('/api/notifications', require('./src/routes/notificationRoutes'));
app.use('/api/ticker',        require('./src/routes/tickerRoutes'));
app.use('/api/sectors',       require('./src/routes/sectorRoutes'));
app.use('/api/learning',      require('./src/routes/learningRoutes'));
app.use(notFound);
app.use(errorHandler);

server.on('error', (error) => {
    if (error?.code === 'EADDRINUSE' && SHOULD_AUTO_FALLBACK_PORT) {
        const nextPort = currentPort + 1;
        logger.warn(`Port ${currentPort} is in use. Retrying on port ${nextPort}.`);
        currentPort = nextPort;
        setTimeout(() => {
            server.listen(currentPort);
        }, 150);
        return;
    }

    logger.error(`Server failed to start: ${error.message}`);
    process.exit(1);
});

server.on('listening', () => {
    logger.info(`Server running on http://localhost:${currentPort}`);
});

const startServer = async () => {
    const dbConnected = await connectDB();

    if (dbConnected) {
        maybeStartAlertEngine();
    } else {
        logger.warn('Skipping Alert Engine startup until MongoDB becomes available.');
        scheduleDbReconnect();
    }

    server.listen(currentPort);
};

startServer();