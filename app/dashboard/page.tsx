import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, Copy } from 'lucide-react';
import { getUserLinks, calculateLinkStats } from '@/data/links';
import { CreateLinkDialog } from './components/CreateLinkDialog';
import { EditLinkDialog } from './components/EditLinkDialog';
import { DeleteLinkDialog } from './components/DeleteLinkDialog';

export default async function DashboardPage() {
  const { userId } = await auth();

  
  if (!userId) {
    redirect('/');
  }
  
  // Fetch user's links using helper function
  const userLinks = await getUserLinks(userId);
  
  // Calculate stats
  const { totalLinks, totalClicks, activeLinks } = calculateLinkStats(userLinks);
  
  return (
    <main className="flex-1 bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-foreground">
              Dashboard
            </h1>
            <CreateLinkDialog />
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Stats Cards */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  Total Links
                </h3>
                <p className="text-2xl font-bold text-foreground">{totalLinks}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  Total Clicks
                </h3>
                <p className="text-2xl font-bold text-foreground">{totalClicks}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  Active Links
                </h3>
                <p className="text-2xl font-bold text-foreground">{activeLinks}</p>
              </CardContent>
            </Card>
          </div>
          
          {/* Links List */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">
              Your Links
            </h2>
            
            {userLinks.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground text-center py-8">
                    No links yet. Create your first shortened link to get started!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {userLinks.map((link) => (
                  <Card key={link.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg font-semibold text-foreground mb-1">
                            /{link.shortCode}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground truncate">
                            {link.originalUrl}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <EditLinkDialog link={link} />
                          <DeleteLinkDialog link={link} />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-4 text-muted-foreground">
                          <span>
                            <strong className="text-foreground font-semibold">{link.clicks}</strong> clicks
                          </span>
                          <span>
                            Created {new Date(link.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
