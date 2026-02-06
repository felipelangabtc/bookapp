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
- PostgreSQL 15+

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

   Edit `.env` with your configuration. At minimum, you need:
   - `DATABASE_URL`: PostgreSQL connection string
   - `NEXTAUTH_SECRET`: A random secret (generate with `openssl rand -base64 32`)
   - `NEXTAUTH_URL`: Your app URL (http://localhost:3000 for development)

4. **Set up the database**
   ```bash
   # Generate Prisma client
   pnpm db:generate

   # Push schema to database (development)
   pnpm db:push

   # Or run migrations (production)
   pnpm db:migrate

   # Seed with sample data
   pnpm db:seed
   ```

5. **Start the development server**
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
pnpm db:migrate       # Run migrations
pnpm db:seed          # Seed database
pnpm db:studio        # Open Prisma Studio

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
