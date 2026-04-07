import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const { userId } = await auth();

  
  if (!userId) {
    redirect('/');
  }
  
  return (
    <main className="flex-1 bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <h1 className="text-3xl font-bold text-foreground">
            Dashboard
          </h1>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Stats Card */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                Total Links
              </h3>
              <p className="text-2xl font-bold text-foreground">0</p>
            </div>
            
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                Total Clicks
              </h3>
              <p className="text-2xl font-bold text-foreground">0</p>
            </div>
            
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                Active Links
              </h3>
              <p className="text-2xl font-bold text-foreground">0</p>
            </div>
          </div>
          
          {/* Welcome Card */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Welcome to Link Shortener
            </h2>
            <p className="text-muted-foreground">
              Get started by creating your first shortened link. Track clicks and manage all your links from this dashboard.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
