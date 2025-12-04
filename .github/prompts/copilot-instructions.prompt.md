# Music App - AI Assistant Instructions

This file contains guidelines and project structure information for AI assistants (GitHub Copilot, ChatGPT, Claude, etc.) working on the Music App project.

## 📋 Project Overview

**Music App** is a full-featured music streaming application built with a Go backend and Next.js frontend. Users can listen to music, create playlists, browse albums, and track their listening history.

## 🏗️ Architecture

### Backend (Go)
```
backend/
├── cmd/server/main.go          # Application entry point
├── internal/
│   ├── api/                    # HTTP handlers
│   │   ├── api.go             # Router and route definitions
│   │   ├── auth/              # Auth handlers (separate package)
│   │   ├── track_handlers.go  # Track operations
│   │   ├── album_handlers.go  # Album operations
│   │   ├── playlist_handlers.go # Playlist operations
│   │   ├── user_handlers.go   # User operations
│   │   └── history_handlers.go # Listen history operations
│   ├── middleware/            # HTTP middlewares
│   ├── models/                # Domain models
│   ├── repository/            # Database access layer
│   └── utils/                 # Helper functions
├── pkg/
│   ├── api_errors/           # Error code constants
│   ├── config/               # Configuration management
│   ├── db/                   # Database connection
│   ├── logger/               # Logging utilities
│   └── storage/              # MinIO storage client
└── docs/                      # Swagger documentation
```

### Frontend (Next.js)
```
frontend/
├── app/                       # Next.js App Router
│   ├── (auth)/               # Auth route group (login, register)
│   ├── admin/                # Admin panel pages
│   ├── album/[id]/           # Dynamic album page
│   ├── playlist/[id]/        # Dynamic playlist page
│   └── search/               # Search page
├── components/
│   ├── ui/                   # shadcn/ui components
│   ├── player/               # Music player components
│   ├── sidebar/              # Sidebar components
│   └── home/                 # Home page components
├── contexts/                 # React Context providers
├── lib/
│   ├── api.ts               # API client and request functions
│   ├── auth.tsx             # Authentication utilities and HOCs
│   ├── types.ts             # TypeScript type definitions
│   ├── errors.ts            # Error handling
│   └── utils.ts             # Utility functions
```

## 🎯 Design Patterns & Conventions

### Backend Patterns

#### 1. Repository Pattern
Database access is handled through the `repository` package:
```go
// Database access with Repository struct
type Repository struct {
    Db *sql.DB
}

func NewRepository(db *sql.DB) *Repository {
    return &Repository{Db: db}
}

// Usage in handler
repo := repository.NewRepository(r.Db)
track, err := repo.GetTrackByID(id)
```

#### 2. Handler Pattern
HTTP handlers are defined as methods on the `Router` struct:
```go
type Router struct {
    Db         *sql.DB
    JWTManager *utils.JWTManager
    Config     *config.Config
    Storage    *storage.MinioClient
}

func (r *Router) GetTracksHandler(w http.ResponseWriter, req *http.Request) {
    // Handler logic
}
```

#### 3. Middleware Pattern
Middlewares wrap `http.Handler`:
```go
func (m *AuthMiddleware) Authenticated(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        // Auth logic
        ctx := WithUserID(r.Context(), claims.UserID)
        next.ServeHTTP(w, r.WithContext(ctx))
    })
}
```

#### 4. Error Response Pattern
Standard error response format is used:
```go
// Error response
utils.JSONError(w, api_errors.ErrNotFound, "Track not found", http.StatusNotFound)

// Success response
utils.JSONSuccess(w, data, http.StatusOK)
```

#### 5. Context Pattern
User information is carried through context:
```go
// Adding to context
ctx := WithUserID(r.Context(), claims.UserID)
ctx = WithUserRole(ctx, claims.Role)

// Reading from context
userID, ok := middleware.GetUserID(req.Context())
```

### Frontend Patterns

#### 1. Context Provider Pattern
Context API is used for global state:
```tsx
// Provider definition
export function PlayerProvider({ children }: { children: React.ReactNode }) {
    // State management
    return (
        <PlayerContext.Provider value={contextValue}>
            {children}
        </PlayerContext.Provider>
    )
}

// Usage
const { currentTrack, isPlaying, playTrack } = usePlayer()
```

#### 2. Custom Hook Pattern
Custom hooks are used for context access:
```tsx
export function usePlayer() {
    const context = useContext(PlayerContext)
    if (!context) {
        throw new Error('usePlayer must be used within a PlayerProvider')
    }
    return context
}
```

#### 3. HOC Pattern (Higher-Order Component)
HOC is used for route protection:
```tsx
export function withAuth<P extends object>(Component: React.ComponentType<P>): React.FC<P> {
    return function ProtectedRoute(props: P) {
        // Auth check logic
        return <Component {...props} />
    }
}

// Usage
export default withAuth(ProfilePage)
```

