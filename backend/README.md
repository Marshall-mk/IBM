# IntelliMark Mobile Backend

Backend API server for the IntelliMark Mobile App - provides authentication, bookmark management, and AI-powered features.

## Features

- 🔐 **Authentication** - JWT-based auth with refresh tokens
- 📚 **Bookmark Management** - Full CRUD operations for bookmarks with categories/tags support
- 🏷️ **Category System** - Tag-based organization and clustering support
- 🔍 **Search Functionality** - Full-text search with filtering capabilities
- 📊 **Analytics** - User activity and bookmark analytics
- 🛡️ **Security** - Rate limiting, validation, and security headers
- 📱 **Mobile API** - Optimized endpoints for React Native mobile app
- 🗄️ **Database** - Prisma with SQLite for development, PostgreSQL ready for production

## Tech Stack

- **Node.js** with **Express** for the API server
- **TypeScript** for type safety and better development experience
- **Prisma** with **SQLite** for database (production-ready with PostgreSQL support)
- **JWT** for secure authentication
- **Winston** for structured logging
- **Axios** for external API calls
- **Express middleware** for security (helmet, cors, compression, rate limiting)

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- SQLite (included) or PostgreSQL for production

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd intellimark-mobile/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Set up database**
   ```bash
   # Generate Prisma client
   npm run db:generate
   
   # Run migrations
   npm run db:migrate
   
   # Seed database (optional)
   npm run db:seed
   ```

5. **Start the server**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm run build
   npm start
   ```

## Environment Variables

Create a `.env` file in the backend directory:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/intellimark_mobile"

# JWT
JWT_SECRET="your-super-secret-jwt-key"
JWT_REFRESH_SECRET="your-super-secret-refresh-key"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Redis
REDIS_URL="redis://localhost:6379"

# OpenAI
OPENAI_API_KEY="your-openai-api-key"

# Email
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# App
PORT=3001
NODE_ENV="development"
FRONTEND_URL="http://localhost:19006"

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## API Endpoints

### Authentication

- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - User logout
- `POST /auth/password-reset` - Request password reset
- `POST /auth/reset-password` - Reset password with token
- `GET /auth/verify-email` - Verify email address
- `GET /auth/profile` - Get user profile
- `PUT /auth/profile` - Update user profile

### Bookmarks

- `GET /api/bookmarks` - Get user bookmarks (with search/filter)
- `POST /api/bookmarks` - Create new bookmark with categories/tags
- `GET /api/bookmarks/:id` - Get specific bookmark
- `PUT /api/bookmarks/:id` - Update bookmark
- `DELETE /api/bookmarks/:id` - Delete bookmark
- `POST /api/bookmarks/:id/favorite` - Toggle bookmark favorite
- `POST /api/bookmarks/:id/read` - Mark bookmark as read
- `GET /api/bookmarks/categories` - Get all bookmark categories/tags
- `POST /api/bookmarks/bulk-delete` - Delete multiple bookmarks
- `GET /api/bookmarks/export` - Export bookmarks (JSON/CSV/HTML)
- `POST /api/bookmarks/import` - Import bookmarks

### Search

- `GET /api/search` - Search bookmarks with AI
- `GET /api/search/suggestions` - Get search suggestions
- `GET /api/search/history` - Get search history

### Analytics

- `GET /api/analytics/dashboard` - Get dashboard stats
- `GET /api/analytics/usage` - Get usage analytics
- `GET /api/analytics/categories` - Get category analytics

### Briefings

- `GET /api/briefings` - Get user briefings
- `POST /api/briefings/generate` - Generate new briefing
- `PUT /api/briefings/preferences` - Update briefing preferences

## Database Schema

### Users Table
```sql
- id: UUID (Primary Key)
- email: String (Unique)
- password: String (Hashed)
- firstName: String (Optional)
- lastName: String (Optional)
- isEmailVerified: Boolean
- emailVerificationToken: String (Optional)
- passwordResetToken: String (Optional)
- passwordResetExpires: DateTime (Optional)
- createdAt: DateTime
- updatedAt: DateTime
```

### Bookmarks Table
```sql
- id: UUID (Primary Key)
- userId: UUID (Foreign Key)
- url: String
- title: String
- content: Text (Optional)
- summary: Text (Optional)
- domain: String
- isRead: Boolean
- isFavorite: Boolean
- categories: JSON (Array of category/tag strings)
- aiAnalysis: JSON (Optional)
- createdAt: DateTime
- updatedAt: DateTime
```

### RefreshTokens Table
```sql
- id: UUID (Primary Key)
- userId: UUID (Foreign Key)
- token: String (Unique)
- expiresAt: DateTime
- createdAt: DateTime
```

## AI Features

### Content Analysis
- Automatically analyzes bookmark content using OpenAI
- Generates summaries and extracts key points
- Categorizes bookmarks automatically
- Sentiment analysis

### Smart Search
- AI-powered search with semantic understanding
- Query expansion and suggestions
- Relevance scoring
- Context-aware results

### Briefing Generation
- Creates personalized bookmark summaries
- Scheduled delivery via email
- Customizable frequency and content

## Security Features

- JWT authentication with refresh tokens
- Password hashing with bcrypt
- Rate limiting on all endpoints
- Input validation and sanitization
- CORS configuration
- Security headers with Helmet
- SQL injection prevention with Prisma

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm test -- --coverage
```

