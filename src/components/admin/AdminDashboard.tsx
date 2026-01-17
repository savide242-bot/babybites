import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, MessageSquare, Calendar, Bell, Activity, TrendingUp, TrendingDown, RefreshCw, Wifi } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subDays, startOfDay, parseISO } from 'date-fns';
import { pt } from 'date-fns/locale';

interface Stats {
  totalUsers: number;
  activeUsers: number;
  onlineNow: number;
  mealLogs: number;
  communityPosts: number;
  notificationSubscribers: number;
  newUsersToday: number;
  newUsersWeek: number;
  weeklyGrowth: number;
  bannedUsers: number;
}

interface DailyData {
  date: string;
  users: number;
  meals: number;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [chartData, setChartData] = useState<DailyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchStats = async () => {
    try {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const today = startOfDay(new Date()).toISOString();
      const sevenDaysAgo = startOfDay(subDays(new Date(), 7)).toISOString();
      const fourteenDaysAgo = startOfDay(subDays(new Date(), 14)).toISOString();
      
      const [
        usersRes, 
        activeRes, 
        onlineRes,
        mealsRes, 
        postsRes, 
        subsRes, 
        newTodayRes, 
        newWeekRes, 
        prevWeekRes,
        bannedRes
      ] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('user_sessions').select('id', { count: 'exact', head: true }).gte('last_active', twentyFourHoursAgo),
        supabase.from('user_sessions').select('id', { count: 'exact', head: true }).gte('last_active', fiveMinutesAgo),
        supabase.from('meal_logs').select('id', { count: 'exact', head: true }),
        supabase.from('forum_posts').select('id', { count: 'exact', head: true }),
        supabase.from('push_subscriptions').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', today),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', fourteenDaysAgo).lt('created_at', sevenDaysAgo),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_banned', true),
      ]);

      const newWeek = newWeekRes.count || 0;
      const prevWeek = prevWeekRes.count || 0;
      const growth = prevWeek > 0 ? Math.round(((newWeek - prevWeek) / prevWeek) * 100) : newWeek > 0 ? 100 : 0;

      setStats({
        totalUsers: usersRes.count || 0,
        activeUsers: activeRes.count || 0,
        onlineNow: onlineRes.count || 0,
        mealLogs: mealsRes.count || 0,
        communityPosts: postsRes.count || 0,
        notificationSubscribers: subsRes.count || 0,
        newUsersToday: newTodayRes.count || 0,
        newUsersWeek: newWeek,
        weeklyGrowth: growth,
        bannedUsers: bannedRes.count || 0,
      });

      // Fetch chart data
      const { data: profiles } = await supabase
        .from('profiles')
        .select('created_at')
        .gte('created_at', sevenDaysAgo);

      const { data: meals } = await supabase
        .from('meal_logs')
        .select('created_at')
        .gte('created_at', sevenDaysAgo);

      // Group by day
      const dailyStats: { [key: string]: DailyData } = {};
      for (let i = 6; i >= 0; i--) {
        const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
        dailyStats[date] = { date: format(subDays(new Date(), i), 'EEE', { locale: pt }), users: 0, meals: 0 };
      }

      profiles?.forEach(p => {
        const date = format(parseISO(p.created_at), 'yyyy-MM-dd');
        if (dailyStats[date]) dailyStats[date].users++;
      });

      meals?.forEach(m => {
        if (m.created_at) {
          const date = format(parseISO(m.created_at), 'yyyy-MM-dd');
          if (dailyStats[date]) dailyStats[date].meals++;
        }
      });

      setChartData(Object.values(dailyStats));
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);

    // Real-time subscription for immediate updates
    const channel = supabase
      .channel('admin-dashboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_sessions' }, fetchStats)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchStats)
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const statCards = [
    { 
      title: 'Total Utilizadores', 
      value: stats?.totalUsers || 0, 
      icon: Users, 
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      subtitle: `+${stats?.newUsersToday || 0} hoje`
    },
    { 
      title: 'Online Agora', 
      value: stats?.onlineNow || 0, 
      icon: Wifi, 
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      subtitle: 'Últimos 5 min',
      pulse: (stats?.onlineNow || 0) > 0
    },
    { 
      title: 'Activos (24h)', 
      value: stats?.activeUsers || 0, 
      icon: Activity, 
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
      subtitle: `${stats?.totalUsers ? Math.round((stats.activeUsers / stats.totalUsers) * 100) : 0}% retenção`
    },
    { 
      title: 'Refeições', 
      value: stats?.mealLogs || 0, 
      icon: Calendar, 
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
      subtitle: 'Total acumulado'
    },
    { 
      title: 'Posts', 
      value: stats?.communityPosts || 0, 
      icon: MessageSquare, 
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      subtitle: 'Comunidade'
    },
    { 
      title: 'Push Activos', 
      value: stats?.notificationSubscribers || 0, 
      icon: Bell, 
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      subtitle: 'Subscrições'
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header with refresh */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3 flex-wrap">
          <Badge variant="outline" className="text-xs">
            Última actualização: {format(lastUpdate, 'HH:mm:ss')}
          </Badge>
          {stats?.weeklyGrowth !== undefined && (
            <Badge 
              variant={stats.weeklyGrowth >= 0 ? "default" : "destructive"}
              className="flex items-center gap-1"
            >
              {stats.weeklyGrowth >= 0 ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {stats.weeklyGrowth >= 0 ? '+' : ''}{stats.weeklyGrowth}% esta semana
            </Badge>
          )}
          {(stats?.bannedUsers || 0) > 0 && (
            <Badge variant="destructive" className="text-xs">
              {stats?.bannedUsers} banidos
            </Badge>
          )}
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        {statCards.map((stat) => (
          <Card key={stat.title} className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-full ${stat.bgColor} relative`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                {stat.pulse && (
                  <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Actividade Últimos 7 Dias</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorMeals" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  className="text-xs fill-muted-foreground"
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  className="text-xs fill-muted-foreground"
                  tick={{ fontSize: 12 }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="users" 
                  stroke="hsl(var(--primary))" 
                  fillOpacity={1} 
                  fill="url(#colorUsers)"
                  name="Novos Utilizadores"
                />
                <Area 
                  type="monotone" 
                  dataKey="meals" 
                  stroke="hsl(var(--chart-2))" 
                  fillOpacity={1} 
                  fill="url(#colorMeals)"
                  name="Refeições"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Quick stats row */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Novos Esta Semana
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.newUsersWeek || 0}</div>
            <p className="text-xs text-muted-foreground">utilizadores registados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Taxa de Retenção
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.totalUsers ? Math.round((stats.activeUsers / stats.totalUsers) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">activos nas últimas 24h</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Média Refeições/Utilizador
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.totalUsers ? (stats.mealLogs / stats.totalUsers).toFixed(1) : 0}
            </div>
            <p className="text-xs text-muted-foreground">refeições registadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Engagement Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.totalUsers 
                ? Math.round(((stats.mealLogs + stats.communityPosts) / stats.totalUsers) * 10) / 10
                : 0
              }
            </div>
            <p className="text-xs text-muted-foreground">acções por utilizador</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
