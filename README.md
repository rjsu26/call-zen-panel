# Automated Feedback System 

A comprehensive call center analytics dashboard for monitoring, analyzing, and optimizing customer service operations.

![FINAL PRESENTATiON](https://github.com/user-attachments/assets/b6adbea5-e0d9-4fc9-8fc5-c48f04a0949b)

## Project Overview

Call Zen Panel is a full-stack application designed to help call center managers and analysts gain insights from customer service call transcripts. The system processes call transcripts, extracts key metrics, and presents the data through an intuitive dashboard interface.

Key features include:
- Real-time metrics display (call volume, satisfaction scores, resolution rates)
- Call transcript analysis and categorization
- Agent performance tracking
- Issue severity monitoring
- Follow-up task management
- Historical trend analysis

## Architecture Overview

The application follows a three-tier architecture:

### Frontend
- Built with React 18 and TypeScript
- Uses Vite as the build tool and development server
- UI components from Shadcn UI library
- State management with React hooks and context
- Data visualization with Recharts

### Backend
- Node.js with Express framework
- TypeScript for type safety
- RESTful API design
- SQLite database for data persistence
- Modular architecture with services, routes, and controllers

### Database
- SQLite for simplicity and portability
- Single table design for call transcript data
- Indexed fields for optimized query performance

## Prerequisites

Before setting up the project, ensure you have the following installed:

- Node.js (v16 or higher)
- npm (v7 or higher)
- Git

## Setup Instructions

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/call-zen-panel.git
   cd call-zen-panel
   ```

2. Install frontend dependencies:
   ```bash
   npm install
   ```

3. Install backend dependencies:
   ```bash
   cd backend
   npm install
   cd ..
   ```

4. Create environment files:
   ```bash
   # In the backend directory
   cp .env.example .env
   ```

5. Build the application:
   ```bash
   npm run build:full
   ```

## Running Development Servers

### Frontend Only
```bash
npm run dev
```

### Backend Only
```bash
npm run dev:backend
```

### Both Frontend and Backend
```bash
npm run dev:full
```

The frontend will be available at http://localhost:5173 and the backend at http://localhost:3001.

## Importing Call Transcript Data

The system comes with several options for importing call transcript data:

### Using the Simple Import Script

This is the easiest way to import all transcripts at once:

```bash
cd backend
node simple-import.js
```

### Using the API

You can also import transcripts via the API:

1. Single transcript:
   ```bash
   curl -X POST http://localhost:3001/api/transcripts \
     -H "Content-Type: application/json" \
     -d @path/to/transcript.json
   ```

2. Directory of transcripts:
   ```bash
   curl -X POST http://localhost:3001/api/transcripts/bulk \
     -H "Content-Type: application/json" \
     -d '{"directoryPath": "path/to/transcripts/directory"}'
   ```

## API Documentation

The backend provides the following API endpoints:

### Transcripts

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/transcripts` | GET | Get all transcripts with optional filtering and pagination |
| `/api/transcripts/:id` | GET | Get a single transcript by ID |
| `/api/transcripts` | POST | Create a new transcript |
| `/api/transcripts/:id` | PUT | Update an existing transcript |
| `/api/transcripts/:id` | DELETE | Delete a transcript |
| `/api/transcripts/bulk` | POST | Import multiple transcripts from a directory |
| `/api/transcripts/stats` | GET | Get dashboard statistics |

### Health Check

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Check API health status |

## Frontend Features

### Dashboard Components

- **Metrics Bar**: Displays key performance indicators like total calls, agent count, average call duration, satisfaction scores, and follow-up requirements.
- **Recent Calls Feed**: Shows the most recent calls with customer information, sentiment analysis, and call details.
- **AI Insights**: Provides AI-generated insights based on call patterns and customer feedback.
- **Problem Analysis**: Visualizes common issues and their frequency.

### UI Components

The application uses a comprehensive set of UI components from the Shadcn UI library, including:
- Cards, buttons, and form elements
- Modals and dialogs
- Charts and data visualization tools
- Navigation and layout components

## Database Schema

The database uses a single `call_transcripts` table with the following structure:

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| customer_name | TEXT | Customer's full name |
| customer_unique_id | TEXT | Unique identifier for the customer |
| support_agent_name | TEXT | Support agent's full name |
| support_agent_id | TEXT | Unique identifier for the support agent |
| call_transcript | TEXT | Full text transcript of the call |
| overall_satisfaction_score | INTEGER | Satisfaction score (1-10) |
| category_of_call | TEXT | Category of the call (e.g., "Account Management") |
| call_duration | INTEGER | Duration of the call in minutes |
| call_date_time | TEXT | Date and time of the call (YYYY-MM-DD HH:MM:SS) |
| call_resolution_status | TEXT | Resolution status (e.g., "Resolved", "Pending") |
| escalation_level | TEXT | Level of escalation (e.g., "None", "Manager") |
| follow_up_required | TEXT | Whether follow-up is required ("Yes" or "No") |
| customer_tier | TEXT | Customer tier (e.g., "Premium", "Basic") |
| issue_severity | TEXT | Severity of the issue (e.g., "High", "Low") |
| agent_experience_level | TEXT | Experience level of the agent (e.g., "Senior") |
| customer_previous_contact_count | INTEGER | Number of previous contacts from this customer |
| created_at | TEXT | Timestamp when the record was created |

## Available Scripts

### Root Directory

| Script | Description |
|--------|-------------|
| `npm run dev` | Start the frontend development server |
| `npm run dev:backend` | Start the backend development server |
| `npm run dev:full` | Start both frontend and backend servers |
| `npm run build` | Build the frontend for production |
| `npm run build:backend` | Build the backend for production |
| `npm run build:full` | Build both frontend and backend for production |
| `npm run lint` | Run ESLint to check code quality |
| `npm run preview` | Preview the production build locally |
| `npm run start:backend` | Start the backend production server |

### Backend Directory

| Script | Description |
|--------|-------------|
| `npm run dev` | Start the backend development server |
| `npm run build` | Build the backend for production |
| `npm run start` | Start the backend production server |
| `npm run import-transcripts` | Import transcripts using the TypeScript importer |

## Deployment Instructions

### Production Build

1. Create production builds for both frontend and backend:
   ```bash
   npm run build:full
   ```

2. The frontend build will be in the `dist` directory, and the backend build will be in the `backend/dist` directory.

### Deployment Options

#### Option 1: Simple Deployment (Same Server)

1. Copy the entire project to your server
2. Install production dependencies:
   ```bash
   npm install --production
   cd backend
   npm install --production
   cd ..
   ```
3. Start the backend server:
   ```bash
   npm run start:backend
   ```
4. Serve the frontend using a static file server like Nginx or Apache, pointing to the `dist` directory

#### Option 2: Separate Deployment (Frontend and Backend on Different Servers)

1. Frontend:
   - Deploy the `dist` directory to a static file hosting service (Netlify, Vercel, etc.)
   - Set the `VITE_API_BASE_URL` environment variable to point to your backend API URL

2. Backend:
   - Deploy the `backend` directory to a Node.js hosting service (Heroku, DigitalOcean, etc.)
   - Set up the appropriate environment variables in your hosting platform

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- Built with [React](https://reactjs.org/)
- UI components from [Shadcn UI](https://ui.shadcn.com/)
- Charts powered by [Recharts](https://recharts.org/)
- Backend powered by [Express](https://expressjs.com/)
