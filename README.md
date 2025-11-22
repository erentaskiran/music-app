# Music App

This project is a full-stack music application built with modern web technologies. It features a high-performance **Go** backend and a user-centric **Next.js** frontend.

## 🚀 Technologies

The project consists of two main components:

### Backend (Go)
- **Language:** Go 1.25.4
- **Web Framework:** Gorilla Mux
- **Database Driver:** lib/pq (PostgreSQL)
- **Authentication:** JWT (JSON Web Tokens)
- **Encryption:** bcrypt

### Frontend (Next.js)
- **Framework:** Next.js 16 (App Router)
- **UI Library:** React 19
- **Styling:** TailwindCSS v4
- **Form Management:** React Hook Form & Zod

## 🛠️ Prerequisites

To run the project locally, you need the following tools installed:

- **Go:** v1.25 or higher
- **Node.js:** v20 or higher
- **PostgreSQL:** v13 or higher
- **Git**

## 📦 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/erentaskiran/music-app.git
cd music-app
```

### 2. Backend Setup

Navigate to the backend directory and install dependencies:

```bash
cd backend
go mod download
```

Set up environment variables:

```bash
cp .env.example .env
# Open .env and update your database credentials
```

Create the database (PostgreSQL must be running):

```sql
CREATE DATABASE music_db;
```

Start the server:

```bash
go run cmd/server/main.go
```
The backend will run on `http://localhost:8080` by default.

### 3. Frontend Setup

Open a new terminal, navigate to the frontend directory, and install dependencies:

```bash
cd frontend
npm install
```

Set up environment variables:

```bash
cp .env.example .env.local
# Edit .env.local if necessary
```

Start the development server:

```bash
npm run dev
```
Your frontend application will be live at `http://localhost:3000`.

## 📚 API Documentation (Swagger)

The backend API is fully documented using **Swagger/OpenAPI 2.0**. Once the backend server is running, you can access the interactive API documentation at:

**🔗 [http://localhost:8080/swagger/index.html](http://localhost:8080/swagger/index.html)**

### Features
- **Interactive API Explorer**: Test all endpoints directly from your browser
- **Request/Response Examples**: See sample payloads for each endpoint
- **Authentication Support**: Test protected endpoints with JWT tokens
- **Model Schemas**: View detailed data structures for requests and responses

### Available Endpoints

#### Authentication (`/api`)
- `POST /api/register` - Register a new user
- `POST /api/login` - Authenticate and receive JWT tokens
- `POST /api/refresh` - Refresh access token
- `POST /api/logout` - Logout user

#### User (`/api`)
- `GET /api/me` - Get current authenticated user profile (🔒 Protected)

#### Health Check
- `GET /api/health` - Server health status

### Regenerating Swagger Documentation

If you make changes to API handlers or add new endpoints, regenerate the Swagger docs:

```bash
cd backend
swag init -g cmd/server/main.go
```

> **Note**: Make sure to install `swag` CLI tool first:
> ```bash
> go install github.com/swaggo/swag/cmd/swag@latest
> ```

## 📂 Project Structure

```
music-app/
├── backend/            # Go backend source code
│   ├── cmd/            # Executables
│   ├── internal/       # Application business logic (API, Middleware, etc.)
│   ├── pkg/            # Helper packages
│   └── go.mod          # Go module file
│
├── frontend/           # Next.js frontend source code
│   ├── app/            # App Router pages and layouts
│   ├── components/     # Reusable UI components
│   ├── lib/            # Helper functions and libraries
│   └── package.json    # Node.js dependencies
│
└── README.md           # Project documentation
```

## 🤝 Contributing

1. Fork this repository.
2. Create a new feature branch (`git checkout -b feature/new-feature`).
3. Commit your changes (`git commit -m 'Add new feature'`).
4. Push to the branch (`git push origin feature/new-feature`).
5. Create a Pull Request.
