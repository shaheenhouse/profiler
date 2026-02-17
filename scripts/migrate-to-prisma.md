# 🔄 Migration Guide: Supabase Raw SQL → Prisma ORM

If you previously set up this app with the old `supabase-schema.sql` file, follow this guide to migrate to Prisma.

## Why Migrate?

- ✅ **Type-Safe Queries** - Full TypeScript support
- ✅ **Automatic Migrations** - Track schema changes in code
- ✅ **Better Developer Experience** - Prisma Studio, autocomplete, etc.
- ✅ **No More Manual SQL** - Everything managed through code

## Migration Steps

### Option 1: Fresh Start (Recommended if no important data yet)

1. **Reset the database** (drops all tables)
   ```bash
   npx prisma migrate reset --force
   ```

2. **Run migrations** (recreates tables with Prisma)
   ```bash
   npm run db:migrate
   ```

3. **Seed the database**
   ```bash
   npm run db:seed
   ```

### Option 2: Keep Existing Data (If you have important data)

Since Prisma generates the same table structure as the old SQL schema, you can:

1. **Just run Prisma migrate**
   ```bash
   npx prisma migrate dev --name prisma_migration --create-only
   ```

2. **Review the migration file**
   - Open `prisma/migrations/[timestamp]_prisma_migration/migration.sql`
   - Remove any `CREATE TABLE` statements for tables that already exist
   - Keep only the new/changed columns

3. **Apply the migration**
   ```bash
   npx prisma migrate deploy
   ```

4. **Generate Prisma Client**
   ```bash
   npm run db:generate
   ```

### Option 3: Use Introspection (Safest for existing data)

If you already have tables created from the old SQL schema:

1. **Introspect the database**
   ```bash
   npx prisma db pull
   ```

   This reads your existing database and updates `schema.prisma` to match.

2. **Review the schema**
   - Open `prisma/schema.prisma`
   - Compare with the original schema (check for any differences)

3. **Create the first migration**
   ```bash
   npx prisma migrate dev --name init
   ```

4. **Generate Prisma Client**
   ```bash
   npm run db:generate
   ```

## Verify Migration

1. **Open Prisma Studio**
   ```bash
   npm run db:studio
   ```

2. **Check your data** - Browse users, portfolios, designs

3. **Test sign-in** - Make sure authentication works

4. **Test the app**
   ```bash
   npm run dev
   ```

## Rollback (if something goes wrong)

If you need to go back to the old setup:

1. Restore the `supabase-schema.sql` file from git history
2. Run it in Supabase SQL Editor
3. Reinstall `@supabase/supabase-js`
4. Restore the old `src/lib/supabase.ts` and `src/lib/storage.ts`

## Changes Made in Migration

| Old Approach | New Approach |
|--------------|--------------|
| Manual SQL in `supabase-schema.sql` | Schema in `prisma/schema.prisma` |
| Supabase client (`supabase.user.insert()`) | Prisma client (`prisma.user.create()`) |
| No type safety | Full TypeScript types |
| Manual migrations | Automatic migration tracking |
| No GUI | Prisma Studio |

## Need Help?

If you run into issues:

1. Check if tables exist:
   ```bash
   npm run db:studio
   ```

2. Check Prisma status:
   ```bash
   npx prisma migrate status
   ```

3. Check database connection:
   ```bash
   npx prisma db execute --stdin
   ```

---

**After migration, you can delete:**
- `supabase-schema.sql` (replaced by `prisma/schema.prisma`)
- `src/lib/supabase.ts` (replaced by `src/lib/prisma.ts`)
- The old `SETUP.md` instructions (now in `PRISMA_SETUP.md`)
