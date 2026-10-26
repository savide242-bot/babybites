import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDistanceToNow } from 'date-fns';
import { pt } from 'date-fns/locale';
import { 
  Trash2, Eye, RefreshCw, MessageSquare, Heart, AlertTriangle, 
  Film, ShieldAlert, CheckCircle, Ban, Bell, ExternalLink, Sparkles 
} from 'lucide-react';
import { toast } from 'sonner';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export interface AdminModerationPost {
  id: string;
  title: string;
  content: string;
  user_id: string;
  author_name: string;
  author_baby?: string;
  created_at: string;
  media_urls?: string[] | null;
  media_type?: 'image' | 'video';
  topic?: string;
  status?: 'published' | 'under_review' | 'hidden' | 'banned';
  likes_count: number;
  comments_count: number;
  reports_count?: number;
}

const LOCAL_POSTS_KEY = "babybites_community_local_posts_v2";

export const ContentModeration = () => {
  const [posts, setPosts] = useState<AdminModerationPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'videos' | 'reported'>('all');
  
  // Dialogs
  const [inspectPost, setInspectPost] = useState<AdminModerationPost | null>(null);
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    type: 'delete' | 'ban_user' | 'hide';
    post: AdminModerationPost | null;
  }>({ open: false, type: 'delete', post: null });

  const fetchContent = async () => {
    try {
      // 1. Fetch from Supabase forum_posts
      const { data: postsData } = await supabase
        .from('forum_posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      // 2. Fetch locally stored community posts (to sync immediate test posts)
      let localPosts: AdminModerationPost[] = [];
      try {
        const saved = localStorage.getItem(LOCAL_POSTS_KEY);
        if (saved) {
          localPosts = JSON.parse(saved);
        }
      } catch (e) {
        console.error(e);
      }

      // 3. Fallback demo sample posts
      const demoPosts: AdminModerationPost[] = [
        {
          id: "sample-1",
          user_id: "usr-1",
          author_name: "Sarah Jenkins",
          author_baby: "Noah • 7m",
          title: "Primeira vez com brócolos no vapor! 🥦👶",
          content: "Fez caretas engraçadas no início, mas depois mastigou os raminhos por 10 minutos seguidos!",
          media_urls: ["https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80"],
          media_type: "image",
          topic: "🥦 BLW & Introdução Alimentar",
          status: "published",
          likes_count: 24,
          comments_count: 2,
          created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
        },
        {
          id: "sample-2",
          user_id: "usr-2",
          author_name: "Emily Rodriguez",
          author_baby: "Maya • 11m",
          title: "Biscoitinhos de Banana & Aveia no congelador! 🍌✨",
          content: "Fiz 50 mini biscoitos em 20 minutos direto da secção de receitas. Práticos e nutritivos.",
          media_urls: ["https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=800&q=80"],
          media_type: "image",
          topic: "🥣 Papinhas & Receitas",
          status: "published",
          likes_count: 42,
          comments_count: 5,
          created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
        },
        {
          id: "sample-video-1",
          user_id: "usr-demo-video",
          author_name: "Mariana Costa",
          author_baby: "Tomás • 8m",
          title: "Vídeo: Reacção fofa à 1ª papinha de abóbora! 🎃🥄",
          content: "Gravado hoje ao almoço. A segurar a colher com as próprias mãozinhas!",
          media_urls: ["https://assets.mixkit.co/videos/preview/mixkit-mother-feeding-her-baby-boy-41318-large.mp4"],
          media_type: "video",
          topic: "👶 Vídeos & Conquistas",
          status: "under_review",
          likes_count: 15,
          comments_count: 3,
          created_at: new Date(Date.now() - 1800000).toISOString(),
        },
      ];

      // Merge and deduplicate by id
      const formattedSupabase: AdminModerationPost[] = (postsData || []).map((p: any) => ({
        id: p.id,
        user_id: p.user_id,
        author_name: p.author_name || "Mãe da Comunidade",
        author_baby: p.author_baby || "Bebé • 8m",
        title: p.title,
        content: p.content,
        media_urls: p.image_urls || (p.video_url ? [p.video_url] : null),
        media_type: p.media_type || (p.video_url ? 'video' : 'image'),
        topic: p.topic || "🥦 BLW & Introdução Alimentar",
        status: p.status || 'published',
        likes_count: p.likes_count || 0,
        comments_count: p.comments_count || 0,
        reports_count: p.reports_count || 0,
        created_at: p.created_at,
      }));

      const combined = [...localPosts, ...formattedSupabase, ...demoPosts];
      const unique = Array.from(new Map(combined.map((item) => [item.id, item])).values());
      setPosts(unique);
    } catch (error) {
      console.error('Error fetching moderation content:', error);
      toast.error('Falha ao carregar conteúdos para moderação');
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

  // Admin Actions
  const handleApprove = (post: AdminModerationPost) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === post.id ? { ...p, status: 'published' } : p))
    );
    toast.success(`Post de ${post.author_name} aprovado e verificado! ✅`);
  };

  const handleExecuteAction = async () => {
    const { type, post } = actionDialog;
    if (!post) return;

    try {
      if (type === 'delete') {
        // Delete from Supabase
        await supabase.from('forum_posts').delete().eq('id', post.id);

        // Delete from local state
        setPosts((prev) => prev.filter((p) => p.id !== post.id));

        // Update localStorage
        try {
          const saved = localStorage.getItem(LOCAL_POSTS_KEY);
          if (saved) {
            const parsed = JSON.parse(saved);
            const filtered = parsed.filter((p: any) => p.id !== post.id);
            localStorage.setItem(LOCAL_POSTS_KEY, JSON.stringify(filtered));
          }
        } catch (e) {
          console.error(e);
        }

        toast.success(`Publicação removida com sucesso da plataforma! 🗑️`);
      } else if (type === 'hide') {
        setPosts((prev) =>
          prev.map((p) => (p.id === post.id ? { ...p, status: 'hidden' } : p))
        );
        toast.success(`Publicação ocultada da comunidade.`);
      } else if (type === 'ban_user') {
        // Mark user as suspended in profiles
        await supabase
          .from('profiles')
          .update({ is_suspended: true })
          .eq('id', post.user_id);

        // Hide all posts from this user
        setPosts((prev) =>
          prev.map((p) =>
            p.user_id === post.user_id ? { ...p, status: 'banned' } : p
          )
        );
        toast.error(`Usuário ${post.author_name} foi suspenso/banido da plataforma! 🚫`);
      }
    } catch (err) {
      console.error(err);
      toast.error("Ocorreu um erro ao executar a acção.");
    } finally {
      setActionDialog({ open: false, type: 'delete', post: null });
      if (inspectPost?.id === post.id) {
        setInspectPost(null);
      }
    }
  };

  // Filter posts
  const filteredPosts = posts.filter((p) => {
    if (activeFilter === 'pending') return p.status === 'under_review';
    if (activeFilter === 'videos') return p.media_type === 'video';
    if (activeFilter === 'reported') return (p.reports_count || 0) > 0 || p.status === 'hidden';
    return true;
  });

  const pendingCount = posts.filter((p) => p.status === 'under_review').length;

  if (loading) {
    return <Skeleton className="h-96 w-full rounded-2xl" />;
  }

  return (
    <div className="space-y-6">
      {/* Super Admin Alert Notification Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-forest/10 to-emerald-500/10 border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-sm shrink-0 animate-bounce">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
              <span>Painel de Moderação Social Ativo</span>
              <Badge variant="outline" className="bg-amber-100 text-amber-800 text-[10px] border-amber-300">
                octaviomoiane2007@gmail.com
              </Badge>
            </h4>
            <p className="text-xs text-gray-600 mt-0.5">
              Recebe alertas instantâneos de novos vídeos, fotos e publicações de mães para manter a comunidade segura.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
            className="rounded-full text-xs h-8 border-[#EBE8DF]"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>
      </div>

      <Card className="rounded-[24px] border border-[#EBE8DF] shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-xl font-serif text-forest flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-forest" />
                <span>Moderação da Rede Social de Mães</span>
              </CardTitle>
              <CardDescription className="text-xs text-gray-500">
                Avalie vídeos e fotos, aprove conteúdos adequados ou remova publicações fora do foco da maternidade.
              </CardDescription>
            </div>

            {/* Quick Filters */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setActiveFilter('all')}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  activeFilter === 'all'
                    ? 'bg-forest text-white'
                    : 'bg-stone-100 text-gray-600 hover:bg-stone-200'
                }`}
              >
                Todas ({posts.length})
              </button>
              <button
                onClick={() => setActiveFilter('pending')}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all flex items-center gap-1 ${
                  activeFilter === 'pending'
                    ? 'bg-amber-500 text-white'
                    : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                }`}
              >
                <span>Pendentes</span>
                {pendingCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-white text-amber-700 text-[10px] flex items-center justify-center font-bold">
                    {pendingCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveFilter('videos')}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all flex items-center gap-1 ${
                  activeFilter === 'videos'
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                }`}
              >
                <Film className="w-3 h-3" />
                <span>Vídeos</span>
              </button>
              <button
                onClick={() => setActiveFilter('reported')}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  activeFilter === 'reported'
                    ? 'bg-red-500 text-white'
                    : 'bg-red-50 text-red-700 hover:bg-red-100'
                }`}
              >
                Denunciadas
              </button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="rounded-xl border border-stone-200 overflow-x-auto">
            <Table>
              <TableHeader className="bg-[#FAF9F5]">
                <TableRow>
                  <TableHead className="w-16">Mídia</TableHead>
                  <TableHead>Publicação & Tópico</TableHead>
                  <TableHead>Mãe & Bebé</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Acções de Gestão</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPosts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-gray-400 text-xs">
                      Nenhuma publicação encontrada para este filtro.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPosts.map((post) => {
                    const hasMedia = post.media_urls && post.media_urls.length > 0;
                    const mediaSrc = hasMedia ? post.media_urls![0] : null;
                    const isVideo = post.media_type === 'video';

                    return (
                      <TableRow key={post.id} className="hover:bg-stone-50/60 transition-colors">
                        {/* Media Thumbnail */}
                        <TableCell>
                          {hasMedia ? (
                            <div
                              onClick={() => setInspectPost(post)}
                              className="w-12 h-12 rounded-lg overflow-hidden bg-stone-100 border border-stone-200 relative cursor-pointer group shrink-0"
                            >
                              {isVideo ? (
                                <div className="w-full h-full bg-stone-900 flex items-center justify-center text-white">
                                  <Film className="w-5 h-5 text-amber-400" />
                                </div>
                              ) : (
                                <img
                                  src={mediaSrc!}
                                  alt={post.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                />
                              )}
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                                <Eye className="w-3.5 h-3.5" />
                              </div>
                            </div>
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-stone-100 flex items-center justify-center text-gray-400 text-[10px]">
                              Sem foto
                            </div>
                          )}
                        </TableCell>

                        {/* Title & Topic */}
                        <TableCell>
                          <div className="max-w-xs">
                            <h5
                              onClick={() => setInspectPost(post)}
                              className="text-xs font-semibold text-gray-900 truncate hover:text-forest cursor-pointer"
                            >
                              {post.title}
                            </h5>
                            <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">
                              {post.content}
                            </p>
                            <span className="inline-block mt-1 text-[10px] bg-[#EAF5EF] text-[#1E5E3A] px-2 py-0.5 rounded-full font-medium">
                              {post.topic || "Geral"}
                            </span>
                          </div>
                        </TableCell>

                        {/* Author */}
                        <TableCell>
                          <div className="text-xs font-medium text-gray-800">
                            {post.author_name}
                          </div>
                          <div className="text-[10px] text-gray-400">
                            {post.author_baby || "Bebé • 8m"}
                          </div>
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          {post.status === 'published' && (
                            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px]">
                              Aprovado
                            </Badge>
                          )}
                          {post.status === 'under_review' && (
                            <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-[10px] animate-pulse">
                              Revisão Pendente
                            </Badge>
                          )}
                          {post.status === 'hidden' && (
                            <Badge className="bg-stone-100 text-stone-700 text-[10px]">
                              Ocultado
                            </Badge>
                          )}
                          {post.status === 'banned' && (
                            <Badge className="bg-red-100 text-red-800 border-red-300 text-[10px]">
                              Suspenso
                            </Badge>
                          )}
                        </TableCell>

                        {/* Date */}
                        <TableCell className="text-[11px] text-gray-500">
                          {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: pt })}
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setInspectPost(post)}
                              title="Avaliar e Inspecionar"
                              className="h-8 w-8 p-0 text-gray-600 hover:text-forest"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>

                            {post.status !== 'published' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleApprove(post)}
                                title="Aprovar e Publicar"
                                className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            )}

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setActionDialog({ open: true, type: 'ban_user', post })
                              }
                              title="Suspender/Banir Usuário"
                              className="h-8 w-8 p-0 text-amber-600 hover:text-amber-800 hover:bg-amber-50"
                            >
                              <Ban className="h-4 w-4" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setActionDialog({ open: true, type: 'delete', post })
                              }
                              title="Excluir Post da Plataforma"
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Media Inspection Modal (Photo & Video Player for Admin) */}
      {inspectPost && (
        <Dialog open={!!inspectPost} onOpenChange={() => setInspectPost(null)}>
          <DialogContent className="max-w-lg rounded-[28px] p-5 bg-white border border-[#EBE8DF]">
            <DialogHeader>
              <DialogTitle className="font-serif text-xl text-forest flex items-center justify-between">
                <span>Avaliação de Conteúdo Social</span>
                <span className="text-xs bg-[#EAF5EF] text-[#1E5E3A] px-2.5 py-0.5 rounded-full font-sans">
                  {inspectPost.author_name} ({inspectPost.author_baby})
                </span>
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              {/* Photo or Video Player */}
              {inspectPost.media_urls && inspectPost.media_urls.length > 0 && (
                <div className="rounded-2xl overflow-hidden aspect-video bg-black flex items-center justify-center">
                  {inspectPost.media_type === 'video' ? (
                    <video
                      src={inspectPost.media_urls[0]}
                      controls
                      autoPlay
                      playsInline
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <img
                      src={inspectPost.media_urls[0]}
                      alt={inspectPost.title}
                      className="w-full h-full object-contain"
                    />
                  )}
                </div>
              )}

              <div>
                <h4 className="font-bold text-gray-900 text-sm">{inspectPost.title}</h4>
                <p className="text-xs text-gray-700 mt-1 leading-relaxed bg-[#FAF9F5] p-3 rounded-xl border border-stone-100">
                  {inspectPost.content}
                </p>
              </div>

              {/* Engagement details */}
              <div className="flex items-center gap-4 text-xs text-gray-500 pt-1">
                <span className="flex items-center gap-1 font-semibold text-gray-700">
                  <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />
                  {inspectPost.likes_count} Curtidas
                </span>
                <span className="flex items-center gap-1 font-semibold text-gray-700">
                  <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
                  {inspectPost.comments_count} Comentários
                </span>
                <span className="text-gray-400">
                  Postado em {new Date(inspectPost.created_at).toLocaleString('pt-PT')}
                </span>
              </div>

              {/* Action Buttons for Admin */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-stone-200">
                <Button
                  onClick={() => {
                    handleApprove(inspectPost);
                    setInspectPost(null);
                  }}
                  className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-10 gap-1.5"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Aprovar</span>
                </Button>

                <Button
                  variant="outline"
                  onClick={() => {
                    setActionDialog({ open: true, type: 'ban_user', post: inspectPost });
                  }}
                  className="rounded-full border-amber-300 text-amber-700 hover:bg-amber-50 text-xs h-10 gap-1.5"
                >
                  <Ban className="w-3.5 h-3.5" />
                  <span>Banir Mãe</span>
                </Button>

                <Button
                  variant="destructive"
                  onClick={() => {
                    setActionDialog({ open: true, type: 'delete', post: inspectPost });
                  }}
                  className="rounded-full text-xs h-10 gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Excluir</span>
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Confirmation Dialog */}
      <AlertDialog
        open={actionDialog.open}
        onOpenChange={(open) => !open && setActionDialog({ open: false, type: 'delete', post: null })}
      >
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionDialog.type === 'delete' && 'Excluir Publicação da Comunidade'}
              {actionDialog.type === 'ban_user' && 'Suspender e Banir Usuário'}
              {actionDialog.type === 'hide' && 'Ocultar Publicação'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionDialog.type === 'delete' &&
                `Tem certeza que deseja apagar permanentemente o post "${actionDialog.post?.title}"? Esta acção não poderá ser revertida.`}
              {actionDialog.type === 'ban_user' &&
                `Tem certeza que deseja suspender a conta de ${actionDialog.post?.author_name}? O utilizador perderá o acesso para postar no app.`}
              {actionDialog.type === 'hide' &&
                'A publicação ficará oculta para as mães até que seja revisada.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleExecuteAction}
              className={`rounded-full ${
                actionDialog.type === 'delete' || actionDialog.type === 'ban_user'
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-forest hover:bg-forest/90'
              }`}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ContentModeration;
