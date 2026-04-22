# MERN + AI + Cloudinary + Stripe

A production-ready REST API for product management with image uploads via Cloudinary, JWT authentication, AI Integration, Stripe live payment and role-based access control.

---

## Stack

| Layer          | Tech                                |
| -------------- | ----------------------------------- |
| Runtime        | Node.js (ESM)                       |
| Framework      | Express 4                           |
| Database       | MongoDB via Mongoose                |
| Auth           | JWT (access + refresh tokens)       |
| File upload    | Multer (disk) → Cloudinary          |
| AI Integration | AI Generate → Text, Image, etc...   |
| Payment online | Payment integration → Stripe or COD |

---

## Project Structure

```
src/
├── app.js                        # Entry point, express setup
├── config/
│   └── db.js                     # MongoDB connection
├── middleware/
│   ├── auth.middleware.js        # verifyJWT, authorizeRoles, optionalJWT
│   └── multer.middleware.js      # upload instances & field presets
├── utils/
│   ├── asyncHandler.js           # Promise-based error forwarding
│   ├── ApiError.js               # Operational error class
│   ├── ApiResponse.js            # Success envelope
│   └── cloudinary.js             # upload, delete, bulk-delete, getAsset, signedUrl
├── models/
│   ├── user.model.js
│   └── product.model.js
├── controllers/
│   ├── auth.controller.js
│   └── product.controller.js
└── routes/
    ├── auth.routes.js
    └── product.routes.js
```

---

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your MongoDB URI, JWT secrets, and Cloudinary credentials

# 3. Start development server
npm run dev
```

---

## Environment Variables

| Variable                | Description                       |
| ----------------------- | --------------------------------- |
| `PORT`                  | Server port (default 8000)        |
| `MONGODB_URI`           | MongoDB connection string         |
| `JWT_SECRET`            | Access token secret               |
| `JWT_EXPIRE`            | Access token expiry (e.g. `7d`)   |
| `JWT_REFRESH_SECRET`    | Refresh token secret              |
| `JWT_REFRESH_EXPIRE`    | Refresh token expiry (e.g. `30d`) |
| `CLOUDINARY_CLOUD_NAME` | Your Cloudinary cloud name        |
| `CLOUDINARY_API_KEY`    | Cloudinary API key                |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret             |
| `CORS_ORIGIN`           | Allowed CORS origin               |

---

## API Endpoints

### Auth

| Method | Endpoint                | Access  | Description                |
| ------ | ----------------------- | ------- | -------------------------- |
| POST   | `/api/v1/auth/register` | Public  | Register + optional avatar |
| POST   | `/api/v1/auth/login`    | Public  | Login → JWT cookies        |
| POST   | `/api/v1/auth/logout`   | 🔒 User | Clear tokens               |
| GET    | `/api/v1/auth/me`       | 🔒 User | Current user profile       |

### Products

| Method | Endpoint                             | Access   | Description                    |
| ------ | ------------------------------------ | -------- | ------------------------------ |
| GET    | `/api/v1/products`                   | Public   | List products (paginated)      |
| GET    | `/api/v1/products/:id`               | Public   | Single product                 |
| GET    | `/api/v1/products/admin/all`         | 🔒 Admin | All products incl. unpublished |
| POST   | `/api/v1/products`                   | 🔒 Admin | Create product + images        |
| PATCH  | `/api/v1/products/:id`               | 🔒 Admin | Update product / images        |
| DELETE | `/api/v1/products/:id/images/:pubId` | 🔒 Admin | Remove one gallery image       |
| DELETE | `/api/v1/products/:id`               | 🔒 Admin | Delete product + all images    |

---

## Request Examples

### Register

```http
POST /api/v1/auth/register
Content-Type: multipart/form-data

fullName     = John Doe
email    = john@example.com
password = secret123
avatar   = <file>        (optional)
```

### Create Product

```http
POST /api/v1/products
Authorization: Bearer <token>
Content-Type: multipart/form-data

name          = Wireless Headphones
description   = Premium noise-cancelling headphones
price         = 299.99
discount      = 4.2 %
category      = Electronics
brand         = SoundMax
stock         = 50
isFeatured    = true
isPublished   = true
thumbnail     = <file>           (required)
images        = <file>, <file>   (optional, max 5)
```

### Query Products

```
GET /api/v1/products?category=Electronics&minPrice=100&maxPrice=500&sort=-price&page=1&limit=10
```

---

## Response Format

### Success

```json
{
  "statusCode": 200,
  "data": { ... },
  "message": "Products fetched successfully",
  "success": true
}
```

### Error

```json
{
  "success": false,
  "statusCode": 404,
  "message": "Product not found",
  "errors": []
}
```

---

## Roles

| Role         | Permissions                              |
| ------------ | ---------------------------------------- |
| `user`       | Read public products, manage own profile |
| `admin`      | Full product CRUD, view all products     |
| `superadmin` | All admin permissions                    |