## Deployment

### Environment Setup

1. **Production Environment Variables**
   ```bash
   NODE_ENV=production
   DATABASE_URL=your-production-database-url
   REDIS_URL=your-production-redis-url
   # ... other production values
   ```

2. **Build Application**
   ```bash
   npm run build
   ```

3. **Start Production Server**
   ```bash
   npm start
   ```

### Docker Deployment

```dockerfile
# Dockerfile included in the project
docker build -t intellimark-mobile-backend .
docker run -p 3001:3001 intellimark-mobile-backend
```

### Cloud Deployment

The backend can be deployed to:
- **Heroku** - Easy deployment with PostgreSQL addon
- **AWS** - EC2, RDS, and ElastiCache
- **Google Cloud** - Cloud Run with Cloud SQL
- **DigitalOcean** - App Platform with managed databases

## Monitoring and Logging

- **Winston** for structured logging
- **Morgan** for HTTP request logging
- **Health check endpoint** at `/health`
- **Error tracking** with proper error handling
- **Performance monitoring** with custom metrics

## API Documentation

- Interactive API docs available at `/api-docs` (Swagger/OpenAPI)
- Postman collection available in `/docs` folder
- Authentication examples and sample requests

## Development

### Project Structure

```
backend/
├── src/
│   ├── controllers/         # Route handlers
│   ├── middleware/          # Express middleware
│   ├── models/             # Database models
│   ├── routes/             # API routes
│   ├── services/           # Business logic
│   ├── utils/              # Utility functions
│   └── app.ts              # Express app setup
├── prisma/
│   ├── schema.prisma       # Database schema
│   ├── migrations/         # Database migrations
│   └── seed.ts            # Database seeding
├── tests/                  # Test files
├── docs/                   # API documentation
└── package.json
```

### Development Scripts

```bash
# Development
npm run dev              # Start development server with hot reload

# Production
npm run build           # Build TypeScript to JavaScript
npm start              # Start production server

# Database
npm run db:generate    # Generate Prisma client
npm run db:migrate     # Run database migrations
npm run db:seed        # Seed database with sample data
npm run db:studio      # Open Prisma Studio

# Code Quality
npm run lint           # Check for linting errors
npm run lint:fix       # Fix linting errors automatically
npm run format         # Format code with Prettier
npm run format:check   # Check if code is properly formatted
npm run type-check     # TypeScript type checking

# Testing
npm test               # Run tests
npm run test:watch     # Run tests in watch mode
```

### Code Quality Tools

This backend uses modern development tools:

- **ESLint**: Configured with TypeScript rules for Node.js/Express
- **Prettier**: Consistent code formatting
- **TypeScript**: Strict type checking with proper configurations
- **Jest**: Testing framework for unit and integration tests

## Recent Updates & Optimization

### ✅ **Backend Cleanup & Optimization (2025)**

The backend has been streamlined for better maintainability and performance:

#### **📦 Dependency Optimization**
- **Removed unused packages**: `bull`, `redis`, `nodemailer`, `openai` and their type definitions
- **Cleaned up package.json**: Removed 4 unused dependencies to reduce bundle size
- **Updated scripts**: Added comprehensive development and quality scripts

#### **🔧 Enhanced Development Tools**
- **Modern ESLint configuration**: Production-ready linting rules for Node.js/Express
- **Prettier integration**: Consistent code formatting across all backend files
- **TypeScript optimization**: Strict type checking with proper error handling
- **Comprehensive scripts**: Full development workflow with quality checks

#### **🗂️ Improved Structure**
- **Removed empty directories**: Cleaned up unused `/src/models` folder
- **Streamlined dependencies**: Focused on core functionality without bloat
- **Enhanced configuration**: Production-ready setup with proper linting and formatting

#### **🎯 Focused Feature Set**
- **Core authentication**: JWT-based auth with proper token management
- **Bookmark management**: Full CRUD operations with proper validation
- **Database integration**: Prisma with SQLite for development, PostgreSQL ready for production
- **Security middleware**: Comprehensive security setup with helmet, cors, compression

### Contributing

1. Fork the repository
2. Create a feature branch
3. Write tests for new features
4. Ensure all tests pass
5. Submit a pull request

## Troubleshooting

### Common Issues

1. **Database connection errors**
   - Check DATABASE_URL in .env
   - Ensure PostgreSQL is running
   - Verify database credentials

2. **Redis connection errors**
   - Check REDIS_URL in .env
   - Ensure Redis server is running
   - Verify Redis configuration

3. **OpenAI API errors**
   - Check OPENAI_API_KEY in .env
   - Verify API key is valid
   - Check API usage limits

4. **Email service errors**
   - Check SMTP configuration
   - Verify email credentials
   - Check firewall/security settings

### Debug Mode

Enable debug logging:
```bash
DEBUG=* npm run dev
```

## License

This project is licensed under the MIT License.

## Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review the API documentation

---

**Note**: This backend is specifically designed for the IntelliMark Mobile App and provides all necessary APIs for mobile functionality.