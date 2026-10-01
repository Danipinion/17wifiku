# Notification Listener

A complete Android application for capturing and forwarding system notifications to external APIs with queue management and retry mechanisms.

## Features

- **Notification Capture**: Listen to all system notifications with filtering capabilities
- **API Forwarding**: Send notification data to external endpoints via HTTP POST
- **Queue Management**: Offline notifications are queued and retried automatically
- **Encryption**: API keys are stored securely using Android's EncryptedSharedPreferences
- **Background Processing**: Uses WorkManager for reliable background retries
- **Foreground Service**: Ensures continuous operation
- **Filtering**: Forward all notifications or filter by specific package names
- **Rupiah Detection**: Automatically detects Indonesian currency amounts in notifications
- **Logs**: Real-time logging with up to 100 recent entries
- **Boot Restart**: Automatically restarts services after device reboot

## Setup Instructions

### 1. Enable Notification Access
1. Open the app
2. Tap "Buka Pengaturan Akses Notifikasi"
3. Find "Notification Listener" in the list
4. Toggle the switch to ON
5. Confirm the permission dialog
6. Return to the app and tap "Cek Status Izin" to verify

### 2. Configure Settings
- **Endpoint URL (wajib)**: Your webhook URL (must start with http:// or https://)
- **API Key (opsional)**: Optional API key sent as X-API-Key header
- **Filter Package**: Comma-separated list of app package names (e.g., `id.dana, com.whatsapp`)
- **Forward semua aplikasi**: Toggle to forward ALL notifications (ignores filter)

### 5. Save and Activate
1. Fill in required fields
2. Tap "Simpan Pengaturan"
3. Grant battery optimization exemption when prompted (recommended)

### Endpoint URL
The HTTP/HTTPS URL where notification data will be sent via POST request.
- **Required**: Yes
- **Format**: Must start with `http://` or `https://`
- **Example**: `https://api.example.com/webhook`

### API Key
Optional authentication key sent in the `X-API-Key` header.
- **Required**: No
- **Storage**: Encrypted using Android's security library
- **Usage**: Added to all requests if provided

### Filter Package
Comma-separated list of Android app package names to monitor.
- **Required**: Only if "Forward semua aplikasi" is OFF
- **Format**: `package1, package2, package3`
- **Example**: `id.dana, com.whatsapp, com.gojek.app`
- **Case Sensitive**: Exact match required

### Forward All Apps Toggle
When enabled, forwards notifications from ALL apps regardless of filter list.
- **ON**: All notifications are sent (filter is ignored)
- **OFF**: Only notifications from apps in filter list are sent

## API Payload Format

### Notification Payload
```json
{
  "deviceId": "550e8400-e29b-41d4-a716-446655440000",
  "packageName": "id.dana",
  "appName": "DANA",
  "postedAt": "2025-08-30T10:00:24+07:00",
  "title": "DANA",
  "text": "Anda menerima Rp 100.000",
  "subText": "",
  "bigText": "",
  "channelId": "payments",
  "notificationId": 12345,
  "amountDetected": "100000",
  "extras": {
    "android.title": "DANA",
    "android.text": "Anda menerima Rp 100.000"
  }
}
```

### Test Payload
```json
{
  "test": true,
  "message": "Test notification from Notification Listener",
  "timestamp": "2025-08-30T10:00:24Z"
}
```

## cURL Examples

### Basic Request
```bash
curl -X POST "https://api.example.com/webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "550e8400-e29b-41d4-a716-446655440000",
    "packageName": "id.dana",
    "appName": "DANA",
    "postedAt": "2025-08-30T10:00:24+07:00",
    "title": "DANA",
    "text": "Anda menerima Rp 100.000",
    "amountDetected": "100000"
  }'
```

### With API Key
```bash
curl -X POST "https://api.example.com/webhook" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-secret-api-key" \
  -d '{
    "test": true,
    "message": "Test notification",
    "timestamp": "2025-08-30T10:00:24Z"
  }'
```

## Troubleshooting

### Notifications Not Being Captured
1. Verify notification access permission is granted
2. Check if target apps are in filter list (if not forwarding all)
3. Look at logs for permission or filtering messages

### API Requests Failing
1. Verify endpoint URL is correct and accessible
2. Check network connectivity
3. Review API key configuration
4. Check logs for HTTP error codes

### Service Stops Working
1. Disable battery optimization for the app
2. Check if notification permission was revoked
3. Restart the app to reinitialize services

### Background Retries Not Working
1. Ensure device has network connectivity
2. Check WorkManager constraints in device settings
3. Verify pending notifications in logs
