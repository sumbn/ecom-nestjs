# Docker Deployment Guide

## 🐳 Quick Start

### Prerequisites
- Docker Desktop installed and running
- Docker Compose installed
- At least 2GB RAM available for containers

### 1. Development Environment

**Start development stack:**
```bash
docker-compose -f docker-compose.dev.yml up -d
```

This starts:
- PostgreSQL (port 5433)
- Redis (port 6379)

**Run app locally with hot reload:**
```bash
npm run start:dev
```

---

### 2. Production Environment

**Start production stack:**
```bash
docker-compose up --build -d
```

This starts:
- PostgreSQL (port 5432)
- NestJS API (port 3000)

**Check health:**
```bash
curl http://localhost:3000/health
```

---

## 📦 Docker Commands

### Build Docker Image
```bash
docker build -t ecom-nestjs:latest .
```

### Run Container Standalone
```bash
docker run -p 3000:3000 \
  -e NODE_ENV=production \
  -e DATABASE_HOST=host.docker.internal \
  -e DATABASE_PORT=5432 \
  -e DATABASE_USERNAME=postgres \
  -e DATABASE_PASSWORD=postgres123 \
  -e DATABASE_NAME=nest_ecom \
  -e JWT_SECRET=your-super-secret-jwt-key-min-32-chars \
  ecom-nestjs:latest
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f app
docker-compose logs -f postgres
```

### Stop Services
```bash
docker-compose down
```

### Stop and Remove Volumes
```bash
docker-compose down -v
```

---

## 🔧 Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `production` |
| `DATABASE_HOST` | PostgreSQL host | `postgres` |
| `DATABASE_PORT` | PostgreSQL port | `5432` |
| `DATABASE_USERNAME` | Database user | `postgres` |
| `DATABASE_PASSWORD` | Database password | `postgres123` |
| `DATABASE_NAME` | Database name | `nest_ecom` |
| `JWT_SECRET` | JWT secret key (min 32 chars) | `your-secret-key` |

### Optional Variables (with defaults)

| Variable | Default | Description |
|----------|---------|-------------|
| `JWT_ACCESS_EXPIRES_IN` | `15m` | Access token expiration |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | Refresh token expiration |
| `BCRYPT_ROUNDS` | `12` | Bcrypt hashing rounds |
| `DATABASE_MAX_CONNECTIONS` | `100` | Max database connections |
| `DATABASE_SSL` | `false` | Enable database SSL |
| `PORT` | `3000` | Application port |

---

## 🗄️ Database Management

### Run Migrations
```bash
# Inside running container
docker-compose exec app npm run migration:run

# From host machine
npm run migration:run
```

### Create Migration
```bash
npm run migration:generate src/database/migrations/MigrationName
```

### Revert Migration
```bash
docker-compose exec app npm run migration:revert
```

### Access PostgreSQL CLI
```bash
docker-compose exec postgres psql -U postgres -d nest_ecom
```

---

## 🏥 Health Checks

### Application Health
```bash
curl http://localhost:3000/health
```

**Response:**
```json
{
  "statusCode": 200,
  "message": "Service is healthy",
  "data": {
    "status": "ok",
    "timestamp": "2025-10-02T00:00:00.000Z",
    "uptime": 123.456,
    "environment": "production",
    "version": "1.0.0",
    "database": "connected",
    "memory": {
      "used": 50,
      "total": 512,
      "percentage": 9.76
    },
    "responseTime": "5ms"
  },
  "timestamp": "2025-10-02T00:00:00.000Z"
}
```

### Readiness Check
```bash
curl http://localhost:3000/health/ready
```

### Liveness Check
```bash
curl http://localhost:3000/health/live
```

---

## 🔍 Troubleshooting

### Container won't start

**Check logs:**
```bash
docker-compose logs app
```

**Common issues:**
- Database not ready: Wait for PostgreSQL health check
- Port conflict: Change port in docker-compose.yml
- Permission issues: Check file ownership

### Database connection failed

**Verify database is running:**
```bash
docker-compose ps
```

**Check PostgreSQL logs:**
```bash
docker-compose logs postgres
```

**Test connection manually:**
```bash
docker-compose exec postgres pg_isready -U postgres
```

### Out of memory

**Increase Docker memory:**
- Docker Desktop → Settings → Resources → Memory
- Recommended: 4GB minimum

---

## 🚀 Deployment Scripts

### Automated Docker Deployment
```bash
# Development
./scripts/deploy-docker.sh dev

# Production
./scripts/deploy-docker.sh prod
```

**Script features:**
- Health checks
- Automatic migration execution
- Error handling
- Service status reporting

---

## 📊 Monitoring

### Container Stats
```bash
docker stats
```

### Container Logs
```bash
# Follow logs
docker-compose logs -f app

# Last 100 lines
docker-compose logs --tail=100 app

# Since timestamp
docker-compose logs --since 2025-10-02T00:00:00Z app
```

### Inspect Container
```bash
docker inspect ecom-api
```

---

## 🔒 Security Best Practices

### 1. Environment Variables
- ❌ **Don't** commit `.env` files to git
- ✅ **Do** use environment-specific `.env` files
- ✅ **Do** use strong JWT secrets (min 32 characters)

### 2. Database
- ✅ **Do** use strong database passwords
- ✅ **Do** enable SSL in production
- ✅ **Do** limit database max connections

### 3. Docker
- ✅ **Do** run as non-root user (already configured)
- ✅ **Do** use multi-stage builds (already configured)
- ✅ **Do** minimize image layers

---

## 📝 Docker Compose Profiles

### Development (docker-compose.dev.yml)
```yaml
services:
  postgres-dev: PostgreSQL on port 5433
  redis-dev: Redis on port 6379
```

**Use case:** Local development with hot reload

### Production (docker-compose.yml)
```yaml
services:
  postgres: PostgreSQL on port 5432
  app: NestJS API on port 3000
```

**Use case:** Production deployment or testing production builds

---

## 🎯 Next Steps

1. **Customize Environment Variables**: Update `docker-compose.yml` with your values
2. **Test Health Endpoints**: Verify `/health`, `/health/ready`, `/health/live`
3. **Run Migrations**: Execute `docker-compose exec app npm run migration:run`
4. **Access API**: http://localhost:3000
5. **Monitor Logs**: `docker-compose logs -f app`

---

## 🆘 Support

### Common Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Restart specific service
docker-compose restart app

# View logs
docker-compose logs -f app

# Execute command in container
docker-compose exec app npm run migration:run

# Rebuild images
docker-compose up --build -d

# Remove all (including volumes)
docker-compose down -v
```

### Useful Docker Commands

```bash
# List running containers
docker ps

# List all containers
docker ps -a

# Remove stopped containers
docker container prune

# Remove unused images
docker image prune

# View disk usage
docker system df

# Clean up everything
docker system prune -a
```
