import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, MessageSquare, Calendar, Bell, Activity, TrendingUp, TrendingDown, RefreshCw, Wifi, Eye, Utensils, ShoppingCart, Target } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { format, subDays, startOfDay, parseISO } from 'date-fns';

interface Stats {
  totalUsers: number;
  activeUsers: number;
  active7d: number;
  active30d: number;
  onlineNow: number;
  mealLogs: number;
  mealPlans: number;
  communityPosts: number;
  notificationSubscribers: number;
  newUsersToday: number;
  newUsersWeek: number;
  weeklyGrowth: number;
  bannedUsers: number;
  totalRecipeViews: number;
  totalShoppingItems: number;
  totalFavorites: number;
}

interface DailyData {
  date: string;
  users: number;
  meals: number;
  views: number;
}

interface TopRecipe {
  recipe_id: string;
  count: number;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [chartData, setChartData] = useState<DailyData[]>([]);
  const [topRecipes, setTopRecipes] = useState<TopRecipe[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchStats = async () => {
    try {
      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000).toISOString();
      const today = startOfDay(now).toISOString();
      const sevenDaysAgo = startOfDay(subDays(now, 7)).toISOString();
      const fourteenDaysAgo = startOfDay(subDays(now, 14)).toISOString();
      const thirtyDaysAgo = startOfDay(subDays(now, 30)).toISOString();
      
      const [
        usersRes, activeRes, active7dRes, active30dRes, onlineRes,
        mealsRes, mealPlansRes, postsRes, subsRes,
        newTodayRes, newWeekRes, prevWeekRes, bannedRes,
        recipeViewsRes, shoppingRes, favoritesRes
      ] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('user_sessions').select('id', { count: 'exact', head: true }).gte('last_active', twentyFourHoursAgo),
        supabase.from('user_sessions').select('id', { count: 'exact', head: true }).gte('last_active', sevenDaysAgo),
        supabase.from('user_sessions').select('id', { count: 'exact', head: true }).gte('last_active', thirtyDaysAgo),
        supabase.from('user_sessions').select('id', { count: 'exact', head: true }).gte('last_active', fiveMinutesAgo),
        supabase.from('meal_logs').select('id', { count: 'exact', head: true }),
        supabase.from('meal_plans').select('id', { count: 'exact', head: true }),
        supabase.from('forum_posts').select('id', { count: 'exact', head: true }),
        supabase.from('push_subscriptions').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', today),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', fourteenDaysAgo).lt('created_at', sevenDaysAgo),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_banned', true),
        supabase.from('recipe_views').select('id', { count: 'exact', head: true }),
        supabase.from('shopping_list_items').select('id', { count: 'exact', head: true }),
        supabase.from('favorite_recipes').select('id', { count: 'exact', head: true }),
      ]);

      const newWeek = newWeekRes.count || 0;
      const prevWeek = prevWeekRes.count || 0;
      const growth = prevWeek > 0 ? Math.round(((newWeek - prevWeek) / prevWeek) * 100) : newWeek > 0 ? 100 : 0;

      setStats({
        totalUsers: usersRes.count || 0,
        activeUsers: activeRes.count || 0,
        active7d: active7dRes.count || 0,
        active30d: active30dRes.count || 0,
        onlineNow: onlineRes.count || 0,
        mealLogs: mealsRes.count || 0,
        mealPlans: mealPlansRes.count || 0,
        communityPosts: postsRes.count || 0,
        notificationSubscribers: subsRes.count || 0,
        newUsersToday: newTodayRes.count || 0,
        newUsersWeek: newWeek,
        weeklyGrowth: growth,
        bannedUsers: bannedRes.count || 0,
        totalRecipeViews: recipeViewsRes.count || 0,
        totalShoppingItems: shoppingRes.count || 0,
        totalFavorites: favoritesRes.count || 0,
      });

      // Chart data — last 7 days
      const [profilesRes, mealsChartRes, viewsChartRes] = await Promise.all([
        supabase.from('profiles').select('created_at').gte('created_at', sevenDaysAgo),
        supabase.from('meal_logs').select('created_at').gte('created_at', sevenDaysAgo),
        supabase.from('recipe_views').select('viewed_at').gte('viewed_at', sevenDaysAgo),
      ]);

      const dailyStats: Record<string, DailyData> = {};
      for (let i = 6; i >= 0; i--) {
        const d = subDays(now, i);
        const key = format(d, 'yyyy-MM-dd');
        dailyStats[key] = { date: format(d, 'EEE'), users: 0, meals: 0, views: 0 };
      }

      profilesRes.data?.forEach(p => {
        const key = format(parseISO(p.created_at!), 'yyyy-MM-dd');
        if (dailyStats[key]) dailyStats[key].users++;
      });
      mealsChartRes.data?.forEach(m => {
        if (m.created_at) {
          const key = format(parseISO(m.created_at), 'yyyy-MM-dd');
          if (dailyStats[key]) dailyStats[key].meals++;
        }
      });
      viewsChartRes.data?.forEach(v => {
        if (v.viewed_at) {
          const key = format(parseISO(v.viewed_at), 'yyyy-MM-dd');
          if (dailyStats[key]) dailyStats[key].views++;
        }
      });

      setChartData(Object.values(dailyStats));

      // Top recipes
      const { data: topRecipeData } = await supabase
        .from('recipe_views')
        .select('recipe_id')
        .order('viewed_at', { ascending: false })
        .limit(500);

      if (topRecipeData) {
        const counts: Record<string, number> = {};
        topRecipeData.forEach(r => { counts[r.recipe_id] = (counts[r.recipe_id] || 0) + 1; });
        const sorted = Object.entries(counts)
          .map(([recipe_id, count]) => ({ recipe_id, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);
        setTopRecipes(sorted);
      }

      // Recent activity
      const { data: activityData } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      setRecentActivity(activityData || []);

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
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    { title: 'Total Users', value: stats?.totalUsers || 0, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10', sub: `+${stats?.newUsersToday || 0} today` },
    { title: 'Online Now', value: stats?.onlineNow || 0, icon: Wifi, color: 'text-green-500', bg: 'bg-green-500/10', sub: 'Last 5 min', pulse: true },
    { title: 'Active 24h', value: stats?.activeUsers || 0, icon: Activity, color: 'text-emerald-500', bg: 'bg-emerald-500/10', sub: `${stats?.totalUsers ? Math.round((stats.activeUsers / stats.totalUsers) * 100) : 0}% retention` },
    { title: 'Active 7d', value: stats?.active7d || 0, icon: TrendingUp, color: 'text-cyan-500', bg: 'bg-cyan-500/10', sub: 'Weekly active' },
    { title: 'Active 30d', value: stats?.active30d || 0, icon: Target, color: 'text-indigo-500', bg: 'bg-indigo-500/10', sub: 'Monthly active' },
    { title: 'Push Enabled', value: stats?.notificationSubscribers || 0, icon: Bell, color: 'text-orange-500', bg: 'bg-orange-500/10', sub: `${stats?.totalUsers ? Math.round(((stats?.notificationSubscribers || 0) / stats.totalUsers) * 100) : 0}% of users` },
    { title: 'Meal Logs', value: stats?.mealLogs || 0, icon: Calendar, color: 'text-amber-500', bg: 'bg-amber-500/10', sub: `${stats?.mealPlans || 0} plans` },
    { title: 'Recipe Views', value: stats?.totalRecipeViews || 0, icon: Eye, color: 'text-purple-500', bg: 'bg-purple-500/10', sub: `${stats?.totalFavorites || 0} favorites` },
    { title: 'Posts', value: stats?.communityPosts || 0, icon: MessageSquare, color: 'text-pink-500', bg: 'bg-pink-500/10', sub: 'Community' },
    { title: 'Shopping Items', value: stats?.totalShoppingItems || 0, icon: ShoppingCart, color: 'text-teal-500', bg: 'bg-teal-500/10', sub: 'Total items' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3 flex-wrap">
          <Badge variant="outline" className="text-xs">
            Updated: {format(lastUpdate, 'HH:mm:ss')}
          </Badge>
          {stats?.weeklyGrowth !== undefined && (
            <Badge variant={stats.weeklyGrowth >= 0 ? "default" : "destructive"} className="flex items-center gap-1">
              {stats.weeklyGrowth >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {stats.weeklyGrowth >= 0 ? '+' : ''}{stats.weeklyGrowth}% this week
            </Badge>
          )}
          {(stats?.bannedUsers || 0) > 0 && (
            <Badge variant="destructive" className="text-xs">{stats?.bannedUsers} banned</Badge>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {statCards.map((stat) => (
          <Card key={stat.title} className="relative overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground truncate">{stat.title}</span>
                <div className={`p-1.5 rounded-full ${stat.bg} relative`}>
                  <stat.icon className={`h-3.5 w-3.5 ${stat.color}`} />
                  {stat.pulse && (stats?.onlineNow || 0) > 0 && (
                    <span className="absolute top-0 right-0 h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                  )}
                </div>
              </div>
              <div className="text-2xl font-bold">{stat.value.toLocaleString()}</div>
              <p className="text-[10px] text-muted-foreground mt-0.5">{stat.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Activity Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Last 7 Days Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                  <Area type="monotone" dataKey="users" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorUsers)" name="New Users" />
                  <Area type="monotone" dataKey="views" stroke="hsl(var(--chart-2))" fillOpacity={1} fill="url(#colorViews)" name="Recipe Views" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Recipes */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Utensils className="h-4 w-4" /> Top Recipes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-52 overflow-y-auto">
              {topRecipes.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recipe view data yet</p>
              ) : (
                topRecipes.map((r, i) => (
                  <div key={r.recipe_id} className="flex items-center justify-between text-sm py-1.5 border-b border-border/50 last:border-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-bold text-muted-foreground w-5">#{i + 1}</span>
                      <span className="truncate text-xs">{r.recipe_id}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs shrink-0">{r.count} views</Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats + Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">New This Week</p>
            <div className="text-2xl font-bold">{stats?.newUsersWeek || 0}</div>
            <p className="text-[10px] text-muted-foreground">registered users</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">24h Retention</p>
            <div className="text-2xl font-bold">
              {stats?.totalUsers ? Math.round((stats.activeUsers / stats.totalUsers) * 100) : 0}%
            </div>
            <p className="text-[10px] text-muted-foreground">active in last 24h</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Avg Meals/User</p>
            <div className="text-2xl font-bold">
              {stats?.totalUsers ? (stats.mealLogs / stats.totalUsers).toFixed(1) : 0}
            </div>
            <p className="text-[10px] text-muted-foreground">total logged</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Engagement Score</p>
            <div className="text-2xl font-bold">
              {stats?.totalUsers 
                ? Math.round(((stats.mealLogs + stats.communityPosts + stats.totalRecipeViews) / stats.totalUsers) * 10) / 10
                : 0}
            </div>
            <p className="text-[10px] text-muted-foreground">actions per user</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Feed */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="h-4 w-4" /> Recent Activity Feed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground">No activity logged yet. Activity tracking is now active.</p>
            ) : (
              recentActivity.map((a) => (
                <div key={a.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <Badge variant="outline" className="text-[10px] shrink-0">{a.action_type}</Badge>
                    <span className="text-xs text-muted-foreground truncate">
                      {typeof a.action_details === 'object' && a.action_details?.path ? a.action_details.path : JSON.stringify(a.action_details).substring(0, 60)}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {a.created_at ? format(parseISO(a.created_at), 'HH:mm') : ''}
                  </span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
