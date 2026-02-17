import { promises as fs } from 'fs';
import path from 'path';
import type { Design } from '@/types/design';
import {
  readBlobJson,
  writeBlobJson,
  deleteBlobJson,
  listDesignBlobs,
  isBlobConfigured,
} from './blob-storage';
import { prisma, isPrismaConfigured } from './prisma';

// Storage mode detection
const USE_PRISMA = isPrismaConfigured();
const USE_BLOB_STORAGE = !USE_PRISMA && isBlobConfigured();

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const DESIGNS_DIR = path.join(DATA_DIR, 'designs');

async function ensureDesignsDir() {
  if (USE_PRISMA || USE_BLOB_STORAGE) return;
  try {
    await fs.mkdir(DESIGNS_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating designs directory:', error);
  }
}

if (!USE_PRISMA && !USE_BLOB_STORAGE) {
  ensureDesignsDir();
}

// Helper: Prisma Design → App Design
function dbDesignToDesign(dbDesign: any): Design {
  return {
    id: dbDesign.id,
    userId: dbDesign.userId,
    name: dbDesign.name,
    width: dbDesign.width,
    height: dbDesign.height,
    canvasJSON: dbDesign.canvasJson,
    thumbnail: dbDesign.thumbnail || '',
    createdAt: dbDesign.createdAt.toISOString(),
    updatedAt: dbDesign.updatedAt.toISOString(),
  };
}

// Get all designs for a user
export async function getUserDesigns(userId: string): Promise<Design[]> {
  try {
    if (USE_PRISMA) {
      const designs = await prisma.design.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
      });
      return designs.map(dbDesignToDesign);
    }
    
    if (USE_BLOB_STORAGE) {
      const designIds = await listDesignBlobs();
      const designs: Design[] = [];
      for (const designId of designIds) {
        const design = await readBlobJson<Design>('designs', designId);
        if (design && design.userId === userId) designs.push(design);
      }
      designs.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      return designs;
    }
    
    await ensureDesignsDir();
    const files = await fs.readdir(DESIGNS_DIR);
    const designs: Design[] = [];
    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      try {
        const data = await fs.readFile(path.join(DESIGNS_DIR, file), 'utf-8');
        const design: Design = JSON.parse(data);
        if (design.userId === userId) designs.push(design);
      } catch { /* skip corrupted */ }
    }
    designs.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return designs;
  } catch {
    return [];
  }
}

// Get a single design
export async function getDesign(designId: string): Promise<Design | null> {
  try {
    if (USE_PRISMA) {
      const design = await prisma.design.findUnique({ where: { id: designId } });
      return design ? dbDesignToDesign(design) : null;
    }
    
    if (USE_BLOB_STORAGE) {
      return await readBlobJson<Design>('designs', designId);
    }
    
    await ensureDesignsDir();
    const filePath = path.join(DESIGNS_DIR, `${designId}.json`);
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return null;
  }
}

// Create a new design
export async function createDesign(design: Omit<Design, 'id' | 'createdAt' | 'updatedAt'>): Promise<Design> {
  const id = crypto.randomUUID();
  
  if (USE_PRISMA) {
    const d = await prisma.design.create({
      data: {
        id,
        userId: design.userId,
        name: design.name,
        width: design.width,
        height: design.height,
        canvasJson: design.canvasJSON,
        thumbnail: design.thumbnail,
      },
    });
    return dbDesignToDesign(d);
  }
  
  const now = new Date().toISOString();
  const newDesign: Design = { ...design, id, createdAt: now, updatedAt: now };
  
  if (USE_BLOB_STORAGE) {
    await writeBlobJson('designs', newDesign, id);
  } else {
    await ensureDesignsDir();
    await fs.writeFile(path.join(DESIGNS_DIR, `${id}.json`), JSON.stringify(newDesign, null, 2), 'utf-8');
  }
  
  return newDesign;
}

// Update a design
export async function updateDesign(designId: string, updates: Partial<Design>): Promise<Design | null> {
  if (USE_PRISMA) {
    const data: any = {};
    if (updates.name !== undefined) data.name = updates.name;
    if (updates.width !== undefined) data.width = updates.width;
    if (updates.height !== undefined) data.height = updates.height;
    if (updates.canvasJSON !== undefined) data.canvasJson = updates.canvasJSON;
    if (updates.thumbnail !== undefined) data.thumbnail = updates.thumbnail;
    
    const design = await prisma.design.update({ where: { id: designId }, data });
    return dbDesignToDesign(design);
  }
  
  const design = await getDesign(designId);
  if (!design) return null;
  
  const updatedDesign: Design = {
    ...design,
    ...updates,
    id: design.id,
    userId: design.userId,
    updatedAt: new Date().toISOString(),
  };
  
  if (USE_BLOB_STORAGE) {
    await writeBlobJson('designs', updatedDesign, designId);
  } else {
    await fs.writeFile(path.join(DESIGNS_DIR, `${designId}.json`), JSON.stringify(updatedDesign, null, 2), 'utf-8');
  }
  
  return updatedDesign;
}

// Delete a design
export async function deleteDesign(designId: string, userId: string): Promise<boolean> {
  try {
    if (USE_PRISMA) {
      await prisma.design.deleteMany({
        where: { id: designId, userId },
      });
      return true;
    }
    
    const design = await getDesign(designId);
    if (!design || design.userId !== userId) return false;
    
    if (USE_BLOB_STORAGE) {
      return await deleteBlobJson('designs', designId);
    }
    
    await fs.unlink(path.join(DESIGNS_DIR, `${designId}.json`));
    return true;
  } catch {
    return false;
  }
}

// Duplicate a design
export async function duplicateDesign(designId: string, userId: string): Promise<Design | null> {
  const design = await getDesign(designId);
  if (!design || design.userId !== userId) return null;
  
  return createDesign({
    userId,
    name: `${design.name} (Copy)`,
    width: design.width,
    height: design.height,
    canvasJSON: design.canvasJSON,
    thumbnail: design.thumbnail,
  });
}
