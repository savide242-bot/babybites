import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Heart, MessageCircle, Share2, Bookmark, Plus, Image as ImageIcon, Sparkles, Filter, Send } from "lucide-react";
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

const SAMPLE_POSTS: Post[] = [
  {
    id: "sample-1",
    user_id: "usr-1",
    title: "First time trying steamed broccoli! 🥦👶",
    content: "He made the funniest face at first, but then chewed on the florets for 10 minutes straight! BLW is messy but so rewarding.",
    image_urls: ["https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80"],
    likes_count: 24,
    comments_count: 7,
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
    comments_count: 12,
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
    comments_count: 15,
    created_at: new Date(Date.now() - 3600000 * 16).toISOString(),
    author_name: "David Chen",
    author_baby: "Dad of Lucas, 9 months",
    user_has_liked: false,
  },
];

export const Community: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>(SAMPLE_POSTS);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [isNewPostOpen, setIsNewPostOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from("forum_posts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      if (!error && data && data.length > 0) {
        // Map database posts or merge with sample
        const mapped: Post[] = data.map((p) => ({
          id: p.id,
          user_id: p.user_id,
          title: p.title,
          content: p.content,
          image_urls: p.image_urls,
          likes_count: p.likes_count || 0,
          comments_count: p.comments_count || 0,
          created_at: p.created_at,
          author_name: "Fellow Parent",
          author_baby: "BabyBites Family",
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
        author_baby: "BabyBites Club",
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
    <div className="min-h-screen bg-[#FAF9F5] pb-24 pt-4 px-4 max-w-2xl mx-auto">
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
            <Button className="rounded-full bg-[#48B774] hover:bg-[#3ca465] text-white font-semibold text-xs px-4 py-2 flex items-center gap-1.5 shadow-sm">
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
                className="w-full rounded-full bg-[#48B774] hover:bg-[#3ca465] text-white font-semibold py-3"
              >
                {isSubmitting ? "Publishing..." : "Publish Post ❤️"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Categories Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-3 -mx-4 px-4 no-scrollbar mb-6">
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
        {posts.map((post) => (
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

            {/* Post Actions: Like, Comment, Share */}
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

                <button className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-700">
                  <MessageCircle className="w-4 h-4" />
                  <span>{post.comments_count}</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => toast.success("Post saved to your bookmarks!")}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <Bookmark className="w-4 h-4" />
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

export default Community;
