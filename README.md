# Incident Response Dashboard

A monorepo application for managing and responding to incidents across multiple cloud platforms and services. Features real-time incident ingestion, status tracking, remediation workflows, and audit logging.

## Latest Updates — August 2026

✅ **Build Fixes Complete**
- TypeScript compilation resolved (Prisma type issues fixed)
- Database migrations created and tested
- Full monorepo build successful (frontend + backend)
- Error handling for OAuth credentials added

📊 **Upcoming Features**
- Cloud Logging connector (Week 2)
- Cloud Monitoring connector (Week 3)
- Cloud Run connector (Week 4)
- Cloud Functions connector (Week 5)
- Data Fusion connector (Week 6)
- BigQuery connector (Week 7)
- Tableau connector (Week 8)

📚 **Documentation**
- [Project Status Overview](../sql-optimizer-bq/docs/00-PROJECT-STATUS.md) — Current state & roadmap
- [Implementation Guide](../sql-optimizer-bq/docs/OPTION_D_PROJECT_IMPLEMENTATION_GUIDES.md) — Week-by-week plans
- [Comprehensive Assessment](../sql-optimizer-bq/docs/COMPREHENSIVE_PROJECT_ASSESSMENT.md) — All findings

## Project Structure

```
incident-response-dashboard/
├── apps/
│   ├── server/          # Express.js backend with Prisma
│   ├── web/             # Next.js frontend
│   └── shared/          # Shared types and utilities
├── packages/
│   ├── config/          # Shared configuration
│   └── tsconfig/        # TypeScript configuration
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── migrations/      # Database migrations
└── package.json
```

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL (or adjust `DATABASE_URL` in `.env.local`)
- Google Cloud credentials (for connectors)

### Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```

3. Run database migrations:
   ```bash
   npm run migrate
   ```

4. Start development servers:
   ```bash
   npm run dev
   ```

   This starts:
   - Next.js frontend on `http://localhost:3000`
   - Express backend on `http://localhost:4000`

## Building for Production

```bash
npm run build
```

All TypeScript compilation issues have been resolved. The build should complete without errors.

## Testing

Run tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

## Architecture

### Database

PostgreSQL with Prisma ORM. Key tables:
- `Incident` — Core incident records
- `IncidentStatus` — Status history and transitions
- `AuditLog` — All changes and actions
- `Connector` — Integration configurations

### Services

- **Incident Ingestion** — Receives events from multiple sources
- **Status Management** — Tracks incident lifecycle
- **Remediation Engine** — Executes remediation steps
- **Audit Service** — Logs all changes

### API

RESTful API at `/api/v1/`:
- `GET /incidents` — List incidents
- `GET /incidents/:id` — Get incident details
- `PATCH /incidents/:id/status` — Update status
- `POST /incidents/:id/acknowledge` — Acknowledge incident
- `POST /incidents/:id/approve-remediation` — Approve remediation step

## Deployment

The application is designed for deployment to:
- Google Cloud Run (recommended)
- Kubernetes
- Traditional VMs

See the Implementation Guide for detailed deployment instructions.

---

**Status**: Ready for development  
**Next Step**: Begin Week 2 connector implementation  
**Build Status**: ✅ All Green
