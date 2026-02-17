# 🚀 Setup Instructions

This project now uses **Prisma ORM** for code-first database management!

## ⚡ Quick Setup (3 Steps)

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Run migrations** (creates database tables)
   ```bash
   npm run db:migrate
   ```

3. **Seed the database** (loads your existing data)
   ```bash
   npm run db:seed
   ```

4. **Start the app**
   ```bash
   npm run dev
   ```

That's it! Your app is now running with **Prisma + Supabase PostgreSQL**. ✅

## 📚 Full Documentation

For detailed setup instructions, see **[PRISMA_SETUP.md](./PRISMA_SETUP.md)**

## 🎨 What's New?

- ✅ **Code-First Database** - Schema defined in `prisma/schema.prisma`
- ✅ **Automatic Migrations** - No more manual SQL scripts
- ✅ **Type-Safe Queries** - Full TypeScript support
- ✅ **Prisma Studio** - Visual database browser (run `npm run db:studio`)
- ✅ **Easy Seeding** - Your existing `data/` files are automatically loaded

## 🐛 Troubleshooting

### Can't connect to database?

Make sure your `.env` file has both:
```env
DATABASE_URL="postgres://..."
DIRECT_URL="postgres://..."
```

### Sign-in not working?

1. Check if migrations ran: `npm run db:migrate`
2. Check if data seeded: `npm run db:seed`
3. Open Prisma Studio to verify: `npm run db:studio`

### Need to reset everything?

```bash
npx prisma migrate reset
npm run db:seed
```

⚠️ **Warning**: This deletes all data!

---

**For more help, see [PRISMA_SETUP.md](./PRISMA_SETUP.md)**
