# Backend Setup Guide

This guide will help you set up the independent Node.js backend for the AI Legal Case Manager, so your customers can use the application without relying on Blink API for authentication and data storage.

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ installed
- npm or yarn package manager

### 1. Backend Setup

Navigate to the backend directory:
```bash
cd backend
```

Install dependencies:
```bash
npm install
```

Create environment file:
```bash
cp .env.example .env
```

Edit the `.env` file with your configuration:
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration (SQLite)
DATABASE_PATH=./database.sqlite

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:5173

# File Upload Configuration
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
```

Start the backend server:
```bash
npm start
```

The backend will be running at `http://localhost:5000`

### 2. Frontend Configuration

Update the API base URL in `src/services/api.ts`:

For development:
```typescript
const API_BASE_URL = 'http://localhost:5000/api'
```

For production:
```typescript
const API_BASE_URL = 'https://your-backend-domain.com/api'
```

### 3. Start the Frontend

In the main project directory:
```bash
npm run dev
```

The frontend will be running at `http://localhost:5173`

## 🏗️ Backend Architecture

### Database Schema

The backend uses SQLite with the following tables:

#### Users Table
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  firm_name TEXT,
  phone TEXT,
  title TEXT DEFAULT 'Attorney',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### Cases Table
```sql
CREATE TABLE cases (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_phone TEXT,
  case_type TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  priority TEXT DEFAULT 'medium',
  settlement_amount DECIMAL(15,2),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id)
);
```

#### Documents Table
```sql
CREATE TABLE documents (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  case_id TEXT,
  filename TEXT NOT NULL,
  original_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id),
  FOREIGN KEY (case_id) REFERENCES cases (id)
);
```

#### Activity Logs Table
```sql
CREATE TABLE activity_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  action TEXT NOT NULL,
  description TEXT,
  metadata TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id)
);
```

### API Endpoints

#### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/change-password` - Change password

#### Cases
- `GET /api/cases` - Get user's cases (with pagination and filters)
- `POST /api/cases` - Create new case
- `GET /api/cases/:id` - Get specific case
- `PUT /api/cases/:id` - Update case
- `DELETE /api/cases/:id` - Delete case
- `GET /api/cases/stats` - Get case statistics

#### Documents
- `POST /api/documents/upload` - Upload document
- `GET /api/documents` - Get user's documents
- `GET /api/documents/:id/download` - Download document
- `DELETE /api/documents/:id` - Delete document

#### Users
- `GET /api/users/dashboard` - Get dashboard statistics
- `GET /api/users/activity` - Get user activity log

## 🔒 Security Features

### Authentication
- JWT-based authentication
- Password hashing with bcrypt
- Secure session management

### Authorization
- User-based data isolation
- Role-based access control ready
- Request validation and sanitization

### Security Middleware
- Rate limiting (100 requests per 15 minutes)
- CORS protection
- Input validation
- File upload security
- SQL injection prevention

## 📁 File Upload

### Configuration
- Maximum file size: 10MB (configurable)
- Allowed file types: PDF, DOC, DOCX, TXT, JPG, PNG
- Files stored in `./uploads` directory
- Unique filename generation to prevent conflicts

### Security
- File type validation
- File size limits
- Secure file paths
- Virus scanning ready (can be added)

## 🚀 Deployment

### Environment Variables for Production
```env
NODE_ENV=production
PORT=5000
DATABASE_PATH=/app/data/database.sqlite
JWT_SECRET=your-production-jwt-secret-very-long-and-secure
CORS_ORIGIN=https://your-frontend-domain.com
UPLOAD_DIR=/app/uploads
```

### Docker Deployment (Optional)

Create `Dockerfile`:
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

Create `docker-compose.yml`:
```yaml
version: '3.8'
services:
  backend:
    build: .
    ports:
      - "5000:5000"
    volumes:
      - ./data:/app/data
      - ./uploads:/app/uploads
    environment:
      - NODE_ENV=production
      - DATABASE_PATH=/app/data/database.sqlite
      - JWT_SECRET=your-production-secret
```

### Cloud Deployment Options

1. **Heroku**
   - Add `Procfile`: `web: npm start`
   - Set environment variables in Heroku dashboard
   - Use Heroku Postgres for production database

2. **DigitalOcean App Platform**
   - Connect GitHub repository
   - Configure environment variables
   - Auto-deploy on push

3. **AWS EC2**
   - Use PM2 for process management
   - Configure nginx as reverse proxy
   - Set up SSL with Let's Encrypt

4. **Railway**
   - Connect GitHub repository
   - Set environment variables
   - Automatic deployments

## 🔧 Development

### Running in Development Mode
```bash
npm run dev
```

This uses nodemon for auto-restart on file changes.

### Database Management

View database:
```bash
sqlite3 database.sqlite
.tables
.schema users
```

Reset database:
```bash
rm database.sqlite
npm start  # Will recreate tables
```

### Testing API Endpoints

Use curl or Postman to test endpoints:

```bash
# Register user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"password123","firm_name":"Doe Law Firm"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'

# Get cases (with token)
curl -X GET http://localhost:5000/api/cases \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🐛 Troubleshooting

### Common Issues

1. **Database locked error**
   - Stop all running instances
   - Delete `database.sqlite-wal` and `database.sqlite-shm` files
   - Restart server

2. **CORS errors**
   - Check `CORS_ORIGIN` in `.env`
   - Ensure frontend URL matches exactly

3. **File upload fails**
   - Check `UPLOAD_DIR` permissions
   - Verify `MAX_FILE_SIZE` setting
   - Ensure disk space available

4. **JWT errors**
   - Verify `JWT_SECRET` is set
   - Check token expiration
   - Clear browser localStorage

### Logs

Check server logs for detailed error information:
```bash
tail -f server.log
```

## 📈 Scaling Considerations

### Database
- For production, consider PostgreSQL or MySQL
- Implement database connection pooling
- Add database migrations system

### File Storage
- Use cloud storage (AWS S3, Google Cloud Storage)
- Implement CDN for file delivery
- Add file compression

### Performance
- Add Redis for session storage
- Implement API caching
- Use load balancer for multiple instances

### Monitoring
- Add application monitoring (New Relic, DataDog)
- Implement health check endpoints
- Set up error tracking (Sentry)

## 🤝 Support

For issues with the backend setup:
1. Check the troubleshooting section
2. Review server logs
3. Ensure all environment variables are set correctly
4. Verify database permissions and connectivity

The backend is designed to be production-ready with proper security, validation, and error handling. It provides a complete replacement for Blink's authentication and data storage services.