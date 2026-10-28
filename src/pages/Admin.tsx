import { useAdminRole } from '@/hooks/useAdminRole';
import { Navigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import AdminDashboard from '@/components/admin/AdminDashboard';
import UserManagement from '@/components/admin/UserManagement';
import NotificationComposer from '@/components/admin/NotificationComposer';
import ActivityLogs from '@/components/admin/ActivityLogs';
import ContentModeration from '@/components/admin/ContentModeration';
import SystemHealth from '@/components/admin/SystemHealth';
import VideoRecipeManager from '@/components/admin/VideoRecipeManager';
import FinancialManagement from '@/components/admin/FinancialManagement';
import { RecipeManagement } from '@/components/admin/RecipeManagement';
import { Shield, Users, Bell, Activity, MessageSquare, Server, Film, ExternalLink, DollarSign, UtensilsCrossed } from 'lucide-react';

const PREVIEW_URL = 'https://id-preview--c5922e44-641f-47eb-8afc-e9b38124e2b3.lovable.app';

const Admin = () => {
  const { isAdmin, isLoading } = useAdminRole();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-24 lg:pb-8 container mx-auto p-4 space-y-4">
        <Skeleton className="h-12 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-8 container mx-auto p-3 sm:p-4 space-y-6 w-full max-w-full overflow-x-hidden min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Admin Panel</h1>
        </div>
        <Button
          variant="outline"
          onClick={() => window.open(PREVIEW_URL, '_blank', 'noopener,noreferrer')}
          className="gap-2 bg-gradient-to-r from-gold/10 to-primary/10 border-gold/40 hover:from-gold/20 hover:to-primary/20"
          title="Always serves the freshest build"
        >
          <ExternalLink className="h-4 w-4" />
          🔄 Open Latest Version
        </Button>
      </div>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full grid-cols-5 lg:grid-cols-9 h-auto overflow-x-auto min-w-0">
          <TabsTrigger value="recipes" className="flex items-center gap-2">
            <UtensilsCrossed className="h-4 w-4" />
            <span className="hidden sm:inline">Recipes</span>
          </TabsTrigger>
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="financial" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            <span className="hidden sm:inline">Finance</span>
          </TabsTrigger>
          <TabsTrigger value="videos" className="flex items-center gap-2">
            <Film className="h-4 w-4" />
            <span className="hidden sm:inline">Videos</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Users</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="content" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Content</span>
          </TabsTrigger>
          <TabsTrigger value="health" className="flex items-center gap-2">
            <Server className="h-4 w-4" />
            <span className="hidden sm:inline">System</span>
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Logs</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="recipes" className="mt-6"><RecipeManagement /></TabsContent>
        <TabsContent value="dashboard" className="mt-6"><AdminDashboard /></TabsContent>
        <TabsContent value="financial" className="mt-6"><FinancialManagement /></TabsContent>
        <TabsContent value="videos" className="mt-6"><VideoRecipeManager /></TabsContent>
        <TabsContent value="users" className="mt-6"><UserManagement /></TabsContent>
        <TabsContent value="notifications" className="mt-6"><NotificationComposer /></TabsContent>
        <TabsContent value="content" className="mt-6"><ContentModeration /></TabsContent>
        <TabsContent value="health" className="mt-6"><SystemHealth /></TabsContent>
        <TabsContent value="logs" className="mt-6"><ActivityLogs /></TabsContent>
      </Tabs>
    </div>
  );
};

export default Admin;
