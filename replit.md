# TechFix Pro - IT Support Management Platform

## Overview

TechFix Pro is a comprehensive IT support management platform built for PC repair shops. It combines modern web technologies with AI-powered insights to streamline repair workflows, manage client relationships, track inventory, and optimize business operations. The platform features a full-stack TypeScript architecture with React frontend and Node.js backend, utilizing PostgreSQL for data persistence.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with Shadcn UI components
- **State Management**: TanStack Query (React Query) for server state
- **Routing**: Wouter for client-side routing
- **Forms**: React Hook Form with Zod validation
- **Mobile Support**: Responsive design with dedicated mobile components

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript (ESM modules)
- **Authentication**: Passport.js with session-based auth
- **Database**: PostgreSQL with Drizzle ORM
- **Real-time**: WebSocket integration for live updates
- **File Handling**: Multer for file uploads with image processing via Sharp

### Data Layer
- **ORM**: Drizzle with migrations support
- **Connection**: Neon serverless PostgreSQL
- **Schema**: Type-safe schema definitions shared between client and server
- **Migrations**: Automated database schema updates via Drizzle Kit

## Key Components

### Core Business Logic
1. **Ticket Management System**
   - Complete lifecycle tracking (received → diagnosed → in progress → completed)
   - Priority-based queue management
   - Time tracking and labor cost calculation
   - Photo attachments and repair documentation

2. **Client & Device Management**
   - Comprehensive client database with contact information
   - Device registry with specifications and repair history
   - Relationship tracking between clients and their devices

3. **Inventory Management**
   - Real-time stock tracking with low-stock alerts
   - Barcode scanning capabilities using ZXing library
   - Supplier management and purchase order system
   - Parts ordering workflow integrated with tickets

4. **Billing & Sales System**
   - Integrated billing with tax calculations
   - Sales transaction recording
   - Invoice generation and payment tracking
   - Billable item management

### Advanced Features
1. **AI Integration**
   - OpenAI API integration for ticket analysis
   - Repair suggestion generation
   - Voice-to-text ticket creation
   - Intelligent priority assessment

2. **Time Tracking**
   - Real-time timer functionality
   - Labor cost calculation based on hourly rates
   - Session management with pause/resume capabilities
   - Comprehensive time reporting

3. **Voice Control**
   - Speech recognition for hands-free operation
   - Voice command navigation
   - Automated ticket creation from voice input

4. **Mobile Optimization**
   - Responsive design for all screen sizes
   - Mobile-specific UI components
   - Touch-optimized interfaces

## Data Flow

### Authentication Flow
1. User credentials validated against PostgreSQL user table
2. Session created and stored in database
3. Passport.js manages session persistence
4. JWT tokens used for WebSocket authentication

### Ticket Workflow
1. Client/device information captured
2. Ticket created with AI-powered priority assessment
3. Time tracking initiated when work begins
4. Repair notes and photos added throughout process
5. Parts ordered and tracked through inventory system
6. Billing generated upon completion
7. Client notification and pickup coordination

### Real-time Updates
1. WebSocket connections established on client connection
2. Server broadcasts updates for ticket status changes
3. Inventory updates reflected across all connected clients
4. Real-time collaboration on repair notes and documentation

## External Dependencies

### Core Dependencies
- **Database**: @neondatabase/serverless for PostgreSQL connectivity
- **ORM**: drizzle-orm with drizzle-kit for migrations
- **Authentication**: passport, passport-local for session management
- **File Processing**: multer for uploads, sharp for image processing
- **AI Services**: OpenAI API for intelligent insights
- **Barcode Scanning**: @zxing/browser and @zxing/library

### UI Dependencies
- **Component Library**: Extensive Radix UI components (@radix-ui/*)
- **Styling**: Tailwind CSS with class-variance-authority
- **Forms**: @hookform/resolvers with Zod validation
- **Icons**: Lucide React icon library
- **Query Management**: @tanstack/react-query

### Development Dependencies
- **Build Tools**: Vite for frontend bundling, esbuild for backend
- **TypeScript**: Full TypeScript support with shared types
- **Linting**: ESLint configuration for code quality

## Deployment Strategy

### Development Environment
- **Hot Reloading**: Vite dev server with HMR
- **Database**: Local PostgreSQL or Neon development instance
- **Environment Variables**: .env file for configuration
- **WebSocket**: Development WebSocket server on port 5000

### Production Deployment
- **Containerization**: Docker support with multi-stage builds
- **Process Management**: PM2 or similar for Node.js process management
- **Static Assets**: Vite build output served from dist/public
- **Database**: Neon serverless PostgreSQL in production
- **Session Storage**: PostgreSQL-backed session store

### CI/CD Pipeline
- **Build Process**: Vite build for frontend, esbuild for backend
- **Database Migrations**: Automated via Drizzle Kit
- **Environment Configuration**: Secure secrets management
- **Health Checks**: Built-in API endpoints for monitoring

The architecture emphasizes modularity, type safety, and developer experience while providing robust business functionality for repair shop operations. The system can scale horizontally with proper load balancing and database optimization.

## Changelog
```
Changelog:
- July 01, 2025. Initial setup
```

## User Preferences
```
Preferred communication style: Simple, everyday language.
```