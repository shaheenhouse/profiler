import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import type { User, Portfolio, RegisterUserInput } from '@/types/portfolio';

// Data directory - in production, this should be a persistent storage location
// For Vercel, consider using Vercel Blob, KV, or an external storage service
const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');

const USERS_FILE = path.join(DATA_DIR, 'users.json');
const PORTFOLIOS_DIR = path.join(DATA_DIR, 'portfolios');

// Ensure directories exist
async function ensureDirectories() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.mkdir(PORTFOLIOS_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating directories:', error);
  }
}

// Initialize storage
ensureDirectories();

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

// ============ USER OPERATIONS ============

export async function getUsers(): Promise<User[]> {
  try {
    await ensureDirectories();
    const data = await fs.readFile(USERS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist, return empty array
    return [];
  }
}

export async function getUserById(id: string): Promise<User | null> {
  const users = await getUsers();
  return users.find(u => u.id === id) || null;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const users = await getUsers();
  return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
}

export async function getUserByUsername(username: string): Promise<User | null> {
  const users = await getUsers();
  return users.find(u => u.username.toLowerCase() === username.toLowerCase()) || null;
}

export async function createUser(input: RegisterUserInput): Promise<User> {
  await ensureDirectories();
  const users = await getUsers();
  
  const newUser: User = {
    id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
    username: input.username,
    email: input.email,
    password: hashPassword(input.password),
    firstName: input.firstName,
    lastName: input.lastName,
    dateOfBirth: input.dateOfBirth,
    phone: input.phone,
    whatsapp: input.whatsapp,
    linkedinUrl: input.linkedinUrl,
    githubUrl: input.githubUrl,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  users.push(newUser);
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
  
  return newUser;
}

export async function authenticateUser(emailOrUsername: string, password: string): Promise<User | null> {
  const users = await getUsers();
  const user = users.find(
    u => u.email.toLowerCase() === emailOrUsername.toLowerCase() || 
         u.username.toLowerCase() === emailOrUsername.toLowerCase()
  );
  
  if (!user) return null;
  
  if (verifyPassword(password, user.password)) {
    return user;
  }
  
  return null;
}

export async function updateUser(id: string, updates: Partial<User>): Promise<User | null> {
  const users = await getUsers();
  const index = users.findIndex(u => u.id === id);
  
  if (index === -1) return null;
  
  users[index] = {
    ...users[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
  return users[index];
}

// ============ PORTFOLIO OPERATIONS ============

function getPortfolioFilePath(userId: string): string {
  return path.join(PORTFOLIOS_DIR, `${userId}.json`);
}

export async function getPortfolioByUserId(userId: string): Promise<Portfolio | null> {
  try {
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
    await ensureDirectories();
    const files = await fs.readdir(PORTFOLIOS_DIR);
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = path.join(PORTFOLIOS_DIR, file);
        const data = await fs.readFile(filePath, 'utf-8');
        const portfolio: Portfolio = JSON.parse(data);
        
        if (portfolio.slug === slug) {
          if (requirePublic && !portfolio.isPublic) {
            return null;
          }
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
  await ensureDirectories();
  const filePath = getPortfolioFilePath(portfolio.userId);
  await fs.writeFile(filePath, JSON.stringify(portfolio, null, 2));
  return portfolio;
}

export async function updatePortfolio(userId: string, updates: Partial<Portfolio>): Promise<Portfolio | null> {
  const portfolio = await getPortfolioByUserId(userId);
  
  if (!portfolio) return null;
  
  const updatedPortfolio: Portfolio = {
    ...portfolio,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  
  const filePath = getPortfolioFilePath(userId);
  await fs.writeFile(filePath, JSON.stringify(updatedPortfolio, null, 2));
  
  return updatedPortfolio;
}

export async function deletePortfolio(userId: string): Promise<boolean> {
  try {
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
    await ensureDirectories();
    const files = await fs.readdir(PORTFOLIOS_DIR);
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        const userId = file.replace('.json', '');
        if (excludeUserId && userId === excludeUserId) continue;
        
        const filePath = path.join(PORTFOLIOS_DIR, file);
        const data = await fs.readFile(filePath, 'utf-8');
        const portfolio: Portfolio = JSON.parse(data);
        
        if (portfolio.slug === slug) {
          return false;
        }
      }
    }
    
    return true;
  } catch (error) {
    return true;
  }
}

export async function getAllPublicPortfolios(): Promise<Portfolio[]> {
  try {
    await ensureDirectories();
    const files = await fs.readdir(PORTFOLIOS_DIR);
    const portfolios: Portfolio[] = [];
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = path.join(PORTFOLIOS_DIR, file);
        const data = await fs.readFile(filePath, 'utf-8');
        const portfolio: Portfolio = JSON.parse(data);
        
        if (portfolio.isPublic) {
          portfolios.push(portfolio);
        }
      }
    }
    
    return portfolios;
  } catch (error) {
    return [];
  }
}
