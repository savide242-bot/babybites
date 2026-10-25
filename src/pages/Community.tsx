import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
  Heart, MessageCircle, Share2, Bookmark, Plus, 
  Sparkles, Send, Bell, Loader2, ChevronDown, ChevronUp, Check, User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

interface Post {
  id: string;
  user_id: string;
  title: string;
  content: string;
  image_urls?: string[] | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  author_name?: string;
  author_baby?: string;
  user_has_liked?: boolean;
}

interface CommentItem {
  id: string;
  post_id: string;
  user_id: string;
  author_name: string;
  author_baby?: string;
  content: string;
  created_at: string;
}

const SAMPLE_POSTS: Post[] = [
  {
    id: "sample-1",
    user_id: "usr-1",
    title: "First time trying steamed broccoli! 🥦👶",
    content: "He made the funniest face at first, but then chewed on the florets for 10 minutes straight! BLW is messy but so rewarding.",
    image_urls: ["https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80"],
    likes_count: 24,
    comments_count: 2,
    created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
    author_name: "Sarah Jenkins",
    author_baby: "Mom of Noah, 7 months",
    user_has_liked: true,
  },
  {
    id: "sample-2",
    user_id: "usr-2",
    title: "Batch cooking success: 3-Ingredient Peanut Butter & Banana Biscuits! 🍌✨",
    content: "Made 50 mini biscuits in 20 minutes from the recipe section. Froze half for next week. Little Maya is obsessed!",
    image_urls: ["https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=800&q=80"],
    likes_count: 42,
    comments_count: 2,
    created_at: new Date(Date.now() - 3600000 * 8).toISOString(),
    author_name: "Emily Rodriguez",
    author_baby: "Mom of Maya, 11 months",
    user_has_liked: false,
  },
  {
    id: "sample-3",
    user_id: "usr-3",
    title: "Question: How do you handle teething strikes? 🦷❤️",
    content: "My 9-month-old is cutting two top teeth and refusing warm purees. Only accepting cold breastmilk popsicles. Any soft cold food suggestions?",
    image_urls: null,
    likes_count: 18,
    comments_count: 2,
    created_at: new Date(Date.now() - 3600000 * 16).toISOString(),
    author_name: "David Chen",
    author_baby: "Dad of Lucas, 9 months",
    user_has_liked: false,
  },
];

