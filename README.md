# Multivendor E-commerce API

This project is a multivendor e-commerce application built using Node.js, Express, TypeScript, and MongoDB. It provides a RESTful API for managing users, products, categories, payments, and authentication.

## Features

- User authentication and authorization
- Role-based access control for Admin, Vendor, and User roles
- CRUD operations for categories and products
- Payment processing using Stripe
- MongoDB for data storage

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- MongoDB (version 4.0 or higher)
- Stripe account for payment processing

### Installation

1. Clone the repository:

   ```
   git clone https://github.com/yourusername/multivendor-ecommerce.git
   ```

2. Navigate to the project directory:

   ```
   cd multivendor-ecommerce
   ```

3. Install the dependencies:

   ```
   npm install
   ```

4. Create a `.env` file in the root directory and add your environment variables:

   ```
   STRIPE_SECRET_KEY=your_stripe_secret_key
   MONGODB_URI=mongodb://localhost:27017/multivendor-ecommerce
   PORT=3000
   JWT_SECRET=your_jwt_secret_key
   ```

### Running the Application

To start the application in development mode, use:

```
npm run dev
```

To start the application in production mode, use:

```
npm start
```

### API Endpoints

- **Authentication**
  - `POST /api/auth/login`: User login

- **Users**
  - `POST /api/users`: Create a new user
  - `GET /api/users`: Get all users (Admin only)
  - `DELETE /api/users/:userId`: Delete a user (Admin only)
  - `PUT /api/users/approve/:userId`: Approve a vendor (Admin only)

- **Categories**
  - `POST /api/categories`: Create a new category (Admin only)
  - `GET /api/categories`: Get all categories
  - `PUT /api/categories/:categoryId`: Update a category (Admin only)
  - `DELETE /api/categories/:categoryId`: Delete a category (Admin only)

- **Products**
  - `POST /api/products`: Create a new product (Vendor only)
  - `GET /api/products`: Get all products
  - `GET /api/products/vendor/:userId`: Get products by vendor
  - `GET /api/products/category/:categoryId`: Get products by category

- **Payments**
  - `POST /api/payments/create-payment-intent`: Create a payment intent (User only)
  - `GET /api/payments/vendor/:userId`: Get payments for a vendor (Vendor and Admin only)

## License

This project is licensed under the MIT License. See the LICENSE file for details.