# Docker Setup for Exam Scheduler

This document provides instructions for running the Exam Scheduler application using Docker and Docker Compose.

## Prerequisites

- Docker (version 20.10 or higher)
- Docker Compose (version 2.0 or higher)

## Quick Start

### 1. Environment Setup

Copy the environment example file and configure your variables:

```bash
cp env.example .env
```

Edit `.env` and update the following required variables:
- `RESEND_API_KEY`: Your Resend API key for email functionality
- `OPENAI_API_KEY`: Your OpenAI API key for AI features
- `SMTP_FROM`: Your verified email address for sending emails

### 2. Production Setup

Build and start all services:

```bash
# Build the application
npm run docker:build

# Start all services
npm run docker:up

# View logs
npm run docker:logs
```

The application will be available at:
- **Application**: http://localhost:3000
- **Database**: localhost:5432
- **Redis**: localhost:6379

### 3. Development Setup

For development with hot reloading and database management tools:

```bash
# Start development services (database and Redis only)
npm run docker:dev
```

This will start:
- **PostgreSQL**: localhost:5433 (different port to avoid conflicts)
- **Redis**: localhost:6380
- **Prisma Studio**: http://localhost:5555 (database management UI)

Then run the Next.js development server locally:

```bash
npm run dev
```

## Services

### Production Services

- **app**: Next.js application (port 3000)
- **postgres**: PostgreSQL database (port 5432)
- **redis**: Redis cache (port 6379)

### Development Services

- **postgres**: PostgreSQL database (port 5433)
- **redis**: Redis cache (port 6380)
- **prisma-studio**: Database management UI (port 5555)

## Available Scripts

### Docker Commands

```bash
# Build Docker images
npm run docker:build

# Start services in background
npm run docker:up

# Stop services
npm run docker:down

# View logs
npm run docker:logs

# Restart services
npm run docker:restart

# Clean up (removes volumes and orphaned containers)
npm run docker:clean

# Start development environment
npm run docker:dev
```

### Database Commands

```bash
# Run database migrations
npm run db:migrate

# Generate Prisma client
npm run db:generate

# Open Prisma Studio
npm run db:studio

# Reset database (⚠️ destructive)
npm run db:reset
```

## Database Setup

### Initial Setup

After starting the services, run the database migrations:

```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate
```

### Accessing the Database

#### Production
- **Host**: localhost
- **Port**: 5432
- **Database**: exam_scheduler
- **Username**: postgres
- **Password**: postgres

#### Development
- **Host**: localhost
- **Port**: 5433
- **Database**: exam_scheduler_dev
- **Username**: postgres
- **Password**: postgres

### Prisma Studio

Access the database management UI at http://localhost:5555 (development only).

## Health Checks

The application includes health check endpoints:

- **Application Health**: http://localhost:3000/api/health
- **Database Health**: Checked automatically by Docker health checks

## File Uploads

Uploaded files are stored in `./public/uploads` and are mounted as a volume to persist between container restarts.

## Troubleshooting

### Common Issues

1. **Port Conflicts**: If you get port conflicts, check if other services are using the same ports
2. **Database Connection**: Ensure the database is healthy before starting the application
3. **Environment Variables**: Make sure all required environment variables are set in `.env`

### Logs

View service logs:

```bash
# All services
npm run docker:logs

# Specific service
docker-compose logs -f app
docker-compose logs -f postgres
docker-compose logs -f redis
```

### Clean Restart

If you encounter issues, try a clean restart:

```bash
npm run docker:clean
npm run docker:build
npm run docker:up
```

### Database Issues

Reset the database:

```bash
npm run docker:down
docker volume rm exam_postgres_data
npm run docker:up
npm run db:migrate
```

## Environment Variables

### Required Variables

- `DATABASE_URL`: PostgreSQL connection string
- `RESEND_API_KEY`: Resend API key for email functionality
- `OPENAI_API_KEY`: OpenAI API key for AI features
- `SMTP_FROM`: Verified email address for sending emails

### Optional Variables

- `NODE_ENV`: Environment mode (development/production)
- `NEXT_PUBLIC_APP_URL`: Public URL of the application
- `REDIS_URL`: Redis connection string
- `JWT_SECRET`: Secret for JWT tokens
- `MAX_FILE_SIZE`: Maximum file upload size
- `RATE_LIMIT_WINDOW_MS`: Rate limiting window
- `RATE_LIMIT_MAX_REQUESTS`: Maximum requests per window

## Security Notes

- Change default database passwords in production
- Use environment-specific configuration files
- Regularly update Docker images for security patches
- Use Docker secrets for sensitive data in production

## Production Deployment

For production deployment:

1. Update environment variables for production
2. Use a reverse proxy (nginx) for SSL termination
3. Set up proper backup strategies for the database
4. Configure monitoring and logging
5. Use Docker secrets for sensitive data
6. Set up proper network security

## Support

For issues related to Docker setup, check the logs and ensure all prerequisites are met. The health check endpoint can help diagnose application issues.
