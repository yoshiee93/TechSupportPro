# TechFix Pro - IT Support Management Platform

An advanced IT support management platform leveraging AI to optimize PC repair shop workflows, enhance ticket management, and provide intelligent insights.

## Features

### Core Functionality
- **Ticket Management**: Complete ticket lifecycle with priority tracking, status updates, and automated workflows
- **Client & Device Management**: Comprehensive client database with device history and repair tracking
- **Inventory Management**: Real-time stock tracking with barcode scanning and supplier management
- **Billing & Sales**: Integrated billing system with tax calculations and payment tracking
- **Time Tracking**: Labor cost calculation with real-time time tracking per ticket

### Advanced Features
- **AI-Powered Insights**: OpenAI integration for intelligent ticket analysis and repair suggestions
- **Multi-Camera Barcode Scanning**: Advanced barcode scanning with camera selection
- **Mobile-Responsive Interface**: Optimized for both desktop and mobile devices
- **Real-time Updates**: WebSocket integration for live updates
- **Automated Backups**: Database backup and recovery system

### Deployment Features
- **Docker Support**: Containerized deployment with Docker Compose
- **CI/CD Pipeline**: GitHub Actions for automated testing and deployment
- **Environment Configuration**: Secure configuration management
- **Database Migrations**: Safe database schema updates

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Shadcn UI
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Passport.js with session management
- **AI Integration**: OpenAI API for intelligent insights
- **Real-time**: WebSockets for live updates
- **Deployment**: Docker, GitHub Actions

## Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- OpenAI API key (optional, for AI features)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd techfix-pro
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

4. **Set up the database**
```bash
npm run db:push
```

5. **Start the development server**
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

### Production Deployment

1. **Build the application**
```bash
npm run build
```

2. **Start the production server**
```bash
npm start
```

### Docker Deployment

1. **Using Docker Compose**
```bash
docker-compose up -d
```

## Configuration

### Environment Variables

- `DATABASE_URL`: PostgreSQL connection string
- `OPENAI_API_KEY`: OpenAI API key for AI features
- `SESSION_SECRET`: Secret for session encryption
- `NODE_ENV`: Environment (development/production)
- `PORT`: Server port (default: 5000)

### Database Backup

- **Create backup**: `npm run backup`
- **List backups**: `npm run backup:list`
- **Restore backup**: `npm run backup:restore <backup-file>`

## Key Features

### Ticket Management
- Create, update, and track repair tickets
- Priority-based workflow management
- Automated status updates
- Time tracking with labor cost calculation
- Attachment support for photos and documents

### Inventory Management
- Real-time stock tracking
- Barcode scanning with multiple camera support
- Supplier management and purchase orders
- Low stock alerts and reorder points
- Stock movement tracking

### AI Integration
- Intelligent ticket analysis
- Automated repair suggestions
- Priority optimization
- Performance insights and recommendations
- Pattern recognition for common issues

### Billing & Sales
- Integrated billing system with tax calculations
- Direct sales for parts and accessories
- Payment tracking and history
- Professional invoice generation
- Customer payment history

### Mobile Interface
- Responsive design optimized for mobile devices
- Touch-friendly controls
- Offline-capable barcode scanning
- Mobile-optimized forms and navigation

## API Documentation

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/user` - Get current user

### Tickets
- `GET /api/tickets` - List all tickets
- `POST /api/tickets` - Create new ticket
- `GET /api/tickets/:id` - Get ticket details
- `PUT /api/tickets/:id` - Update ticket
- `DELETE /api/tickets/:id` - Delete ticket

### Time Tracking
- `POST /api/time-tracking/start` - Start time tracking
- `POST /api/time-tracking/stop` - Stop time tracking
- `GET /api/time-tracking/active` - Get active time log
- `GET /api/time-tracking/stats` - Get time tracking statistics

### AI Insights
- `POST /api/ai/analyze-ticket` - Analyze ticket with AI
- `GET /api/ai/insights` - Get AI-generated insights

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For support and questions, please open an issue on the GitHub repository.