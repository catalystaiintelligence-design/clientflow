# ClientFlow

Template-driven client onboarding automation SaaS. $29-79/month.

## Features

- **Template Builder** - Visual form creator with drag-and-drop field ordering
- **Client Portal** - Unique token-based links for each client
- **Auto-Tasks** - Tasks auto-created when a client submits their portal
- **Team Collaboration** - Assign tasks, track progress
- **Dashboard** - Analytics with status breakdown charts

## Tech Stack

- **Frontend**: React 18 + Vite + TailwindCSS
- **Backend**: Node.js + Express + PostgreSQL + Prisma
- **Auth**: JWT (access 15min + refresh 7day)
- **File Storage**: Local disk (R2 stub included)
- **Email**: Console log fallback (Resend stub included)

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database

### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your DATABASE_URL and secrets
```

Edit `backend/.env`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/clientflow"
JWT_ACCESS_SECRET="your-secret-here"
JWT_REFRESH_SECRET="your-refresh-secret-here"
PORT=3000
CLIENT_URL="http://localhost:5173"
```

Run database migrations and seed:
```bash
npm run db:migrate    # Run Prisma migrations
npm run db:seed       # Seed with demo data
npm run dev           # Start dev server on port 3000
```

### 2. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
# Edit .env if backend is not on localhost:3000
npm run dev           # Start on port 5173
```

### 3. Login

After seeding, use these demo accounts:
- `alice@example.com` / `password123`
- `bob@example.com` / `password123`

## API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Create account |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/refresh` | Refresh access token |

### Templates
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/templates` | List templates |
| POST | `/api/templates` | Create template |
| GET | `/api/templates/:id` | Get template |
| PUT | `/api/templates/:id` | Update template |
| DELETE | `/api/templates/:id` | Delete template |

### Clients
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/clients` | List clients |
| POST | `/api/clients` | Create client |
| GET | `/api/clients/:id` | Get client with tasks/submissions |
| PUT | `/api/clients/:id` | Update client |
| DELETE | `/api/clients/:id` | Delete client |
| POST | `/api/clients/:id/resend-invite` | Resend portal invite email |

### Portal (Public)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/portal/:token` | Get portal form |
| POST | `/api/portal/:token` | Submit portal form |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks` | List tasks |
| POST | `/api/tasks` | Create task |
| GET | `/api/tasks/:id` | Get task |
| PUT | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task |

## Database Schema

See `backend/prisma/schema.prisma` for the full Prisma schema.

Key models:
- **User** - Account holders
- **Template** - Reusable form schemas with field definitions and task templates
- **Client** - Clients being onboarded, each with a unique portal token
- **Submission** - Form data submitted through the client portal
- **Task** - Action items auto-created or manually added per client

## Environment Variables

### Backend (`backend/.env`)
| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_ACCESS_SECRET` | Yes | Secret for access tokens (15min) |
| `JWT_REFRESH_SECRET` | Yes | Secret for refresh tokens (7d) |
| `PORT` | No | Server port (default: 3000) |
| `CLIENT_URL` | No | Frontend URL for CORS (default: http://localhost:5173) |
| `R2_ACCOUNT_ID` | No | Cloudflare R2 account ID |
| `R2_ACCESS_KEY_ID` | No | Cloudflare R2 access key |
| `R2_SECRET_ACCESS_KEY` | No | Cloudflare R2 secret key |
| `R2_BUCKET_NAME` | No | R2 bucket name |
| `RESEND_API_KEY` | No | Resend API key for emails |
| `FROM_EMAIL` | No | Sender email (default: onboarding@clientflow.app) |

### Frontend (`frontend/.env`)
| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | No | Backend URL (uses Vite proxy if not set) |

## Available Scripts

### Backend
```bash
npm run dev          # Start with nodemon (hot reload)
npm run start        # Production start
npm run db:migrate   # Run Prisma migrations
npm run db:seed      # Seed database with demo data
npm run db:studio    # Open Prisma Studio
npm run db:generate  # Regenerate Prisma client
```

### Frontend
```bash
npm run dev          # Start Vite dev server
npm run build        # Build for production
npm run preview      # Preview production build
```

## Deployment

### Backend (Railway)
1. Create a new Railway project
2. Add a PostgreSQL plugin
3. Set environment variables
4. Deploy via GitHub or CLI

### Frontend (Vercel)
1. Connect your GitHub repo
2. Set `VITE_API_URL` to your Railway backend URL
3. Deploy

## File Uploads

By default, files are stored in `backend/uploads/` on local disk. For production, configure Cloudflare R2 by setting the R2 environment variables. The `uploadToStorage` function in `backend/utils/upload.js` handles the routing.

## Email

When `RESEND_API_KEY` is not set, emails are logged to the console. Set the key to enable real email delivery. Two emails are sent:
1. Portal invite when a client is created
2. Submission notification to the account owner when a client submits
