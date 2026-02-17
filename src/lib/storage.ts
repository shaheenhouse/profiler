import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import type { User, Portfolio, RegisterUserInput } from '@/types/portfolio';
import {
  readBlobJson,
  writeBlobJson,
  deleteBlobJson,
  listPortfolioBlobs,
  isBlobConfigured,
} from './blob-storage';
import { prisma, isPrismaConfigured } from './prisma';

// Storage mode detection
const USE_PRISMA = isPrismaConfigured();
const USE_BLOB_STORAGE = !USE_PRISMA && isBlobConfigured();

// Track if we've already seeded
let hasSeeded = false;

// Data directory - only used for local development
const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const PORTFOLIOS_DIR = path.join(DATA_DIR, 'portfolios');

// Ensure directories exist (only for local development)
async function ensureDirectories() {
  if (USE_PRISMA || USE_BLOB_STORAGE) return;
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.mkdir(PORTFOLIOS_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating directories:', error);
  }
}

// Load seed data from files
async function loadSeedDataFromFiles() {
  try {
    const usersData = await fs.readFile(USERS_FILE, 'utf-8');
    const users = JSON.parse(usersData);
    console.log(`[Storage] Loaded ${users.length} users from data/users.json`);
    
    const portfoliosDir = await fs.readdir(PORTFOLIOS_DIR);
    const portfolios: Portfolio[] = [];
    for (const file of portfoliosDir) {
      if (file.endsWith('.json')) {
        const data = await fs.readFile(path.join(PORTFOLIOS_DIR, file), 'utf-8');
        portfolios.push(JSON.parse(data));
      }
    }
    console.log(`[Storage] Loaded ${portfolios.length} portfolios from data/portfolios/`);
    
    return { users, portfolios };
  } catch (err) {
    console.log('[Storage] No local data files found, using empty seed data');
    return { users: [] as User[], portfolios: [] as Portfolio[] };
  }
}

// Auto-seed Prisma if needed
async function autoSeedIfNeeded() {
  if (hasSeeded) return;
  
  try {
    if (USE_PRISMA) {
      console.log('[Storage] Checking if Prisma needs seeding...');
      const userCount = await prisma.user.count();
      
      if (userCount === 0) {
        console.log('[Storage] Database is empty, starting auto-seed...');
        await seedPrisma();
        console.log('[Storage] ✓ Auto-seeding complete!');
      } else {
        console.log('[Storage] Database already has data, skipping seed.');
      }
      hasSeeded = true;
      return;
    }
    
    if (USE_BLOB_STORAGE) {
      const existingUsers = await readBlobJson<User[]>('users');
      if (!existingUsers || existingUsers.length === 0) {
        console.log('[Storage] Blob storage is empty, auto-seeding...');
        const { users, portfolios } = await loadSeedDataFromFiles();
        await writeBlobJson('users', users);
        for (const portfolio of portfolios) {
          await writeBlobJson('portfolio', portfolio, portfolio.userId);
        }
        console.log('[Storage] Auto-seeding complete!');
      }
      hasSeeded = true;
    }
  } catch (error: any) {
    console.error('[Storage] Auto-seed error:', error?.message || error);
    console.error('[Storage] ⚠️  Make sure Prisma is set up correctly!');
    console.error('[Storage] Run: npx prisma migrate dev --name init');
    hasSeeded = true; // Mark as seeded to prevent infinite loops
  }
}

async function seedPrisma() {
  const { users, portfolios } = await loadSeedDataFromFiles();
  
  console.log('[Storage] Seeding users...');
  for (const user of users) {
    await prisma.user.upsert({
      where: { id: user.id },
      update: {},
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
  }
  console.log(`[Storage] ✓ Seeded ${users.length} users`);

  console.log('[Storage] Seeding portfolios...');
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
  }
  console.log(`[Storage] ✓ Seeded ${portfolios.length} portfolios`);
}

// Initialize storage
if (!USE_PRISMA && !USE_BLOB_STORAGE) {
  ensureDirectories();
}

// Log storage mode on startup
console.log(`[Storage] Using ${USE_PRISMA ? 'Prisma + PostgreSQL' : USE_BLOB_STORAGE ? 'Vercel Blob' : 'Local File System'} storage`);

// ============ PASSWORD UTILITIES ============

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, hashedPassword: string): boolean {
  const [salt, hash] = hashedPassword.split(':');
  const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hash === verifyHash;
}

// ============ PRISMA → APP TYPE CONVERTERS ============

