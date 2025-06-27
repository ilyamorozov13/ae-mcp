import express from 'express';
import { Logger } from 'winston';
import winston from 'winston';
import { AfterEffectsServer } from './aeServer.js';

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
    new winston.transports.File({ filename: 'ae-mcp-server.log' })
  ],
});

async function main() {
  try {
    logger.info('Starting Adobe After Effects MCP HTTP Server...');
    
    const server = new AfterEffectsServer(logger);
    const port = parseInt(process.env.AE_MCP_PORT || '3000');
    
    await server.start(port);
    
    logger.info(`HTTP server started on port ${port}`);
    
    process.on('SIGINT', async () => {
      logger.info('Shutting down server...');
      await server.stop();
      process.exit(0);
    });
    
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

main();