#### 4. API Client Pattern
Centralized API client for request management:
```tsx
// Base request function
export async function makeRequest(url: string, options: RequestOptions = {}) {
    // Request logic with error handling
}

// Authenticated requests
export async function makeAuthenticatedRequest(url: string, options: RequestOptions = {}) {
    // Token refresh logic included
}
```

#### 5. Component Composition Pattern
Component composition with shadcn/ui:
```tsx
<Card>
    <CardHeader>
        <CardTitle>Title</CardTitle>
    </CardHeader>
    <CardContent>
        {/* Content */}
    </CardContent>
</Card>
```

## 🔐 Authentication Flow

### JWT Token Structure
- **Access Token**: Short-lived (15 min default), used for API requests
- **Refresh Token**: Long-lived (7 days default), used to renew access token

### Token Refresh
Frontend automatically refreshes the access token using the refresh token when receiving a 401 error:
```tsx
if (response.status === 401) {
    const newToken = await refreshAccessToken()
    // Retry request with new token
}
```

### Role-Based Access Control
- `user`: Regular user permissions
- `admin`: Admin panel and track upload permissions

## 📝 Coding Standards

### Go Backend

1. **Error Handling**
   - Every error must be checked
   - Errors should be logged with meaningful messages
   - API error codes should be used from the `api_errors` package

2. **Logging**
   - Use `log/slog`
   - Prefer structured logging
   ```go
   slog.Error("Failed to get track", "trackID", id, "error", err)
   ```

3. **Swagger Documentation**
   - Write swagger comments for every handler
   - Document request/response models

4. **Database Queries**
   - Use parameterized queries (SQL injection prevention)
   - Use `COALESCE` for null handling

### Next.js Frontend

1. **TypeScript**
   - Strict mode enabled
   - Interface/type definitions in `lib/types.ts`
   - Avoid using `any`

2. **Components**
   - "use client" directive is required for client components
   - Props interface must be defined
   - UI components should be under `components/ui/`

3. **State Management**
   - Context API for global state
   - useState/useReducer for local state
   - API calls for server state

4. **Styling**
   - TailwindCSS utility classes
   - `cn()` helper for conditional classes
   - Dark mode supported design

## 🗄️ Database Schema

### Main Tables
- `users`: User information (id, email, password_hash, username, role)
- `tracks`: Track information (id, title, artist_id, file_url, duration)
- `albums`: Album information (id, title, artist_id, cover_url)
- `playlists`: Playlist information (id, title, creator_id, privacy)
- `playlist_tracks`: Many-to-many relationship table
- `listens`: Listening history

### Relationships
- `tracks.artist_id` → `users.id` (FK, CASCADE DELETE)
- `albums.artist_id` → `users.id`
- `playlists.creator_id` → `users.id`

## 🔧 Environment Variables

### Backend (.env)
```env
PORT=8000
DATABASE_URL=postgres://user:pass@localhost:5432/music_db
JWT_SECRET=your-secret-key
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET_NAME=music-files
MINIO_USE_SSL=false
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

## 📚 API Endpoints

### Public Endpoints
- `GET /api/health` - Health check
- `POST /api/register` - User registration
- `POST /api/login` - User login
- `POST /api/refresh` - Token refresh
- `POST /api/logout` - User logout
- `GET /api/tracks` - List tracks
- `GET /api/search` - Search tracks
- `GET /api/tracks/{id}/stream` - Stream track audio

### Protected Endpoints (Auth Required)
- `GET /api/me` - Current user info
- `GET /api/profile` - User profile
- `PUT /api/profile` - Update profile
- `GET /api/albums` - List albums
- `GET /api/albums/{id}` - Album detail
- `GET /api/playlists` - User playlists
- `POST /api/playlists` - Create playlist
- `GET /api/history/recently-played` - Listen history

### Admin Endpoints
- `POST /api/tracks/upload` - Upload track
- `POST /api/albums` - Create album
- `DELETE /api/albums/{id}` - Delete album

## 🚨 Important Rules

1. **Security**
   - Content-type validation for all file uploads
   - Filename sanitization for path traversal protection
   - Parameterized queries for SQL injection protection
   - JWT tokens should be stored in httpOnly cookies (client-side)

2. **Performance**
   - LIMIT/OFFSET pagination in database queries
   - HTTP Range request support for audio streaming
   - Lazy loading and code splitting in frontend

3. **Error Handling**
   - Consistent error response format in backend
   - User-friendly error messages in frontend
   - Automatic token refresh on 401

4. **Code Organization**
   - Handlers in separate files by domain
   - Shared utilities under `utils/` or `lib/`
   - Type definitions in centralized files

## 🔄 Git Branch Strategy

- `main`: Production-ready code
- `refactor/*`: Refactoring work
- `feature/*`: New features
- `fix/*`: Bug fixes

---

This file is prepared to help AI assistants contributing to the project generate correct and consistent code.
