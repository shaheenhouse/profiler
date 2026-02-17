/**
 * Migration Script: Local File System → Vercel Blob
 * 
 * This script migrates all existing data from local file system to Vercel Blob storage.
 * 
 * Usage:
 *   1. Set BLOB_READ_WRITE_TOKEN environment variable
 *   2. Run: npx tsx scripts/migrate-to-blob.ts
 */

import { put, list } from '@vercel/blob';
import { promises as fs } from 'fs';
import path from 'path';

const BLOB_PREFIX = 'profiler-data';
const DATA_DIR = path.join(process.cwd(), 'data');
const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads', 'profiles');

async function uploadToBlob(blobPath: string, content: string | Buffer, contentType: string) {
  try {
    const blob = await put(blobPath, content, {
      access: 'public',
      contentType,
      addRandomSuffix: false,
      allowOverwrite: true, // Allow re-running migration
    });
    console.log(`  ✓ Uploaded: ${blobPath}`);
    return blob.url;
  } catch (error) {
    console.error(`  ✗ Failed to upload ${blobPath}:`, error);
    return null;
  }
}

async function migrateUsers() {
  console.log('\n📦 Migrating users...');
  
  const usersFile = path.join(DATA_DIR, 'users.json');
  try {
    const data = await fs.readFile(usersFile, 'utf-8');
    const users = JSON.parse(data);
    console.log(`  Found ${users.length} user(s)`);
    
    await uploadToBlob(`${BLOB_PREFIX}/users.json`, data, 'application/json');
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      console.log('  No users.json found, skipping...');
    } else {
      throw error;
    }
  }
}

async function migratePortfolios() {
  console.log('\n📦 Migrating portfolios...');
  
  const portfoliosDir = path.join(DATA_DIR, 'portfolios');
  try {
    const files = await fs.readdir(portfoliosDir);
    const jsonFiles = files.filter(f => f.endsWith('.json'));
    console.log(`  Found ${jsonFiles.length} portfolio(s)`);
    
    for (const file of jsonFiles) {
      const filePath = path.join(portfoliosDir, file);
      const data = await fs.readFile(filePath, 'utf-8');
      const blobPath = `${BLOB_PREFIX}/portfolios/${file}`;
      await uploadToBlob(blobPath, data, 'application/json');
    }
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      console.log('  No portfolios directory found, skipping...');
    } else {
      throw error;
    }
  }
}

async function migrateDesigns() {
  console.log('\n📦 Migrating designs...');
  
  const designsDir = path.join(DATA_DIR, 'designs');
  try {
    const files = await fs.readdir(designsDir);
    const jsonFiles = files.filter(f => f.endsWith('.json'));
    console.log(`  Found ${jsonFiles.length} design(s)`);
    
    for (const file of jsonFiles) {
      const filePath = path.join(designsDir, file);
      const data = await fs.readFile(filePath, 'utf-8');
      const blobPath = `${BLOB_PREFIX}/designs/${file}`;
      await uploadToBlob(blobPath, data, 'application/json');
    }
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      console.log('  No designs directory found, skipping...');
    } else {
      throw error;
    }
  }
}

async function migrateProfileImages() {
  console.log('\n📦 Migrating profile images...');
  
  try {
    const files = await fs.readdir(UPLOADS_DIR);
    const imageFiles = files.filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f));
    console.log(`  Found ${imageFiles.length} image(s)`);
    
    const imageUrls: Record<string, string> = {};
    
    for (const file of imageFiles) {
      const filePath = path.join(UPLOADS_DIR, file);
      const buffer = await fs.readFile(filePath);
      const ext = path.extname(file).toLowerCase();
      
      const contentTypes: Record<string, string> = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
      };
      
      const blobPath = `${BLOB_PREFIX}/uploads/profiles/${file}`;
      const url = await uploadToBlob(blobPath, buffer, contentTypes[ext] || 'application/octet-stream');
      
      if (url) {
        // Map old local path to new blob URL
        imageUrls[`/uploads/profiles/${file}`] = url;
      }
    }
    
    return imageUrls;
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      console.log('  No uploads directory found, skipping...');
    } else {
      throw error;
    }
  }
  
  return {};
}

async function updatePortfolioImageUrls(imageUrls: Record<string, string>) {
  if (Object.keys(imageUrls).length === 0) {
    console.log('\n⏭️  No image URLs to update in portfolios');
    return;
  }
  
  console.log('\n🔄 Updating portfolio image URLs...');
  
  // List existing portfolio blobs
  const { blobs } = await list({ prefix: `${BLOB_PREFIX}/portfolios/` });
  
  for (const blob of blobs) {
    try {
      const response = await fetch(blob.url);
      const portfolio = await response.json();
      
      let updated = false;
      
      // Update profile image URL if it exists
      if (portfolio.personalInfo?.profileImage && imageUrls[portfolio.personalInfo.profileImage]) {
        portfolio.personalInfo.profileImage = imageUrls[portfolio.personalInfo.profileImage];
        updated = true;
        console.log(`  Updated profileImage in ${blob.pathname}`);
      }
      
      if (updated) {
        await put(blob.pathname, JSON.stringify(portfolio, null, 2), {
          access: 'public',
          contentType: 'application/json',
          addRandomSuffix: false,
          allowOverwrite: true,
        });
      }
    } catch (error) {
      console.error(`  Failed to update ${blob.pathname}:`, error);
    }
  }
}

async function verifyMigration() {
  console.log('\n✅ Verifying migration...');
  
  const { blobs } = await list({ prefix: BLOB_PREFIX });
  
  console.log(`\n  Total blobs uploaded: ${blobs.length}`);
  
  const categories = {
    users: blobs.filter(b => b.pathname.includes('/users.json')).length,
    portfolios: blobs.filter(b => b.pathname.includes('/portfolios/')).length,
    designs: blobs.filter(b => b.pathname.includes('/designs/')).length,
    uploads: blobs.filter(b => b.pathname.includes('/uploads/')).length,
  };
  
  console.log(`  - Users: ${categories.users}`);
  console.log(`  - Portfolios: ${categories.portfolios}`);
  console.log(`  - Designs: ${categories.designs}`);
  console.log(`  - Profile Images: ${categories.uploads}`);
}

async function main() {
  console.log('🚀 Starting migration to Vercel Blob Storage\n');
  console.log('=' .repeat(50));
  
  // Check for token
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error('\n❌ Error: BLOB_READ_WRITE_TOKEN environment variable is not set!');
    console.error('\nTo get your token:');
    console.error('1. Go to Vercel Dashboard → Storage → Create → Blob');
    console.error('2. Copy the BLOB_READ_WRITE_TOKEN');
    console.error('3. Run: set BLOB_READ_WRITE_TOKEN=your_token_here');
    console.error('   Then run this script again.\n');
    process.exit(1);
  }
  
  try {
    // Migrate data
    await migrateUsers();
    await migratePortfolios();
    await migrateDesigns();
    const imageUrls = await migrateProfileImages();
    
    // Update image URLs in portfolios if any images were migrated
    if (imageUrls && Object.keys(imageUrls).length > 0) {
      await updatePortfolioImageUrls(imageUrls);
    }
    
    // Verify
    await verifyMigration();
    
    console.log('\n' + '=' .repeat(50));
    console.log('✨ Migration completed successfully!\n');
    console.log('Your data is now stored in Vercel Blob and will persist');
    console.log('across deployments. Make sure BLOB_READ_WRITE_TOKEN is');
    console.log('set in your Vercel project environment variables.\n');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

main();
