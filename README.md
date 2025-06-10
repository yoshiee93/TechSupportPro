# TechFix Pro - IT Support System

A comprehensive IT support system for PC repair shops, enhancing device management, client tracking, and repair workflows through intelligent technology solutions.

## Architecture

The application follows a modular monolith architecture with the following structure:

```
server/
├── modules/
│   ├── auth/           # Authentication & authorization
│   ├── clients/        # Client management
│   ├── inventory/      # Stock & parts management
│   ├── ordering/       # Parts ordering
│   └── ticketing/      # Repair ticket management
├── shared/
│   ├── database/       # Database utilities & migrations
│   ├── middleware/     # Express middleware
│   └── utils/          # Shared utilities
└── storage.ts          # Data access layer
```

## Features

### Core Functionality
- **Ticket Management**: Create, track, and manage repair tickets
- **Client Management**: Customer information and device history
- **Device Tracking**: Detailed device specifications and repair history
- **Parts Management**: Inventory tracking and ordering
- **Time Logging**: Track technician time and billing
- **Repair Notes**: Detailed repair documentation

### Planned Features (Phase 2+)
- **AI Integration**: Intelligent ticket routing and troubleshooting assistance
- **Real-time Updates**: WebSocket-based live updates
- **Photo Attachments**: Device condition documentation
- **Mobile App**: React Native app for field technicians
- **Advanced Inventory**: ABC analysis, demand forecasting
- **Wholesaler Integration**: Live pricing from distributors

## Technology Stack

- **Frontend**: React with TypeScript, Tailwind CSS, Shadcn UI
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Passport.js + JWT tokens
- **Deployment**: GitHub Actions CI/CD

## Development

### Setup
```bash
npm install
npm run dev
```

### Database Management
```bash
# Generate migration
npm run db:generate

# Run migrations
npm run db:migrate

# Push schema changes (development only)
npm run db:push

# Create backup
npm run db:backup
```

### Deployment Pipeline

- **Development**: Local Replit environment
- **Staging**: Deployed Replit instance
- **Production**: Self-hosted server with automated deployment

## Database Schema

Key entities:
- `users` - System users (admins, technicians)
- `clients` - Customers
- `devices` - Customer devices
- `tickets` - Repair tickets
- `repair_notes` - Repair documentation
- `time_logs` - Time tracking
- `parts_orders` - Parts ordering
- `reminders` - Follow-up reminders

## API Endpoints

### Authentication
- `GET /api/auth/user` - Get current user
- `POST /api/login` - Login
- `POST /api/logout` - Logout

### Tickets
- `GET /api/tickets` - List tickets (with search)
- `GET /api/tickets/:id` - Get ticket details
- `POST /api/tickets` - Create ticket
- `PUT /api/tickets/:id` - Update ticket
- `DELETE /api/tickets/:id` - Delete ticket

### Clients
- `GET /api/clients` - List clients
- `POST /api/clients` - Create client
- `PUT /api/clients/:id` - Update client
- `DELETE /api/clients/:id` - Delete client

## Contributing

1. Follow the modular architecture
2. Use proper TypeScript types
3. Add error handling and logging
4. Test database migrations
5. Update documentation

## License

MIT License