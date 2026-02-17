# 🎨 Portfolio & Resume Builder with Design Studio

A modern, full-featured portfolio builder with an integrated design studio, AI-powered features, and professional resume templates.

## ✨ Features

- 🎨 **Design Studio** - Fabric.js-based canvas editor with AI design generation
- 📄 **Resume Builder** - Multiple templates with PDF export
- 🤖 **AI Integration** - OpenAI-powered design generation and resume data extraction
- 🔐 **Authentication** - NextAuth.js with credentials provider
- 💾 **Database** - Prisma ORM with Supabase PostgreSQL
- 📦 **File Storage** - Vercel Blob for images and design thumbnails
- 🚀 **SEO Optimized** - Dynamic metadata, sitemap, robots.txt, Open Graph
- 🎯 **Public Portfolios** - Shareable portfolio pages with custom slugs

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5
- **UI Library**: React 19
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **Database**: Prisma + Supabase PostgreSQL
- **Storage**: Vercel Blob
- **Auth**: NextAuth.js
- **Canvas**: Fabric.js 7
- **AI**: OpenAI (GPT-4o, GPT-4o-mini)
- **Animations**: Framer Motion

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier works!)
- An OpenAI API key (optional - for AI features)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd profilerv2
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Copy `.env.example` to `.env.local` and fill in your values:
   ```env
   # NextAuth
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-secret-key
   
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   
   # Prisma (also add to .env)
   DATABASE_URL=your-database-url
   DIRECT_URL=your-direct-url
   
   # Vercel Blob
   BLOB_READ_WRITE_TOKEN=your-blob-token
   
   # OpenAI (optional)
   OPENAI_API_KEY=your-openai-key
   ```

4. **Set up the database**
   ```bash
   # Generate Prisma Client
   npm run db:generate
   
   # Run migrations (creates tables)
   npm run db:migrate
   
   # Seed with initial data
   npm run db:seed
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📚 Documentation

- **[Prisma Setup Guide](./PRISMA_SETUP.md)** - Complete guide to the database setup
- **[AI Integration](./docs/AI.md)** - How to use AI features (coming soon)
- **[Design Studio](./docs/DESIGN_STUDIO.md)** - Canvas editor guide (coming soon)

## 🗄️ Database Commands

```bash
# Generate Prisma Client (after schema changes)
npm run db:generate

# Create and apply migrations
npm run db:migrate

# Seed the database
npm run db:seed

# Open Prisma Studio (visual database browser)
npm run db:studio

# Push schema changes (dev only, no migration files)
npm run db:push
```

## 🏗️ Project Structure

```
profilerv2/
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── api/            # API routes
│   │   ├── auth/           # Auth pages (signin, register)
│   │   ├── dashboard/      # User dashboard
│   │   ├── design/         # Design studio
│   │   └── p/              # Public portfolio pages
│   ├── components/         # React components
│   │   ├── dashboard/      # Dashboard components
│   │   ├── design/         # Design studio components
│   │   ├── portfolio/      # Portfolio components
│   │   └── ui/             # shadcn/ui components
│   ├── lib/                # Utility libraries
│   │   ├── prisma.ts       # Prisma client singleton
│   │   ├── storage.ts      # User & portfolio storage
│   │   ├── design-storage.ts # Design storage
│   │   ├── openai.ts       # AI integration
│   │   └── blob-storage.ts # Vercel Blob utilities
│   └── types/              # TypeScript type definitions
├── prisma/
│   ├── schema.prisma       # Database schema
│   ├── seed.ts             # Seed script
│   └── migrations/         # Migration history
├── data/                   # Local data files (for seeding)
│   ├── users.json
│   └── portfolios/
└── public/                 # Static assets
```

## 🎨 Design Studio Features

- ✅ Multiple canvas sizes (preset + custom)
- ✅ Add text with custom fonts and styling
- ✅ Add shapes (rectangle, circle, triangle, etc.)
- ✅ Add images from upload or URL
- ✅ Add SVG icons
- ✅ Layers panel with reordering
- ✅ Alignment tools
- ✅ Color picker
- ✅ Export as PNG/JPG/PDF
- ✅ Save designs to database
- ✅ **AI Design Generation** - Generate designs from text prompts
- ✅ **AI Reference Image** - Upload an image and AI recreates it as editable canvas objects

## 🤖 AI Features

### Design Studio AI

1. **Text-to-Design**: Enter a prompt like "Instagram post for a coffee shop" and AI generates a complete design
2. **Image-to-Design**: Upload a reference image and AI recreates it with editable Fabric.js objects

### Resume AI Extraction

Upload a resume (PDF, image, or paste text) and AI automatically extracts and populates:
- Personal information
- Work experience
- Education
- Skills
- Projects
- And more!

## 🔒 Authentication

The app uses NextAuth.js with a credentials provider. Users can:
- Register with email/username and password
- Sign in with email/username
- Passwords are hashed with PBKDF2
- Session management with JWT

## 📄 Resume Templates

Three professional templates included:
1. **Modern** - Clean, minimalist design
2. **Professional** - Traditional corporate style
3. **Creative** - Bold, colorful layout

Export to PDF with a single click!

## 🌐 Public Portfolios

Users can:
- Create a custom slug (e.g., `/p/johndoe`)
- Toggle portfolio visibility (public/private)
- Share their portfolio URL
- Display all their work experience, education, skills, projects, etc.

## 🚢 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy!

Vercel automatically:
- Runs `prisma generate` during build
- Handles serverless functions
- Provides Blob storage

### Running Migrations in Production

```bash
npx prisma migrate deploy
```

Or set up automatic migrations in your CI/CD pipeline.

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines first.

## 📝 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/)
- [Prisma](https://www.prisma.io/)
- [Supabase](https://supabase.com/)
- [Fabric.js](http://fabricjs.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [OpenAI](https://openai.com/)

---

**Built with ❤️ by Almas Khan**
