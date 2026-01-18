import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Activity, 
  Bell, 
  Database, 
  Key, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Server,
  Users,
  HardDrive
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { pt } from 'date-fns/locale';

interface HealthStatus {
  vapidConfigured: boolean;
  pushSubscriptions: {
    total: number;
    active: number;
  };
  recentNotifications: {
    total: number;
    successful: number;
    failed: number;
  };
  database: {
    profiles: number;
    sessions: number;
    mealLogs: number;
  };
  edgeFunctions: {
    name: string;
    status: 'ok' | 'warning' | 'error';
    lastRun?: string;
  }[];
}

const SystemHealth = () => {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const checkHealth = async () => {
    try {
      // Check VAPID configuration
      let vapidConfigured = false;
      try {
        const { data } = await supabase.functions.invoke('get-vapid-key');
        vapidConfigured = !!data?.vapidPublicKey;
      } catch (e) {
        console.error('VAPID check error:', e);
      }

      // Get push subscription stats
      const { data: allSubs, count: totalSubs } = await supabase
        .from('push_subscriptions')
        .select('*', { count: 'exact' });

      // Get recent notification stats
      const { data: recentNotifs } = await supabase
        .from('admin_notifications')
        .select('successful_count, failed_count')
        .order('created_at', { ascending: false })
        .limit(10);

      const notifStats = recentNotifs?.reduce(
        (acc, n) => ({
          total: acc.total + (n.successful_count || 0) + (n.failed_count || 0),
          successful: acc.successful + (n.successful_count || 0),
          failed: acc.failed + (n.failed_count || 0),
        }),
        { total: 0, successful: 0, failed: 0 }
      ) || { total: 0, successful: 0, failed: 0 };

      // Get database stats
      const [profilesRes, sessionsRes, mealsRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('user_sessions').select('id', { count: 'exact', head: true }),
        supabase.from('meal_logs').select('id', { count: 'exact', head: true }),
      ]);

      // Get activity logs to check edge function health
      const { data: activityLogs } = await supabase
        .from('activity_logs')
        .select('action_type, created_at')
        .order('created_at', { ascending: false })
        .limit(100);

      // Define edge functions to monitor
      const edgeFunctions = [
        { name: 'notify-all-users', actionType: 'notification_sent' },
        { name: 'baby-birthday-check', actionType: 'birthday_check' },
        { name: 'check-meal-reminders', actionType: 'meal_reminder' },
        { name: 'rotate-challenges', actionType: 'challenge_rotation' },
      ];

      const edgeFunctionStatus = edgeFunctions.map(fn => {
        const lastLog = activityLogs?.find(l => 
          l.action_type.toLowerCase().includes(fn.actionType.replace('_', ''))
        );
        return {
          name: fn.name,
          status: 'ok' as const,
          lastRun: lastLog?.created_at,
        };
      });

      setHealth({
        vapidConfigured,
        pushSubscriptions: {
          total: totalSubs || 0,
          active: allSubs?.length || 0,
        },
        recentNotifications: notifStats,
        database: {
          profiles: profilesRes.count || 0,
          sessions: sessionsRes.count || 0,
          mealLogs: mealsRes.count || 0,
        },
        edgeFunctions: edgeFunctionStatus,
      });

    } catch (error) {
      console.error('Health check error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    checkHealth();
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  const StatusIcon = ({ status }: { status: 'ok' | 'warning' | 'error' }) => {
    switch (status) {
      case 'ok':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Estado do Sistema
        </h3>
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* VAPID Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Key className="h-4 w-4 text-amber-500" />
              VAPID Keys
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">
                {health?.vapidConfigured ? 'Configurado' : 'Não Configurado'}
              </span>
              <StatusIcon status={health?.vapidConfigured ? 'ok' : 'error'} />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Necessário para notificações push
            </p>
          </CardContent>
        </Card>

        {/* Push Subscriptions */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Bell className="h-4 w-4 text-blue-500" />
              Subscrições Push
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{health?.pushSubscriptions.total}</span>
              <Badge variant="outline" className="bg-green-500/10 text-green-600">
                {health?.pushSubscriptions.active} activas
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Dispositivos registados
            </p>
          </CardContent>
        </Card>

        {/* Recent Notifications */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Bell className="h-4 w-4 text-purple-500" />
              Notificações Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{health?.recentNotifications.total}</span>
              <div className="flex gap-2">
                <Badge variant="outline" className="bg-green-500/10 text-green-600">
                  ✓ {health?.recentNotifications.successful}
                </Badge>
                {(health?.recentNotifications.failed || 0) > 0 && (
                  <Badge variant="outline" className="bg-red-500/10 text-red-600">
                    ✗ {health?.recentNotifications.failed}
                  </Badge>
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Últimas 10 campanhas
            </p>
          </CardContent>
        </Card>

        {/* Database Stats */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Database className="h-4 w-4 text-green-500" />
              Base de Dados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Perfis</span>
                <span className="font-medium">{health?.database.profiles.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sessões</span>
                <span className="font-medium">{health?.database.sessions.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Refeições</span>
                <span className="font-medium">{health?.database.mealLogs.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Edge Functions */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Server className="h-4 w-4 text-indigo-500" />
              Edge Functions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {health?.edgeFunctions.map((fn) => (
                <div 
                  key={fn.name}
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                >
                  <div>
                    <p className="font-medium text-sm">{fn.name}</p>
                    {fn.lastRun && (
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(fn.lastRun), { addSuffix: true, locale: pt })}
                      </p>
                    )}
                  </div>
                  <StatusIcon status={fn.status} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SystemHealth;
