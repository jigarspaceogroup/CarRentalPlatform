import http from 'http';
import { createApp } from './app';
import { env } from './config/env';
import { initializeSocket } from './realtime/socket';

const app = createApp();
const server = http.createServer(app);

// Initialize Socket.io
initializeSocket(server);

server.listen(env.PORT, () => {
  console.log(`🚀 API server running on port ${env.PORT}`);
  console.log(`📖 Health check: http://localhost:${env.PORT}/api/v1/health`);
});
