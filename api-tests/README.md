# RickshawX API Testing

Comprehensive REST API test collection for the RickshawX ride-sharing platform.

## 📁 Test Files Overview

| File | Description | Purpose |
|------|-------------|---------|
| `00-variables.rest` | Variable definitions | Common variables and endpoints |
| `01-health-checks.rest` | Service health checks | Verify all services are running |
| `02-authentication.rest` | Auth endpoints | User/driver registration and login |
| `03-user-management.rest` | User/driver management | Profile and status management |
| `04-routes-rides.rest` | Ride lifecycle | Complete ride booking flow |
| `05-payments.rest` | Payment processing | Payment and earnings management |
| `06-notifications.rest` | Notifications | Database-stored notifications |
| `07-complete-workflow.rest` | End-to-end flow | Full ride booking workflow |
| `08-error-scenarios.rest` | Error testing | Edge cases and error conditions |

## 🚀 Getting Started

### Prerequisites

1. **VS Code with REST Client Extension**
   ```bash
   # Install the REST Client extension
   code --install-extension humao.rest-client
   ```

2. **Running Services**
   ```bash
   # Start all services with Docker
   docker-compose up -d
   
   # Or start services individually
   npm run dev:gateway
   npm run dev:user-service
   npm run dev:ride-service
   npm run dev:payment-service
   npm run dev:notification-service
   ```

### Setup Instructions

1. **Update Variables** (if needed)
   - Edit `00-variables.rest` to match your environment
   - Default: `http://localhost:3000` (API Gateway)

2. **Start Testing**
   - Run health checks first: `01-health-checks.rest`
   - Follow the sequence: `02` → `03` → `04` → `05` → `06`
   - Use `07-complete-workflow.rest` for end-to-end testing

## 📋 Testing Workflow

### 1. Health Checks
```http
GET http://localhost:3000/health
```
Verify all services are operational.

### 2. Authentication Flow
```http
# Register User
POST http://localhost:3000/auth/register
{
  "email": "user@example.com",
  "phone": "+8801234567890",
  "password": "password123",
  "name": "Test User",
  "type": "user"
}

# Register Driver
POST http://localhost:3000/auth/register
{
  "email": "driver@example.com",
  "phone": "+8801234567891", 
  "password": "password123",
  "name": "Test Driver",
  "type": "driver",
  "vehicleType": "Rickshaw",
  "vehicleNumber": "DH-001",
  "licenseNumber": "LIC123"
}

# Login and get JWT token
POST http://localhost:3000/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}
```

### 3. Complete Ride Flow
1. **User requests ride** → `POST /rides/request`
2. **Driver accepts ride** → `POST /rides/{id}/accept`
3. **Driver starts trip** → `POST /rides/{id}/start`
4. **Driver completes trip** → `POST /rides/{id}/complete`
5. **User processes payment** → `POST /payments/process`

## 🔧 Usage Tips

### Authentication Tokens
After login, copy the JWT token and use it in subsequent requests:
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Variable Usage
Use variables for consistency:
```http
### Login User
POST {{authUrl}}/login
Authorization: Bearer {{userToken}}
```

### Response Handling
The REST Client shows:
- **Status codes** (200, 400, 500, etc.)
- **Response headers**
- **Response body** (JSON data)
- **Response time**

## 📊 Test Categories

### Happy Path Tests
- Successful user/driver registration
- Successful ride booking and completion
- Successful payment processing
- Successful notification retrieval

### Error Scenarios
- Invalid authentication
- Missing required fields
- Unauthorized access attempts
- Invalid data formats
- Race conditions
- Duplicate operations

### Edge Cases
- Large payload testing
- SQL injection attempts
- XSS prevention
- Concurrent requests
- Invalid IDs and references

## 🎯 Key Endpoints

### Authentication
- `POST /auth/register` - Register user/driver
- `POST /auth/login` - Login and get JWT
- `POST /auth/logout` - Logout user

### User Management
- `GET /users/profile` - Get user profile
- `PUT /users/profile` - Update profile
- `PUT /drivers/status` - Update driver status

### Rides
- `GET /routes` - Get available routes
- `POST /rides/request` - Request a ride
- `POST /rides/{id}/accept` - Accept ride (driver)
- `POST /rides/{id}/start` - Start trip (driver)
- `POST /rides/{id}/complete` - Complete trip (driver)
- `GET /rides/history` - Get ride history

### Payments
- `POST /payments/process` - Process payment
- `GET /payments/history` - Payment history
- `GET /payments/earnings` - Driver earnings

### Notifications
- `GET /notifications` - Get user notifications
- `GET /notifications/unread-count` - Unread count
- `PUT /notifications/{id}/read` - Mark as read
- `PUT /notifications/mark-all-read` - Mark all as read

## 🔍 Expected Responses

### Successful Registration
```json
{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "Test User",
    "type": "user"
  }
}
```

### Successful Ride Request
```json
{
  "message": "Ride request created successfully",
  "ride": {
    "id": 1,
    "from_location": "Dhanmondi",
    "to_location": "Gulshan", 
    "price": 120.00,
    "status": "requested"
  },
  "notified_drivers": 3
}
```

### Error Response
```json
{
  "error": "Validation error",
  "message": "Email is required"
}
```

## 🐛 Troubleshooting

### Common Issues

1. **Connection Refused**
   ```
   Error: connect ECONNREFUSED ::1:3000
   ```
   **Solution**: Ensure services are running (`docker-compose up -d`)

2. **401 Unauthorized**
   ```json
   {"error": "No token provided"}
   ```
   **Solution**: Include valid JWT token in Authorization header

3. **404 Not Found**
   ```json
   {"error": "Endpoint not found"}
   ```
   **Solution**: Check endpoint URL and HTTP method

4. **Validation Errors**
   ```json
   {"error": "Validation error", "message": "Email is required"}
   ```
   **Solution**: Check request body format and required fields

### Debug Tips

1. **Check Service Logs**
   ```bash
   docker-compose logs api-gateway
   docker-compose logs user-service 
   docker-compose logs ride-service
   ```

2. **Verify Database Connection**
   ```bash
   docker-compose logs postgres
   docker-compose logs redis
   ```

3. **Test Direct Service URLs**
   - User Service: `http://localhost:3001/health`
   - Ride Service: `http://localhost:3002/health`
   - Payment Service: `http://localhost:3003/health`
   - Notification Service: `http://localhost:3004/health`

## 📈 Performance Testing

### Load Testing Endpoints
- User registration: 100+ concurrent requests
- Ride requests: Multiple simultaneous bookings
- Payment processing: Concurrent payments
- Notification retrieval: High-frequency polling

### Monitoring
- Response times should be < 500ms for most endpoints
- Database queries should be optimized
- Memory usage should remain stable
- No memory leaks in long-running tests

## 🔒 Security Testing

The test suite includes:
- **SQL Injection** prevention testing
- **XSS** attack prevention
- **Authentication** bypass attempts
- **Authorization** validation
- **Input validation** edge cases
- **Rate limiting** verification

## 📝 Notes

- Replace placeholder values (IDs, tokens) with actual values during testing
- Some tests depend on previous test results (e.g., ride ID from ride request)
- Error scenarios are expected to fail - this validates error handling
- Use the complete workflow test for integration testing
- Monitor console output for detailed service logs

---

**Happy Testing!** 🚀 These comprehensive tests ensure the RickshawX platform works reliably across all scenarios.