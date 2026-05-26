import { db } from '@/db';
import { links } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { notFound, redirect } from 'next/navigation';

type RouteParams = {
  params: Promise<{
    shortcode: string;
  }>;
};

/**
 * GET /l/[shortcode]
 * Redirects to the original URL and increments click count
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { shortcode } = await params;

    // Find the link by shortcode
    const [link] = await db
      .select()
      .from(links)
      .where(eq(links.shortCode, shortcode))
      .limit(1);

    // If link doesn't exist, return 404
    if (!link) {
      return NextResponse.json(
        { error: 'Link not found' },
        { status: 404 }
      );
    }

    // Increment click count in the background (don't wait for it)
    db.update(links)
      .set({ 
        clicks: link.clicks + 1,
        updatedAt: new Date(),
      })
      .where(eq(links.id, link.id))
      .then(() => {
        console.log(`Incremented clicks for shortcode: ${shortcode}`);
      })
      .catch((error) => {
        console.error('Failed to increment clicks:', error);
      });

    // Redirect to the original URL
    return NextResponse.redirect(link.originalUrl, { status: 307 });
  } catch (error) {
    console.error('Error in redirect route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
