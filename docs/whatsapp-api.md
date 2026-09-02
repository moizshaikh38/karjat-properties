# WhatsApp Integration Architecture

The WhatsApp API integration implements the official Meta Graph API (Cloud API) with robust Webhook parsing, deduplication, and mode-aware routing.

## Flow Diagram
```mermaid
flowchart TD
    A[WhatsApp Customer] --> B[Meta WhatsApp Cloud API]
    B --> C[Webhook /api/webhooks/whatsapp]
    C --> D[Parse Event & Verify Signature]
    D --> E[Find/Create Lead by Phone]
    E --> F[Find/Create Active Conversation]
    F --> G[Store Message (Idempotent)]
    G --> H{Conversation Mode}
    H -->|AI| I[Future AI Pipeline]
    H -->|HUMAN| J[Human Agent - No Auto Reply]
    H -->|PAUSED| K[No Automatic Response]
```

## Features

1. **Webhook Verification**: Supports Meta's `hub.challenge` loop securely.
2. **Signature Validation**: Checks `x-hub-signature-256` using HMAC SHA-256 against `WHATSAPP_APP_SECRET`. 
3. **Idempotency**: Webhook events often repeat. The system strictly deduplicates based on `whatsapp_message_id`. Duplicate incoming events are ignored harmlessly.
4. **Lead & Conversation Sync**: Every message dynamically ensures a lead exists (normalizing numbers to `+91`) and an active conversation is prepared.
5. **AI Guard**: Before routing any message to the AI hook, the system re-checks `shouldAIRespond()`. This prevents a race condition where a human agent takes over mid-processing.
6. **Abstracted WhatsApp Provider**: All outgoing requests pass through `WhatsAppMessageService`, allowing for clean mockability and centralized API error handling.

## Required Environment Variables
Add these to your `.env`:
```env
WHATSAPP_API_VERSION=v19.0
WHATSAPP_ACCESS_TOKEN=your_permanent_or_system_user_token
WHATSAPP_PHONE_NUMBER_ID=1234567890
WHATSAPP_BUSINESS_ACCOUNT_ID=0987654321
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your_random_secure_string
WHATSAPP_APP_SECRET=your_meta_app_secret
```

## Endpoints

| Endpoint | Type | Auth | Purpose |
|----------|------|------|---------|
| `/api/webhooks/whatsapp` | `GET` | None | Meta Verification Check |
| `/api/webhooks/whatsapp` | `POST` | Signature | Incoming Webhook Events |
| `/api/whatsapp/test-message`| `POST` | Admin/Manager | Dev Endpoint to test sending messages |

## Local Development
To test this locally:
1. You must expose your local server to the public internet using `ngrok` or `localtunnel` (e.g. `ngrok http 7001`).
2. Go to Meta Developer Dashboard -> WhatsApp -> Configuration.
3. Set the **Callback URL** to `https://<your-ngrok-url>/api/webhooks/whatsapp`.
4. Set the **Verify Token** to exactly match your `WHATSAPP_WEBHOOK_VERIFY_TOKEN`.
5. Subscribe to `messages` events.

## Security
- `WHATSAPP_ACCESS_TOKEN` and `WHATSAPP_APP_SECRET` are never exposed in API responses or logged.
- The generic webhook responds `200 OK EVENT_RECEIVED` immediately to Meta before async processing begins, to prevent Meta from timing out and re-firing requests needlessly.
