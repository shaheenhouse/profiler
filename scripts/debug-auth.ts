import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import 'dotenv/config';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL
    }
  }
});

function verifyPassword(password: string, hashedPassword: string): boolean {
  const [salt, hash] = hashedPassword.split(':');
  if (!salt || !hash) {
    console.log('❌ Invalid hash format - missing salt or hash');
    return false;
  }
  const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  console.log('Salt:', salt);
  console.log('Stored hash:', hash);
  console.log('Computed hash:', verifyHash);
  console.log('Match:', hash === verifyHash);
  return hash === verifyHash;
}

async function main() {
  console.log('🔍 Debugging Authentication...\n');

  // Get users from database
  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      email: true,
      password: true,
    }
  });

  console.log(`Found ${users.length} users in database:\n`);

  for (const user of users) {
    console.log(`User: ${user.username} (${user.email})`);
    console.log(`Password field length: ${user.password.length}`);
    console.log(`Password preview: ${user.password.substring(0, 50)}...`);
    console.log('---');
  }

  // Test password verification
  console.log('\n🔐 Testing password verification...\n');
  
  const testUser = users.find(u => u.email === 'almaskhanwazir@gmail.com');
  if (testUser) {
    console.log(`Testing user: ${testUser.email}`);
    console.log(`Full password hash: ${testUser.password}`);
    console.log('\nTrying common test passwords:');
    
    const testPasswords = ['password', 'password123', 'Password123', 'test', '123456', 'admin'];
    for (const pwd of testPasswords) {
      console.log(`\nTrying: "${pwd}"`);
      const result = verifyPassword(pwd, testUser.password);
      if (result) {
        console.log(`✅ FOUND! Password is: ${pwd}`);
        break;
      }
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
