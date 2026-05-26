import { db } from '@/db';
import { links } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import type { Link } from '@/db/schema';

/**
 * Fetches all links for a specific user, ordered by creation date (newest first)
 * @param userId - The Clerk user ID
 * @returns Array of links owned by the user
 */
export async function getUserLinks(userId: string): Promise<Link[]> {
  const userLinks = await db
    .select()
    .from(links)
    .where(eq(links.userId, userId))
    .orderBy(desc(links.updatedAt));
  
  return userLinks;
}

/**
 * Calculate user link statistics
 * @param userLinks - Array of user's links
 * @returns Object containing totalLinks, totalClicks, and activeLinks
 */
export function calculateLinkStats(userLinks: Link[]) {
  const totalLinks = userLinks.length;
  const totalClicks = userLinks.reduce((sum, link) => sum + link.clicks, 0);
  const activeLinks = userLinks.filter(link => link.clicks > 0).length;
  
  return {
    totalLinks,
    totalClicks,
    activeLinks,
  };
}

/**
 * Generates a random short code for a link
 * @param length - Length of the short code (default: 6)
 * @returns Random alphanumeric string
 */
function generateShortCode(length: number = 6): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

/**
 * Inserts a new link into the database
 * @param originalUrl - The original URL to shorten
 * @param userId - The Clerk user ID
 * @returns The created link with generated short code
 */
export async function insertLink(originalUrl: string, userId: string): Promise<Link> {
  // Generate a unique short code
  let shortCode = generateShortCode();
  let attempts = 0;
  const maxAttempts = 10;
  
  // Ensure the short code is unique (retry if collision)
  while (attempts < maxAttempts) {
    const existing = await db
      .select()
      .from(links)
      .where(eq(links.shortCode, shortCode))
      .limit(1);
    
    if (existing.length === 0) {
      break;
    }
    
    shortCode = generateShortCode();
    attempts++;
  }
  
  if (attempts === maxAttempts) {
    throw new Error('Failed to generate unique short code');
  }
  
  // Insert the new link
  const [newLink] = await db
    .insert(links)
    .values({
      originalUrl,
      userId,
      shortCode,
    })
    .returning();
  
  return newLink;
}

/**
 * Updates an existing link's original URL and/or short code
 * @param linkId - The ID of the link to update
 * @param originalUrl - The new original URL
 * @param userId - The Clerk user ID (for ownership verification)
 * @param shortCode - Optional new short code
 * @returns The updated link or null if not found/unauthorized
 */
export async function updateLink(
  linkId: number,
  originalUrl: string,
  userId: string,
  shortCode?: string
): Promise<Link | null> {
  // Verify ownership before updating
  const existing = await db
    .select()
    .from(links)
    .where(eq(links.id, linkId))
    .limit(1);
  
  if (existing.length === 0 || existing[0].userId !== userId) {
    return null;
  }
  
  // If shortCode is provided, verify it's unique (and not the same as current)
  if (shortCode && shortCode !== existing[0].shortCode) {
    const duplicate = await db
      .select()
      .from(links)
      .where(eq(links.shortCode, shortCode))
      .limit(1);
    
    if (duplicate.length > 0) {
      throw new Error('This short code is already in use. Please choose another.');
    }
  }
  
  // Update the link
  const updateData: { originalUrl: string; shortCode?: string; updatedAt: Date } = { 
    originalUrl,
    updatedAt: new Date()
  };
  if (shortCode && shortCode !== existing[0].shortCode) {
    updateData.shortCode = shortCode;
  }
  
  const [updatedLink] = await db
    .update(links)
    .set(updateData)
    .where(eq(links.id, linkId))
    .returning();
  
  return updatedLink;
}

/**
 * Deletes a link from the database
 * @param linkId - The ID of the link to delete
 * @param userId - The Clerk user ID (for ownership verification)
 * @returns True if deleted, false if not found/unauthorized
 */
export async function deleteLink(
  linkId: number,
  userId: string
): Promise<boolean> {
  // Verify ownership before deleting
  const existing = await db
    .select()
    .from(links)
    .where(eq(links.id, linkId))
    .limit(1);
  
  if (existing.length === 0 || existing[0].userId !== userId) {
    return false;
  }
  
  // Delete the link
  await db
    .delete(links)
    .where(eq(links.id, linkId));
  
  return true;
}
