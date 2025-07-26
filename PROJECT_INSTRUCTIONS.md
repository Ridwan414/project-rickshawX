# RickshawX Project - Development Instructions

## Overview
RickshawX is a ride-sharing platform with a microservices architecture built using Node.js, Next.js, PostgreSQL, and Redis. The system supports both web and mobile clients with real-time communication via WebSockets.

## System Architecture

### Technology Stack
- **Frontend**: Next.js (Web)
- **Backend**: Node.js Express (API Gateway + Microservices)
- **Database**: PostgreSQL (Primary), Redis (Cache & Sessions)
- **Message Broker**: Redis Pub/Sub
- **Infrastructure**: Docker, Nginx Load Balancer

### Core Services
1. **API Gateway** - Route requests and handle authentication
2. **User Service** - User/driver registration and management (minimalistic)
3. **Ride Service** - Ride requests, matching, and lifecycle management
4. **Payment Service** - Payment processing and records
5. **Notification Service** - Real-time notifications via WebSocket

## Development Phases

### Phase 1: Infrastructure Setup
1. **Database Setup**
   - Configure PostgreSQL with required tables:
     - `users` (id, email, phone, type, created_at)
     - `drivers` (id, user_id, vehicle_info, status, created_at)
     - `routes` (id, from_location, to_location, price, duration)
     - `rides` (id, user_id, driver_id, route_id, status, price, created_at)
     - `payments` (id, ride_id, amount, payment_method, status, created_at)
   
2. **Redis Setup**
   - Configure for caching and session storage
   - Set up Pub/Sub channels for real-time events

3. **Docker Configuration**
   - Create Dockerfiles for each service
   - Set up docker-compose for local development
   - Configure Nginx as load balancer

### Phase 2: Core Services Development

#### API Gateway (Port: 3000)
- **Authentication middleware** - JWT token validation
- **Request routing** - Forward to appropriate microservices
- **WebSocket handling** - Real-time communication setup
- **CORS configuration** - Allow frontend access

#### User Service (Port: 3001)
**Endpoints:**
- `POST /auth/register` - User/driver registration
- `POST /auth/login` - User authentication
- `PUT /drivers/status` - Update driver availability (available/busy/offline)
- `GET /users/profile` - Get user profile
- `PUT /users/profile` - Update user profile

**Key Features:**
- JWT token generation and validation
- Password hashing (bcrypt)
- Driver status management
- Session management with Redis

#### Ride Service (Port: 3002)
**Endpoints:**
- `GET /routes` - Get all available routes with prices
- `POST /rides/request` - Create ride request
- `POST /rides/{id}/accept` - Driver accepts ride
- `POST /rides/{id}/start` - Start trip
- `POST /rides/{id}/complete` - Complete trip
- `GET /rides/history` - User ride history

**Key Features:**
- Fixed route pricing system (6 predefined locations)
- Driver matching algorithm (find available drivers)
- Ride lifecycle management (requested → accepted → in_progress → completed)
- Real-time event publishing to message broker

#### Payment Service (Port: 3003)
**Endpoints:**
- `POST /payments/process` - Process payment for completed ride
- `GET /payments/history` - Payment history
- `POST /payments/refund` - Process refund (if needed)

**Key Features:**
- Fixed price calculation based on route
- Payment record management
- Integration with payment gateways (future)
- Event publishing for payment status

#### Notification Service (Port: 3004)
**WebSocket Events:**
- `ride_request` - New ride available for drivers
- `ride_accepted` - Driver assigned to user
- `trip_started` - Trip has begun
- `trip_completed` - Trip finished
- `payment_processed` - Payment successful
- `driver_status` - Driver availability changed


### Phase 3: Frontend Development

#### Next.js Web Application
**User Interface:**
- Registration/login forms
- Route selection with pricing
- Real-time ride tracking
- Payment interface
- Ride history

**Driver Interface:**
- Driver registration with vehicle details
- Status toggle (available/busy/offline)
- Incoming ride requests
- Trip management (start/complete)
- Earnings dashboard

**Real-time Features:**
- WebSocket connection management
- Live ride status updates


### Phase 4: API Workflow Implementation

#### User Registration Flow
1. User submits registration form
2. API Gateway forwards to User Service
3. User Service saves to PostgreSQL
4. Session stored in Redis
5. JWT token returned to client

#### Ride Booking Flow
1. User selects route from predefined options
2. Ride Service creates request with fixed price
3. Available drivers fetched from database
4. Ride request published to message broker
5. Drivers receive real-time notification
6. First driver to accept gets the ride

#### Trip Lifecycle Management
1. **Accepted**: Driver accepts ride, status updated
2. **Started**: Driver starts trip, user notified
3. **Completed**: Driver completes trip, payment triggered
4. **Paid**: Payment processed, both parties notified

#### Real-time Communication
- WebSocket connections for live updates
- Message broker handles event distribution
- Automatic reconnection handling
- Event queuing for offline scenarios

### Phase 5: Testing & Deployment

#### Testing Strategy
- Unit tests for each service
- Integration tests for API endpoints
- WebSocket connection testing
- Database transaction testing
- Load testing for concurrent users

#### Deployment Configuration
- Production Docker images
- Environment variable management
- Database migrations
- Redis cluster setup (if needed)
- Nginx configuration for production
- SSL certificate setup
- Monitoring and logging setup

## Key Business Rules

### Route & Pricing System
- **Fixed Routes**: 6 predefined locations with set prices
- **No Dynamic Pricing**: Prices remain constant
- **Route Selection**: Users choose from available routes only

### Driver Management
- **Status Types**: available, busy, offline
- **Automatic Status Updates**: busy during rides, available after completion
- **First-Come-First-Served**: First driver to accept gets the ride

### Payment System
- **Fixed Pricing**: Based on selected route
- **Post-Trip Payment**: Payment processed after trip completion
- **Payment Methods**: Multiple options supported
- **Refund Policy**: Automated refunds for cancelled rides

## Environment Variables
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/rickshawx
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h

# External Services (Optional)
# Currently no external services required

# File Storage
AWS_S3_BUCKET=your-bucket-name
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# Service Ports
API_GATEWAY_PORT=3000
USER_SERVICE_PORT=3001
RIDE_SERVICE_PORT=3002
PAYMENT_SERVICE_PORT=3003
NOTIFICATION_SERVICE_PORT=3004
```

## Development Commands
```bash
# Start all services
docker-compose up -d

# Run database migrations
npm run migrate

# Start individual services
npm run dev:gateway
npm run dev:user-service
npm run dev:ride-service
npm run dev:payment-service
npm run dev:notification-service

# Run tests
npm test
npm run test:integration

# Build for production
npm run build
docker-compose -f docker-compose.prod.yml up -d
```

## Error Handling Strategy
- Graceful degradation for service failures
- Retry mechanisms for external API calls
- Database transaction rollbacks
- WebSocket reconnection logic
- Comprehensive logging for debugging
- User-friendly error messages

This document serves as the complete development roadmap for the RickshawX project. Follow the phases sequentially for systematic development and ensure all components integrate seamlessly.