function dbUserToUser(dbUser: any): User {
  return {
    id: dbUser.id,
    username: dbUser.username,
    email: dbUser.email,
    password: dbUser.password,
    firstName: dbUser.firstName,
    lastName: dbUser.lastName,
    dateOfBirth: dbUser.dateOfBirth ? dbUser.dateOfBirth.toISOString().split('T')[0] : undefined,
    phone: dbUser.phone || undefined,
    whatsapp: dbUser.whatsapp || undefined,
    linkedinUrl: dbUser.linkedinUrl || undefined,
    githubUrl: dbUser.githubUrl || undefined,
    image: dbUser.image || undefined,
    createdAt: dbUser.createdAt.toISOString(),
    updatedAt: dbUser.updatedAt.toISOString(),
  };
}

function dbPortfolioToPortfolio(dbPortfolio: any): Portfolio {
  return {
    id: dbPortfolio.id,
    userId: dbPortfolio.userId,
    slug: dbPortfolio.slug,
    isPublic: dbPortfolio.isPublic,
    theme: dbPortfolio.theme,
    personalInfo: dbPortfolio.personalInfo as any,
    education: dbPortfolio.education as any,
    experience: dbPortfolio.experience as any,
    skills: dbPortfolio.skills as any,
    roles: dbPortfolio.roles as any,
    certifications: dbPortfolio.certifications as any,
    projects: dbPortfolio.projects as any,
    achievements: dbPortfolio.achievements as any,
    languages: dbPortfolio.languages as any,
    resumes: dbPortfolio.resumes as any,
    createdAt: dbPortfolio.createdAt.toISOString(),
    updatedAt: dbPortfolio.updatedAt.toISOString(),
  };
}

// ============ USER OPERATIONS ============

export async function getUsers(): Promise<User[]> {
  try {
    await autoSeedIfNeeded();
    
    if (USE_PRISMA) {
      const users = await prisma.user.findMany();
      return users.map(dbUserToUser);
    }
    
    if (USE_BLOB_STORAGE) {
      const users = await readBlobJson<User[]>('users');
      return users || [];
    }
    
    await ensureDirectories();
    const data = await fs.readFile(USERS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

export async function getUserById(id: string): Promise<User | null> {
  try {
    await autoSeedIfNeeded();
    
    if (USE_PRISMA) {
      const user = await prisma.user.findUnique({ where: { id } });
      return user ? dbUserToUser(user) : null;
    }
    
    const users = await getUsers();
    return users.find(u => u.id === id) || null;
  } catch {
    return null;
  }
}

export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    await autoSeedIfNeeded();
    
    if (USE_PRISMA) {
      const user = await prisma.user.findFirst({
        where: { email: { equals: email, mode: 'insensitive' } },
      });
      return user ? dbUserToUser(user) : null;
    }
    
    const users = await getUsers();
    return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  } catch {
    return null;
  }
}

export async function getUserByUsername(username: string): Promise<User | null> {
  try {
    await autoSeedIfNeeded();
    
    if (USE_PRISMA) {
      const user = await prisma.user.findFirst({
        where: { username: { equals: username, mode: 'insensitive' } },
      });
      return user ? dbUserToUser(user) : null;
    }
    
    const users = await getUsers();
    return users.find(u => u.username.toLowerCase() === username.toLowerCase()) || null;
  } catch {
    return null;
  }
}

export async function createUser(input: RegisterUserInput): Promise<User> {
  const id = crypto.randomUUID();
  const now = new Date();
  const hashedPw = hashPassword(input.password);
  
  if (USE_PRISMA) {
    const user = await prisma.user.create({
      data: {
        id,
        username: input.username,
        email: input.email,
        password: hashedPw,
        firstName: input.firstName,
        lastName: input.lastName,
        dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : null,
        phone: input.phone,
        whatsapp: input.whatsapp,
        linkedinUrl: input.linkedinUrl,
        githubUrl: input.githubUrl,
      },
    });
    return dbUserToUser(user);
  }
  
  const users = await getUsers();
  const newUser: User = {
    id,
    username: input.username,
    email: input.email,
    password: hashedPw,
    firstName: input.firstName,
    lastName: input.lastName,
    dateOfBirth: input.dateOfBirth,
    phone: input.phone,
    whatsapp: input.whatsapp,
    linkedinUrl: input.linkedinUrl,
    githubUrl: input.githubUrl,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
  
  users.push(newUser);
  
  if (USE_BLOB_STORAGE) {
    await writeBlobJson('users', users);
  } else {
    await ensureDirectories();
    await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
  }
  
  return newUser;
}

export async function authenticateUser(emailOrUsername: string, password: string): Promise<User | null> {
  try {
    await autoSeedIfNeeded();
    
    if (USE_PRISMA) {
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: { equals: emailOrUsername, mode: 'insensitive' } },
            { username: { equals: emailOrUsername, mode: 'insensitive' } },
          ],
        },
      });
      if (!user) return null;
      const appUser = dbUserToUser(user);
      if (verifyPassword(password, appUser.password)) return appUser;
      return null;
    }
    
    const users = await getUsers();
    const user = users.find(
      u => u.email.toLowerCase() === emailOrUsername.toLowerCase() || 
           u.username.toLowerCase() === emailOrUsername.toLowerCase()
    );
    
    if (!user) return null;
    if (verifyPassword(password, user.password)) return user;
    return null;
  } catch (err) {
    console.error('[Auth] Authentication error:', err);
    return null;
  }
}

