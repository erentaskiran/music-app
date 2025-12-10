# Gemini Integration for Music App

This document provides guidelines and information for using Gemini to assist with development in the Music App project. Adhering to these guidelines will help Gemini understand the project structure and provide more accurate and relevant assistance.

## Overview

This project is a monorepo containing two main parts:
- **`frontend`**: A [Next.js](https://nextjs.org/) and [TypeScript](https://www.typescriptlang.org/) application.
- **`backend`**: A [Go](https://go.dev/) application providing the API.

Gemini can be used for various tasks, including code generation, refactoring, bug fixing, writing tests, and documentation.

## How to use Gemini

- **Be specific and provide context.** When asking for changes, mention the relevant files and whether the change is for the `frontend` or `backend`.
- **Refer to existing code.** Base your requests on existing patterns and conventions in the codebase.
- **Review all generated code.** Carefully check any code provided by Gemini before committing it.
- **Use for:**
    - Generating components, functions, or API endpoints.
    - Debugging issues and fixing bugs.
    - Refactoring code to improve clarity and performance.
    - Writing unit or integration tests.
    - Creating or updating documentation.

---

## Project-Specific Guidelines

### Frontend (`/frontend`)

The frontend is a Next.js application. All frontend-related requests should be directed at the files within the `frontend` directory.

**Key Commands:**
Run these commands from the `frontend` directory (`cd frontend`).

- **Install Dependencies:**
  ```bash
  npm install
  ```
  *(For CI environments, `npm ci` is used)*

- **Run Development Server:**
  ```bash
  npm run dev
  ```

- **Linting:** Check for code quality and style issues.
  ```bash
  npm run lint
  ```

- **Building for Production:**
  ```bash
  npm run build
  ```

**Example Prompt:**
> "In the frontend, create a new React component in `frontend/components/ui/` named `info-card.tsx`. It should accept a title and a description as props and use Radix UI for styling, similar to the existing `card.tsx` component."

### Backend (`/backend`)

The backend is a Go application. All backend-related requests should be directed at the files within the `backend` directory.

**Key Commands:**
Run these commands from the `backend` directory (`cd backend`).

- **Install Dependencies:**
  ```bash
  go mod tidy
  ```
  *(The CI uses `go mod download`)*

- **Run Static Analysis:**
  ```bash
  go vet ./...
  ```

- **Run Tests:**
  ```bash
  go test -v ./...
  ```
  *(Note: Tests should be added for any new business logic.)*

- **Building the Application:**
  ```bash
  go build -v ./cmd/server/main.go
  ```

- **Running the Server:**
  ```bash
  go run ./cmd/server/main.go
  ```

**Example Prompt:**
> "In the backend, I need to add a new API endpoint. In `backend/internal/api/album_handlers.go`, create a handler to get albums by genre. Also, add the corresponding route in `backend/internal/api/api.go`."
