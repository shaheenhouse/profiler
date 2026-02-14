import { put, del, list, head } from '@vercel/blob';

/**
 * Vercel Blob storage utility functions
 * These functions handle JSON data storage in Vercel Blob for production
 */

const BLOB_PREFIX = 'profiler-data';

// Helper to construct blob paths
function getBlobPath(type: 'users' | 'portfolio' | 'designs', id?: string): string {
  if (type === 'users') {
    return `${BLOB_PREFIX}/users.json`;
  }
  if (type === 'portfolio' && id) {
    return `${BLOB_PREFIX}/portfolios/${id}.json`;
  }
  if (type === 'designs' && id) {
    return `${BLOB_PREFIX}/designs/${id}.json`;
  }
  throw new Error(`Invalid blob path: type=${type}, id=${id}`);
}

// ============ READ OPERATIONS ============

export async function readBlobJson<T>(type: 'users' | 'portfolio' | 'designs', id?: string): Promise<T | null> {
  try {
    const path = getBlobPath(type, id);
    
    // First, list blobs to find the one we need
    const { blobs } = await list({ prefix: path });
    
    if (blobs.length === 0) {
      return null;
    }

    // Fetch the blob content
    const response = await fetch(blobs[0].url);
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    return data as T;
  } catch (error) {
    console.error(`Error reading blob ${type}/${id}:`, error);
    return null;
  }
}

export async function writeBlobJson<T>(type: 'users' | 'portfolio' | 'designs', data: T, id?: string): Promise<boolean> {
  try {
    const path = getBlobPath(type, id);
    const jsonString = JSON.stringify(data, null, 2);
    
    await put(path, jsonString, {
      access: 'public',
      contentType: 'application/json',
      addRandomSuffix: false,
    });
    
    return true;
  } catch (error) {
    console.error(`Error writing blob ${type}/${id}:`, error);
    return false;
  }
}

export async function deleteBlobJson(type: 'users' | 'portfolio' | 'designs', id?: string): Promise<boolean> {
  try {
    const path = getBlobPath(type, id);
    
    // List blobs with this prefix to get the URL
    const { blobs } = await list({ prefix: path });
    
    if (blobs.length > 0) {
      await del(blobs[0].url);
    }
    
    return true;
  } catch (error) {
    console.error(`Error deleting blob ${type}/${id}:`, error);
    return false;
  }
}

// ============ LIST OPERATIONS ============

export async function listPortfolioBlobs(): Promise<string[]> {
  try {
    const { blobs } = await list({ prefix: `${BLOB_PREFIX}/portfolios/` });
    return blobs.map(blob => {
      // Extract userId from path like "profiler-data/portfolios/userId.json"
      const match = blob.pathname.match(/portfolios\/(.+)\.json$/);
      return match ? match[1] : '';
    }).filter(Boolean);
  } catch (error) {
    console.error('Error listing portfolio blobs:', error);
    return [];
  }
}

export async function listDesignBlobs(): Promise<string[]> {
  try {
    const { blobs } = await list({ prefix: `${BLOB_PREFIX}/designs/` });
    return blobs.map(blob => {
      const match = blob.pathname.match(/designs\/(.+)\.json$/);
      return match ? match[1] : '';
    }).filter(Boolean);
  } catch (error) {
    console.error('Error listing design blobs:', error);
    return [];
  }
}

// ============ IMAGE UPLOAD ============

export async function uploadImageToBlob(
  file: Buffer,
  filename: string,
  contentType: string
): Promise<string | null> {
  try {
    const path = `${BLOB_PREFIX}/uploads/profiles/${filename}`;
    
    const blob = await put(path, file, {
      access: 'public',
      contentType,
      addRandomSuffix: false,
    });
    
    return blob.url;
  } catch (error) {
    console.error('Error uploading image to blob:', error);
    return null;
  }
}

export async function deleteImageFromBlob(url: string): Promise<boolean> {
  try {
    await del(url);
    return true;
  } catch (error) {
    console.error('Error deleting image from blob:', error);
    return false;
  }
}

// ============ MIGRATION HELPER ============

/**
 * Check if Vercel Blob is configured
 */
export function isBlobConfigured(): boolean {
  return !!process.env.BLOB_READ_WRITE_TOKEN;
}
