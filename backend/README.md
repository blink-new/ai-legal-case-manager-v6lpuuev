# AI Legal Case Manager - Backend API

A complete Node.js/Express backend API for the AI Legal Case Manager application with JWT authentication, SQLite database, and file upload capabilities.

## 🚀 Features

- **Authentication & Authorization**
  - JWT-based authentication
  - User registration and login
  - Password hashing with bcrypt
  - Session management
  - Role-based access control

- **Case Management**
  - CRUD operations for legal cases
  - Case notes and deadlines
  - Advanced filtering and search
  - Case statistics and analytics

- **Document Management**
  - File upload with validation
  - Document categorization
  - Secure file storage
  - Download and metadata management

- **User Management**
  - User profiles and preferences
  - Activity tracking
  - Dashboard data aggregation
  - Admin user management

- **Security Features**
  - Rate limiting
  - CORS protection
  - Input validation
  - File type restrictions
  - SQL injection prevention

## 📋 Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- SQLite3

## 🛠️ Installation

1. **Clone or extract the backend code**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
   DATABASE_PATH=./database.sqlite
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   PORT=5000
   NODE_ENV=development
   CORS_ORIGINS=http://localhost:3000,http://localhost:5173
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   MAX_FILE_SIZE=10485760
   UPLOAD_PATH=./uploads
   ```

4. **Start the server**
   ```bash
   # Development mode with auto-restart
   npm run dev
   
   # Production mode
   npm start
   ```

The server will start on `http://localhost:5000` (or your configured PORT).

## 📚 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "firmName": "Law Firm LLC",
  "phone": "+1234567890"
}
```

#### Login User
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <jwt_token>
```

#### Logout
```http
POST /api/auth/logout
Authorization: Bearer <jwt_token>
```

### Case Management Endpoints

#### Get All Cases
```http
GET /api/cases?page=1&limit=20&status=open&search=accident
Authorization: Bearer <jwt_token>
```

#### Create Case
```http
POST /api/cases
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "title": "Auto Accident Case",
  "clientName": "Jane Smith",
  "clientEmail": "jane@example.com",
  "caseType": "auto_accident",
  "priority": "high",
  "description": "Rear-end collision case",
  "incidentDate": "2024-01-15",
  "insuranceCompany": "State Farm"
}
```

#### Get Case Details
```http
GET /api/cases/:caseId
Authorization: Bearer <jwt_token>
```

#### Update Case
```http
PUT /api/cases/:caseId
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "status": "settled",
  "settlementAmount": 25000
}
```

#### Add Case Note
```http
POST /api/cases/:caseId/notes
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "note": "Client called to discuss settlement offer",
  "noteType": "phone_call"
}
```

### Document Management Endpoints

#### Upload Document
```http
POST /api/documents/upload/:caseId
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data

document: <file>
documentType: "medical_record"
description: "MRI scan results"
```

#### Get Case Documents
```http
GET /api/documents/case/:caseId
Authorization: Bearer <jwt_token>
```

#### Download Document
```http
GET /api/documents/download/:documentId
Authorization: Bearer <jwt_token>
```

### User Management Endpoints

#### Get Dashboard Data
```http
GET /api/users/dashboard
Authorization: Bearer <jwt_token>
```

#### Get User Statistics
```http
GET /api/users/stats
Authorization: Bearer <jwt_token>
```

#### Update Profile
```http
PUT /api/auth/profile
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "firmName": "Updated Law Firm",
  "phone": "+1987654321"
}
```

## 🗄️ Database Schema

The API uses SQLite with the following main tables:

- **users** - User accounts and profiles
- **cases** - Legal case information
- **documents** - File uploads and metadata
- **case_notes** - Case notes and communications
- **deadlines** - Important dates and deadlines
- **sessions** - JWT session management

## 🔒 Security Features

- **JWT Authentication** - Secure token-based authentication
- **Password Hashing** - bcrypt with salt rounds
- **Rate Limiting** - Prevents API abuse
- **Input Validation** - express-validator for request validation
- **File Upload Security** - File type and size restrictions
- **CORS Protection** - Configurable cross-origin requests
- **SQL Injection Prevention** - Parameterized queries

## 📁 File Upload

Supported file types:
- PDF documents
- Microsoft Word (.doc, .docx)
- Microsoft Excel (.xls, .xlsx)
- Text files (.txt)
- Images (.jpg, .jpeg, .png, .gif, .webp)

Maximum file size: 10MB (configurable)

## 🚀 Deployment

### Production Setup

1. **Set production environment variables**
   ```env
   NODE_ENV=production
   JWT_SECRET=your-very-secure-production-secret
   DATABASE_PATH=/path/to/production/database.sqlite
   CORS_ORIGINS=https://yourdomain.com
   ```

2. **Use a process manager**
   ```bash
   npm install -g pm2
   pm2 start server.js --name "legal-api"
   ```

3. **Set up reverse proxy (nginx)**
   ```nginx
   server {
       listen 80;
       server_name api.yourdomain.com;
       
       location / {
           proxy_pass http://localhost:5000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

### Docker Deployment

```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage
```

## 📊 Monitoring

The API includes:
- Health check endpoint: `GET /health`
- Request logging
- Error tracking
- Performance monitoring

## 🤝 Integration with Frontend

To integrate with your React frontend:

1. **Install axios in your frontend**
   ```bash
   npm install axios
   ```

2. **Create an API client**
   ```javascript
   import axios from 'axios';
   
   const api = axios.create({
     baseURL: 'http://localhost:5000/api',
     headers: {
       'Content-Type': 'application/json'
     }
   });
   
   // Add auth token to requests
   api.interceptors.request.use((config) => {
     const token = localStorage.getItem('token');
     if (token) {
       config.headers.Authorization = `Bearer ${token}`;
     }
     return config;
   });
   ```

3. **Replace Blink SDK calls**
   ```javascript
   // Instead of: blink.auth.login()
   const login = async (email, password) => {
     const response = await api.post('/auth/login', { email, password });
     localStorage.setItem('token', response.data.token);
     return response.data.user;
   };
   
   // Instead of: blink.db.cases.list()
   const getCases = async () => {
     const response = await api.get('/cases');
     return response.data.cases;
   };
   ```

## 📝 License

MIT License - see LICENSE file for details.

## 🆘 Support

For issues and questions:
1. Check the API logs for error details
2. Verify environment variables are set correctly
3. Ensure database permissions are correct
4. Check CORS settings for frontend integration

## 🔄 API Response Format

All API responses follow this format:

**Success Response:**
```json
{
  "message": "Operation successful",
  "data": { ... },
  "user": { ... },
  "cases": [ ... ]
}
```

**Error Response:**
```json
{
  "error": "Error Type",
  "message": "Detailed error message",
  "details": [ ... ]
}
```

## 🚀 Next Steps

1. Set up the backend server
2. Update your frontend to use the new API endpoints
3. Test authentication and case management
4. Deploy to production
5. Set up monitoring and backups

Your AI Legal Case Manager now has a complete, independent backend that doesn't rely on Blink API!