import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

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
}

const UserManagement = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // Fetch profiles with session data
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });

        if (profilesError) throw profilesError;

        // Fetch session data for all users
        const { data: sessions } = await supabase
          .from('user_sessions')
          .select('*');

        // Merge profile and session data
        const usersWithSessions = profiles?.map(profile => {
          const session = sessions?.find(s => s.user_id === profile.id);
          return {
            ...profile,
            last_login: session?.last_login,
            last_active: session?.last_active,
            total_sessions: session?.total_sessions || 0
          };
        }) || [];

        setUsers(usersWithSessions);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  if (loading) {
    return <Skeleton className="h-96 w-full" />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Management</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Mother/Baby</TableHead>
              <TableHead>Last Active</TableHead>
              <TableHead>Sessions</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => {
              const lastActive = user.last_active ? new Date(user.last_active) : null;
              const now = new Date();
              const hoursSinceActive = lastActive 
                ? Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 60 * 60))
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
                    {lastActive ? (
                      <div className="text-sm">
                        <div>{lastActive.toLocaleDateString()}</div>
                        <div className="text-muted-foreground">
                          {hoursSinceActive < 1 
                            ? 'Just now'
                            : hoursSinceActive < 24
                            ? `${hoursSinceActive}h ago`
                            : `${Math.floor(hoursSinceActive / 24)}d ago`
                          }
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Never</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {user.total_sessions || 0} sessions
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={isActive ? "default" : "secondary"}>
                      {isActive ? '🟢 Active' : '⚫ Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default UserManagement;
