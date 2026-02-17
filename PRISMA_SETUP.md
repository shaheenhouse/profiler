# 🚀 Prisma Setup Guide - Code-First Database Management

This application now uses **Prisma ORM** for type-safe, code-first database management. No more manual SQL scripts!

## ✅ What You Get with Prisma

- 🔹 **Type-Safe Database Queries** - Full TypeScript support
- 🔹 **Automatic Migrations** - Schema changes tracked in code
- 🔹 **Visual Database Browser** - Prisma Studio GUI
- 🔹 **Code-First Approach** - Define models in `schema.prisma`
- 🔹 **Automatic Seeding** - Your existing data is preserved

## 📋 Prerequisites

1. **Supabase Project** - You already have this configured
2. **Database Connection Strings** - Already in `.env`

## 🔧 Setup Steps

### 1️⃣ Generate Prisma Client

```bash
npm run db:generate
```

This creates the TypeScript types from your schema.

### 2️⃣ Run Migrations (Create Tables)

```bash
npm run db:migrate
```

This will:
- Create the `users`, `portfolios`, and `designs` tables in your Supabase database
- Create a migration file in `prisma/migrations/`
- Generate the Prisma Client with updated types

### 3️⃣ Seed the Database

```bash
npm run db:seed
```

This will load your existing data from `data/users.json` and `data/portfolios/*.json` into the database.

### 4️⃣ Start Your App

```bash
npm run dev
```

Now your app uses **Prisma + Supabase PostgreSQL** for all database operations!

## 📂 Database Commands

Here are all the database commands available:

```bash
# Generate Prisma Client (after schema changes)
npm run db:generate

# Create and apply migrations
npm run db:migrate

# Seed the database
npm run db:seed

# Open Prisma Studio (visual database browser)
npm run db:studio

# Push schema changes without creating migration files (dev only)
npm run db:push
```

## 🎨 Prisma Studio - Visual Database Browser

Want to see your database in a beautiful GUI?

```bash
npm run db:studio
```

This opens `http://localhost:5555` where you can:
- Browse all your data
- Edit records directly
- Run queries visually
- No SQL knowledge required!

## 📝 Making Schema Changes

To modify your database structure:

1. **Edit the Schema** - Open `prisma/schema.prisma`
2. **Example: Add a new field**
   ```prisma
   model User {
     // ... existing fields
     bio String? // Add this line
   }
   ```
3. **Create Migration**
   ```bash
   npm run db:migrate
   ```
4. **Name Your Migration** - When prompted, give it a descriptive name like `add_user_bio`
5. **Done!** - Tables updated, types regenerated, app ready to use the new field

## 🗄️ Schema Overview

### User Table
```prisma
model User {
  id          String   @id @default(uuid())
  username    String   @unique
  email       String   @unique
  password    String
  firstName   String
  lastName    String
  dateOfBirth DateTime?
  phone       String?
  // ... and more
  
  portfolio Portfolio?
  designs   Design[]
}
```

### Portfolio Table
```prisma
model Portfolio {
  id             String   @id @default(uuid())
  userId         String   @unique
  slug           String   @unique
  isPublic       Boolean  @default(false)
  theme          String   @default("dark")
  personalInfo   Json     @default("{}")
  education      Json     @default("[]")
  experience     Json     @default("[]")
  // ... stores all portfolio data as JSON
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

### Design Table
```prisma
model Design {
  id         String   @id @default(uuid())
  userId     String
  name       String   @default("Untitled Design")
  width      Int      @default(1080)
  height     Int      @default(1080)
  canvasJson String   @db.Text // Fabric.js canvas JSON
  thumbnail  String   @default("")
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

## 🔐 Environment Variables

Make sure you have these in your `.env`:

```env
# Prisma Database URLs
DATABASE_URL="postgres://..." # Transaction pooler (6543)
DIRECT_URL="postgres://..."   # Direct connection (5432)
```

These are already configured from your Supabase setup!

## 🐛 Troubleshooting

### ❌ "Environment variable not found: DATABASE_URL"

**Fix**: Make sure `.env` file exists with both `DATABASE_URL` and `DIRECT_URL`

### ❌ "Table already exists"

**Fix**: Your database already has tables. Run this to reset:
```bash
npx prisma migrate reset
```

⚠️ **Warning**: This will delete all data! Use the seed command to restore it.

### ❌ Seed fails with "No data files found"

**Fix**: Make sure `data/users.json` and `data/portfolios/*.json` exist in your project.

### ❌ Types not updating after schema changes

**Fix**: Regenerate Prisma Client:
```bash
npm run db:generate
```

## 🚀 Deploying to Production

When deploying (e.g., to Vercel):

1. **Add Environment Variables** - Add `DATABASE_URL` and `DIRECT_URL` to your hosting platform
2. **Prisma Generates Automatically** - The build process runs `prisma generate`
3. **Run Migrations** - You can run migrations via:
   ```bash
   npx prisma migrate deploy
   ```

## 📚 Learn More

- [Prisma Documentation](https://www.prisma.io/docs)
- [Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [Prisma Client API](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)

## ✨ Benefits Over Raw SQL

| Feature | Raw SQL | Prisma |
|---------|---------|--------|
| Type Safety | ❌ None | ✅ Full TypeScript support |
| Schema Changes | 📝 Write SQL manually | 🔄 Automatic migrations |
| Queries | 🔤 String templates | 🎯 Type-safe methods |
| Relations | 👷 Manual joins | 🔗 Automatic includes |
| Seeding | 📜 SQL scripts | 💻 TypeScript functions |
| Visual GUI | ❌ None | ✅ Prisma Studio |

---

**You're all set!** 🎉 Your app now has enterprise-grade, type-safe database management with Prisma.
