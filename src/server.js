const app = require('./app');
const { PORT, NODE_ENV } = require('./config/env');
const logger = require('./utils/logger');
const prisma = require('./lib/prisma');

// ============================================================================
// Server Startup
// ============================================================================

const server = app.listen(PORT, () => {
    logger.info(`
    ╔════════════════════════════════════════════╗
    ║      PetVMS API Server Started             ║
    ╠════════════════════════════════════════════╣
    ║  Environment: ${NODE_ENV.padEnd(25)}    ║
    ║  Port: ${PORT.toString().padEnd(35)} ║
    ║  URL: http://localhost:${PORT.toString().padEnd(30)} 
    ╚════════════════════════════════════════════╝
  `);
});

// ============================================================================
// Graceful Shutdown
// ============================================================================

process.on('SIGINT', async () => {
    logger.info('SIGINT signal received: closing HTTP server');
    server.close(async () => {
        logger.info('HTTP server closed');
        await prisma.$disconnect();
        logger.info('Prisma disconnected');
        process.exit(0);
    });
});

process.on('SIGTERM', async () => {
    logger.info('SIGTERM signal received: closing HTTP server');
    server.close(async () => {
        logger.info('HTTP server closed');
        await prisma.$disconnect();
        logger.info('Prisma disconnected');
        process.exit(0);
    });
});

// ============================================================================
// Uncaught Exception Handler
// ============================================================================

process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// ============================================================================
// Server Export
// ============================================================================

module.exports = server;