export async function updateUser(id: string, updates: Partial<User>): Promise<User | null> {
  if (USE_PRISMA) {
    const data: any = {};
    if (updates.username !== undefined) data.username = updates.username;
    if (updates.email !== undefined) data.email = updates.email;
    if (updates.password !== undefined) data.password = updates.password;
    if (updates.firstName !== undefined) data.firstName = updates.firstName;
    if (updates.lastName !== undefined) data.lastName = updates.lastName;
    if (updates.dateOfBirth !== undefined) data.dateOfBirth = updates.dateOfBirth ? new Date(updates.dateOfBirth) : null;
    if (updates.phone !== undefined) data.phone = updates.phone;
    if (updates.whatsapp !== undefined) data.whatsapp = updates.whatsapp;
    if (updates.linkedinUrl !== undefined) data.linkedinUrl = updates.linkedinUrl;
    if (updates.githubUrl !== undefined) data.githubUrl = updates.githubUrl;
    if (updates.image !== undefined) data.image = updates.image;
    
    const user = await prisma.user.update({ where: { id }, data });
    return dbUserToUser(user);
  }
  
  const users = await getUsers();
  const index = users.findIndex(u => u.id === id);
  if (index === -1) return null;
  
  users[index] = {
    ...users[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  
  if (USE_BLOB_STORAGE) {
    await writeBlobJson('users', users);
  } else {
    await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
  }
  
  return users[index];
}

// ============ PORTFOLIO OPERATIONS ============

function getPortfolioFilePath(userId: string): string {
  return path.join(PORTFOLIOS_DIR, `${userId}.json`);
}

export async function getPortfolioByUserId(userId: string): Promise<Portfolio | null> {
  try {
    await autoSeedIfNeeded();
    
    if (USE_PRISMA) {
      const p = await prisma.portfolio.findUnique({ where: { userId } });
      return p ? dbPortfolioToPortfolio(p) : null;
    }
    
    if (USE_BLOB_STORAGE) {
      return await readBlobJson<Portfolio>('portfolio', userId);
    }
    
    await ensureDirectories();
    const filePath = getPortfolioFilePath(userId);
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return null;
  }
}

export async function getPortfolioBySlug(slug: string, requirePublic: boolean = false): Promise<Portfolio | null> {
  try {
    await autoSeedIfNeeded();
    
    if (USE_PRISMA) {
      const where: any = { slug };
      if (requirePublic) where.isPublic = true;
      const p = await prisma.portfolio.findFirst({ where });
      return p ? dbPortfolioToPortfolio(p) : null;
    }
    
    if (USE_BLOB_STORAGE) {
      const userIds = await listPortfolioBlobs();
      for (const userId of userIds) {
        const portfolio = await readBlobJson<Portfolio>('portfolio', userId);
        if (portfolio && portfolio.slug === slug) {
          if (requirePublic && !portfolio.isPublic) return null;
          return portfolio;
        }
      }
      return null;
    }
    
    await ensureDirectories();
    const files = await fs.readdir(PORTFOLIOS_DIR);
    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = path.join(PORTFOLIOS_DIR, file);
        const data = await fs.readFile(filePath, 'utf-8');
        const portfolio: Portfolio = JSON.parse(data);
        if (portfolio.slug === slug) {
          if (requirePublic && !portfolio.isPublic) return null;
          return portfolio;
        }
      }
    }
    return null;
  } catch (error) {
    return null;
  }
}

export async function createPortfolio(portfolio: Portfolio): Promise<Portfolio> {
  if (USE_PRISMA) {
    const p = await prisma.portfolio.create({
      data: {
        id: portfolio.id,
        userId: portfolio.userId,
        slug: portfolio.slug,
        isPublic: portfolio.isPublic,
        theme: portfolio.theme,
        personalInfo: portfolio.personalInfo as any,
        education: portfolio.education as any,
        experience: portfolio.experience as any,
        skills: portfolio.skills as any,
        roles: portfolio.roles as any,
        certifications: portfolio.certifications as any,
        projects: portfolio.projects as any,
        achievements: portfolio.achievements as any,
        languages: portfolio.languages as any,
        resumes: portfolio.resumes as any,
        createdAt: new Date(portfolio.createdAt),
        updatedAt: new Date(portfolio.updatedAt),
      },
    });
    return dbPortfolioToPortfolio(p);
  }
  
  if (USE_BLOB_STORAGE) {
    await writeBlobJson('portfolio', portfolio, portfolio.userId);
  } else {
    await ensureDirectories();
    const filePath = getPortfolioFilePath(portfolio.userId);
    await fs.writeFile(filePath, JSON.stringify(portfolio, null, 2));
  }
  return portfolio;
}

