import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDistanceToNow } from 'date-fns';
import { pt } from 'date-fns/locale';
import { Trash2, Eye, RefreshCw, MessageSquare, Heart, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ForumPost {
  id: string;
  title: string;
  content: string;
  user_id: string;
  created_at: string;
  likes_count: number;
  comments_count: number;
  user_name?: string;
}

interface PostComment {
  id: string;
  content: string;
  post_id: string;
  user_id: string;
  created_at: string;
  user_name?: string;
  post_title?: string;
}

const ContentModeration = () => {
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: 'post' | 'comment'; id: string } | null>(null);
  const { toast } = useToast();

  const fetchContent = async () => {
    try {
      // Fetch posts
      const { data: postsData, error: postsError } = await supabase
        .from('forum_posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (postsError) throw postsError;

      // Fetch comments
      const { data: commentsData, error: commentsError } = await supabase
        .from('post_comments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (commentsError) throw commentsError;

      // Fetch user names for posts
      const postUserIds = [...new Set(postsData?.map(p => p.user_id) || [])];
      const commentUserIds = [...new Set(commentsData?.map(c => c.user_id) || [])];
      const allUserIds = [...new Set([...postUserIds, ...commentUserIds])];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', allUserIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p.full_name]) || []);

      // Get post titles for comments
      const postIds = [...new Set(commentsData?.map(c => c.post_id) || [])];
      const { data: postTitles } = await supabase
        .from('forum_posts')
        .select('id, title')
        .in('id', postIds);

      const postTitleMap = new Map(postTitles?.map(p => [p.id, p.title]) || []);

      setPosts(postsData?.map(p => ({
        ...p,
        user_name: profileMap.get(p.user_id) || 'Desconhecido'
      })) || []);

      setComments(commentsData?.map(c => ({
        ...c,
        user_name: profileMap.get(c.user_id) || 'Desconhecido',
        post_title: postTitleMap.get(c.post_id) || 'Post removido'
      })) || []);

    } catch (error) {
      console.error('Error fetching content:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar conteúdo',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchContent();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchContent();
  };

  const handleDeleteClick = (type: 'post' | 'comment', id: string) => {
    setItemToDelete({ type, id });
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;

    try {
      if (itemToDelete.type === 'post') {
        const { error } = await supabase
          .from('forum_posts')
          .delete()
          .eq('id', itemToDelete.id);

        if (error) throw error;

        setPosts(prev => prev.filter(p => p.id !== itemToDelete.id));
      } else {
        const { error } = await supabase
          .from('post_comments')
          .delete()
          .eq('id', itemToDelete.id);

        if (error) throw error;

        setComments(prev => prev.filter(c => c.id !== itemToDelete.id));
      }

      toast({
        title: '✅ Removido',
        description: `${itemToDelete.type === 'post' ? 'Post' : 'Comentário'} removido com sucesso`,
      });
    } catch (error: any) {
      console.error('Error deleting:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Falha ao remover',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  if (loading) {
    return <Skeleton className="h-96 w-full" />;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Moderação de Conteúdo
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
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="posts" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Posts ({posts.length})
            </TabsTrigger>
            <TabsTrigger value="comments" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Comentários ({comments.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="mt-4">
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Autor</TableHead>
                    <TableHead>Engajamento</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Acções</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {posts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Nenhum post encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    posts.map((post) => (
                      <TableRow key={post.id}>
                        <TableCell className="font-medium max-w-xs truncate">
                          {post.title}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {post.user_name}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3 text-sm">
                            <span className="flex items-center gap-1">
                              <Heart className="h-3 w-3 text-red-500" />
                              {post.likes_count || 0}
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageSquare className="h-3 w-3 text-blue-500" />
                              {post.comments_count || 0}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: pt })}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick('post', post.id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="comments" className="mt-4">
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Comentário</TableHead>
                    <TableHead>Post</TableHead>
                    <TableHead>Autor</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Acções</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {comments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Nenhum comentário encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    comments.map((comment) => (
                      <TableRow key={comment.id}>
                        <TableCell className="max-w-xs truncate">
                          {comment.content}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                          {comment.post_title}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {comment.user_name}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: pt })}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick('comment', comment.id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Remoção</AlertDialogTitle>
            <AlertDialogDescription>
              Tem a certeza que deseja remover este {itemToDelete?.type === 'post' ? 'post' : 'comentário'}? 
              Esta acção não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-500 hover:bg-red-600">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default ContentModeration;