const INITIAL_COMMENTS: Record<string, CommentItem[]> = {
  "sample-1": [
    {
      id: "c-1",
      post_id: "sample-1",
      user_id: "u-101",
      author_name: "Hannah Cole",
      author_baby: "Mom of Theo, 9m",
      content: "The broccoli grimace is legendary! Mine did the exact same face for 3 days and now it's his favorite veggie.",
      created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
    {
      id: "c-2",
      post_id: "sample-1",
      user_id: "u-102",
      author_name: "Dr. Clara Mendes",
      author_baby: "Pediatric Nutritionist",
      content: "Great job offering the whole floret! Grasping the stem strengthens fine motor pincer grasp.",
      created_at: new Date(Date.now() - 3600000 * 1).toISOString(),
    },
  ],
  "sample-2": [
    {
      id: "c-3",
      post_id: "sample-2",
      user_id: "u-103",
      author_name: "Sophie Laurent",
      author_baby: "Mom of Leo, 12m",
      content: "Making these right now! Did you bake at 180°C or 160°C?",
      created_at: new Date(Date.now() - 3600000 * 6).toISOString(),
    },
    {
      id: "c-4",
      post_id: "sample-2",
      user_id: "usr-2",
      author_name: "Emily Rodriguez",
      author_baby: "Post Author",
      content: "175°C for 14 minutes was perfect! Let them cool fully on a wire rack so they stay chewy.",
      created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    },
  ],
  "sample-3": [
    {
      id: "c-5",
      post_id: "sample-3",
      user_id: "u-104",
      author_name: "Amanda Brooks",
      author_baby: "Mom of Oliver, 10m",
      content: "Chilled peeled cucumber spears or cold mashed avocado on a pre-loaded spoon! It numbs the gums right away.",
      created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    },
    {
      id: "c-6",
      post_id: "sample-3",
      user_id: "u-105",
      author_name: "Dr. Elena Vance",
      author_baby: "Family Doctor",
      content: "Frozen breastmilk slushie or refrigerated pureed pear in a silicone mesh feeder works wonders. Keep baby upright!",
      created_at: new Date(Date.now() - 3600000 * 8).toISOString(),
    },
  ],
};

const COMMENTS_STORAGE_KEY = "babybites_community_comments_v1";

export const Community: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>(SAMPLE_POSTS);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [isNewPostOpen, setIsNewPostOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Comments state
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [commentsByPost, setCommentsByPost] = useState<Record<string, CommentItem[]>>(() => {
    try {
      const saved = localStorage.getItem(COMMENTS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : INITIAL_COMMENTS;
    } catch {
      return INITIAL_COMMENTS;
    }
  });
  const [replyInputByPost, setReplyInputByPost] = useState<Record<string, string>>({});
  const [submittingComment, setSubmittingComment] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchPosts();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(COMMENTS_STORAGE_KEY, JSON.stringify(commentsByPost));
    } catch (e) {
      console.error(e);
    }
  }, [commentsByPost]);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from("forum_posts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      if (!error && data && data.length > 0) {
        const mapped: Post[] = data.map((p) => ({
          id: p.id,
          user_id: p.user_id,
          title: p.title,
          content: p.content,
          image_urls: p.image_urls,
          likes_count: p.likes_count || 0,
          comments_count: p.comments_count || 0,
          created_at: p.created_at,
          author_name: "Community Member",
          author_baby: "BabyBites Parent",
          user_has_liked: false,
        }));
        setPosts([...mapped, ...SAMPLE_POSTS]);
      }
    } catch (err) {
      console.log("Using cached community feed:", err);
    }
  };

  const handleLike = (id: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const nextLiked = !p.user_has_liked;
          return {
            ...p,
            user_has_liked: nextLiked,
            likes_count: p.likes_count + (nextLiked ? 1 : -1),
          };
        }
        return p;
      })
    );
  };

  const toggleComments = async (postId: string) => {
    const nextState = !expandedComments[postId];
    setExpandedComments((prev) => ({ ...prev, [postId]: nextState }));

    // If opening and not yet loaded from DB for non-sample post
    if (nextState && !postId.startsWith("sample-")) {
      try {
        const { data, error } = await supabase
          .from("post_comments")
          .select("*")
          .eq("post_id", postId)
          .order("created_at", { ascending: true });

        if (!error && data && data.length > 0) {
          const dbComments: CommentItem[] = data.map((c) => ({
            id: c.id,
            post_id: c.post_id,
            user_id: c.user_id,
            author_name: "BabyBites Parent",
            author_baby: "Family Member",
            content: c.content,
            created_at: c.created_at || new Date().toISOString(),
          }));
          setCommentsByPost((prev) => ({ ...prev, [postId]: dbComments }));
        }
      } catch (err) {
        console.log("Could not load comments from DB:", err);
      }
    }
  };

  const handleSendComment = async (post: Post) => {
    const text = (replyInputByPost[post.id] || "").trim();
    if (!text) {
      toast.error("Please type your reply before sending.");
      return;
    }

    setSubmittingComment((prev) => ({ ...prev, [post.id]: true }));

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      let commenterName = "Loving Parent";
      let commenterRole = "Mom / Dad";

      if (session?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("mother_name, baby_name, full_name")
          .eq("id", session.user.id)
          .single();

        if (profile?.mother_name || profile?.full_name) {
          commenterName = profile.mother_name || profile.full_name;
        }
        if (profile?.baby_name) {
          commenterRole = `Parent of ${profile.baby_name}`;
        }
      }

      const newCommentObj: CommentItem = {
        id: "c-" + Date.now(),
        post_id: post.id,
        user_id: session?.user?.id || "guest",
        author_name: commenterName,
        author_baby: commenterRole,
        content: text,
        created_at: new Date().toISOString(),
      };

      // 1. Insert into database if user is authenticated and post is in database
      if (session?.user && !post.id.startsWith("sample-")) {
        await supabase.from("post_comments").insert({
          post_id: post.id,
          user_id: session.user.id,
          content: text,
        });
      }

      // 2. Notify post author via push notification
      let authorNotified = false;
      if (post.user_id && post.user_id !== session?.user?.id && !post.user_id.startsWith("usr-")) {
        try {
          const { error: pushError } = await supabase.functions.invoke("send-direct-push", {
            body: {
              user_id: post.user_id,
              title: "💬 New reply to your BabyBites post!",
              body: `${commenterName}: "${text.length > 70 ? text.substring(0, 67) + '...' : text}"`,
            },
          });
          if (!pushError) authorNotified = true;
        } catch (pushErr) {
          console.warn("Could not send direct push:", pushErr);
        }
      }

      // 3. Update local state
      setCommentsByPost((prev) => ({
        ...prev,
        [post.id]: [...(prev[post.id] || []), newCommentObj],
      }));

      // 4. Update post comments count
      setPosts((prev) =>
        prev.map((p) => (p.id === post.id ? { ...p, comments_count: p.comments_count + 1 } : p))
      );

      // 5. Clear input
      setReplyInputByPost((prev) => ({ ...prev, [post.id]: "" }));

      // 6. Provide user feedback
      toast.success(
        authorNotified
          ? "Reply sent! The author received a notification. 🔔"
          : "Reply posted to the community! 💬"
      );
    } catch (err: any) {
      console.error("Error submitting comment:", err);
      toast.error("Could not post reply. Please try again.");
    } finally {
      setSubmittingComment((prev) => ({ ...prev, [post.id]: false }));
    }
  };

  const handleCreatePost = async () => {
    if (!newTitle.trim() || !newContent.trim()) {
      toast.error("Please add a title and some thoughts for your post");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const newPostObj: Post = {
        id: "post-" + Date.now(),
        user_id: session?.user?.id || "guest",
        title: newTitle,
        content: newContent,
        image_urls: newImageUrl ? [newImageUrl] : null,
        likes_count: 1,
        comments_count: 0,
        created_at: new Date().toISOString(),
        author_name: session?.user?.user_metadata?.full_name || "Loving Parent",
        author_baby: "BabyBites Parent",
        user_has_liked: true,
      };

      if (session?.user) {
        await supabase.from("forum_posts").insert({
          user_id: session.user.id,
          title: newTitle,
          content: newContent,
          image_urls: newImageUrl ? [newImageUrl] : [],
        });
      }

      setPosts([newPostObj, ...posts]);
      setNewTitle("");
      setNewContent("");
      setNewImageUrl("");
      setIsNewPostOpen(false);
      toast.success("Post shared with the community! ❤️");
    } catch (err) {
      toast.error("Could not share post. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = [
    { id: "all", label: "🌟 All Posts" },
    { id: "first-bites", label: "🥦 First Bites & BLW" },
    { id: "plates", label: "🥑 Toddler Plates" },
    { id: "questions", label: "💬 Parent Q&A" },
  ];

  return (
    <div className="min-h-screen bg-[#FAF9F5] pb-24 pt-4 px-3 sm:px-4 max-w-2xl mx-auto w-full max-w-full overflow-x-hidden min-w-0">
      {/* Header Banner */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold tracking-wider uppercase text-[#48B774]">
            BabyBites Community
          </span>
          <h1 className="text-3xl font-serif font-bold text-forest mt-0.5">
            Parents' Hub
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Real meals, first bites, and encouragement from moms & dads.
          </p>
        </div>

        {/* Create Post Button */}
        <Dialog open={isNewPostOpen} onOpenChange={setIsNewPostOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-full bg-[#1E5E3A] hover:bg-[#16472c] text-white font-semibold text-xs px-4 py-2 flex items-center gap-1.5 shadow-sm">
              <Plus className="w-4 h-4" />
              <span>Share</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-[28px] max-w-md bg-white border border-[#EBE8DF]">
            <DialogHeader>
              <DialogTitle className="font-serif text-2xl text-forest">
                Share with the Community
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Title
                </label>
                <Input
                  placeholder="e.g. Tried avocado fingers for the first time!"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="rounded-xl border-[#E3DFD3]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Your Story or Question
                </label>
                <Textarea
                  placeholder="Share how it went, your recipe variation, or ask other parents for advice..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  rows={4}
                  className="rounded-xl border-[#E3DFD3]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Photo URL (Optional)
                </label>
                <Input
                  placeholder="Paste photo link..."
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  className="rounded-xl border-[#E3DFD3]"
                />
              </div>

              <Button
                onClick={handleCreatePost}
                disabled={isSubmitting}
                className="w-full rounded-full bg-[#1E5E3A] hover:bg-[#16472c] text-white font-semibold py-3"
              >
                {isSubmitting ? "Publishing..." : "Publish Post ❤️"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Categories Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-3 w-full max-w-full min-w-0 no-scrollbar mb-6">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveTab(cat.id)}
            className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
              activeTab === cat.id
                ? "bg-forest text-white shadow-sm"
                : "bg-white text-gray-600 border border-[#EBE8DF] hover:bg-gray-50"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Feed List */}
      <div className="space-y-5">
        {posts.map((post) => {
          const isExpanded = !!expandedComments[post.id];
          const postComments = commentsByPost[post.id] || [];
          const currentReply = replyInputByPost[post.id] || "";
          const isPostingReply = !!submittingComment[post.id];

          return (
            <article
              key={post.id}
              className="rounded-[28px] bg-white border border-[#EBE8DF] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] overflow-hidden transition-all duration-200"
            >
              {/* Author Info */}
              <div className="p-4 pb-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#EAF5EE] to-[#CCE0D2] flex items-center justify-center text-forest font-serif font-bold text-sm border border-[#CCE0D2]">
                    {post.author_name?.charAt(0) || "P"}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 leading-tight">
                      {post.author_name}
                    </h4>
                    <p className="text-[11px] text-gray-500">
                      {post.author_baby}
                    </p>
                  </div>
                </div>
                <span className="text-[11px] text-gray-400">
                  {new Date(post.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>

              {/* Post Content */}
              <div className="px-4 pb-3">
                <h3 className="font-serif font-bold text-gray-900 text-lg leading-snug mb-1">
                  {post.title}
                </h3>
                <p className="text-xs text-gray-700 leading-relaxed">
                  {post.content}
                </p>
              </div>

              {/* Post Image (if any) */}
              {post.image_urls && post.image_urls.length > 0 && (
                <div className="w-full max-h-[380px] overflow-hidden bg-gray-50 border-t border-b border-[#F5F3EC]">
                  <img
                    src={post.image_urls[0]}
                    alt={post.title}
                    className="w-full h-full object-cover max-h-[380px]"
                    loading="lazy"
                  />
                </div>
              )}

              {/* Post Actions: Like, Comment Toggle, Bookmark */}
              <div className="px-4 py-3 flex items-center justify-between border-t border-[#F5F3EC]">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleLike(post.id)}
                    className={`flex items-center gap-1.5 text-xs font-semibold transition-colors ${
                      post.user_has_liked
                        ? "text-[#E53E3E]"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <Heart
                      className={`w-4 h-4 ${
                        post.user_has_liked ? "fill-current" : ""
                      }`}
                    />
                    <span>{post.likes_count}</span>
                  </button>

                  <button 
                    onClick={() => toggleComments(post.id)}
                    className={`flex items-center gap-1.5 text-xs font-semibold transition-colors px-2.5 py-1 rounded-full ${
                      isExpanded 
                        ? "bg-[#1E5E3A]/10 text-[#1E5E3A]" 
                        : "text-gray-600 hover:text-gray-900 hover:bg-stone-50"
                    }`}
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>{postComments.length || post.comments_count} replies</span>
                    {isExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5 ml-0.5 text-stone-400" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 ml-0.5 text-stone-400" />
                    )}
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toast.success("Post saved to your bookmarks!")}
                    className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-stone-50"
                    title="Bookmark post"
                  >
                    <Bookmark className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Expandable Comments & Replies Section */}
              {isExpanded && (
                <div className="bg-[#FAF9F5] border-t border-[#EBE8DF] p-4 sm:p-5 space-y-3.5">
                  <div className="flex items-center justify-between text-xs text-stone-500 font-medium">
                    <span className="flex items-center gap-1.5">
                      <MessageCircle className="w-3.5 h-3.5 text-[#1E5E3A]" />
                      Conversation ({postComments.length})
                    </span>
                    <span className="text-[11px] text-stone-400 flex items-center gap-1">
                      <Bell className="w-3 h-3 text-[#1E5E3A]" /> Authors receive instant push alerts
                    </span>
                  </div>

                  {/* List of comments */}
                  <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                    {postComments.length === 0 ? (
                      <p className="text-xs text-stone-400 italic py-2 text-center">
                        Be the first to share advice or reply to this post!
                      </p>
                    ) : (
                      postComments.map((comment) => (
                        <div 
                          key={comment.id}
                          className="bg-white rounded-2xl p-3 border border-stone-200/80 shadow-xs flex items-start gap-2.5"
                        >
                          <div className="w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center text-stone-700 font-serif font-bold text-xs shrink-0 border border-stone-200">
                            {comment.author_name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-semibold text-xs text-stone-900 leading-tight">
                                  {comment.author_name}
                                </span>
                                {comment.author_baby && (
                                  <span className="text-[10px] bg-stone-100 text-stone-500 px-1.5 py-0.2 rounded-md">
                                    {comment.author_baby}
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-stone-400 shrink-0">
                                {new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-xs text-stone-700 leading-relaxed break-words">
                              {comment.content}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Reply Form */}
                  <div className="pt-2 border-t border-stone-200/60">
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder={`Reply to ${post.author_name || 'parent'}...`}
                        value={currentReply}
                        onChange={(e) =>
                          setReplyInputByPost((prev) => ({
                            ...prev,
                            [post.id]: e.target.value,
                          }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSendComment(post);
                          }
                        }}
                        className="flex-1 bg-white border-stone-200 rounded-xl text-xs h-9 focus-visible:ring-[#1E5E3A]"
                      />
                      <Button
                        size="sm"
                        onClick={() => handleSendComment(post)}
                        disabled={isPostingReply || !currentReply.trim()}
                        className="bg-[#1E5E3A] hover:bg-[#16472c] text-white rounded-xl h-9 px-3 shrink-0 flex items-center gap-1 text-xs"
                      >
                        {isPostingReply ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            <span>Reply</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
};

export default Community;
