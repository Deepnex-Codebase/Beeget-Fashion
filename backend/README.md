# Begget Fashion E-commerce Backend

This is the backend server for the Begget Fashion E-commerce platform, built using the MERN stack (MongoDB, Express, React, Node.js).

## Features

- User authentication and authorization (Admin, Sub-Admin, User roles)
- Product management with variants and categories
- Order processing with payment integration (Cashfree)
- Shipping integration (ShipRocket)
- Coupon management
- Email notifications (Nodemailer)
- SMS notifications (Twilio)
- File uploads (Multer)
- Redis for OTP and caching
- Comprehensive error handling and logging

## Tech Stack

- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - MongoDB ODM
- **Redis** - Caching and OTP storage
- **JWT** - Authentication
- **Multer** - File uploads
- **Nodemailer** - Email services
- **Twilio** - SMS services
- **Cashfree** - Payment gateway
- **ShipRocket** - Shipping services
- **Winston** - Logging
- **Docker** - Containerization

## Prerequisites

- Node.js (v16+)
- MongoDB
- Redis
- Docker and Docker Compose (for production deployment)

## Installation

1. Clone the repository
   ```bash
   git clone https://github.com/your-username/begget-fashion.git
   cd begget-fashion/backend
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Set up environment variables
   ```bash
   cp .env.example .env
   # Edit .env file with your configuration
   ```

4. Start the development server
   ```bash
   npm run dev
   ```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Server
NODE_ENV=development
PORT=5000
API_URL=http://localhost:5000
FRONTEND_URL=http://localhost:3000

# MongoDB
MONGO_URI=mongodb://localhost:27017/begget-fashion
MONGO_USERNAME=
MONGO_PASSWORD=

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

# OTP & Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
OTP_EXPIRY=10 # minutes

# Email (SendGrid/SES)
EMAIL_FROM=noreply@beggetfashion.com
EMAIL_FROM_NAME=Begget Fashion
SENDGRID_API_KEY=

# Twilio SMS
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# Cashfree Payment Gateway
CASHFREE_APP_ID=
CASHFREE_SECRET_KEY=
CASHFREE_API_URL=

# ShipRocket
SHIPROCKET_EMAIL=
SHIPROCKET_PASSWORD=
SHIPROCKET_API_URL=

# File Upload
UPLOAD_PATH=uploads
MAX_FILE_SIZE=5 # MB

# Logging
LOG_LEVEL=info
LOG_FILE_PATH=logs
```

## API Documentation

API documentation is available at `/api-docs` when the server is running in development mode.

## Docker Deployment

To deploy using Docker:

```bash
# Build and start containers
docker-compose up -d

# View logs
docker-compose logs -f

# Stop containers
docker-compose down
```

## CI/CD Pipeline

This project uses GitHub Actions for CI/CD. When code is pushed to the main branch, it automatically:

1. Runs tests
2. Builds the Docker image
3. Deploys to the Hostinger VPS

See `.github/workflows/deploy.yml` for details.

## Project Structure

```
src/
├── app.js           # Express app setup
├── server.js        # Entry point
├── config/          # Configuration files
├── controllers/     # Route controllers
├── middlewares/     # Custom middlewares
├── models/          # Mongoose models
├── routes/          # API routes
├── services/        # External services
└── utils/           # Utility functions
```

## License

This project is proprietary and confidential.

## Contact

For any inquiries, please contact [your-email@example.com](mailto:your-email@example.com).