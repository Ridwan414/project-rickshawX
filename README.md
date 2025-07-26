# RickshawX - Ride Sharing Platform

A comprehensive ride-sharing platform built with microservices architecture using Node.js, PostgreSQL, and Redis.

## 🚀 Features

- **User Management**: Registration, authentication, and profile management
- **Driver Management**: Driver registration, status management, and availability tracking
- **Ride System**: Fixed route pricing, ride requests, matching, and lifecycle management
- **Payment Processing**: Secure payment handling with multiple methods
- **Real-time Notifications**: WebSocket support, database storage, and console logging
- **Microservices Architecture**: Scalable and maintainable service-oriented design

## 🏗️ Architecture
![Architecture Diagram](images/image.png)

### Services
1. **API Gateway** (Port 3000) - Request routing and authentication
2. **User Service** (Port 3001) - User and driver management
3. **Ride Service** (Port 3002) - Ride requests and lifecycle management
4. **Payment Service** (Port 3003) - Payment processing
5. **Notification Service** (Port 3004) - Database storage and console logging

### Infrastructure
- **PostgreSQL** - Primary database
- **Redis** - Caching, sessions, and pub/sub messaging
- **Docker** - Containerization
- **Nginx** - Load balancing

### APi workflow diagram
/api-workflow.md

## 📋 Prerequisites

- Node.js 18+ 
- Docker and Docker Compose
- PostgreSQL 15+
- Redis 7+

## 🚀 Quick Start

### 1. Clone and Setup

```bash
git clone <repository-url>
cd project-rickshawX
cp .env.example .env
```

### 2. Configure Environment

Edit `.env` file with your configuration:

```env
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/rickshawx
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-secret-key-here-change-in-production
JWT_EXPIRES_IN=24h

# External Services (Optional)
# Currently no external services required
```

### 3. Start with Docker

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### 4. Initialize Database

```bash
# Run database migrations and seed data
npm run migrate
```

## 🔧 Development Setup

### Install Dependencies

```bash
# Install root dependencies
npm install

# Install all service dependencies
npm run install:all
```

### Start Services Individually

```bash
# Start API Gateway
npm run dev:gateway

# Start User Service  
npm run dev:user-service

# Start Ride Service
npm run dev:ride-service

# Start Payment Service
npm run dev:payment-service

# Start Notification Service
npm run dev:notification-service
```

## 📡 API Endpoints

### Authentication
- `POST /auth/register` - User/driver registration
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout

### Users
- `GET /users/profile` - Get user profile
- `PUT /users/profile` - Update user profile
- `PUT /drivers/status` - Update driver status

### Routes & Rides
- `GET /routes` - Get all available routes
- `POST /rides/request` - Request a ride
- `POST /rides/{id}/accept` - Accept ride (driver)
- `POST /rides/{id}/start` - Start trip (driver)
- `POST /rides/{id}/complete` - Complete trip (driver)
- `GET /rides/history` - Get ride history

### Payments
- `POST /payments/process` - Process payment
- `GET /payments/history` - Get payment history
- `GET /payments/earnings` - Get driver earnings

### Notifications
- `GET /notifications` - Get user notifications
- `GET /notifications/unread-count` - Get unread notification count
- `PUT /notifications/{id}/read` - Mark notification as read
- `PUT /notifications/mark-all-read` - Mark all notifications as read
- `POST /notifications/send` - Send notification (admin)
- `POST /notifications/test` - Test notification system

## 🎯 Usage Examples

### Register as User

```bash
curl -X POST http://localhost/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "phone": "+8801234567890", 
    "password": "password123",
    "name": "John Doe",
    "type": "user"
  }'
```

### Register as Driver

```bash
curl -X POST http://localhost/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "driver@example.com",
    "phone": "+8801234567891",
    "password": "password123", 
    "name": "Jane Driver",
    "type": "driver",
    "vehicleType": "Rickshaw",
    "vehicleNumber": "DH-1234",
    "licenseNumber": "LIC123456"
  }'
```

### Request a Ride

```bash
curl -X POST http://localhost/rides/request \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "routeId": 1
  }'
```

## 🛠️ Database Schema

### Users Table
- id, email, phone, password_hash, name, type, created_at, updated_at

### Drivers Table  
- id, user_id, vehicle_type, vehicle_number, license_number, status, created_at, updated_at

### Routes Table (Pre-seeded)
- id, from_location, to_location, price, duration, distance, created_at

### Rides Table
- id, user_id, driver_id, route_id, status, price, pickup_time, start_time, end_time, created_at, updated_at

### Payments Table
- id, ride_id, amount, payment_method, status, transaction_id, processed_at, created_at

## 🔄 Real-time Events

The system uses Redis pub/sub for real-time communication:

- `ride_request` - New ride available for drivers
- `ride_accepted` - Driver assigned to user  
- `trip_started` - Trip has begun
- `trip_completed` - Trip finished
- `payment_processed` - Payment successful
- `driver_status` - Driver availability changed

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run integration tests  
npm run test:integration
```

## 📦 Production Deployment

```bash
# Build for production
npm run build

# Start production services
docker-compose -f docker-compose.prod.yml up -d
```

## 🚨 Health Checks

Each service provides a health check endpoint:

- API Gateway: `GET http://localhost:3000/health`
- User Service: `GET http://localhost:3001/health`  
- Ride Service: `GET http://localhost:3002/health`
- Payment Service: `GET http://localhost:3003/health`
- Notification Service: `GET http://localhost:3004/health`

## 📖 Business Logic

### Fixed Routes System
- 6 predefined locations with set prices
- No dynamic pricing - fares remain constant
- Routes: Dhanmondi, Gulshan, Uttara, Old Dhaka, Mirpur, Banani

### Driver Management
- Status types: `available`, `busy`, `offline`
- Automatic status updates during ride lifecycle
- First-come-first-served ride assignment

### Payment Flow
- Fixed pricing based on selected route
- Payment processed after trip completion  
- Multiple payment methods supported
- Automated refund system

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

---

**Phase 1 & 2 Implementation Complete!** ✅

The infrastructure and core services are now fully implemented and ready for development and testing.