export async function updatePortfolio(userId: string, updates: Partial<Portfolio>): Promise<Portfolio | null> {
  if (USE_PRISMA) {
    const data: any = {};
    if (updates.slug !== undefined) data.slug = updates.slug;
    if (updates.isPublic !== undefined) data.isPublic = updates.isPublic;
    if (updates.theme !== undefined) data.theme = updates.theme;
    if (updates.personalInfo !== undefined) data.personalInfo = updates.personalInfo;
    if (updates.education !== undefined) data.education = updates.education;
    if (updates.experience !== undefined) data.experience = updates.experience;
    if (updates.skills !== undefined) data.skills = updates.skills;
    if (updates.roles !== undefined) data.roles = updates.roles;
    if (updates.certifications !== undefined) data.certifications = updates.certifications;
    if (updates.projects !== undefined) data.projects = updates.projects;
    if (updates.achievements !== undefined) data.achievements = updates.achievements;
    if (updates.languages !== undefined) data.languages = updates.languages;
    if (updates.resumes !== undefined) data.resumes = updates.resumes;
    
    const p = await prisma.portfolio.update({ where: { userId }, data });
    return dbPortfolioToPortfolio(p);
  }
  
  const portfolio = await getPortfolioByUserId(userId);
  if (!portfolio) return null;
  
  const updatedPortfolio: Portfolio = {
    ...portfolio,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  
  if (USE_BLOB_STORAGE) {
    await writeBlobJson('portfolio', updatedPortfolio, userId);
  } else {
    const filePath = getPortfolioFilePath(userId);
    await fs.writeFile(filePath, JSON.stringify(updatedPortfolio, null, 2));
  }
  
  return updatedPortfolio;
}

export async function deletePortfolio(userId: string): Promise<boolean> {
  try {
    if (USE_PRISMA) {
      await prisma.portfolio.delete({ where: { userId } });
      return true;
    }
    
    if (USE_BLOB_STORAGE) {
      return await deleteBlobJson('portfolio', userId);
    }
    
    const filePath = getPortfolioFilePath(userId);
    await fs.unlink(filePath);
    return true;
  } catch (error) {
    return false;
  }
}

// ============ SLUG UTILITIES ============

export async function isSlugAvailable(slug: string, excludeUserId?: string): Promise<boolean> {
  try {
    if (USE_PRISMA) {
      const where: any = { slug };
      if (excludeUserId) where.userId = { not: excludeUserId };
      const count = await prisma.portfolio.count({ where });
      return count === 0;
    }
    
    if (USE_BLOB_STORAGE) {
      const userIds = await listPortfolioBlobs();
      for (const userId of userIds) {
        if (excludeUserId && userId === excludeUserId) continue;
        const portfolio = await readBlobJson<Portfolio>('portfolio', userId);
        if (portfolio && portfolio.slug === slug) return false;
      }
      return true;
    }
    
    await ensureDirectories();
    const files = await fs.readdir(PORTFOLIOS_DIR);
    for (const file of files) {
      if (file.endsWith('.json')) {
        const userId = file.replace('.json', '');
        if (excludeUserId && userId === excludeUserId) continue;
        const filePath = path.join(PORTFOLIOS_DIR, file);
        const data = await fs.readFile(filePath, 'utf-8');
        const portfolio: Portfolio = JSON.parse(data);
        if (portfolio.slug === slug) return false;
      }
    }
    return true;
  } catch (error) {
    return true;
  }
}

export async function getAllPublicPortfolios(): Promise<Portfolio[]> {
  try {
    if (USE_PRISMA) {
      const portfolios = await prisma.portfolio.findMany({
        where: { isPublic: true },
      });
      return portfolios.map(dbPortfolioToPortfolio);
    }
    
    if (USE_BLOB_STORAGE) {
      const userIds = await listPortfolioBlobs();
      const portfolios: Portfolio[] = [];
      for (const userId of userIds) {
        const portfolio = await readBlobJson<Portfolio>('portfolio', userId);
        if (portfolio && portfolio.isPublic) portfolios.push(portfolio);
      }
      return portfolios;
    }
    
    await ensureDirectories();
    const files = await fs.readdir(PORTFOLIOS_DIR);
    const portfolios: Portfolio[] = [];
    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = path.join(PORTFOLIOS_DIR, file);
        const data = await fs.readFile(filePath, 'utf-8');
        const portfolio: Portfolio = JSON.parse(data);
        if (portfolio.isPublic) portfolios.push(portfolio);
      }
    }
    return portfolios;
  } catch (error) {
    return [];
  }
}
