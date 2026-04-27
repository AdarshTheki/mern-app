import userRoute from '../routes/user.route.js';
import productRoute from '../routes/product.route.js';
import brandRoute from '../routes/brand.route.js';
import healthRoute from '../routes/health.route.js';

export const routes = [
  { path: '/api/v1/user', route: userRoute },
  { path: '/api/v1/product', route: productRoute },
  { path: '/api/v1/brand', route: brandRoute },
  { path: '/', route: healthRoute },
];
