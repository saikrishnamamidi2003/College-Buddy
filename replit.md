# College Buddy - Peer-to-Peer Marketplace & Study Hub

## Overview

College Buddy is a full-stack web application designed for college students to buy/sell items, share study materials, and communicate with peers. The application features a React frontend with TypeScript, an Express.js backend, and uses PostgreSQL with Drizzle ORM for data persistence.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using functional components and hooks
- **Build Tool**: Vite for fast development and optimized builds
- **Styling**: Tailwind CSS with shadcn/ui component library for consistent UI
- **State Management**: React Query (@tanstack/react-query) for server state, React Context for authentication
- **Routing**: Wouter for lightweight client-side routing
- **Form Management**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with proper HTTP methods and status codes
- **Authentication**: JWT-based authentication with bcrypt for password hashing
- **File Upload**: Multer for handling multipart/form-data (images and PDFs)
- **Real-time Communication**: WebSocket support for chat functionality

### Database Architecture
- **Database**: PostgreSQL (configured for Neon Database)
- **ORM**: Drizzle ORM with schema-first approach
- **Migration**: Drizzle Kit for database migrations
- **Connection**: @neondatabase/serverless for serverless PostgreSQL connections

## Key Components

### Authentication System
- JWT token-based authentication stored in localStorage
- Protected routes with automatic redirection
- User registration and login with form validation
- Password hashing using bcryptjs

### Marketplace Module
- Item listing with categories (Textbooks, Electronics, Lab Equipment, Stationery)
- Image upload support for item listings
- Search and filter functionality
- Item condition tracking and pricing

### Study Notes Module
- PDF upload and storage system
- Subject and unit categorization
- Download tracking and rating system
- Tag-based organization

### Chat System
- Real-time messaging using WebSockets
- Context-aware chat (item/note specific)
- Message persistence and read status tracking

### User Management
- User profiles with academic information (branch, year)
- Rating system for sellers and note contributors
- Activity tracking and statistics

## Data Flow

### Authentication Flow
1. User submits login/register form
2. Frontend validates data using Zod schemas
3. Backend authenticates and generates JWT token
4. Token stored in localStorage and used for API requests
5. Protected routes check authentication status

### Item Listing Flow
1. User uploads item details and images via form
2. Images processed and stored using Multer
3. Item data validated and stored in database
4. Real-time updates to marketplace listings

### Note Sharing Flow
1. User uploads PDF with metadata
2. File validation (PDF only, size limits)
3. File stored on server filesystem
4. Metadata stored in database with file path
5. Download tracking and rating system

### Chat Flow
1. WebSocket connection established on authentication
2. Messages sent through WebSocket for real-time delivery
3. Message persistence in database
4. Context linking to items/notes

## External Dependencies

### Core Dependencies
- **React Ecosystem**: React 18, React Query, React Hook Form, React Router (Wouter)
- **UI Components**: Radix UI primitives, Tailwind CSS, Lucide React icons
- **Backend**: Express.js, JWT, bcryptjs, Multer
- **Database**: Drizzle ORM, Neon Database serverless connector
- **Validation**: Zod for schema validation
- **WebSockets**: ws library for real-time communication

### Development Tools
- **Build**: Vite with React plugin
- **TypeScript**: Full TypeScript support with strict configuration
- **Code Quality**: ESLint configuration (implicit)
- **Replit Integration**: Special plugins for Replit development environment

## Deployment Strategy

### Development Environment
- Vite dev server with HMR (Hot Module Replacement)
- Express server with middleware for development
- File uploads stored locally in `server/uploads`
- Environment variables for database connection

### Production Build
- Vite builds optimized static assets to `dist/public`
- ESBuild bundles server code for production
- Static file serving from Express
- PostgreSQL database with connection pooling

### File Storage
- Local filesystem storage using Multer
- Organized upload directory structure
- File type validation (images for items, PDFs for notes)
- Size limitations (10MB max per file)

### Environment Configuration
- DATABASE_URL required for PostgreSQL connection
- JWT_SECRET for token signing
- NODE_ENV for environment detection
- Replit-specific configuration for development

The architecture prioritizes simplicity and rapid development while maintaining scalability and proper separation of concerns. The use of modern web technologies ensures good performance and developer experience.