# PrepWise Compiler Engine (Advanced)

This is a production-grade, sandboxed code execution engine that powers the PrepWise Full IDE.

## Features
- **Secure Sandboxing**: Uses Docker containers with resource limits and no network access.
- **Asynchronous Execution**: Redis + BullMQ handles multiple concurrent requests efficiently.
- **Multi-Language Support**: C, C++, Python, Java, JS, Go, and Rust.
- **Microservice Architecture**: Decoupled from the main Next.js app for scaling.

## Prerequisites
1. **Docker**: Installed and running on the host machine.
2. **Node.js**: v18 or newer.
3. **Redis**: Running locally or accessible via network.

## Quick Start (with Docker Compose)

1. **Build the Runner Image**:
   ```bash
   cd runner
   docker build -t compiler-runner:latest .
   ```

2. **Start the Engine**:
   ```bash
   cd ..
   docker-compose up -d
   ```

3. **Verify**:
   Visit `http://localhost:5000/health` to ensure the API is online.

## Manual Installation (without Docker Compose)

1. Install Redis on your system.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set environment variables in `.env`:
   ```env
   REDIS_HOST=localhost
   REDIS_PORT=6379
   PORT=5000
   ```
4. Start the API Server:
   ```bash
   npm start
   ```
5. Start the Worker (in a separate terminal):
   ```bash
   npm run worker
   ```

## Security Design
- Containers are limited to **128MB RAM** and **0.5 CPU cores**.
- Execution timeout is set to **10 seconds**.
- Filesystem is ephemeral and cleaned up after every run.
- Network is disabled inside the container to prevent malicious code from contacting external servers.
