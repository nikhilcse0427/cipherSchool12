# CipherSchool - SQL Assignment Platform

A web application that allows users to practice SQL queries with pre-loaded assignments, execute queries in real-time, and get intelligent hints from an LLM.

## Features

### Core Features (90%)
- ✅ **Assignment Listing Page** - Browse all available SQL assignments with difficulty levels
- ✅ **Assignment Attempt Interface** - Complete interface with:
  - Question panel displaying assignment requirements
  - Sample data viewer showing table schemas and sample data
  - SQL Editor using Monaco Editor (VS Code-like experience)
  - Results panel displaying query execution results
  - LLM Hint Integration for guided learning
- ✅ **Query Execution Engine** - Execute SQL queries against PostgreSQL with security validation
- ✅ **Real-time Results** - See query results instantly in formatted tables

### Optional Features (10%)
- ✅ **Login/Signup System** - User authentication (backend ready)
- ✅ **Save Attempts** - Track user's SQL query attempts (backend ready)

## Tech Stack

### Backend
- Node.js + Express
- MongoDB (for assignments, user data, and SQL query execution)
- JWT Authentication
- OpenAI API (for LLM hints)
- SQL-to-MongoDB Query Converter (executes SQL queries on MongoDB)

### Frontend
- React 18
- Vite
- Monaco Editor (SQL code editor)
- Axios (API calls)
- Core CSS (no frameworks)

## Prerequisites

- Node.js (v18 or higher)
- MongoDB (for storing assignments and executing SQL queries)
- npm or yarn

## Installation

### 1. Clone the repository
```bash
git clone <repository-url>
cd cipherSchool
```

### 2. Backend Setup

```bash
cd server
npm install
```

Create a `.env` file in the `server` directory:

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/cipherSchool

# JWT
ACCESS_TOKEN_SECRET=your_access_token_secret
REFRESH_TOKEN_SECRET=your_refresh_token_secret
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_EXPIRY=10d

# CORS
CORS_ORIGIN=http://localhost:5173

# LLM API (Optional - for hints)
OPENAI_API_KEY=your_openai_api_key

# Server
PORT=3000
```

### 3. Frontend Setup

```bash
cd client
npm install
```

### 4. Database Setup

#### MongoDB
1. Install MongoDB and make sure it's running
2. The application will automatically:
   - Connect to MongoDB
   - Create collections for assignments
   - Insert sample data when queries are executed
3. No manual database setup required - everything is handled automatically!

### 5. Seed Sample Assignments

```bash
cd server
node src/scripts/seedAssignments.js
```

## Running the Application

### Start Backend Server
```bash
cd server
npm run dev
```
Server will run on `http://localhost:3000`

### Start Frontend
```bash
cd client
npm run dev
```
Frontend will run on `http://localhost:5173`

## API Endpoints

### Assignments
- `GET /api/v1/assignments` - Get all assignments
- `GET /api/v1/assignments/:id` - Get assignment by ID
- `POST /api/v1/assignments/execute` - Execute SQL query
- `POST /api/v1/assignments/hint` - Get LLM hint
- `GET /api/v1/assignments/:assignmentId/attempts` - Get user attempts (requires auth)

### Users (Authentication)
- `POST /api/v1/users/register` - Register new user
- `POST /api/v1/users/login` - Login user
- `POST /api/v1/users/logout` - Logout user
- `GET /api/v1/users/current-user` - Get current user (requires auth)

## Security Features

- Only SELECT queries are allowed
- Dangerous keywords are blocked (DROP, DELETE, UPDATE, INSERT, etc.)
- Query validation and sanitization
- SQL queries are converted to safe MongoDB queries
- JWT-based authentication
- CORS configuration

## Project Structure

```
cipherSchool/
├── server/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js (MongoDB)
│   │   ├── controllers/
│   │   │   ├── assignment.controller.js
│   │   │   └── auth.controllers.js
│   │   ├── models/
│   │   │   ├── assignment.model.js
│   │   │   ├── attempt.model.js
│   │   │   └── user.model.js
│   │   ├── routes/
│   │   │   ├── assignment.routes.js
│   │   │   └── user.routes.js
│   │   ├── utils/
│   │   │   └── sqlToMongo.js (SQL to MongoDB converter)
│   │   └── scripts/
│   │       └── seedAssignments.js
│   └── package.json
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AssignmentList.jsx
│   │   │   ├── AssignmentAttempt.jsx
│   │   │   ├── SampleDataViewer.jsx
│   │   │   └── ResultsPanel.jsx
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
└── README.md
```

## Usage

1. **View Assignments**: Browse available SQL assignments on the home page
2. **Select Assignment**: Click on an assignment card to start attempting
3. **View Sample Data**: Click on table names to see schemas and sample data
4. **Write Query**: Use the Monaco Editor to write your SQL query
5. **Get Hint**: Click "Get Hint" for LLM-powered guidance
6. **Execute Query**: Click "Run Query" to execute and see results
7. **View Results**: See query results or error messages in the results panel

## Notes

- This is NOT a database creation tool. Assignments and sample data are pre-inserted by administrators.
- Only SELECT queries are allowed for security.
- SQL queries are automatically converted to MongoDB queries for execution.
- Sample data is stored in MongoDB and created automatically when queries are executed.
- LLM hints require an OpenAI API key (optional - falls back to generic hints if not provided).
- Supported SQL features: SELECT, FROM, WHERE (basic conditions), JOIN (basic), LIKE pattern matching.

## License

ISC

## Author

Nikhil Verma
