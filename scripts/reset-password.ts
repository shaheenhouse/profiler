import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import 'dotenv/config';

const prisma = new PrismaClient();

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

// ============================================
// SET YOUR NEW PASSWORD HERE
// ============================================
const NEW_PASSWORD = 'admin123';  // <-- Change this to whatever you want
const USER_EMAIL = 'almaskhanwazir@gmail.com';  // Your email
// ============================================

async function main() {
  console.log('🔐 Password Reset Script\n');
  console.log(`Target user: ${USER_EMAIL}`);
  console.log(`New password: ${NEW_PASSWORD}\n`);

  const hashedPassword = hashPassword(NEW_PASSWORD);
  
  try {
    const user = await prisma.user.update({
      where: { email: USER_EMAIL },
      data: { password: hashedPassword },
    });
    
    console.log('✅ Password reset successfully!');
    console.log(`\nYou can now login with:`);
    console.log(`   Email: ${USER_EMAIL}`);
    console.log(`   Password: ${NEW_PASSWORD}`);
  } catch (error: any) {
    console.error('❌ Failed to reset password:', error.message);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
