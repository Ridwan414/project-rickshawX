# RickshawX API Testing Guide

## Overview
This guide provides comprehensive information about the RickshawX platform APIs and how to test them using the provided REST files.

## Services Architecture
The RickshawX platform consists of four main microservices:

1. **User Service** (Port 3001) - User authentication and profile management
2. **Ride Service** (Port 3002) - Ride booking and management
3. **Payment Service** (Port 3003) - Payment processing and earnings
4. **Notification Service** (Port 3004) - Real-time notifications

## Testing Files Structure

### Authentication (`tests/auth.rest`)
- User registration and login
- JWT token generation
- Password reset functionality

### Users & Drivers (`tests/users.rest`)
- User profile management
- Driver registration and management
- Profile updates and status changes

### Rides & Routes (`tests/rides.rest`)
- Route creation and management
- Ride booking workflow
- Ride status tracking

### Payments (`tests/payments.rest`)
- Payment processing
- Earnings tracking
- Refund handling

### Notifications (`tests/notifications.rest`)
- Real-time event handling
- WebSocket connections
- Push notifications

## Quick Start Testing

### 1. Environment Setup
```bash
# Start all services
docker-compose up -d

# Or start individually
cd services/user-service && npm start
cd services/ride-service && npm start
cd services/payment-service && npm start
cd services/notification-service && npm start
```

### 2. Basic Testing Flow

#### Step 1: Register Users
```http
# Register a regular user
POST http://localhost:3001/auth/register
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "+1234567890"
}

# Register a driver
POST http://localhost:3001/auth/register
{
  "name": "Jane Driver",
  "email": "jane@example.com",
  "password": "password123",
  "phone": "+1234567891",
  "type": "driver"
}
```

#### Step 2: Login and Get Tokens
```http
POST http://localhost:3001/auth/login
{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Step 3: Create Routes (Admin/Driver)
```http
POST http://localhost:3002/routes
Authorization: Bearer YOUR_TOKEN
{
  "from_location": "Dhaka University",
  "to_location": "New Market",
  "distance": 8.5,
  "duration": 25,
  "price": 150.00
}
```

#### Step 4: Book a Ride
```http
POST http://localhost:3002/rides/request
Authorization: Bearer USER_TOKEN
{
  "routeId": 1
}
```

#### Step 5: Accept Ride (Driver)
```http
POST http://localhost:3002/rides/{rideId}/accept
Authorization: Bearer DRIVER_TOKEN
```

#### Step 6: Process Payment
```http
POST http://localhost:3003/payments/process
Authorization: Bearer USER_TOKEN
{
  "rideId": 1,
  "paymentMethod": "card"
}
```

## API Endpoints Reference

### User Service (Port 3001)

#### Authentication
- `POST /auth/register` - Register new user/driver
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `POST /auth/reset-password` - Password reset

#### User Management
- `GET /users/profile` - Get user profile
- `PUT /users/profile` - Update user profile
- `GET /drivers/available` - Get available drivers
- `PUT /drivers/status` - Update driver status

### Ride Service (Port 3002)

#### Routes
- `GET /routes` - List all routes
- `POST /routes` - Create new route
- `GET /routes/{id}` - Get route details
- `PUT /routes/{id}` - Update route

#### Rides
- `POST /rides/request` - Request a ride
- `POST /rides/{id}/accept` - Accept ride (driver)
- `POST /rides/{id}/start` - Start trip
- `POST /rides/{id}/complete` - Complete trip
- `GET /rides/history` - Get ride history
- `GET /rides/active` - Get active ride

### Payment Service (Port 3003)

#### Payments
- `POST /payments/process` - Process payment
- `GET /payments/history` - Payment history
- `POST /payments/refund` - Process refund
- `GET /payments/earnings` - Driver earnings
- `GET /payments/{id}` - Get payment details

### Notification Service (Port 3004)

#### Notifications
- `GET /notifications` - Get user notifications
- `PUT /notifications/{id}/read` - Mark as read
- `WebSocket /` - Real-time notifications

## Testing Scenarios

### Complete Ride Flow
1. User registers and logs in
2. Driver registers and logs in
3. Admin creates routes
4. User requests a ride
5. Driver accepts the ride
6. Driver starts the trip
7. Driver completes the trip
8. User processes payment
9. Both parties receive notifications

### Error Scenarios
- Invalid authentication
- Duplicate ride requests
- Payment failures
- Driver unavailability
- Route not found

## Authentication
All protected endpoints require JWT token in Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Response Formats

### Success Response
```json
{
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
```json
{
  "error": "Error type",
  "message": "Detailed error message"
}
```

## Rate Limiting
- Authentication endpoints: 5 requests/minute
- General API: 100 requests/minute
- WebSocket connections: 10 concurrent per user

## Testing Tips

1. **Use Variables**: Store tokens and IDs as variables in your REST client
2. **Test Sequentially**: Follow the logical flow of operations
3. **Handle Errors**: Test both success and failure scenarios
4. **Real-time**: Test WebSocket connections for notifications
5. **Cleanup**: Reset test data between test runs

## WebSocket Testing
For real-time notifications, connect to:
```
ws://localhost:3004?token=YOUR_JWT_TOKEN
```

Events you'll receive:
- `ride_request` - New ride available (drivers)
- `ride_accepted` - Ride accepted (users)
- `trip_started` - Trip started
- `trip_completed` - Trip completed
- `payment_processed` - Payment completed

## Database Schema
The platform uses PostgreSQL with the following main tables:
- `users` - User accounts
- `drivers` - Driver profiles
- `routes` - Available routes
- `rides` - Ride bookings
- `payments` - Payment records
- `notifications` - User notifications

## Support
For issues or questions about the API:
1. Check the REST files for example requests
2. Verify service status at `/health` endpoints
3. Check logs for detailed error information
4. Ensure all services are running and accessible