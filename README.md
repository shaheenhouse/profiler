# Portfolio Builder

A beautiful, modern portfolio builder application built with Next.js 14, Tailwind CSS, and shadcn/ui. Create stunning portfolios and resumes with ease.

## Features

- **Beautiful UI**: Modern, responsive design with smooth animations using Framer Motion
- **Dark/Light Mode**: Seamless theme switching with next-themes
- **Google OAuth**: Secure authentication with NextAuth.js
- **File-based Storage**: No database required - all data stored in JSON files
- **Resume Builder**: Complete resume with education, experience, skills, projects, and certifications
- **Public Portfolio**: Shareable portfolio URL for each user
- **Particle Effects**: Interactive particle background using tsparticles

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Animations**: Framer Motion
- **Authentication**: NextAuth.js with Google OAuth
- **Data Storage**: File-based JSON storage
- **Particles**: tsparticles

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
cd portfolio-app
```

2. Install dependencies:
```bash
npm install
```

3. Copy the environment example file:
```bash
cp .env.example .env.local
```

4. Configure your environment variables in `.env.local`:
```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-super-secret-key

# Get these from Google Cloud Console
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### Setting up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Go to "APIs & Services" > "Credentials"
4. Click "Create Credentials" > "OAuth client ID"
5. Select "Web application"
6. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://yourdomain.com/api/auth/callback/google` (production)
7. Copy the Client ID and Client Secret to your `.env.local`

### Running the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Data Storage

All data is stored in the `/data` directory:
- `users.json` - User account information
- `portfolios/{userId}.json` - Individual portfolio data

### Production Deployment

For production deployment on platforms like Vercel:

**Important**: The default file-based storage is ephemeral on serverless platforms. For persistent storage, consider:

1. **Vercel Blob Storage** - Add Vercel Blob for persistent file storage
2. **External File Storage** - Use AWS S3, Cloudflare R2, or similar
3. **Database** - Upgrade to a database like PostgreSQL, MongoDB, or PlanetScale

To use Vercel Blob, modify the storage layer in `src/lib/storage.ts`.

## Project Structure

```
portfolio-app/
├── data/                    # Data storage directory
├── public/                  # Static assets
├── src/
│   ├── actions/             # Server actions
│   ├── app/                 # Next.js App Router pages
│   │   ├── api/             # API routes
│   │   ├── auth/            # Authentication pages
│   │   ├── dashboard/       # Dashboard pages
│   │   └── p/[slug]/        # Public portfolio pages
│   ├── components/          # React components
│   │   ├── dashboard/       # Dashboard components
│   │   ├── portfolio/       # Public portfolio components
│   │   ├── providers/       # Context providers
│   │   ├── resume/          # Resume components
│   │   └── ui/              # UI components (shadcn/ui)
│   ├── lib/                 # Utility functions
│   └── types/               # TypeScript types
├── .env.example             # Environment variables example
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

## Portfolio Sections

- **Personal Information**: Name, title, bio, contact details, social links
- **Education**: Degree, institution, field of study, dates, GPA
- **Experience**: Job title, company, responsibilities, technologies used
- **Skills**: Technical skills by category with proficiency levels
- **Professional Roles**: Your expertise areas
- **Projects**: Showcase your work with descriptions and links
- **Certifications**: Professional certifications and credentials

## Customization

### Theming

Modify the theme colors in `src/app/globals.css`:

```css
:root {
  --primary: 221.2 83.2% 53.3%;
  /* ... other variables */
}

.dark {
  --primary: 217.2 91.2% 59.8%;
  /* ... other variables */
}
```

### Adding New Sections

1. Define the type in `src/types/portfolio.ts`
2. Add server actions in `src/actions/portfolio.ts`
3. Create the dashboard component in `src/components/dashboard/`
4. Add the section to `src/components/portfolio/public-portfolio.tsx`
5. Update the resume modal in `src/components/resume/resume-modal.tsx`

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
