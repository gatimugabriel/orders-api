# Orders API

A RESTful API service for managing orders with role-based access control and caching.

## Features

- 🔐 **Authentication & Authorization**
  - JWT-based authentication
  - Role-based access control (Admin, Manager, Editor)
  - Secure password hashing
  - Route-specific permission checks

- 📦 **Order Management**
  - Create, read, update, and delete orders
  - Role-based viewing permissions
  - Order status tracking
  - Email notifications
  - Search and filter capabilities

- 🛍️ **Product Management**
  - Product CRUD operations
  - Image upload support

- 🚀 **Performance**
  - Redis caching for frequently accessed data
  - Database query optimization
  - Rate limiting

- 📚 **Documentation**
  - Comprehensive Swagger/OpenAPI documentation
  - Detailed API documentation at /api-docs
  - TypeScript types and interfaces

## Tech Stack

- Node.js & Express.js
- TypeScript
- PostgreSQL with Prisma ORM
- Redis for caching
- JWT for authentication
- Swagger/OpenAPI for documentation
<!-- - Jest for testing -->
- Docker support

## Getting Started

### Prerequisites

- Node.js (v14+)
- PostgreSQL
- Redis
- pnpm (recommended) or npm

### Installation

1. Clone the repository
```bash
git clone [repository-url]
cd orders-api
```

2. Install dependencies
```bash
pnpm install
```
or
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start your Redis server
```bash
redis-server
```

5. Run database migrations
```bash
pnpm prisma migrate dev
```

6. Start the development server
```bash
pnpm dev
```

The API will be available at http://localhost:8080

## API Documentation

Visit `/api-docs` after starting the server to view the Swagger documentation.

### Key Endpoints

- **Authentication**
  - POST /auth/register - Create new user account
  - POST /auth/login - User login
  <!-- - POST /auth/refresh - Refresh access token -->

- **Orders**
  - GET /orders - List all orders (with role-based access)
  - POST /orders - Create new order
  - GET /orders/:id - Get order details (with ownership verification)
  - PUT /orders/:id/status - Update order status (admin/manager only)

- **Products**
  - GET /products - List all products
  - POST /products - Create new product (admin only)
  - PUT /products/:id - Update product (admin/manager only)
  - DELETE /products/:id - Delete product (admin only)

## Project Structure

```
src/
├── @types/          # TypeScript type definitions
├── config/          # Configuration files
├── controllers/     # Route controllers
├── middleware/      # Custom middleware
│   ├── auth/       # Authentication & authorization
│   ├── validation/ # Request validation
│   └── cache/      # Caching middleware
├── routes/          # API routes
├── services/        # Business logic
└── utils/           # Utility functions
```

## Error Handling

The API uses a consistent error response format:

```json
{
  "success": false,
  "message": "Error message",
  "errors": []
}
```

## Caching Strategy

The API implements Redis caching for:
- Product listings
- Order details
- Frequently accessed resources

See [Caching Strategy](docs/CACHING.md) for details.

## Database Schema

Prisma is used as the ORM. See [Prisma Guide](docs/PRISMA.md) for details.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'Add some  feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
