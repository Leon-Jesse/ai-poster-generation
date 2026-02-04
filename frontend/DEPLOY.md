# Frontend Deployment Guide

This guide describes how to build and deploy the frontend application using Docker.

## Prerequisites

- Docker
- Docker Compose (optional, for easier orchestration)

## Build and Run with Docker

1.  **Build the Docker image:**

    ```bash
    docker build -t auradraw-frontend .
    ```

2.  **Run the container:**

    ```bash
    docker run -d -p 80:80 --name auradraw-frontend auradraw-frontend
    ```

    The application will be accessible at `http://localhost`.

## Deployment with Docker Compose

For a complete setup including the backend, use `docker-compose.yml`.

1.  **Start the services:**

    ```bash
    docker-compose up -d --build
    ```

2.  **Stop the services:**

    ```bash
    docker-compose down
    ```

## Configuration

- **Nginx Configuration:** The `nginx.conf` file controls the web server behavior, including proxying API requests to the backend.
    - By default, it forwards `/api/` requests to `http://backend:8081/api/`.
    - Ensure your backend service is reachable at this hostname/port within the Docker network.

- **Environment Variables:**
    - The `.env` file is used during the build process.
    - `VITE_API_BASE_URL` should be set to `/api/v1` so that requests are routed through Nginx.
