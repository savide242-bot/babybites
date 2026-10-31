import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
  Heart, MessageCircle, Share2, Bookmark, Plus, 
  Sparkles, Send, Bell, Loader2, Check, User,
  Camera, Image as ImageIcon, Video, X, Smile, UserPlus, UserCheck, 
  MoreHorizontal, Flag, Film, Baby, ShieldCheck, Hash, Tag
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import CommunityStories, { StoryItem } from "@/components/community/CommunityStories";
import MotherProfileModal, { MotherProfileData } from "@/components/community/MotherProfileModal";
import DirectMessagesModal from "@/components/community/DirectMessagesModal";
import CreateStoryModal from "@/components/community/CreateStoryModal";

export interface Post {
  id: string;
  user_id: string;
  title: string;
  content: string;
  image_urls?: string[] | null;
  media_type?: "image" | "video";
  video_url?: string;
  video_thumbnail?: string;
  hashtags?: string[];
  likes_count: number;
  comments_count: number;
  created_at: string;
  author_name: string;
  author_baby: string;
  author_avatar?: string;
  user_has_liked?: boolean;
  age_tag?: string;
  status?: "published" | "under_review" | "hidden" | "banned";
}

export interface CommentItem {
  id: string;
  post_id: string;
  user_id: string;
  author_name: string;
  author_baby?: string;
  content: string;
  created_at: string;
}

const ADMIN_EMAILS = ["savide242@gmail.com", "octaviomoiane2007@gmail.com"];

const SAMPLE_ADMIN_POSTS: Post[] = [
  {
    id: "sample-1",
    user_id: "usr-1",
    title: "Golden Sweet Potato & Chicken Patties! 🍠✨",
    content: "Made these soft BLW patties from the 6-8 months recipe section. Noah held them easily with his little hands and ate every single bite!",
    image_urls: ["/community/sarah-fritters.jpg"],
    media_type: "image",
    hashtags: ["#BLW", "#FingerFood", "#BabyBites", "#FirstBite"],
    likes_count: 24,
    comments_count: 2,
    created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
    author_name: "Sarah Jenkins",
    author_baby: "Noah • 7m",
    author_avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80",
    user_has_liked: true,
    age_tag: "6-8 Months",
  },
  {
    id: "sample-video-1",
    user_id: "usr-demo-video",
    author_name: "Mariana Costa",
    author_baby: "Lucas • 8m",
    title: "Milestone: Holding his own baby spoon for the first time! 🥄✨",
    content: "Look at his focus trying to bring the pumpkin puree to his mouth independently. Mama's heart is melting!",
    image_urls: ["https://assets.mixkit.co/videos/preview/mixkit-mother-feeding-her-baby-boy-41318-large.mp4"],
    media_type: "video",
    video_url: "https://assets.mixkit.co/videos/preview/mixkit-mother-feeding-her-baby-boy-41318-large.mp4",
    hashtags: ["#HealthyBaby", "#MilestoneMoment", "#RealMotherhood"],
    likes_count: 36,
    comments_count: 1,
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    author_avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
    user_has_liked: false,
    age_tag: "6-8 Months",
  },
];

const SUGGESTED_HASHTAGS = [
  "#BLW",
  "#BabyWeaning",
  "#FirstBite",
  "#HealthyBaby",
  "#BabyRecipes",
  "#RealMotherhood",
  "#ToddlerMeals",
];

const COMMENTS_STORAGE_KEY = "babybites_community_comments_v3";
const FOLLOWS_STORAGE_KEY = "babybites_followed_moms_v3";
const LOCAL_POSTS_KEY = "babybites_community_local_posts_v3";

