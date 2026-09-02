# Karjat Properties AI - Backend

## Purpose
This is the backend foundation for Karjat Properties, an AI-powered real estate automation and CRM system. It handles core API functionality, database interactions, authentication, and integrations with services like WhatsApp Business API and AI services.

## Architecture
This project follows clean architecture principles with a modular design, enabling easier scalability and maintainability:
- **Controllers**: Handle HTTP requests and responses.
- **Services**: Contain the core business logic.
- **Repositories**: Handle database interactions.
- **Middleware**: Intercept requests for authentication, validation, error handling, etc.
- **Config**: Manage environment variables and configuration.
- **Routes**: Define API endpoints.
- **Schemas**: Define Zod schemas for request validation.

## Prerequisites
- Node.js (v18+)
- npm
- PostgreSQL
- Supabase account (optional, for backend services like Storage)

## Setup & Installation

1. Clone the repository and navigate to the backend folder:
   ```bash
   cd karjat-properties-ai/backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Setup environment variables:
   Copy `.env.example` to `.env` and fill in the required values.
   ```bash
   cp .env.example .env
   ```

## Development Server
To start the development server with live reload:
```bash
npm run dev
```
The server will run at `http://localhost:7000`.

## Production Build
To build the project for production:
```bash
npm run build
```
To run the production build:
```bash
npm run start
```

## Available API Endpoints

### Health Check
- `GET /api/health`: Returns the health status of the API.

## Next Steps
Future iterations will introduce WhatsApp API integration, AI-powered chatbots, property management, and CRM functionalities.
