graph TB
    %% Client Layer
    subgraph "Client Layer"
        WEB[React.js Web App<br/>TypeScript]
        MOBILE[Mobile App<br/>React Native/Flutter]
    end

    %% API Gateway
    GATEWAY[API Gateway<br/>Node.js Express]

    %% Microservices
    subgraph "Microservices Layer"
        USER_SVC[User Service<br/>Node.js]
        RIDE_SVC[Ride Service<br/>Node.js]
        PAYMENT_SVC[Payment Service<br/>Node.js]
        NOTIFICATION_SVC[Notification Service<br/>Node.js]
    end

    %% Message Broker
    BROKER[Message Broker<br/>Redis Pub/Sub]

    %% Database Layer
    subgraph "Data Layer"
        POSTGRES[(PostgreSQL<br/>Primary Database)]
        REDIS[(Redis<br/>Cache & Sessions)]
        FILES[File Storage<br/>AWS S3/Local]
    end

    %% Database Tables
    subgraph "Key Tables"
        ROUTES[Routes Table<br/>6 Fixed Locations + Prices]
        DRIVERS[Drivers Table<br/>Status: Available/Busy]
    end

    %% External Services
    subgraph "External Services"
        SMS[SMS Service<br/>Twilio]
        EMAIL[Email Service<br/>SendGrid]
    end

    %% Connections
    WEB --> GATEWAY
    MOBILE --> GATEWAY
    
    GATEWAY --> USER_SVC
    GATEWAY --> RIDE_SVC
    GATEWAY --> PAYMENT_SVC
    GATEWAY --> NOTIFICATION_SVC

    USER_SVC --> POSTGRES
    RIDE_SVC --> POSTGRES
    PAYMENT_SVC --> POSTGRES
    NOTIFICATION_SVC --> POSTGRES

    USER_SVC --> REDIS
    RIDE_SVC --> REDIS

    USER_SVC --> FILES
    
    NOTIFICATION_SVC --> BROKER
    RIDE_SVC --> BROKER

    RIDE_SVC --> ROUTES
    RIDE_SVC --> DRIVERS
    PAYMENT_SVC --> ROUTES

    NOTIFICATION_SVC --> SMS
    NOTIFICATION_SVC --> EMAIL

    %% WebSocket for real-time
    GATEWAY -.->|WebSocket| WEB
    GATEWAY -.->|WebSocket| MOBILE

    %% Docker Container
    subgraph "Infrastructure"
        DOCKER[Docker Containers]
        NGINX[Load Balancer<br/>Nginx]
    end

    NGINX --> GATEWAY
    DOCKER -.-> USER_SVC
    DOCKER -.-> RIDE_SVC
    DOCKER -.-> PAYMENT_SVC
    DOCKER -.-> NOTIFICATION_SVC