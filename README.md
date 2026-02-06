# BookApp - Global Social Reading Platform

A production-ready SaaS web application combining Skoob.com.br's social reading features, Wattpad-style publishing, and AI-generated audiobooks.

## Features

### Core Features
- **Authentication & Profiles**: Email/password auth with verification, OAuth providers (Google, GitHub), user profiles with roles (User, Author, Admin)
- **Global Book Catalog**: Search millions of books via Google Books & Open Library APIs, manual book creation, categories/genres
- **Reading Shelves**: Track books as Want to Read, Reading, Read, or Abandoned with progress tracking and reading goals
- **Reviews & Ratings**: 0.5-5 star ratings, markdown reviews with spoiler protection, likes, comments, and moderation
- **Writer Mode**: Create and publish short stories or books with chapters, author dashboard with analytics
- **AI Audiobooks**: Generate audiobooks from chapters using TTS (OpenAI, ElevenLabs, or mock provider)
- **Subscriptions**: Stripe-powered Free/Pro plans with usage limits

### Technical Features
- **Internationalization**: Full i18n support (English + Brazilian Portuguese)
- **Security**: Rate limiting, input validation, CSRF protection, secure headers
- **Observability**: Structured logging, request IDs, error boundaries

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, TailwindCSS, shadcn/ui
- **State Management**: TanStack Query (React Query)
- **Backend**: Next.js Route Handlers, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: NextAuth.js
- **Payments**: Stripe
- **Testing**: Vitest, Testing Library
- **CI/CD**: GitHub Actions

## Project Structure

```
bookapp/
├── apps/
│   └── web/                  # Next.js application
│       ├── src/
│       │   ├── app/          # App Router pages & API routes
│       │   ├── components/   # React components
│       │   ├── hooks/        # Custom React hooks
│       │   ├── lib/          # Utilities, validations, services
│       │   ├── messages/     # i18n translation files
│       │   └── test/         # Test setup
│       └── ...
├── packages/
│   ├── config/               # Shared ESLint & TypeScript configs
│   ├── db/                   # Prisma schema & client
│   └── ui/                   # Shared UI components
└── ...
```

## Getting Started

### Prerequisites

- Node.js 18.17+
- pnpm 8+
- Docker & Docker Compose (for local Postgres)

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd bookapp
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```

   The defaults in `.env.example` point to the Docker Postgres instance.
   At minimum, you need:
   - `DATABASE_URL`: PostgreSQL connection string (default works with Docker)
   - `NEXTAUTH_SECRET`: A random secret (generate with `openssl rand -base64 32`)
   - `NEXTAUTH_URL`: Your app URL (http://localhost:3000 for development)

4. **Start Docker Postgres**
   ```bash
   pnpm docker:up
   ```

5. **Set up the database**
   ```bash
   pnpm db:generate
   pnpm db:migrate
   pnpm db:seed
   ```

6. **Start the development server**
   ```bash
   pnpm dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

### Test Accounts (after seeding)

| Email | Password | Role |
|-------|----------|------|
| admin@bookapp.com | Password123! | Admin |
| author@bookapp.com | Password123! | Author |
| user@bookapp.com | Password123! | User |
| leitor@bookapp.com | Password123! | User |

## Available Scripts

```bash
# Development
pnpm dev              # Start development server
pnpm build            # Build for production
pnpm start            # Start production server

# Code Quality
pnpm lint             # Run ESLint
pnpm typecheck        # Run TypeScript check
pnpm format           # Format code with Prettier

# Testing
pnpm test             # Run tests
pnpm test:watch       # Run tests in watch mode

# Database
pnpm db:generate      # Generate Prisma client
pnpm db:push          # Push schema to database
pnpm db:migrate       # Run migrations (dev)
pnpm db:deploy        # Apply migrations (prod/CI)
pnpm db:seed          # Seed database
pnpm db:reset         # Reset DB + re-run migrate + seed
pnpm db:studio        # Open Prisma Studio

# Docker
pnpm docker:up        # Start Postgres container
pnpm docker:down      # Stop Postgres container
pnpm docker:reset     # Stop and remove Postgres data volume

# Utilities
pnpm clean            # Clean build artifacts
```

## Environment Variables

See [.env.example](.env.example) for all available environment variables.

### Required Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Secret for NextAuth.js session encryption |
| `NEXTAUTH_URL` | Application URL |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `GOOGLE_BOOKS_API_KEY` | Google Books API key for search | None |
| `STRIPE_SECRET_KEY` | Stripe secret key for payments | None |
| `TTS_PROVIDER` | TTS provider (mock/openai/elevenlabs) | mock |
| `TRANSLATION_PROVIDER` | Translation provider (mock/openai/deepl) | mock |
| `STORAGE_PROVIDER` | Storage provider (local/s3) | local |

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Database Providers

