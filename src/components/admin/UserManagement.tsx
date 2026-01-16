import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDistanceToNow } from 'date-fns';
import { Search, Filter, Bell, BellOff, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';

interface UserProfile {
  id: string;
  full_name: string;
  mother_name: string | null;
  baby_name: string | null;
  created_at: string;
  dietary_preferences: string[] | null;
  last_login?: string;
  last_active?: string;
  total_sessions?: number;
  hasPush?: boolean;
}

const ITEMS_PER_PAGE = 10;

const UserManagement = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [pushFilter, setPushFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);

  const fetchUsers = async () => {
    try {
      // Fetch profiles, sessions, and push subscriptions in parallel
      const [profilesRes, sessionsRes, pushSubsRes] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('user_sessions').select('*'),
        supabase.from('push_subscriptions').select('user_id'),
      ]);

      if (profilesRes.error) throw profilesRes.error;

      const pushUserIds = new Set(pushSubsRes.data?.map(p => p.user_id) || []);

      // Merge all data
      const usersWithData = profilesRes.data?.map(profile => {
        const session = sessionsRes.data?.find(s => s.user_id === profile.id);
        return {
          ...profile,
          last_login: session?.last_login,
          last_active: session?.last_active,
          total_sessions: session?.total_sessions || 0,
          hasPush: pushUserIds.has(profile.id),
        };
      }) || [];

      // Filter out generic profiles
      const realUsers = usersWithData.filter(user => 
        user.full_name !== 'User' || sessionsRes.data?.some(s => s.user_id === user.id)
      );

      // Sort by last_active
      realUsers.sort((a, b) => {
        if (a.last_active && b.last_active) {
          return new Date(b.last_active).getTime() - new Date(a.last_active).getTime();
        }
        if (a.last_active) return -1;
        if (b.last_active) return 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      setUsers(realUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  // Filter and search logic
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      // Search filter
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
        user.full_name?.toLowerCase().includes(searchLower) ||
        user.mother_name?.toLowerCase().includes(searchLower) ||
        user.baby_name?.toLowerCase().includes(searchLower);

      // Status filter
      const lastActive = user.last_active ? new Date(user.last_active) : null;
      const hoursSinceActive = lastActive 
        ? Math.floor((Date.now() - lastActive.getTime()) / (1000 * 60 * 60))
        : null;
      const isActive = hoursSinceActive !== null && hoursSinceActive < 24;
      
      const matchesStatus = statusFilter === 'all' ||
        (statusFilter === 'active' && isActive) ||
        (statusFilter === 'inactive' && !isActive);

      // Push filter
      const matchesPush = pushFilter === 'all' ||
        (pushFilter === 'enabled' && user.hasPush) ||
        (pushFilter === 'disabled' && !user.hasPush);

      return matchesSearch && matchesStatus && matchesPush;
    });
  }, [users, searchTerm, statusFilter, pushFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, pushFilter]);

  if (loading) {
    return <Skeleton className="h-96 w-full" />;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <CardTitle className="flex items-center gap-2">
            Gestão de Utilizadores
            <Badge variant="outline" className="text-sm">
              {filteredUsers.length} de {users.length}
            </Badge>
          </CardTitle>
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

        {/* Filters */}
        <div className="flex flex-col gap-3 mt-4 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar por nome, mãe ou bebé..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Activos</SelectItem>
              <SelectItem value="inactive">Inactivos</SelectItem>
            </SelectContent>
          </Select>
          <Select value={pushFilter} onValueChange={setPushFilter}>
            <SelectTrigger className="w-full md:w-40">
              <Bell className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Push" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="enabled">Com Push</SelectItem>
              <SelectItem value="disabled">Sem Push</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Mãe/Bebé</TableHead>
                <TableHead>Push</TableHead>
                <TableHead>Última Actividade</TableHead>
                <TableHead>Sessões</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Registo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhum utilizador encontrado
                  </TableCell>
                </TableRow>
              ) : (
                paginatedUsers.map((user) => {
                  const lastActive = user.last_active ? new Date(user.last_active) : null;
                  const hoursSinceActive = lastActive 
                    ? Math.floor((Date.now() - lastActive.getTime()) / (1000 * 60 * 60))
                    : null;
                  const isActive = hoursSinceActive !== null && hoursSinceActive < 24;
                  
                  return (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.full_name}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm space-y-1">
                          {user.mother_name && (
                            <div className="text-muted-foreground">
                              👩 {user.mother_name}
                            </div>
                          )}
                          {user.baby_name && (
                            <div className="text-muted-foreground">
                              👶 {user.baby_name}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.hasPush ? (
                          <Badge variant="default" className="bg-green-500/10 text-green-600 hover:bg-green-500/20">
                            <Bell className="h-3 w-3 mr-1" />
                            Activo
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            <BellOff className="h-3 w-3 mr-1" />
                            Não
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {lastActive ? (
                          <div className="text-sm">
                            <div>{lastActive.toLocaleDateString('pt-PT')}</div>
                            <div className="text-muted-foreground">
                              {hoursSinceActive !== null && hoursSinceActive < 1 
                                ? 'Agora'
                                : hoursSinceActive !== null && hoursSinceActive < 24
                                ? `${hoursSinceActive}h atrás`
                                : hoursSinceActive !== null
                                ? `${Math.floor(hoursSinceActive / 24)}d atrás`
                                : ''
                              }
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Nunca</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {user.total_sessions || 0}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={isActive ? "default" : "secondary"}>
                          {isActive ? '🟢 Activo' : '⚫ Inactivo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
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

export default UserManagement;
