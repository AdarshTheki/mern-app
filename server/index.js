import server from './src/app.js';
import { logger } from './src/middlewares/logger.middleware.js';
import { connectDB } from './src/config/connectDB.js';

const PORT = process.env.PORT || 8000;
const HOST = process.env.HOST || '0.0.0.0';

connectDB()
  .then(() => {
    server.listen(PORT, () => {
      logger.info(`Running PORT >> http://localhost:${PORT}`);
    });
  })
  .catch((err) => logger.error(`Server Failed On >> ${err.message}`));
