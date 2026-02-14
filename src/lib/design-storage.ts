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

// Detect if we're running on Vercel with Blob storage configured
const USE_BLOB_STORAGE = isBlobConfigured();

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const DESIGNS_DIR = path.join(DATA_DIR, 'designs');

async function ensureDesignsDir() {
  if (USE_BLOB_STORAGE) return; // Skip for Vercel Blob
  try {
    await fs.mkdir(DESIGNS_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating designs directory:', error);
  }
}

if (!USE_BLOB_STORAGE) {
  ensureDesignsDir();
}

// Get all designs for a user
export async function getUserDesigns(userId: string): Promise<Design[]> {
  try {
    if (USE_BLOB_STORAGE) {
      const designIds = await listDesignBlobs();
      const designs: Design[] = [];
      
      for (const designId of designIds) {
        const design = await readBlobJson<Design>('designs', designId);
        if (design && design.userId === userId) {
          designs.push(design);
        }
      }
      
      // Sort by updatedAt descending
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
        if (design.userId === userId) {
          designs.push(design);
        }
      } catch {
        // Skip corrupted files
      }
    }
    
    // Sort by updatedAt descending
    designs.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return designs;
  } catch {
    return [];
  }
}

// Get a single design
export async function getDesign(designId: string): Promise<Design | null> {
  try {
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
  const now = new Date().toISOString();
  
  const newDesign: Design = {
    ...design,
    id,
    createdAt: now,
    updatedAt: now,
  };
  
  if (USE_BLOB_STORAGE) {
    await writeBlobJson('designs', newDesign, id);
  } else {
    await ensureDesignsDir();
    const filePath = path.join(DESIGNS_DIR, `${id}.json`);
    await fs.writeFile(filePath, JSON.stringify(newDesign, null, 2), 'utf-8');
  }
  
  return newDesign;
}

// Update a design
export async function updateDesign(designId: string, updates: Partial<Design>): Promise<Design | null> {
  const design = await getDesign(designId);
  if (!design) return null;
  
  const updatedDesign: Design = {
    ...design,
    ...updates,
    id: design.id, // Prevent overwriting ID
    userId: design.userId, // Prevent overwriting user
    updatedAt: new Date().toISOString(),
  };
  
  if (USE_BLOB_STORAGE) {
    await writeBlobJson('designs', updatedDesign, designId);
  } else {
    const filePath = path.join(DESIGNS_DIR, `${designId}.json`);
    await fs.writeFile(filePath, JSON.stringify(updatedDesign, null, 2), 'utf-8');
  }
  
  return updatedDesign;
}

// Delete a design
export async function deleteDesign(designId: string, userId: string): Promise<boolean> {
  const design = await getDesign(designId);
  if (!design || design.userId !== userId) return false;
  
  try {
    if (USE_BLOB_STORAGE) {
      return await deleteBlobJson('designs', designId);
    }
    
    const filePath = path.join(DESIGNS_DIR, `${designId}.json`);
    await fs.unlink(filePath);
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
