import userRoute from '../routes/user.route.js';
import productRoute from '../routes/product.route.js';
import brandRoute from '../routes/brand.route.js';
import healthRoute from '../routes/health.route.js';
import wishlistRoute from '../routes/wishlist.route.js';
import cartRoute from '../routes/cart.route.js';

export const routes = [
  { path: '/api/v1/user', route: userRoute },
  { path: '/api/v1/product', route: productRoute },
  { path: '/api/v1/brand', route: brandRoute },
  { path: '/api/v1/wishlist', route: wishlistRoute },
  { path: '/api/v1/cart', route: cartRoute },
  { path: '/', route: healthRoute },
];
