sequenceDiagram
    participant U as User (Next.js)
    participant D as Driver (Next.js)
    participant G as API Gateway
    participant US as User Service
    participant RS as Ride Service
    participant PS as Payment Service
    participant NS as Notification Service
    participant MB as Message Broker
    participant DB as PostgreSQL
    participant Cache as Redis

    %% User Registration & Authentication
    Note over U,Cache: 1. User Registration Flow
    U->>G: POST /auth/register
    G->>US: Register user
    US->>DB: Save user data
    US->>Cache: Store session
    US-->>G: Return JWT token
    G-->>U: Registration success + token

    %% Driver Registration
    Note over D,Cache: 2. Driver Registration Flow
    D->>G: POST /auth/register
    G->>US: Register driver
    US->>DB: Save driver data + vehicle info
    US->>DB: Set driver status = 'available'
    US-->>G: Return JWT token
    G-->>D: Registration success + token

    %% Get Available Routes
    Note over U,Cache: 3. Get Routes & Prices
    U->>G: GET /routes
    G->>RS: Get all routes
    RS->>DB: SELECT * FROM routes
    RS-->>G: Return routes with prices
    G-->>U: Routes list {id, from, to, price, duration}

    %% User Books Ride
    Note over U,Cache: 4. Ride Booking Flow
    U->>G: POST /rides/request {route_id}
    G->>RS: Create ride request
    RS->>DB: Get route details by route_id
    RS->>DB: Save ride request with fixed price
    RS->>DB: Find available drivers (status = 'available')
    alt Available Drivers Found
        RS->>MB: Publish ride request event
        RS-->>G: Ride request created + price
        G-->>U: Ride request ID + confirmed price
    else No Available Drivers
        RS-->>G: No drivers available
        G-->>U: Error: No drivers available
    end

    %% Driver Matching
    Note over D,Cache: 5. Driver Matching Flow
    MB->>NS: Ride request event
    NS->>D: WebSocket notification (new ride request)
    D->>G: POST /rides/{id}/accept
    G->>RS: Accept ride
    RS->>DB: Update ride status = "accepted"
    RS->>DB: Update driver status = "busy"
    RS->>MB: Publish ride accepted event
    MB->>NS: Ride accepted event
    NS->>U: WebSocket notification (driver assigned)
    RS-->>G: Ride accepted
    G-->>D: Acceptance confirmed

    %% Trip Lifecycle
    Note over D,Cache: 6. Trip Management Flow
    D->>G: POST /rides/{id}/start
    G->>RS: Start trip
    RS->>DB: Update ride status = "in_progress"
    RS->>MB: Publish trip started event
    MB->>NS: Trip started event
    NS->>U: WebSocket notification (trip started)

    D->>G: POST /rides/{id}/complete
    G->>RS: Complete trip
    RS->>DB: Update ride status = "completed"
    RS->>DB: Update driver status = "available"
    RS->>MB: Publish trip completed event
    MB->>NS: Trip completed event
    NS->>U: WebSocket notification (trip completed)
    NS->>D: WebSocket notification (trip completed)

    %% Payment Processing
    Note over U,Cache: 7. Payment Flow
    U->>G: POST /payments/process {ride_id, payment_method}
    G->>PS: Process payment
    PS->>DB: Get ride details with fixed price
    PS->>DB: Save payment record
    PS->>DB: Update ride payment status = "paid"
    PS->>MB: Publish payment processed event
    MB->>NS: Payment processed event
    NS->>U: WebSocket notification (payment successful)
    NS->>D: WebSocket notification (payment received)
    PS-->>G: Payment confirmation
    G-->>U: Payment successful

    %% Driver Status Management
    Note over D,Cache: 8. Driver Availability
    D->>G: PUT /drivers/status {status: 'available'|'busy'|'offline'}
    G->>US: Update driver status
    US->>DB: UPDATE drivers SET status = ?
    US-->>G: Status updated
    G-->>D: Status change confirmed

    %% Real-time Updates via WebSocket
    Note over U,D: 9. WebSocket Events
    Note right of NS: Events: ride_request, ride_accepted,<br/>trip_started, trip_completed,<br/>payment_processed, driver_status

    %% Error Handling
    Note over G,DB: 10. Error Scenarios
    alt Ride Request Failed
        RS->>MB: Publish ride failed event
        MB->>NS: Ride failed event
        NS->>U: WebSocket notification (no drivers available)
    else Payment Failed
        PS->>MB: Publish payment failed event
        MB->>NS: Payment failed event
        NS->>U: WebSocket notification (payment failed)
        Note over RS: Keep driver status as 'available'
    end