- [Neon](https://neon.tech) (recommended for Vercel)
- [Supabase](https://supabase.com)
- [Railway](https://railway.app)
- [PlanetScale](https://planetscale.com) (requires adapter)

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Configure a production PostgreSQL database
- [ ] Set strong `NEXTAUTH_SECRET`
- [ ] Configure Stripe for production
- [ ] Set up email provider (SMTP/Resend)
- [ ] Enable rate limiting with Redis/Upstash
- [ ] Configure S3-compatible storage

## MVP Demo Script

1. **Home Page**
   - Visit `/` to see the landing page
   - Browse features and navigation

2. **Authentication**
   - Register at `/auth/register`
   - Verify email (check console in dev mode)
   - Login at `/auth/login`

3. **Book Catalog**
   - Browse books at `/books`
   - Use search and filters
   - View book details

4. **Reading Tracking**
   - Add books to shelves
   - Track reading progress
   - View your library at `/library`

5. **Reviews**
   - Write a review on a book page
   - Rate with half-star precision
   - Toggle spoiler protection

6. **Writer Mode** (Author/Admin only)
   - Create a work at `/dashboard/author`
   - Add chapters
   - Publish your story

7. **AI Audiobooks** (Pro feature)
   - Generate audio for a chapter
   - Listen to generated audiobook

8. **Subscription**
   - View plans at `/settings/billing`
   - Upgrade to Pro (Stripe test mode)

9. **Admin** (Admin only)
   - View moderation queue at `/admin`
   - Handle reported content

---

## Database & Infrastructure

### Database Setup

#### Docker Postgres (Local Development)

The project includes a `docker-compose.yml` that runs **PostgreSQL 16** locally:

```bash
pnpm docker:up        # Start the container
pnpm docker:down      # Stop the container
pnpm docker:reset     # Stop and delete all data
```

Credentials: `postgres` / `postgres` — Database: `litapp` — Port: `5432`

Cross-platform shell scripts are also available in [`scripts/`](scripts/):

| Bash | PowerShell |
|------|------------|
| `scripts/docker-up.sh` | `scripts/docker-up.ps1` |
| `scripts/docker-down.sh` | `scripts/docker-down.ps1` |
| `scripts/docker-reset.sh` | `scripts/docker-reset.ps1` |

#### Neon (Staging / Production)

For staging or production, use [Neon](https://neon.tech) (or any hosted Postgres). Set `DATABASE_URL` in your environment:

```
DATABASE_URL="postgresql://user:pass@ep-cool-name-123456.us-east-2.aws.neon.tech/litapp?sslmode=require"
```

The application reads `DATABASE_URL` from the environment and does **not** hardcode `localhost` anywhere.

### Resetting the Database

```bash
# Full reset: drops all tables, re-runs migrations, re-seeds
pnpm db:reset

# Or manually:
pnpm docker:reset       # Wipe Docker volume
pnpm docker:up          # Fresh Postgres
pnpm db:migrate         # Apply migrations
pnpm db:seed            # Seed sample data
```

### Migrations & Seed

| Command | Description |
|---------|-------------|
| `pnpm db:migrate` | Create & apply migrations during **development** (interactive) |
| `pnpm db:deploy` | Apply existing migrations in **CI / production** (non-interactive) |
| `pnpm db:seed` | Populate the database with sample data (idempotent — safe to re-run) |
| `pnpm db:studio` | Open Prisma Studio to browse data in the browser |

The seed creates 4 users, 10 books, 2 works with chapters, reviews, shelf entries, follows, and a queued audio job.

### CI Database Strategy

GitHub Actions (`.github/workflows/ci.yml`) spins up a **Postgres 16 service container** for the `test` and `prisma-migrate-check` jobs. The workflow:

1. Starts Postgres with health checks
2. Sets `DATABASE_URL` pointing to the service
3. Runs `pnpm db:deploy` (non-interactive migrate)
4. Executes tests / migration diff checks

No external database or Docker-in-Docker is needed — GitHub Actions manages the service container lifecycle.

### Common Issues

#### Port 5432 conflict

If another Postgres instance is already running on port 5432:

```bash
# Check what is using the port
# Windows:
netstat -ano | findstr :5432
# macOS/Linux:
lsof -i :5432

# Stop the conflicting service, or change the port in docker-compose.yml
```

#### Prisma client not generated

If you see `Cannot find module '@prisma/client'`:

```bash
pnpm db:generate
```

This is also run automatically by Turbo before `build`, `dev`, and `typecheck`.

#### Windows PowerShell execution policy

If PowerShell blocks the `.ps1` scripts with a security error:

```powershell
# Allow scripts for the current user (run once)
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned

# Or bypass for a single script
powershell -ExecutionPolicy Bypass -File scripts/docker-up.ps1
```

---

### Infra Demo Checklist

Quick sanity check after cloning:

- [ ] `pnpm install`
- [ ] `pnpm docker:up` — Postgres container running
- [ ] `pnpm db:migrate` — Migrations applied
- [ ] `pnpm db:seed` — Sample data inserted
- [ ] `pnpm dev` — App running at http://localhost:3000
- [ ] `pnpm db:studio` — Prisma Studio opens in browser

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Acknowledgments

- [Skoob](https://skoob.com.br) - Inspiration for social reading features
- [Wattpad](https://wattpad.com) - Inspiration for publishing features
- [shadcn/ui](https://ui.shadcn.com) - UI component library
- [Vercel](https://vercel.com) - Hosting platform
