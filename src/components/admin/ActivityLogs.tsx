import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow, format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { RefreshCw, Filter, User, Calendar, Utensils, MessageSquare, Bell, Settings, ChevronLeft, ChevronRight } from 'lucide-react';

interface ActivityLog {
  id: string;
  user_id: string | null;
  action_type: string;
  action_details: any;
  created_at: string;
  user_name?: string;
}

const ITEMS_PER_PAGE = 20;

const ACTION_CATEGORIES: Record<string, { label: string; icon: typeof User; color: string }> = {
  'login': { label: 'Autenticação', icon: User, color: 'bg-blue-500/10 text-blue-600' },
  'logout': { label: 'Autenticação', icon: User, color: 'bg-blue-500/10 text-blue-600' },
  'signup': { label: 'Autenticação', icon: User, color: 'bg-green-500/10 text-green-600' },
  'meal': { label: 'Refeições', icon: Utensils, color: 'bg-amber-500/10 text-amber-600' },
  'recipe': { label: 'Receitas', icon: Utensils, color: 'bg-amber-500/10 text-amber-600' },
  'post': { label: 'Comunidade', icon: MessageSquare, color: 'bg-purple-500/10 text-purple-600' },
  'comment': { label: 'Comunidade', icon: MessageSquare, color: 'bg-purple-500/10 text-purple-600' },
  'notification': { label: 'Notificações', icon: Bell, color: 'bg-orange-500/10 text-orange-600' },
  'push': { label: 'Notificações', icon: Bell, color: 'bg-orange-500/10 text-orange-600' },
  'settings': { label: 'Definições', icon: Settings, color: 'bg-gray-500/10 text-gray-600' },
  'profile': { label: 'Perfil', icon: User, color: 'bg-indigo-500/10 text-indigo-600' },
};

const getActionCategory = (actionType: string) => {
  const lowerAction = actionType.toLowerCase();
  for (const [key, value] of Object.entries(ACTION_CATEGORIES)) {
    if (lowerAction.includes(key)) return value;
  }
  return { label: 'Outro', icon: Calendar, color: 'bg-gray-500/10 text-gray-600' };
};

const ActivityLogs = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [profiles, setProfiles] = useState<Record<string, string>>({});

  const fetchLogs = async () => {
    try {
      // Fetch logs and profiles in parallel
      const [logsRes, profilesRes] = await Promise.all([
        supabase
          .from('activity_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(200),
        supabase
          .from('profiles')
          .select('id, full_name, mother_name'),
      ]);

      if (logsRes.error) throw logsRes.error;

      // Create profiles lookup
      const profilesMap: Record<string, string> = {};
      profilesRes.data?.forEach(p => {
        profilesMap[p.id] = p.mother_name || p.full_name || 'Utilizador';
      });
      setProfiles(profilesMap);

      // Map logs with user names
      const logsWithNames = logsRes.data?.map(log => ({
        ...log,
        user_name: log.user_id ? profilesMap[log.user_id] : 'Sistema',
      })) || [];

      setLogs(logsWithNames);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchLogs();
  };

  // Filter logs
  const filteredLogs = logs.filter(log => {
    if (filter === 'all') return true;
    const category = getActionCategory(log.action_type);
    return category.label.toLowerCase() === filter.toLowerCase();
  });

  // Pagination
  const totalPages = Math.ceil(filteredLogs.length / ITEMS_PER_PAGE);
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Get unique categories for filter
  const uniqueCategories = Array.from(new Set(logs.map(log => getActionCategory(log.action_type).label)));

  if (loading) {
    return <Skeleton className="h-96 w-full" />;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <CardTitle className="flex items-center gap-2">
            Logs de Actividade
            <Badge variant="outline">{filteredLogs.length}</Badge>
          </CardTitle>
          <div className="flex gap-2">
            <Select value={filter} onValueChange={(value) => { setFilter(value); setCurrentPage(1); }}>
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {uniqueCategories.map(cat => (
                  <SelectItem key={cat} value={cat.toLowerCase()}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              size="icon"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Utilizador</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Acção</TableHead>
                <TableHead>Detalhes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Nenhum log encontrado
                  </TableCell>
                </TableRow>
              ) : (
                paginatedLogs.map((log) => {
                  const category = getActionCategory(log.action_type);
                  const IconComponent = category.icon;
                  
                  return (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">
                            {format(new Date(log.created_at), 'dd/MM/yyyy', { locale: pt })}
                          </div>
                          <div className="text-muted-foreground">
                            {format(new Date(log.created_at), 'HH:mm:ss')}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                            <User className="h-4 w-4" />
                          </div>
                          <span className="font-medium text-sm">
                            {log.user_name || 'Sistema'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={category.color}>
                          <IconComponent className="h-3 w-3 mr-1" />
                          {category.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-mono">
                          {log.action_type}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground max-w-xs truncate">
                          {log.action_details 
                            ? typeof log.action_details === 'object' 
                              ? JSON.stringify(log.action_details).slice(0, 50) + '...'
                              : String(log.action_details)
                            : '-'
                          }
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              Página {currentPage} de {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ActivityLogs;
