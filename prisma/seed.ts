import { PrismaClient } from '@prisma/client';
import { promises as fs } from 'fs';
import path from 'path';
import type { User, Portfolio } from '../src/types/portfolio';

const prisma = new PrismaClient();

async function loadDataFromFiles() {
  const dataDir = path.join(process.cwd(), 'data');
  
  try {
    // Load users
    const usersFile = path.join(dataDir, 'users.json');
    const usersData = await fs.readFile(usersFile, 'utf-8');
    const users: User[] = JSON.parse(usersData);
    console.log(`✓ Loaded ${users.length} users from data/users.json`);
    
    // Load portfolios
    const portfoliosDir = path.join(dataDir, 'portfolios');
    const files = await fs.readdir(portfoliosDir);
    const portfolios: Portfolio[] = [];
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = path.join(portfoliosDir, file);
        const data = await fs.readFile(filePath, 'utf-8');
        portfolios.push(JSON.parse(data));
      }
    }
    console.log(`✓ Loaded ${portfolios.length} portfolios from data/portfolios/`);
    
    return { users, portfolios };
  } catch (error) {
    console.error('Error loading data files:', error);
    throw error;
  }
}

async function main() {
  console.log('🌱 Starting database seed...\n');

  const { users, portfolios } = await loadDataFromFiles();

  // Seed users
  console.log('Seeding users...');
  for (const user of users) {
    await prisma.user.upsert({
      where: { id: user.id },
      update: {
        password: user.password, // Update password if user exists
      },
      create: {
        id: user.id,
        username: user.username,
        email: user.email,
        password: user.password,
        firstName: user.firstName,
        lastName: user.lastName,
        dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth) : null,
        phone: user.phone,
        whatsapp: user.whatsapp,
        linkedinUrl: user.linkedinUrl,
        githubUrl: user.githubUrl,
        image: user.image,
        createdAt: new Date(user.createdAt),
        updatedAt: new Date(user.updatedAt),
      },
    });
    console.log(`  ✓ User: ${user.email}`);
  }

  // Seed portfolios
  console.log('\nSeeding portfolios...');
  for (const p of portfolios) {
    await prisma.portfolio.upsert({
      where: { id: p.id },
      update: {},
      create: {
        id: p.id,
        userId: p.userId,
        slug: p.slug,
        isPublic: p.isPublic,
        theme: p.theme,
        personalInfo: p.personalInfo as any,
        education: p.education as any,
        experience: p.experience as any,
        skills: p.skills as any,
        roles: p.roles as any,
        certifications: p.certifications as any,
        projects: p.projects as any,
        achievements: p.achievements as any,
        languages: p.languages as any,
        resumes: p.resumes as any,
        createdAt: new Date(p.createdAt),
        updatedAt: new Date(p.updatedAt),
      },
    });
    console.log(`  ✓ Portfolio: ${p.slug} (${p.personalInfo.fullName})`);
  }

  console.log('\n✅ Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
