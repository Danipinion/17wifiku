# Notification Listener Backend

A Node.js Express server for receiving and storing Android notification data from the Notification Listener app.

## Features

- ✅ **Webhook Endpoint** - Receives notification data via HTTP POST
- ✅ **SQLite Database** - Stores notifications and device information
- ✅ **API Key Authentication** - Optional security layer
- ✅ **REST API** - Query stored notifications and statistics
- ✅ **Health Monitoring** - Health check endpoint
- ✅ **CORS Support** - Cross-origin requests enabled
- ✅ **Request Logging** - Morgan HTTP request logger
- ✅ **Security Headers** - Helmet.js security middleware

## Quick Start

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment
Edit `.env` file:
```env
PORT=3000
API_KEY=your-secret-api-key
```

### 3. Start Server
```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

The server will start on `http://localhost:3000`

## API Endpoints

### Core Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/webhook` | Main notification receiver |
| `POST` | `/test` | Test endpoint |
| `GET` | `/health` | Health check |

### Data Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/notifications` | Get stored notifications |
| `GET` | `/devices` | Get registered devices |
| `GET` | `/stats` | Get statistics |

### Authentication

All endpoints (except `/health`) require the `X-API-Key` header if `API_KEY` is configured in `.env`.

```bash
curl -H "X-API-Key: your-secret-api-key" http://localhost:3000/notifications
```

## Webhook Usage

### Android App Configuration

1. Set **Endpoint URL**: `http://your-server:3000/webhook`
2. Set **API Key**: `your-secret-api-key` (optional)

### Example Notification Payload

```json
{
  "deviceId": "550e8400-e29b-41d4-a716-446655440000",
  "packageName": "id.dana",
  "appName": "DANA",
  "postedAt": "2025-09-01T14:30:24+07:00",
  "title": "Payment received",
  "text": "Anda menerima Rp 100.000",
  "amountDetected": "100000",
  "extras": {
    "android.title": "Payment received"
  }
}
```

### Response Format

```json
{
  "success": true,
  "message": "Notification received successfully",
  "id": 123,
  "timestamp": "2025-09-01T07:30:24.000Z"
}
```

## API Examples

### Get Recent Notifications
```bash
curl -H "X-API-Key: your-secret-api-key" \
  "http://localhost:3000/notifications?limit=10"
```

### Get Device-Specific Notifications
```bash
curl -H "X-API-Key: your-secret-api-key" \
  "http://localhost:3000/notifications?device_id=550e8400-e29b-41d4-a716-446655440000"
```

### Get Statistics
```bash
curl -H "X-API-Key: your-secret-api-key" \
  "http://localhost:3000/stats"
```

## Database Schema

### notifications table
```sql
CREATE TABLE notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id TEXT NOT NULL,
    package_name TEXT NOT NULL,
    app_name TEXT,
    posted_at TEXT,
    title TEXT,
    text TEXT,
    sub_text TEXT,
    big_text TEXT,
    channel_id TEXT,
    notification_id INTEGER,
    amount_detected TEXT,
    extras TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### devices table
```sql
CREATE TABLE devices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id TEXT UNIQUE NOT NULL,
    last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
    total_notifications INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## Testing

### Test the Webhook
```bash
curl -X POST "http://localhost:3000/test" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-secret-api-key" \
  -d '{
    "test": true,
    "message": "Test notification",
    "timestamp": "2025-09-01T07:30:24Z"
  }'
```

### Health Check
```bash
curl http://localhost:3000/health
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `API_KEY` | API authentication key | `your-secret-api-key` |
|           |                        |                       |
