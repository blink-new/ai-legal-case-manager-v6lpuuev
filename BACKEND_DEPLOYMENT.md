# Backend Deployment Guide

## Local Development

The backend is now running locally on `http://localhost:5000` with the following features:

- ✅ SQLite database with all required tables
- ✅ JWT-based authentication
- ✅ User registration and login
- ✅ CORS configured for frontend
- ✅ Rate limiting and security middleware
- ✅ File upload support
- ✅ Case management APIs
- ✅ Document management APIs

### Test the Backend

1. **Health Check**: `curl http://localhost:5000/health`
2. **Register User**: 
   ```bash
   curl -X POST http://localhost:5000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"firstName":"John","lastName":"Doe","email":"john@example.com","password":"password123","firmName":"Doe Law Firm"}'
   ```
3. **Login**: 
   ```bash
   curl -X POST http://localhost:5000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"john@example.com","password":"password123"}'
   ```

## Deploy to Vercel

### Option 1: Deploy from GitHub

1. **Push backend to GitHub**:
   ```bash
   git add backend/
   git commit -m "Add custom backend server"
   git push origin main
   ```

2. **Create new Vercel project**:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Set **Root Directory** to `backend`
   - Set **Framework Preset** to "Other"

3. **Configure Environment Variables** in Vercel dashboard:
   ```
   NODE_ENV=production
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRES_IN=7d
   CORS_ORIGINS=https://your-frontend-domain.com,https://ai-legal-case-manager-v6lpuuev.sites.blink.new
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   MAX_FILE_SIZE=10485760
   ```

4. **Add vercel.json** to backend folder:
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "server.js",
         "use": "@vercel/node"
       }
     ],
     "routes": [
       {
         "src": "/(.*)",
         "dest": "/server.js"
       }
     ]
   }
   ```

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Deploy**:
   ```bash
   cd backend
   vercel --prod
   ```

### Update Frontend API URL

After deployment, update `src/services/api.ts`:

```typescript
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-backend-domain.vercel.app/api'  // Replace with your actual Vercel URL
  : 'http://localhost:5000/api'
```

## Database Considerations

- **Development**: Uses SQLite file (`database.sqlite`)
- **Production**: Consider upgrading to PostgreSQL or MySQL for better performance
- **Vercel**: SQLite files are ephemeral on Vercel. For production, use:
  - Vercel Postgres
  - PlanetScale
  - Supabase
  - Railway

## Security Notes

- Change `JWT_SECRET` in production
- Use HTTPS in production
- Configure proper CORS origins
- Consider rate limiting adjustments
- Add input validation and sanitization
- Implement proper logging and monitoring

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/password` - Change password

### Cases
- `GET /api/cases` - List cases
- `POST /api/cases` - Create case
- `GET /api/cases/:id` - Get case details
- `PUT /api/cases/:id` - Update case
- `DELETE /api/cases/:id` - Delete case
- `GET /api/cases/stats` - Get case statistics

### Documents
- `POST /api/documents/upload` - Upload document
- `GET /api/documents` - List documents
- `DELETE /api/documents/:id` - Delete document
- `GET /api/documents/:id/download` - Download document

### Users
- `GET /api/users/dashboard` - Dashboard data
- `GET /api/users/activity` - User activity
- `GET /api/users/stats` - User statistics