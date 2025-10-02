# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

GEEK TECHNOLOGIE is a comprehensive stock management and invoicing application built with FastAPI and Bootstrap, designed to replicate the functionality of a Node.js/React template application. This is a business management system for technology products with focus on product variants, IMEI/serial tracking, and complete transaction history.

## Development Commands

### Environment Setup
```bash
# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac

# Install dependencies
pip install -r requirements.txt
```

### Running the Application

#### Development Mode
```bash
# Start application (development with auto-migrations and seeding)
python start.py

# Or run directly
python main.py

# Application accessible at: http://127.0.0.1:8000
```

#### Production Docker Deployment
```bash
# Start with Docker Compose (includes PostgreSQL)
docker compose up -d --build

# View logs
docker compose logs -f app

# Stop services
docker compose down

# Application accessible at: http://localhost:8000
```

#### VPS Deployment (Production)
```bash
# Use the management script
./manage.sh start     # Start application
./manage.sh stop      # Stop application  
./manage.sh restart   # Restart with rebuild
./manage.sh logs      # View real-time logs
./manage.sh status    # Check container status
./manage.sh update    # Git pull and restart
./manage.sh backup    # Database backup
```

### Database Operations
```bash
# Access PostgreSQL container
docker exec -it geek_db psql -U postgres -d geektechnologie_db

# Create database backup
docker exec geek_db pg_dump -U postgres geektechnologie_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Database migrations are handled automatically at startup
# Manual migration check in code: migrations/migration_manager.py
```

### Testing
```bash
# Test environment variables
powershell -ExecutionPolicy Bypass -File scripts/test_env_variables.ps1

# No formal test suite currently implemented
# API testing can be done via http://localhost:8000/docs (FastAPI auto-docs)
```

## Architecture Overview

### Core Application Structure
- **Framework**: FastAPI with SQLAlchemy ORM and Bootstrap 5 frontend
- **Database**: PostgreSQL (production) / SQLite (development fallback)
- **Authentication**: JWT-based with role-based access (admin, manager, user)
- **Frontend**: Server-side rendered templates with vanilla JavaScript

### Key Components

#### Database Layer (`app/database.py`)
- SQLAlchemy models defining complete business schema
- Support for both PostgreSQL and SQLite with automatic URL normalization
- Connection pooling and SSL configuration
- Key entities: User, Client, Product, ProductVariant, Invoice, Quotation, StockMovement

#### API Layer (`app/routers/`)
- RESTful API endpoints organized by business domain
- Each router handles: auth, products, clients, stock_movements, invoices, quotations, suppliers, etc.
- Standardized response patterns and error handling

#### Business Logic Patterns
- **Product System**: Core products with optional variants (smartphones, computers)
- **Barcode Rules**: Products with variants have no main barcode; individual variants have unique barcodes
- **IMEI/Serial Tracking**: Full traceability for variants with unique identifiers  
- **Stock Movements**: Complete audit trail for all inventory changes
- **Multi-Stage Sales**: Quotation → Invoice → Delivery Note flow

#### Migration System (`migrations/`)
- Automatic database migrations on startup
- Version-controlled schema changes in `migration_manager.py`
- Migration tracking table for applied changes

#### Configuration Management
- Environment-based configuration via `.env` file
- Docker environment overrides in `docker-compose.yml`
- Production deployment settings in VPS management scripts

### Authentication & Security
- JWT tokens with configurable expiration (default: 1 day)
- Role-based permissions (admin, manager, user)
- Secure password hashing with bcrypt
- CSRF protection and secure headers

### Frontend Architecture
- Server-side rendered Jinja2 templates (`templates/`)
- Bootstrap 5 responsive design with custom GEEK TECHNOLOGIE theme
- Vanilla JavaScript for dynamic interactions
- Asset versioning for cache busting (`ASSET_VERSION`)

## Database Schema Highlights

### Core Business Rules
- Products can have variants (color, storage, etc.) or be standalone
- Barcode uniqueness enforced globally across products and variants
- Stock quantity = number of tracked variants for products with variants
- Complete audit logging for stock movements and deletions
- Multi-payment support for invoices
- Warranty certificates integrated with invoices

### Key Tables
- `products` / `product_variants`: Main inventory system
- `clients`: Customer management
- `quotations` / `invoices`: Sales pipeline
- `stock_movements`: Inventory tracking
- `users`: Authentication and roles
- `delivery_notes`: Shipping management
- `daily_purchases`: Expense tracking

## Environment Configuration

### Required Environment Variables
```bash
DATABASE_URL=postgresql://user:pass@host:port/dbname
SECRET_KEY=your-jwt-secret-key
ENVIRONMENT=development|production
```

### Optional Configuration
```bash
# Database initialization (development)
INIT_DB_ON_STARTUP=true
SEED_DEFAULT_DATA=false

# Authentication
ACCESS_TOKEN_EXPIRE_MINUTES=1441
AUTH_TRUST_JWT_CLAIMS=true

# Server configuration
HOST=0.0.0.0
PORT=8000
RELOAD=false
```

## Default Accounts
- **Administrator**: `admin` / `admin123`
- **User**: `user` / `user123`

## Key Files for Understanding
- `main.py`: Application entry point and route definitions
- `start.py`: Production startup script with database initialization
- `app/database.py`: Complete database schema and models
- `app/routers/`: API endpoint implementations by domain
- `docker-compose.yml`: Local development environment
- `DEPLOYMENT.md`: Production deployment instructions