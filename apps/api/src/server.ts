import { createApp } from './app';
import { env } from './config/env';

const app = createApp();

app.listen(env.PORT, () => {
  console.log(`🚀 API server running on port ${env.PORT}`);
  console.log(`📖 Health check: http://localhost:${env.PORT}/api/v1/health`);
});
