import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Link2, BarChart3, Zap, Shield, RefreshCw, QrCode } from 'lucide-react';
import Link from 'next/link';

export default async function Home() {
  const { userId } = await auth();

  if (userId) {
    redirect('/dashboard');
  }
  
  return (
    <div className="flex flex-col flex-1">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24 lg:py-32">
        <div className="flex flex-col items-center text-center gap-8 max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
            Shorten Links.
            <span className="block text-primary mt-2">Track Performance.</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl">
            Create memorable short links, track click analytics, and manage all your URLs 
            in one powerful dashboard. Perfect for marketers, businesses, and content creators.
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16 md:py-24 bg-muted/50">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Everything you need to manage links
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Powerful features to help you create, track, and optimize your short links
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {/* Feature 1 */}
          <Card className="transition-shadow hover:shadow-lg">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Link2 className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Custom Short Links</CardTitle>
              <CardDescription>
                Create branded short URLs with custom aliases that are easy to remember and share
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Feature 2 */}
          <Card className="transition-shadow hover:shadow-lg">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Click Analytics</CardTitle>
              <CardDescription>
                Track clicks, geographic data, and referrers to understand your audience better
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Feature 3 */}
          <Card className="transition-shadow hover:shadow-lg">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Lightning Fast</CardTitle>
              <CardDescription>
                Blazing fast redirects with global CDN and serverless infrastructure
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Feature 4 */}
          <Card className="transition-shadow hover:shadow-lg">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <QrCode className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>QR Code Generator</CardTitle>
              <CardDescription>
                Automatically generate QR codes for your short links for offline sharing
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Feature 5 */}
          <Card className="transition-shadow hover:shadow-lg">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Secure & Private</CardTitle>
              <CardDescription>
                Your data is encrypted and secure. We never share your information with third parties
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Feature 6 */}
          <Card className="transition-shadow hover:shadow-lg">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <RefreshCw className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Link Management</CardTitle>
              <CardDescription>
                Edit, update, or deactivate your links anytime from your centralized dashboard
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to get started?
          </h2>
          <p className="text-muted-foreground text-lg mb-8">
            Join thousands of users who trust us with their links. Start shortening for free today.
          </p>
        </div>
      </section>
    </div>
  );
}

