import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, MessageSquare, Calendar, Bell, Activity } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface Stats {
  totalUsers: number;
  activeUsers: number;
  mealLogs: number;
  communityPosts: number;
  notificationSubscribers: number;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Get active users (last active within 24 hours)
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        
        const [usersRes, activeRes, mealsRes, postsRes, subsRes] = await Promise.all([
          supabase.from('profiles').select('id', { count: 'exact', head: true }),
          supabase.from('user_sessions').select('id', { count: 'exact', head: true }).gte('last_active', twentyFourHoursAgo),
          supabase.from('meal_logs').select('id', { count: 'exact', head: true }),
          supabase.from('forum_posts').select('id', { count: 'exact', head: true }),
          supabase.from('push_subscriptions').select('id', { count: 'exact', head: true }),
        ]);

        setStats({
          totalUsers: usersRes.count || 0,
          activeUsers: activeRes.count || 0,
          mealLogs: mealsRes.count || 0,
          communityPosts: postsRes.count || 0,
          notificationSubscribers: subsRes.count || 0,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  const statCards = [
    { title: 'Total Users', value: stats?.totalUsers || 0, icon: Users, color: 'text-blue-500', subtitle: 'All registered' },
    { title: 'Active Users', value: stats?.activeUsers || 0, icon: Activity, color: 'text-green-500', subtitle: 'Last 24 hours' },
    { title: 'Meal Logs', value: stats?.mealLogs || 0, icon: Calendar, color: 'text-amber-500', subtitle: 'Total tracked' },
    { title: 'Community Posts', value: stats?.communityPosts || 0, icon: MessageSquare, color: 'text-purple-500', subtitle: 'Forum activity' },
    { title: 'Push Subscribers', value: stats?.notificationSubscribers || 0, icon: Bell, color: 'text-orange-500', subtitle: 'Notifications enabled' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
