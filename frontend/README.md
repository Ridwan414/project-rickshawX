# RickshawX Frontend

A modern React frontend for the RickshawX ride-sharing platform, featuring real-time updates, user authentication, and a complete ride booking workflow.

## Features

- 🚀 **Modern React App** - Built with React 19 and Material-UI
- 🔐 **Authentication System** - JWT-based login/registration
- 📱 **Responsive Design** - Mobile-first approach
- 🔄 **Real-time Updates** - WebSocket integration for live updates
- 🚗 **Ride Booking** - Complete booking workflow
- 💳 **Payment Processing** - Multiple payment methods
- 👨‍💼 **Driver Dashboard** - Driver-specific interface
- 🔔 **Notifications** - Toast notifications and real-time alerts

## Tech Stack

- **React 19** - Frontend framework
- **Material-UI** - UI component library
- **React Router** - Client-side routing
- **Socket.io Client** - Real-time communication
- **Axios** - HTTP client
- **React Toastify** - Notification system

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Backend services running (see main project README)

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   # Copy .env.example to .env and update values
   cp .env.example .env
   ```

3. **Start the development server:**
   ```bash
   npm start
   ```

4. **Open your browser:**
   Navigate to `http://localhost:3000`

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── auth/           # Authentication components
│   ├── rides/          # Ride-related components
│   ├── payments/       # Payment components
│   ├── drivers/        # Driver-specific components
│   ├── common/         # Shared components
│   └── maps/           # Map components
├── contexts/           # React contexts
│   ├── AuthContext.js  # Authentication state
│   ├── WebSocketContext.js # WebSocket management
│   └── NotificationContext.js # Notifications
├── services/           # API and external services
│   ├── api.js         # API client
│   └── websocket.js   # WebSocket service
├── pages/              # Page components
├── utils/              # Utility functions
└── hooks/              # Custom React hooks
```

## Key Components

### Authentication
- **LoginForm** - User login interface
- **RegisterForm** - User registration with driver option
- **ProtectedRoute** - Route protection wrapper

### Ride Management
- **RouteSelection** - Display available routes
- **RideBooking** - Real-time booking process
- **DriverDashboard** - Driver interface

### Payment
- **PaymentForm** - Payment processing interface

## API Integration

The frontend integrates with the following backend services:

- **User Service** (Port 3001) - Authentication and user management
- **Ride Service** (Port 3002) - Ride booking and management
- **Payment Service** (Port 3003) - Payment processing
- **Notification Service** (Port 3004) - Real-time notifications

## WebSocket Events

The frontend listens for these WebSocket events:

- `ride_request` - New ride available (drivers)
- `ride_accepted` - Ride accepted (users)
- `trip_started` - Trip started
- `trip_completed` - Trip completed
- `payment_processed` - Payment completed

## User Workflows

### Passenger Flow
1. Register/Login as a user
2. Browse available routes
3. Select a route and book
4. Wait for driver assignment
5. Track ride progress
6. Complete payment

### Driver Flow
1. Register/Login as a driver
2. Set availability status
3. Receive ride requests
4. Accept rides
5. Start and complete trips
6. Track earnings

## Environment Variables

```env
REACT_APP_API_BASE_URL=http://localhost:3000
REACT_APP_WS_URL=http://localhost:3000
REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

## Available Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App

## Development

### Adding New Components
1. Create component in appropriate directory
2. Import and use in parent component
3. Add to routing if needed

### Styling
- Use Material-UI components and styling
- Follow the established theme
- Use responsive design principles

### State Management
- Use React Context for global state
- Use local state for component-specific data
- Use custom hooks for reusable logic

## Testing

The frontend includes:
- Unit tests for components
- Integration tests for workflows
- E2E tests for critical paths

Run tests with:
```bash
npm test
```

## Deployment

### Production Build
```bash
npm run build
```

### Docker Deployment
```bash
docker build -t rickshawx-frontend .
docker run -p 3000:3000 rickshawx-frontend
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Support

For issues or questions:
1. Check the documentation
2. Review existing issues
3. Create a new issue with details

## License

This project is licensed under the MIT License.