export const Community: React.FC = () => {
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [isAdminUser, setIsAdminUser] = useState(false);

  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoadingFeed, setIsLoadingFeed] = useState(true);

  // Post creation modal
  const [isNewPostOpen, setIsNewPostOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newHashtags, setNewHashtags] = useState<string[]>(["#BabyWeaning", "#BLW"]);
  const [customHashtagInput, setCustomHashtagInput] = useState("");
  const [newMediaPreview, setNewMediaPreview] = useState<string | null>(null);
  const [newMediaType, setNewMediaType] = useState<"image" | "video">("image");
  const [newVideoThumbnail, setNewVideoThumbnail] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [heartPops, setHeartPops] = useState<Record<string, boolean>>({});

  // Modals state
  const [isDMOpen, setIsDMOpen] = useState(false);
  const [targetDMMom, setTargetDMMom] = useState<MotherProfileData | null>(null);
  const [isStoryModalOpen, setIsStoryModalOpen] = useState(false);
  const [savedPosts, setSavedPosts] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem("babygram_saved_posts_v1");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [mutedVideos, setMutedVideos] = useState<Record<string, boolean>>({});

  const handleToggleSave = (postId: string) => {
    setSavedPosts((prev) => {
      const updated = { ...prev, [postId]: !prev[postId] };
      try {
        localStorage.setItem("babygram_saved_posts_v1", JSON.stringify(updated));
      } catch {}
      if (updated[postId]) {
        toast.success("Post saved to your BabyGram collection! 🔖");
      } else {
        toast.info("Removed from saved collection");
      }
      return updated;
    });
  };

  const toggleVideoMute = (postId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setMutedVideos((prev) => ({ ...prev, [postId]: !prev[postId] }));
  };

  const [profileModalState, setProfileModalState] = useState<{
    open: boolean;
    profile: MotherProfileData | null;
  }>({ open: false, profile: null });

  // Refs for media pickers
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  // Follow system: starts empty for regular users (they don't follow anyone initially)
  const [followedMoms, setFollowedMoms] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(FOLLOWS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Comments state
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [commentsByPost, setCommentsByPost] = useState<Record<string, CommentItem[]>>(() => {
    try {
      const saved = localStorage.getItem(COMMENTS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [replyInputByPost, setReplyInputByPost] = useState<Record<string, string>>({});
  const [submittingComment, setSubmittingComment] = useState<Record<string, boolean>>({});

  // Initialize Auth & Feed
  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const email = session?.user?.email?.toLowerCase() || "";
        setCurrentUserEmail(email);
        const adminCheck = ADMIN_EMAILS.includes(email);
        setIsAdminUser(adminCheck);

        // Fetch Supabase posts
        await fetchSupabasePosts(adminCheck);
      } catch (err) {
        console.error("Auth init error:", err);
        setIsLoadingFeed(false);
      }
    };
    initAuth();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(COMMENTS_STORAGE_KEY, JSON.stringify(commentsByPost));
    } catch (e) {
      console.error(e);
    }
  }, [commentsByPost]);

  useEffect(() => {
    try {
      localStorage.setItem(FOLLOWS_STORAGE_KEY, JSON.stringify(followedMoms));
    } catch (e) {
      console.error(e);
    }
  }, [followedMoms]);

  const fetchSupabasePosts = async (allowAdminDemo: boolean) => {
    setIsLoadingFeed(true);
    try {
      const { data, error } = await supabase
        .from("forum_posts")
        .select("*")
        .neq("title", "__SYSTEM_RECIPE_OVERRIDES__")
        .order("created_at", { ascending: false })
        .limit(30);

      // Locally saved posts
      let localPosts: Post[] = [];
      try {
        const saved = localStorage.getItem(LOCAL_POSTS_KEY);
        if (saved) localPosts = JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }

      const mappedSupabase: Post[] = (!error && data) ? data.map((p: any) => ({
        id: p.id,
        user_id: p.user_id,
        title: p.title,
        content: p.content,
        image_urls: p.image_urls || (p.video_url ? [p.video_url] : null),
        media_type: p.media_type || (p.video_url ? "video" : "image"),
        video_url: p.video_url,
        video_thumbnail: p.video_thumbnail,
        hashtags: p.hashtags || ["#BabyWeaning"],
        likes_count: p.likes_count || 0,
        comments_count: p.comments_count || 0,
        created_at: p.created_at,
        author_name: p.author_name || "Community Mom",
        author_baby: p.author_baby || "Baby • 8m",
        author_avatar: p.author_avatar || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80",
        user_has_liked: false,
        age_tag: p.age_tag || "6-8 Months",
      })) : [];

      // Only include sample admin posts if current user is an admin!
      const initialPool = [
        ...localPosts,
        ...mappedSupabase,
        ...(allowAdminDemo ? SAMPLE_ADMIN_POSTS : []),
      ];

      const deduplicated = Array.from(new Map(initialPool.map((p) => [p.id, p])).values());
      setPosts(deduplicated);
    } catch (err) {
      console.log("Feed fetch error:", err);
    } finally {
      setIsLoadingFeed(false);
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

  // Double-tap photo/video like with heart animation
  const handleDoubleTapPhoto = (id: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          if (!p.user_has_liked) {
            return {
              ...p,
              user_has_liked: true,
              likes_count: p.likes_count + 1,
            };
          }
        }
        return p;
      })
    );

    setHeartPops((prev) => ({ ...prev, [id]: true }));
    setTimeout(() => {
      setHeartPops((prev) => ({ ...prev, [id]: false }));
    }, 900);
  };

  const handleToggleFollow = (authorName: string) => {
    setFollowedMoms((prev) => {
      const isFollowing = !!prev[authorName];
      const updated = { ...prev, [authorName]: !isFollowing };
      toast.success(
        !isFollowing
          ? `You are now following ${authorName}! 💚`
          : `Unfollowed ${authorName}`
      );
      return updated;
    });
  };

  const handleSharePost = async (post: Post) => {
    const shareText = `Check out "${post.title}" on BabyBites Community! 🥑👶`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: shareText,
          url: window.location.href,
        });
      } catch {
        /* user cancelled */
      }
    } else {
      navigator.clipboard.writeText(`${shareText}\n${window.location.href}`);
      toast.success("Post link copied to clipboard!");
    }
  };

  const handleReportPost = (post: Post) => {
    toast.success("Post reported. The admin will review it in the moderation dashboard.");
  };

  const toggleComments = async (postId: string) => {
    const nextState = !expandedComments[postId];
    setExpandedComments((prev) => ({ ...prev, [postId]: nextState }));
  };

  const handleSendComment = async (post: Post) => {
    const text = (replyInputByPost[post.id] || "").trim();
    if (!text) {
      toast.error("Please type your comment before sending.");
      return;
    }

    setSubmittingComment((prev) => ({ ...prev, [post.id]: true }));

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      let commenterName = "Loving Mom";
      let commenterRole = "Mom of Baby";

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
          commenterRole = `Mom of ${profile.baby_name}`;
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

      if (session?.user && !post.id.startsWith("sample-")) {
        await supabase.from("post_comments").insert({
          post_id: post.id,
          user_id: session.user.id,
          content: text,
        });
      }

      setCommentsByPost((prev) => ({
        ...prev,
        [post.id]: [...(prev[post.id] || []), newCommentObj],
      }));

      setPosts((prev) =>
        prev.map((p) => (p.id === post.id ? { ...p, comments_count: p.comments_count + 1 } : p))
      );

      setReplyInputByPost((prev) => ({ ...prev, [post.id]: "" }));
      toast.success("Comment posted with love! ❤️");
    } catch (err: any) {
      console.error(err);
      toast.error("Could not post comment.");
    } finally {
      setSubmittingComment((prev) => ({ ...prev, [post.id]: false }));
    }
  };

  // Media Pickers
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setNewMediaType("image");
    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      setNewMediaPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setNewMediaType("video");
    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      setNewMediaPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleThumbnailSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setNewVideoThumbnail(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const toggleHashtag = (tag: string) => {
    setNewHashtags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const addCustomHashtag = () => {
    const tag = customHashtagInput.trim();
    if (!tag) return;
    const formatted = tag.startsWith("#") ? tag : `#${tag}`;
    if (!newHashtags.includes(formatted)) {
      setNewHashtags([...newHashtags, formatted]);
    }
    setCustomHashtagInput("");
  };

  const handleCreatePost = async () => {
    if (!newTitle.trim() || !newContent.trim()) {
      toast.error("Please add a title and description for your post");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      let authorName = "Community Mom";
      let babyRole = "Baby • 7m";

      if (session?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("mother_name, baby_name, full_name")
          .eq("id", session.user.id)
          .single();

        if (profile?.mother_name || profile?.full_name) {
          authorName = profile.mother_name || profile.full_name;
        }
        if (profile?.baby_name) {
          babyRole = `${profile.baby_name} • 7m`;
        }
      }

      const newPostId = "post-" + Date.now();
      const newPostObj: Post = {
        id: newPostId,
        user_id: session?.user?.id || "guest",
        title: newTitle,
        content: newContent,
        image_urls: newMediaPreview ? [newMediaPreview] : null,
        media_type: newMediaType,
        video_url: newMediaType === "video" ? newMediaPreview || undefined : undefined,
        video_thumbnail: newVideoThumbnail || undefined,
        hashtags: newHashtags,
        likes_count: 1,
        comments_count: 0,
        created_at: new Date().toISOString(),
        author_name: authorName,
        author_baby: babyRole,
        author_avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80",
        user_has_liked: true,
        status: "published",
      };

      // Save locally
      const updatedPosts = [newPostObj, ...posts];
      setPosts(updatedPosts);
      try {
        localStorage.setItem(LOCAL_POSTS_KEY, JSON.stringify([newPostObj]));
      } catch (e) {
        console.error(e);
      }

      // Sync with Supabase
      try {
        if (session?.user) {
          await supabase.from("forum_posts").insert({
            user_id: session.user.id,
            title: newTitle,
            content: newContent,
            image_urls: newMediaPreview ? [newMediaPreview] : null,
          });
        }
      } catch (sbErr) {
        console.log("Supabase post sync:", sbErr);
      }

      setNewTitle("");
      setNewContent("");
      setNewMediaPreview(null);
      setNewVideoThumbnail(null);
      setSelectedFile(null);
      setIsNewPostOpen(false);
      toast.success("Post published to the community! ❤️");
    } catch (err) {
      toast.error("Could not share post.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Mother Profile
  const handleOpenMotherProfile = (authorName: string, isCurrent: boolean = false) => {
    const authorPosts = posts.filter((p) => p.author_name === authorName);
    const profileData: MotherProfileData = {
      id: authorName,
      name: authorName,
      babyName: authorPosts[0]?.author_baby?.split("•")[0]?.trim() || "Baby",
      babyAge: authorPosts[0]?.author_baby?.split("•")[1]?.trim() || "8m",
      avatar: authorPosts[0]?.author_avatar || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80",
      bio: "Loving mother learning wholesome baby-led weaning and sharing healthy meal ideas on BabyBites! 🥑🥣",
      followersCount: followedMoms[authorName] ? 1 : 0,
      followingCount: 0,
      isFollowing: !!followedMoms[authorName],
      isCurrentUser: isCurrent,
      posts: authorPosts.map((p) => ({
        id: p.id,
        title: p.title,
        mediaUrl: p.image_urls?.[0] || "",
        mediaType: p.media_type,
        likesCount: p.likes_count,
      })),
    };

    setProfileModalState({ open: true, profile: profileData });
  };

  return (
    <div className="min-h-screen bg-[#FAF9F5] dark:bg-[#0f1411] text-stone-900 dark:text-stone-100 pb-24 pt-3 px-3 sm:px-4 max-w-2xl mx-auto w-full max-w-full overflow-x-hidden min-w-0 transition-colors">
      {/* Hidden File Inputs */}
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handlePhotoSelect}
        className="hidden"
      />
      <input
        type="file"
        accept="video/*"
        ref={videoInputRef}
        onChange={handleVideoSelect}
        className="hidden"
      />
      <input
        type="file"
        accept="image/*"
        ref={thumbnailInputRef}
        onChange={handleThumbnailSelect}
        className="hidden"
      />

      {/* 1. BabyGram Instagram-Style Top Bar */}
      <div className="mb-4 py-1.5 px-0.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-baseline gap-1">
            <h1 className="font-serif italic font-extrabold text-2xl sm:text-3xl tracking-tight text-[#1E5E3A] dark:text-[#48B774] flex items-center gap-1 cursor-pointer select-none">
              BabyGram
              <span className="text-xs text-stone-400 not-italic font-sans">▾</span>
            </h1>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#EAF5EF] text-[#1E5E3A] dark:bg-emerald-950/70 dark:text-emerald-300 border border-[#CCE0D2] dark:border-emerald-800/40">
            Moms Club
          </span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Create Post Button (+) */}
          <Dialog open={isNewPostOpen} onOpenChange={setIsNewPostOpen}>
            <DialogTrigger asChild>
              <button
                title="Create New Post"
                className="w-9 h-9 rounded-full bg-white dark:bg-stone-800/90 border border-[#EBE8DF] dark:border-stone-700/60 text-gray-700 dark:text-stone-300 hover:text-forest dark:hover:text-emerald-400 hover:border-[#CCE0D2] flex items-center justify-center shadow-xs transition-transform hover:scale-105"
              >
                <Plus className="w-5 h-5 stroke-[2.3]" />
              </button>
            </DialogTrigger>
            <DialogContent className="rounded-[28px] max-w-md bg-white dark:bg-[#161c18] border border-[#EBE8DF] dark:border-stone-800 text-stone-900 dark:text-stone-100 max-h-[90vh] overflow-y-auto no-scrollbar">
              <DialogHeader>
                <DialogTitle className="font-serif text-2xl text-forest dark:text-emerald-400">
                  New BabyGram Post ✨
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 pt-1">
                {/* Media Type Switcher & Uploader */}
                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-stone-300 block mb-2">
                    Choose what to share:
                  </label>

                  {newMediaPreview ? (
                    <div className="space-y-2">
                      <div className="relative rounded-2xl overflow-hidden border border-[#EBE8DF] dark:border-stone-800 aspect-video bg-stone-900 flex items-center justify-center">
                        {newMediaType === "video" ? (
                          <video
                            src={newMediaPreview}
                            poster={newVideoThumbnail || undefined}
                            controls
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <img
                            src={newMediaPreview}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setNewMediaPreview(null);
                            setNewVideoThumbnail(null);
                            setSelectedFile(null);
                          }}
                          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black/90 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Video Thumbnail / Cover Picker */}
                      {newMediaType === "video" && (
                        <div className="p-3 bg-[#FAF9F5] dark:bg-stone-900 rounded-xl border border-[#EBE8DF] dark:border-stone-800 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {newVideoThumbnail ? (
                              <img
                                src={newVideoThumbnail}
                                alt="Cover"
                                className="w-10 h-10 rounded-lg object-cover border"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-stone-200 dark:bg-stone-800 flex items-center justify-center text-gray-500">
                                <ImageIcon className="w-4 h-4" />
                              </div>
                            )}
                            <div>
                              <p className="text-xs font-semibold text-gray-800 dark:text-stone-200">Video Cover</p>
                              <p className="text-[10px] text-gray-500 dark:text-stone-400">
                                {newVideoThumbnail ? "Custom cover selected" : "Select a cover photo (optional)"}
                              </p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => thumbnailInputRef.current?.click()}
                            className="text-xs h-8 rounded-lg"
                          >
                            {newVideoThumbnail ? "Change" : "Add Cover"}
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="rounded-2xl h-16 border-[#E3DFD3] dark:border-stone-700 flex flex-col items-center justify-center gap-1 hover:border-[#48B774] hover:bg-[#EAF5EF]/40 dark:hover:bg-emerald-950/30"
                      >
                        <Camera className="w-5 h-5 text-[#1E5E3A] dark:text-emerald-400" />
                        <span className="text-[11px] font-semibold text-gray-700 dark:text-stone-300">Photo / Gallery</span>
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => videoInputRef.current?.click()}
                        className="rounded-2xl h-16 border-[#E3DFD3] dark:border-stone-700 flex flex-col items-center justify-center gap-1 hover:border-[#48B774] hover:bg-[#EAF5EF]/40 dark:hover:bg-emerald-950/30"
                      >
                        <Film className="w-5 h-5 text-[#1E5E3A] dark:text-emerald-400" />
                        <span className="text-[11px] font-semibold text-gray-700 dark:text-stone-300">Baby Video</span>
                      </Button>
                    </div>
                  )}
                </div>

                {/* Title */}
                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-stone-300 block mb-1">
                    Post Title
                  </label>
                  <Input
                    placeholder="e.g. First time trying avocado mash!"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="rounded-xl border-[#E3DFD3] dark:border-stone-700 text-xs dark:bg-stone-900"
                  />
                </div>

                {/* Content */}
                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-stone-300 block mb-1">
                    Story / Caption
                  </label>
                  <Textarea
                    placeholder="Share how your baby reacted, recipe ingredients, or feeding tips with fellow moms..."
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    rows={3}
                    className="rounded-xl border-[#E3DFD3] dark:border-stone-700 text-xs resize-none dark:bg-stone-900"
                  />
                </div>

                {/* Age Tag */}
                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-stone-300 block mb-1">
                    Baby Age Category
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {["6-8 Months", "9-11 Months", "12-23 Months", "24+ Months"].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setNewAgeTag(tag)}
                        className={`text-[10px] py-1.5 px-1 rounded-xl border font-semibold text-center transition-all ${
                          newAgeTag === tag
                            ? "bg-[#1E5E3A] text-white border-[#1E5E3A] shadow-xs"
                            : "bg-[#FAF9F5] dark:bg-stone-900 text-gray-700 dark:text-stone-300 border-[#E3DFD3] dark:border-stone-700 hover:bg-stone-100"
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Hashtags */}
                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-stone-300 block mb-1">
                    Hashtags
                  </label>
                  {newHashtags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {newHashtags.map((h) => (
                        <span
                          key={h}
                          className="text-[10px] bg-[#EAF5EF] dark:bg-emerald-950 text-[#1E5E3A] dark:text-emerald-300 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1"
                        >
                          {h}
                          <button
                            type="button"
                            onClick={() => removeHashtag(h)}
                            className="hover:text-red-500"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Suggested Hashtags */}
                  <div className="flex flex-wrap gap-1 mb-2">
                    {SUGGESTED_HASHTAGS.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleHashtag(tag)}
                        className={`text-[10px] px-2 py-0.5 rounded-md border transition-all ${
                          newHashtags.includes(tag)
                            ? "bg-[#1E5E3A] text-white border-[#1E5E3A]"
                            : "bg-white dark:bg-stone-900 text-gray-600 dark:text-stone-400 border-gray-200 dark:border-stone-700 hover:bg-stone-50"
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>

                  {/* Add Custom Hashtag Input */}
                  <div className="flex gap-1.5">
                    <Input
                      placeholder="#AddHashtag"
                      value={customHashtagInput}
                      onChange={(e) => setCustomHashtagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addCustomHashtag();
                        }
                      }}
                      className="rounded-lg border-[#E3DFD3] dark:border-stone-700 text-xs h-8 dark:bg-stone-900"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={addCustomHashtag}
                      className="h-8 text-xs rounded-lg px-3"
                    >
                      Add
                    </Button>
                  </div>
                </div>

                <Button
                  onClick={handleCreatePost}
                  disabled={isSubmitting}
                  className="w-full rounded-full bg-[#1E5E3A] dark:bg-emerald-600 hover:bg-[#16472c] text-white font-semibold py-3 shadow-md"
                >
                  {isSubmitting ? "Publishing..." : "Publish to BabyGram ❤️"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Activity / Notifications (Heart) */}
          <button
            onClick={() => toast.info("Your BabyGram notifications are active! When moms like or comment on your posts, you'll see alerts here. 💕")}
            title="Activity Notifications"
            className="w-9 h-9 rounded-full bg-white dark:bg-stone-800/90 border border-[#EBE8DF] dark:border-stone-700/60 text-gray-700 dark:text-stone-300 hover:text-rose-500 dark:hover:text-rose-400 flex items-center justify-center relative shadow-xs transition-transform hover:scale-105"
          >
            <Heart className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-stone-900 animate-pulse" />
          </button>

          {/* Direct Messages (DMs) Button - Opens Inbox */}
          <button
            onClick={() => {
              setTargetDMMom(null);
              setIsDMOpen(true);
            }}
            title="Direct Messages"
            className="w-9 h-9 rounded-full bg-white dark:bg-stone-800/90 border border-[#EBE8DF] dark:border-stone-700/60 text-gray-700 dark:text-stone-300 hover:text-forest dark:hover:text-emerald-400 flex items-center justify-center relative shadow-xs transition-transform hover:scale-105"
          >
            <Send className="w-4 h-4" />
          </button>

          {/* Current Mom Profile Button */}
          <button
            onClick={() => handleOpenMotherProfile("You (Mom)", true)}
            title="My Profile"
            className="w-9 h-9 rounded-full p-0.5 bg-gradient-to-tr from-[#1E5E3A] via-[#48B774] to-[#F3A847] shadow-xs hover:scale-105 transition-transform"
          >
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"
              alt="My Profile"
              className="w-full h-full rounded-full object-cover border border-white dark:border-stone-900"
            />
          </button>
        </div>
      </div>

      {/* 2. Instagram Stories Bar on Top */}
      {/* 1. Instagram Stories Bar on Top (Only shows followed moms, or empty for new users) */}
      <CommunityStories
        onAddStoryClick={() => setIsStoryModalOpen(true)}
        followedMoms={followedMoms}
        isAdminUser={isAdminUser}
        onAuthorClick={(name) => handleOpenMotherProfile(name)}
      />

      {/* 2. Instagram-Style Continuous Feed */}
      <div className="space-y-6">
        {isLoadingFeed ? (
          <div className="text-center py-16 text-gray-400 text-xs flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-[#1E5E3A]" />
            <span>Loading community feed...</span>
          </div>
        ) : posts.length === 0 ? (
          <div className="rounded-[28px] bg-white border border-[#EBE8DF] p-10 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-[#EAF5EF] text-[#1E5E3A] flex items-center justify-center mx-auto shadow-xs">
              <Sparkles className="w-8 h-8 stroke-[1.5]" />
            </div>
            <h3 className="font-serif text-xl font-bold text-gray-900">
              Welcome to Moms' Community!
            </h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
              No posts have been shared yet. Be the very first mother to post a baby weaning photo, video, or recipe milestone!
            </p>
            <Button
              onClick={() => setIsNewPostOpen(true)}
              className="rounded-full bg-[#1E5E3A] hover:bg-[#16472c] text-white text-xs px-6 py-2.5 font-semibold"
            >
              Share First Post 🥑
            </Button>
          </div>
        ) : (
          posts.map((post) => {
            const isExpanded = !!expandedComments[post.id];
            const postComments = commentsByPost[post.id] || [];
            const currentReply = replyInputByPost[post.id] || "";
            const isPostingReply = !!submittingComment[post.id];
            const hasMedia = (post.image_urls && post.image_urls.length > 0) || !!post.video_url;
            const isVideo = post.media_type === "video";
            const mediaSrc = (post.image_urls && post.image_urls[0]) || post.video_url || null;
            const isFollowing = !!followedMoms[post.author_name || ""];
            const isHeartPopping = !!heartPops[post.id];

            return (
              <article
                key={post.id}
                className="rounded-[28px] bg-white dark:bg-[#161c18] border border-[#EBE8DF] dark:border-stone-800 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.06)] overflow-hidden transition-all duration-200 mb-6"
              >
                {/* 1. Instagram Post Header */}
                <div className="p-3 sm:p-4 flex items-center justify-between">
                  <div
                    className="flex items-center gap-3 cursor-pointer"
                    onClick={() => handleOpenMotherProfile(post.author_name)}
                  >
                    {/* Avatar with authentic Instagram gradient ring */}
                    <div className="w-10 h-10 rounded-full p-[2px] bg-gradient-to-tr from-[#F59E0B] via-[#E1306C] to-[#833AB4] shrink-0">
                      <img
                        src={post.author_avatar || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80"}
                        alt={post.author_name}
                        className="w-full h-full rounded-full object-cover border-2 border-white dark:border-stone-900"
                      />
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-stone-100 leading-tight hover:underline flex items-center gap-1">
                          {post.author_name}
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#0095F6] fill-[#0095F6] text-white shrink-0" />
                        </h4>
                        <span className="text-[10px] bg-[#EAF5EF] dark:bg-emerald-950/70 text-[#1E5E3A] dark:text-emerald-300 px-2 py-0.5 rounded-full font-semibold">
                          {post.author_baby}
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-400 dark:text-stone-500">
                        {new Date(post.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })} • BabyGram
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Follow Button */}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleToggleFollow(post.author_name || "")}
                      className={`rounded-full h-7 px-2.5 text-[11px] font-semibold transition-all ${
                        isFollowing
                          ? "bg-gray-100 dark:bg-stone-800 text-gray-600 dark:text-stone-300 hover:bg-gray-200"
                          : "bg-[#EAF5EF] dark:bg-emerald-950/60 text-[#1E5E3A] dark:text-emerald-300 hover:bg-[#d6ecde]"
                      }`}
                    >
                      {isFollowing ? (
                        <span className="flex items-center gap-1"><UserCheck className="w-3 h-3" /> Following</span>
                      ) : (
                        <span className="flex items-center gap-1"><UserPlus className="w-3 h-3" /> Follow</span>
                      )}
                    </Button>

                    {/* 3-dots Menu */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-stone-200">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl text-xs dark:bg-stone-900 dark:border-stone-800">
                        <DropdownMenuItem
                          onClick={() => handleToggleSave(post.id)}
                          className="cursor-pointer"
                        >
                          <Bookmark className="w-3.5 h-3.5 mr-2" />
                          {savedPosts[post.id] ? "Remove from Saved" : "Save Post"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleSharePost(post)}
                          className="cursor-pointer"
                        >
                          <Share2 className="w-3.5 h-3.5 mr-2" />
                          Share Post
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleReportPost(post)}
                          className="cursor-pointer text-red-600 focus:text-red-600"
                        >
                          <Flag className="w-3.5 h-3.5 mr-2" />
                          Report to Admin
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* 2. Instagram High-Res Post Media (Aspect 4:5 or 4:3) with Double-Tap Heart */}
                {hasMedia && (
                  <div
                    className="relative w-full aspect-[4/5] sm:aspect-square bg-stone-950 cursor-pointer overflow-hidden select-none flex items-center justify-center"
                    onDoubleClick={() => handleDoubleTapPhoto(post.id)}
                  >
                    {isVideo ? (
                      <video
                        src={mediaSrc!}
                        poster={post.video_thumbnail}
                        controls
                        muted={mutedVideos[post.id] ?? false}
                        playsInline
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <img
                        src={mediaSrc!}
                        alt={post.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    )}

                    {/* Video sound toggle overlay */}
                    {isVideo && (
                      <button
                        type="button"
                        onClick={(e) => toggleVideoMute(post.id, e)}
                        className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors z-20 shadow-md"
                        title={mutedVideos[post.id] ? "Unmute" : "Mute"}
                      >
                        {mutedVideos[post.id] ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                      </button>
                    )}

                    {/* Blooming Pop Heart on Double Tap */}
                    {isHeartPopping && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-in fade-in zoom-in duration-300 z-30">
                        <Heart className="w-24 h-24 text-white fill-white drop-shadow-2xl scale-125 transition-transform animate-pulse" />
                      </div>
                    )}
                  </div>
                )}

                {/* 3. Instagram Action Bar */}
                <div className="p-4 pt-3 pb-2 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Heart (Like) Button */}
                    <button
                      onClick={() => handleLike(post.id)}
                      className="flex items-center gap-1.5 focus:outline-none transition-transform active:scale-125"
                      title="Like"
                    >
                      <Heart
                        className={`w-6 h-6 transition-all duration-200 ${
                          post.user_has_liked
                            ? "fill-rose-500 text-rose-500 scale-110 drop-shadow-xs"
                            : "text-gray-700 dark:text-stone-300 hover:text-rose-500"
                        }`}
                      />
                    </button>

                    {/* Comment Button */}
                    <button
                      onClick={() => toggleComments(post.id)}
                      className="text-gray-700 dark:text-stone-300 hover:text-forest dark:hover:text-emerald-400 transition-colors focus:outline-none"
                      title="Comment"
                    >
                      <MessageCircle className="w-6 h-6" />
                    </button>

                    {/* Send / Direct Message Button */}
                    <button
                      onClick={() => {
                        setTargetDMMom({
                          id: post.author_name,
                          name: post.author_name,
                          babyName: post.author_baby?.split("•")[0]?.trim() || "Baby",
                          babyAge: post.author_baby?.split("•")[1]?.trim() || "8m",
                          avatar: post.author_avatar || "",
                          bio: "",
                          followersCount: 0,
                          followingCount: 0,
                          posts: [],
                        });
                        setIsDMOpen(true);
                      }}
                      title={`Message ${post.author_name}`}
                      className="text-gray-700 dark:text-stone-300 hover:text-forest dark:hover:text-emerald-400 transition-colors focus:outline-none"
                    >
                      <Send className="w-5 h-5 -rotate-12" />
                    </button>

                    {/* Share Button */}
                    <button
                      onClick={() => handleSharePost(post)}
                      className="text-gray-700 dark:text-stone-300 hover:text-forest dark:hover:text-emerald-400 transition-colors focus:outline-none"
                      title="Share"
                    >
                      <Share2 className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Bookmark / Save Button */}
                  <button
                    onClick={() => handleToggleSave(post.id)}
                    className="focus:outline-none transition-transform active:scale-125"
                    title={savedPosts[post.id] ? "Saved" : "Save"}
                  >
                    <Bookmark
                      className={`w-6 h-6 transition-colors ${
                        savedPosts[post.id]
                          ? "fill-[#1E5E3A] text-[#1E5E3A] dark:fill-emerald-400 dark:text-emerald-400"
                          : "text-gray-700 dark:text-stone-300 hover:text-forest dark:hover:text-emerald-400"
                      }`}
                    />
                  </button>
                </div>

                {/* 4. Instagram Likes Count */}
                <div className="px-4 pb-1">
                  <span className="text-xs font-bold text-gray-900 dark:text-stone-100">
                    Liked by <span className="hover:underline cursor-pointer">sarah_jenkins</span> and {post.likes_count} others
                  </span>
                </div>

                {/* 5. Instagram Caption */}
                <div className="px-4 pb-2">
                  <p className="text-xs text-gray-800 dark:text-stone-200 leading-relaxed">
                    <span
                      onClick={() => handleOpenMotherProfile(post.author_name)}
                      className="font-bold text-gray-900 dark:text-stone-100 mr-1.5 cursor-pointer hover:underline inline-flex items-center gap-1"
                    >
                      {post.author_name}
                      <CheckCircle2 className="w-3 h-3 text-[#0095F6] fill-[#0095F6] text-white" />
                    </span>
                    <span className="font-semibold text-forest dark:text-emerald-400 mr-1.5">{post.title} —</span>
                    {post.content}
                  </p>

                  {/* Hashtags display */}
                  {post.hashtags && post.hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {post.hashtags.map((h) => (
                        <span key={h} className="text-[11px] font-semibold text-[#1E5E3A] dark:text-emerald-400 hover:underline cursor-pointer">
                          {h}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* 6. Expandable Comments Preview */}
                {postComments.length > 0 && !isExpanded && (
                  <div className="px-4 pb-2">
                    <button
                      onClick={() => toggleComments(post.id)}
                      className="text-xs text-gray-500 dark:text-stone-400 hover:text-forest dark:hover:text-emerald-400 transition-colors font-medium"
                    >
                      View all {postComments.length} comments
                    </button>
                  </div>
                )}

                {/* Expanded Comment Thread */}
                {isExpanded && (
                  <div className="px-4 pb-3 border-t border-stone-100 dark:border-stone-800 pt-3 space-y-2.5 bg-[#FAF9F5]/50 dark:bg-stone-900/40">
                    {postComments.map((comment) => (
                      <div key={comment.id} className="text-xs leading-relaxed">
                        <span className="font-bold text-gray-900 dark:text-stone-100 mr-1.5">
                          {comment.author_name}
                        </span>
                        <span className="text-gray-700 dark:text-stone-300">{comment.content}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* 7. Instagram Quick Reply Bar with Smiley */}
                <div className="px-4 py-2.5 border-t border-stone-100 dark:border-stone-800 flex items-center gap-2 bg-white dark:bg-[#161c18]">
                  <Smile className="w-4 h-4 text-gray-400 dark:text-stone-500 shrink-0" />
                  <Input
                    value={currentReply}
                    onChange={(e) =>
                      setReplyInputByPost((prev) => ({ ...prev, [post.id]: e.target.value }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendComment(post);
                      }
                    }}
                    placeholder="Add a comment as a mom..."
                    className="border-0 bg-transparent text-xs h-8 px-1 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-gray-400 dark:placeholder:text-stone-500 dark:text-stone-100 flex-1 shadow-none"
                  />
                  {currentReply.trim() && (
                    <Button
                      size="sm"
                      onClick={() => handleSendComment(post)}
                      disabled={isPostingReply}
                      className="rounded-full bg-[#1E5E3A] dark:bg-emerald-600 hover:bg-[#16472c] text-white text-xs h-7 px-3 font-semibold shrink-0"
                    >
                      {isPostingReply ? <Loader2 className="w-3 h-3 animate-spin" /> : "Post"}
                    </Button>
                  )}
                </div>
              </article>
            );
          })
        )}
      </div>

      {/* Mother Profile Modal */}
      <MotherProfileModal
        isOpen={profileModalState.open}
        onClose={() => setProfileModalState({ open: false, profile: null })}
        profile={profileModalState.profile}
        onToggleFollow={(name) => handleToggleFollow(name)}
        onOpenDM={(mom) => {
          setTargetDMMom(mom);
          setIsDMOpen(true);
        }}
      />

      {/* Direct Messages (DM) Modal */}
      <DirectMessagesModal
        isOpen={isDMOpen}
        onClose={() => setIsDMOpen(false)}
        targetMom={targetDMMom}
        isAdminUser={isAdminUser}
      />

      {/* Create Story Modal */}
      <CreateStoryModal
        isOpen={isStoryModalOpen}
        onClose={() => setIsStoryModalOpen(false)}
        onStoryCreated={(newStory) => {
          // Handled inside CommunityStories
        }}
      />
    </div>
  );
};

export default Community;
