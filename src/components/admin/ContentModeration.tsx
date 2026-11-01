import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Trash2, Eye, RefreshCw, MessageSquare, Heart, AlertTriangle, 
  Film, ShieldAlert, CheckCircle, Ban, Bell, ExternalLink, Sparkles,
  Search, Check, ShieldCheck, Flag, User, Clock, Image as ImageIcon
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { 
  COMMUNITY_LOCAL_POSTS_KEY, 
  getDeletedPostIds, 
  deletePostGlobally, 
  getCommunityReports, 
  dismissReport, 
  deleteReportedPost,
  CommunityReport 
} from '@/services/communityService';

export interface AdminModerationPost {
  id: string;
  title: string;
  content: string;
  user_id: string;
  author_name: string;
  author_baby?: string;
  author_avatar?: string;
  created_at: string;
  media_urls?: string[] | null;
  media_type?: 'image' | 'video';
  video_url?: string;
  image_urls?: string[];
  topic?: string;
  likes_count: number;
  comments_count: number;
}

export const ContentModeration = () => {
  const [posts, setPosts] = useState<AdminModerationPost[]>([]);
  const [reports, setReports] = useState<CommunityReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mediaFilter, setMediaFilter] = useState<'all' | 'videos' | 'images'>('all');
  const [activeTab, setActiveTab] = useState<'posts' | 'reports'>('posts');
  
  // Inspection & Deletion dialogs
  const [inspectPost, setInspectPost] = useState<AdminModerationPost | null>(null);
  const [postToDelete, setPostToDelete] = useState<AdminModerationPost | null>(null);
  const [reportToResolve, setReportToResolve] = useState<{ report: CommunityReport; action: 'delete' | 'dismiss' } | null>(null);

  const fetchContent = async () => {
    try {
      const deletedIds = getDeletedPostIds();

      // 1. Fetch from Supabase forum_posts
      const { data: postsData } = await supabase
        .from('forum_posts')
        .select('*')
        .neq('title', '__SYSTEM_RECIPE_OVERRIDES__')
        .order('created_at', { ascending: false })
        .limit(60);

      // 2. Fetch locally stored community posts
      let localPosts: any[] = [];
      try {
        const saved = localStorage.getItem(COMMUNITY_LOCAL_POSTS_KEY);
        if (saved) {
          localPosts = JSON.parse(saved);
        }
      } catch (e) {
        console.error(e);
      }

      // Merge and format
      const formattedSupabase: AdminModerationPost[] = (postsData || []).map((p: any) => ({
        id: p.id,
        user_id: p.user_id,
        author_name: p.author_name || "Community Mother",
        author_baby: p.author_baby || "Baby • 7m",
        author_avatar: p.author_avatar,
        title: p.title,
        content: p.content,
        media_urls: p.image_urls || (p.video_url ? [p.video_url] : null),
        media_type: p.media_type || (p.video_url ? 'video' : 'image'),
        video_url: p.video_url,
        image_urls: p.image_urls,
        topic: p.topic || "🥦 BLW & Weaning",
        likes_count: p.likes_count || 0,
        comments_count: p.comments_count || 0,
        created_at: p.created_at,
      }));

      const formattedLocal: AdminModerationPost[] = localPosts.map((p: any) => ({
        id: p.id,
        user_id: p.user_id || "guest",
        author_name: p.author_name || "Community Mother",
        author_baby: p.author_baby || "Baby • 7m",
        author_avatar: p.author_avatar,
        title: p.title || "",
        content: p.content || "",
        media_urls: p.image_urls || (p.video_url ? [p.video_url] : null),
        media_type: p.media_type || (p.video_url ? 'video' : 'image'),
        video_url: p.video_url,
        image_urls: p.image_urls,
        topic: p.topic || "🥦 BLW & Weaning",
        likes_count: p.likes_count || 0,
        comments_count: p.comments_count || 0,
        created_at: p.created_at || new Date().toISOString(),
      }));

      const combined = [...formattedLocal, ...formattedSupabase];
      const unique = Array.from(new Map(combined.map((item) => [item.id, item])).values())
        .filter((post) => !deletedIds.includes(post.id));

      setPosts(unique);

      // Load Reports
      const allReports = getCommunityReports();
      setReports(allReports);
    } catch (error) {
      console.error('Error fetching admin moderation content:', error);
      toast.error('Failed to load moderation content.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchContent();

    // Listen to real-time events from community
    const onPostDeleted = () => fetchContent();
    const onPostReported = () => fetchContent();
    const onReportsUpdated = () => fetchContent();

    window.addEventListener("babygram:post_deleted", onPostDeleted);
    window.addEventListener("babygram:post_reported", onPostReported);
    window.addEventListener("babygram:reports_updated", onReportsUpdated);

    return () => {
      window.removeEventListener("babygram:post_deleted", onPostDeleted);
      window.removeEventListener("babygram:post_reported", onPostReported);
      window.removeEventListener("babygram:reports_updated", onReportsUpdated);
    };
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchContent();
  };

  // Direct Post Deletion by Admin
  const handleConfirmDeletePost = async () => {
    if (!postToDelete) return;
    const postId = postToDelete.id;

    try {
      await deletePostGlobally(postId);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      toast.success("Post deleted permanently from the Community! 🗑️");
    } catch (e) {
      console.error(e);
      toast.error("Could not delete post.");
    } finally {
      setPostToDelete(null);
      if (inspectPost?.id === postId) {
        setInspectPost(null);
      }
    }
  };

  // Report resolution
  const handleExecuteReportAction = async () => {
    if (!reportToResolve) return;
    const { report, action } = reportToResolve;

    try {
      if (action === 'delete') {
        await deleteReportedPost(report.id, report.post_id);
        setPosts((prev) => prev.filter((p) => p.id !== report.post_id));
        setReports((prev) =>
          prev.map((r) => (r.id === report.id ? { ...r, status: 'resolved' as const } : r))
        );
        toast.success(`Post removed and report marked as resolved! 🛡️`);
      } else {
        dismissReport(report.id);
        setReports((prev) =>
          prev.map((r) => (r.id === report.id ? { ...r, status: 'dismissed' as const } : r))
        );
        toast.info("Report dismissed.");
      }
    } catch (e) {
      console.error(e);
      toast.error("Action could not be completed.");
    } finally {
      setReportToResolve(null);
    }
  };

  // Filter posts
  const filteredPosts = posts.filter((p) => {
    const matchesMedia = 
      mediaFilter === 'all' 
        ? true 
        : mediaFilter === 'videos' 
        ? p.media_type === 'video' || !!p.video_url
        : p.media_type === 'image' || (!p.video_url && (p.image_urls?.length ?? 0) > 0);

    const matchesSearch = 
      !searchQuery.trim() ||
      p.author_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.content?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesMedia && matchesSearch;
  });

  const pendingReports = reports.filter((r) => r.status === 'pending');
  const videosCount = posts.filter((p) => p.media_type === 'video' || !!p.video_url).length;

  return (
    <div className="space-y-6">
      {/* Header & KPI Summary */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-[#161c18] p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs">
        <div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2.5">
            <Sparkles className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <span>Community Feed & Moderation</span>
          </h2>
          <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">
            Mothers publish directly to BabyGram without waiting for pre-approval. You can review all videos and posts here and remove any inappropriate content immediately.
          </p>
        </div>

        <Button
          onClick={handleRefresh}
          variant="outline"
          disabled={refreshing}
          className="rounded-full gap-2 border-stone-200 dark:border-stone-700 font-medium shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-white dark:bg-[#161c18] border-stone-200 dark:border-stone-800">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Live Posts</p>
              <p className="text-2xl font-bold text-stone-900 dark:text-stone-100 mt-0.5">{posts.length}</p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">Visible to all mothers</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <MessageSquare className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-[#161c18] border-stone-200 dark:border-stone-800">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Shared Videos</p>
              <p className="text-2xl font-bold text-stone-900 dark:text-stone-100 mt-0.5">{videosCount}</p>
              <p className="text-xs text-purple-600 dark:text-purple-400 mt-1 font-medium">BLW recipe & feeding reels</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Film className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card 
          onClick={() => setActiveTab('reports')}
          className={`cursor-pointer transition-all border-stone-200 dark:border-stone-800 ${
            pendingReports.length > 0
              ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-900 shadow-sm'
              : 'bg-white dark:bg-[#161c18]'
          }`}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">User Reports</p>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-2xl font-bold text-stone-900 dark:text-stone-100">{pendingReports.length}</p>
                {pendingReports.length > 0 && (
                  <Badge variant="destructive" className="animate-pulse">Needs Review</Badge>
                )}
              </div>
              <p className="text-xs text-rose-600 dark:text-rose-400 mt-1 font-medium">Flagged by community</p>
            </div>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
              pendingReports.length > 0 
                ? 'bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400' 
                : 'bg-stone-100 dark:bg-stone-800 text-stone-500'
            }`}>
              <ShieldAlert className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs: Live Feed vs User Reports */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
        <TabsList className="bg-stone-100 dark:bg-stone-900 p-1 rounded-2xl border border-stone-200 dark:border-stone-800 w-full sm:w-auto grid grid-cols-2">
          <TabsTrigger value="posts" className="rounded-xl font-semibold gap-2">
            <MessageSquare className="w-4 h-4" />
            <span>Community Posts ({posts.length})</span>
          </TabsTrigger>
          <TabsTrigger value="reports" className="rounded-xl font-semibold gap-2 relative">
            <Flag className="w-4 h-4 text-rose-500" />
            <span>User Reports</span>
            {pendingReports.length > 0 && (
              <Badge variant="destructive" className="ml-1.5 h-5 px-1.5 text-[10px]">
                {pendingReports.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Live Posts & Videos */}
        <TabsContent value="posts" className="space-y-4 mt-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by mother name, title or text..."
                className="pl-9 rounded-full bg-white dark:bg-[#161c18] border-stone-200 dark:border-stone-800 text-sm"
              />
            </div>

            {/* Media Filter */}
            <div className="flex items-center gap-1.5 bg-stone-100 dark:bg-stone-900 p-1 rounded-full border border-stone-200 dark:border-stone-800">
              <Button
                size="sm"
                variant={mediaFilter === 'all' ? 'default' : 'ghost'}
                onClick={() => setMediaFilter('all')}
                className="rounded-full text-xs font-semibold px-3 h-8"
              >
                All Posts
              </Button>
              <Button
                size="sm"
                variant={mediaFilter === 'videos' ? 'default' : 'ghost'}
                onClick={() => setMediaFilter('videos')}
                className="rounded-full text-xs font-semibold px-3 h-8 gap-1.5"
              >
                <Film className="w-3.5 h-3.5" />
                Videos
              </Button>
              <Button
                size="sm"
                variant={mediaFilter === 'images' ? 'default' : 'ghost'}
                onClick={() => setMediaFilter('images')}
                className="rounded-full text-xs font-semibold px-3 h-8 gap-1.5"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                Photos
              </Button>
            </div>
          </div>

          {/* Posts Grid */}
          {filteredPosts.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-[#161c18] rounded-2xl border border-stone-200 dark:border-stone-800">
              <MessageSquare className="w-12 h-12 text-stone-300 dark:text-stone-700 mx-auto mb-3" />
              <p className="font-semibold text-stone-700 dark:text-stone-300">No community posts found</p>
              <p className="text-xs text-stone-500 mt-1">Try adjusting your search query or media filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPosts.map((post) => {
                const mediaUrl = post.video_url || post.image_urls?.[0] || post.media_urls?.[0];
                const isVideo = post.media_type === 'video' || !!post.video_url;

                return (
                  <Card key={post.id} className="bg-white dark:bg-[#161c18] border-stone-200 dark:border-stone-800 overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div>
                      {/* Post Header */}
                      <div className="p-3.5 flex items-center justify-between border-b border-stone-100 dark:border-stone-800/80">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                            {post.author_avatar ? (
                              <img src={post.author_avatar} alt={post.author_name} className="w-full h-full object-cover" />
                            ) : (
                              post.author_name.charAt(0)
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">
                              {post.author_name}
                            </p>
                            <p className="text-[10px] text-stone-500 truncate">
                              {post.author_baby || "Mom"}
                            </p>
                          </div>
                        </div>

                        {isVideo ? (
                          <Badge variant="outline" className="text-[10px] bg-purple-50 dark:bg-purple-950/40 border-purple-200 text-purple-700 dark:text-purple-300 gap-1">
                            <Film className="w-3 h-3" /> Video
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] bg-stone-50 dark:bg-stone-900 border-stone-200 text-stone-600 dark:text-stone-400">
                            Photo
                          </Badge>
                        )}
                      </div>

                      {/* Media Display - No Cropping */}
                      {mediaUrl && (
                        <div className="relative bg-stone-950 aspect-video flex items-center justify-center overflow-hidden">
                          {isVideo ? (
                            <video
                              src={mediaUrl}
                              controls
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <img
                              src={mediaUrl}
                              alt={post.title}
                              className="w-full h-full object-contain"
                              loading="lazy"
                            />
                          )}
                        </div>
                      )}

                      {/* Content excerpt */}
                      <div className="p-3.5 space-y-1.5">
                        {post.title && (
                          <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100 line-clamp-1">
                            {post.title}
                          </h4>
                        )}
                        <p className="text-xs text-stone-600 dark:text-stone-400 line-clamp-3 leading-relaxed">
                          {post.content}
                        </p>

                        <div className="flex items-center gap-3 pt-2 text-[11px] text-stone-500 font-medium">
                          <span className="flex items-center gap-1">
                            <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
                            {post.likes_count} likes
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-3 h-3 text-stone-400" />
                            {post.comments_count} comments
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Admin Action Buttons */}
                    <div className="p-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between gap-2 bg-stone-50/50 dark:bg-stone-900/30">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setInspectPost(post)}
                        className="rounded-full text-xs font-semibold text-stone-700 dark:text-stone-300 gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Inspect
                      </Button>

                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setPostToDelete(post)}
                        className="rounded-full text-xs font-semibold gap-1.5 px-3 bg-rose-600 hover:bg-rose-700 text-white"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete Post
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Tab 2: User Reports & Moderation */}
        <TabsContent value="reports" className="space-y-4 mt-4">
          {reports.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-[#161c18] rounded-2xl border border-stone-200 dark:border-stone-800">
              <ShieldCheck className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <p className="font-semibold text-stone-800 dark:text-stone-200">No Reports Submitted</p>
              <p className="text-xs text-stone-500 mt-1">The community is clean and all reports have been processed.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((report) => {
                const isPending = report.status === 'pending';

                return (
                  <Card 
                    key={report.id} 
                    className={`border transition-all ${
                      isPending 
                        ? 'border-rose-200 dark:border-rose-900 bg-rose-50/30 dark:bg-rose-950/10' 
                        : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-[#161c18] opacity-75'
                    }`}
                  >
                    <CardContent className="p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div className="space-y-2 flex-1 min-w-0">
                        {/* Reporter & Author Header */}
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant={isPending ? 'destructive' : 'outline'} className="text-[11px] gap-1 font-semibold">
                            <Flag className="w-3 h-3 fill-current" />
                            {isPending ? 'Pending Report' : report.status === 'resolved' ? 'Resolved (Post Deleted)' : 'Dismissed'}
                          </Badge>

                          <span className="text-xs text-stone-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(report.created_at).toLocaleString()}
                          </span>
                        </div>

                        <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                          🚨 User <strong className="text-emerald-700 dark:text-emerald-400 font-bold">{report.reporter_name}</strong> reported a post by <strong className="text-purple-700 dark:text-purple-400 font-bold">{report.post_author}</strong>
                        </p>

                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-stone-700 dark:text-stone-300">Reason:</span>
                          <Badge variant="secondary" className="text-xs font-semibold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-200">
                            {report.reason}
                          </Badge>
                        </div>

                        {report.details && (
                          <p className="text-xs bg-stone-100 dark:bg-stone-900 p-2.5 rounded-xl text-stone-700 dark:text-stone-300 italic border border-stone-200 dark:border-stone-800">
                            "{report.details}"
                          </p>
                        )}

                        <p className="text-xs text-stone-500 truncate">
                          Post excerpt: "{report.post_title}"
                        </p>
                      </div>

                      {/* Report Action Buttons */}
                      <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                        {isPending && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setReportToResolve({ report, action: 'dismiss' })}
                              className="rounded-full text-xs font-semibold border-stone-300 dark:border-stone-700"
                            >
                              Dismiss Report
                            </Button>

                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => setReportToResolve({ report, action: 'delete' })}
                              className="rounded-full text-xs font-semibold gap-1.5 bg-rose-600 hover:bg-rose-700 text-white shadow-sm"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Delete Post & Remove
                            </Button>
                          </>
                        )}

                        {!isPending && (
                          <Badge variant="outline" className="text-xs text-stone-500 font-medium">
                            Processed
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={!!postToDelete} onOpenChange={(open) => !open && setPostToDelete(null)}>
        <AlertDialogContent className="rounded-[28px] max-w-md bg-white dark:bg-[#161c18] border-stone-200 dark:border-stone-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif text-xl text-rose-600 flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              Delete Community Post?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-stone-600 dark:text-stone-400">
              Are you sure you want to permanently delete this post by <strong className="text-stone-900 dark:text-stone-100">{postToDelete?.author_name}</strong>? It will immediately disappear from the BabyGram community feed for all mothers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeletePost}
              className="rounded-full bg-rose-600 hover:bg-rose-700 text-white font-semibold"
            >
              Confirm & Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Report Resolution Confirmation Dialog */}
      <AlertDialog open={!!reportToResolve} onOpenChange={(open) => !open && setReportToResolve(null)}>
        <AlertDialogContent className="rounded-[28px] max-w-md bg-white dark:bg-[#161c18] border-stone-200 dark:border-stone-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif text-xl flex items-center gap-2">
              {reportToResolve?.action === 'delete' ? (
                <>
                  <Trash2 className="w-5 h-5 text-rose-600" />
                  <span>Remove Reported Post?</span>
                </>
              ) : (
                <>
                  <Check className="w-5 h-5 text-emerald-600" />
                  <span>Dismiss Report?</span>
                </>
              )}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-stone-600 dark:text-stone-400">
              {reportToResolve?.action === 'delete'
                ? `This will permanently delete the post by "${reportToResolve.report.post_author}" and mark the report as resolved.`
                : 'This will dismiss the report without deleting the post, keeping it visible in the community.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleExecuteReportAction}
              className={`rounded-full font-semibold ${
                reportToResolve?.action === 'delete'
                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Inspect Post Full Preview Dialog */}
      <Dialog open={!!inspectPost} onOpenChange={(open) => !open && setInspectPost(null)}>
        <DialogContent className="rounded-[28px] max-w-lg bg-white dark:bg-[#161c18] border-stone-200 dark:border-stone-800 p-6 max-h-[90vh] overflow-y-auto">
          {inspectPost && (
            <div className="space-y-4">
              <DialogHeader>
                <DialogTitle className="font-serif text-xl flex items-center gap-2">
                  <span>Post by {inspectPost.author_name}</span>
                </DialogTitle>
                <DialogDescription>
                  Published on {new Date(inspectPost.created_at).toLocaleString()}
                </DialogDescription>
              </DialogHeader>

              {/* Media Preview without cropping */}
              {(inspectPost.video_url || inspectPost.image_urls?.[0] || inspectPost.media_urls?.[0]) && (
                <div className="rounded-2xl overflow-hidden bg-black flex items-center justify-center max-h-[400px]">
                  {inspectPost.media_type === 'video' || inspectPost.video_url ? (
                    <video
                      src={inspectPost.video_url || inspectPost.media_urls?.[0]}
                      controls
                      autoPlay
                      className="w-full max-h-[400px] object-contain"
                    />
                  ) : (
                    <img
                      src={inspectPost.image_urls?.[0] || inspectPost.media_urls?.[0]}
                      alt={inspectPost.title}
                      className="w-full max-h-[400px] object-contain"
                    />
                  )}
                </div>
              )}

              <div className="space-y-2">
                {inspectPost.title && (
                  <h3 className="font-bold text-base text-stone-900 dark:text-stone-100">
                    {inspectPost.title}
                  </h3>
                )}
                <p className="text-sm text-stone-700 dark:text-stone-300 whitespace-pre-wrap leading-relaxed">
                  {inspectPost.content}
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-stone-100 dark:border-stone-800">
                <Button
                  variant="outline"
                  onClick={() => setInspectPost(null)}
                  className="rounded-full"
                >
                  Close
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setPostToDelete(inspectPost);
                    setInspectPost(null);
                  }}
                  className="rounded-full bg-rose-600 hover:bg-rose-700 text-white font-semibold gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Post
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContentModeration;
