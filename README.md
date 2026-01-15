# User Activity Log Processing Service

A scalable, event-driven microservice for collecting, processing, storing, and querying user activity logs. Built with Node.js, Express, Kafka, and MongoDB following DDD (Domain-Driven Design) principles.

## Project Structure

```
├── app.js              # API server
├── consumer.js         # Kafka consumer worker
├── domain/             # Business entities
├── application/        # Use cases
├── infrastructure/     # Kafka & MongoDB
├── api/                # Routes & controllers
├── config/             # Configuration
├── Dockerfile
└── docker-compose.yml
```

## Activity Types

```javascript
USER_LOGIN      
USER_LOGOUT     
PAGE_VIEW       
BUTTON_CLICK    
ITEM_PURCHASED  
PROFILE_UPDATED 
```

## API Endpoints

### POST /activities - Log Activity

Creates a new activity event and publishes to Kafka.

**Request:**
```json
{
  "userId": "user-123",
  "activityType": "PAGE_VIEW",
  "metadata": {
    "page": "/dashboard",
    "referrer": "/home"
  }
}
```

**Response (202 Accepted):**
```json
{
  "success": true,
  "message": "Activity event accepted for processing",
  "data": {
    "eventId": "550e8400-e29b-41d4-a716-446655440000",
    "userId": "user-123",
    "activityType": "PAGE_VIEW",
    "occurredAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### GET /activities - Query Activities

Fetch processed activities with filtering and pagination.

**Example:**
```
GET /activities?userId=user-123&activityType=PAGE_VIEW&from=2024-01-01&to=2024-01-31&page=1&limit=10
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "eventId": "550e8400-e29b-41d4-a716-446655440000",
      "userId": "user-123",
      "activityType": "PAGE_VIEW",
      "metadata": { "page": "/dashboard" },
      "occurredAt": "2024-01-15T10:30:00.000Z",
      "processedAt": "2024-01-15T10:30:01.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 150,
    "totalPages": 15,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

### GET /activities/:eventId - Get Single Activity

### GET /activities/stats - Get Statistics

### GET /health - Health Check


## Deployment
# Local Setup

```bash
npm install

# Start Kafka & MongoDB
docker-compose up -d zookeeper kafka kafka-init mongodb

# Start API server and Consumer  
npm run dev:api
npm run dev:consumer


```dockerfile
FROM node:18-alpine AS dependencies
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS production
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY --chown=nodejs:nodejs . .
USER nodejs
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "app.js"]
```

**Build:**
```bash
docker build -t activity-service .
```

**Run API:**
```bash
docker run -p 3000:3000 \
  -e MONGO_URI=mongodb://host:27017/activity-logs \
  -e KAFKA_BROKERS=kafka:9092 \
  activity-service
```

**Run Consumer:**
```bash
docker run \
  -e MONGO_URI=mongodb://host:27017/activity-logs \
  -e KAFKA_BROKERS=kafka:9092 \
  activity-service node consumer.js
```

---

# Environment Variables

cat > .env << 'EOF'
NODE_ENV=production
PORT=3000
MONGO_URI=mongodb://admin:password@mongodb:27017/activity-logs?authSource=admin
KAFKA_BROKERS=kafka:29092
KAFKA_TOPIC=user-activity-events
KAFKA_CONSUMER_GROUP=activity-log-processor
EOF

# Build and start services
docker-compose up -d --build

