import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
  Heart, MessageCircle, Share2, Bookmark, Plus, 
  Sparkles, Send, Bell, Loader2, Check, User,
  Camera, Image as ImageIcon, Video, X, Smile, UserPlus, UserCheck, 
  MoreHorizontal, Flag, Film, Baby, ShieldCheck, Hash, Tag,
  CheckCircle2, Volume2, VolumeX, Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BADGES } from "@/hooks/useGamification";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import CommunityStories, { StoryItem } from "@/components/community/CommunityStories";
import MotherProfileModal, { MotherProfileData } from "@/components/community/MotherProfileModal";
import DirectMessagesModal from "@/components/community/DirectMessagesModal";
import CreateStoryModal from "@/components/community/CreateStoryModal";
import CreatePostModal from "@/components/community/CreatePostModal";
import ReportPostModal from "@/components/community/ReportPostModal";
import { 
  getDeletedPostIds, 
  deletePostGlobally, 
  COMMUNITY_LOCAL_POSTS_KEY 
} from "@/services/communityService";

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
  location?: string;
  audio_track?: string;
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

const ADMIN_EMAILS = [
  "admin@babybites.app",
  "superadmin@babybites.app",
  "dona@babybites.app",
  "pediatra@babybites.app",
  "nutri@babybites.app",
];

// No mock posts by default - clean real community feed
const SAMPLE_COMMUNITY_POSTS: Post[] = [];

const COMMENTS_STORAGE_KEY = "babybites_community_comments_v3";
const FOLLOWS_STORAGE_KEY = "babybites_followed_moms_v3";

export const Community: React.FC = () => {
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>("guest");
  const [currentUserName, setCurrentUserName] = useState<string>("Loving Mom");
  const [currentUserBaby, setCurrentUserBaby] = useState<string>("Mom of Baby");
  const [currentUserAvatar, setCurrentUserAvatar] = useState<string>(
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"
  );
  const [isAdminUser, setIsAdminUser] = useState(false);

  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoadingFeed, setIsLoadingFeed] = useState(true);

  // New Post Modal (Instagram Style Flow: Image 3 & 4)
  const [isNewPostOpen, setIsNewPostOpen] = useState(false);

  // Story Creation Modal (Image 1 & 2)
  const [isStoryModalOpen, setIsStoryModalOpen] = useState(false);

  // Report Modal (Requirement 2)
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [postToReport, setPostToReport] = useState<Post | null>(null);

  // Interactions state
  const [heartPops, setHeartPops] = useState<Record<string, boolean>>({});
  const [mutedVideos, setMutedVideos] = useState<Record<string, boolean>>({});
  const [savedPosts, setSavedPosts] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem("babygram_saved_posts_v1");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Modals state
  const [isDMOpen, setIsDMOpen] = useState(false);
  const [targetDMMom, setTargetDMMom] = useState<MotherProfileData | null>(null);
  const [profileModalState, setProfileModalState] = useState<{
    open: boolean;
    profile: MotherProfileData | null;
  }>({ open: false, profile: null });

  // Follow system
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
        setCurrentUserId(session?.user?.id || "guest");
        const adminCheck = ADMIN_EMAILS.includes(email);
        setIsAdminUser(adminCheck);

        if (session?.user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("mother_name, baby_name, full_name, avatar_url")
            .eq("id", session.user.id)
            .single();

          if (profile?.mother_name || profile?.full_name) {
            setCurrentUserName(profile.mother_name || profile.full_name);
          }
          if (profile?.baby_name) {
            setCurrentUserBaby(`Mom of ${profile.baby_name}`);
          }
          if (profile?.avatar_url) {
            setCurrentUserAvatar(profile.avatar_url);
          }
        }

        // Fetch Supabase posts
        await fetchSupabasePosts();
      } catch (err) {
        console.error("Auth init error:", err);
        setIsLoadingFeed(false);
      }
    };
    initAuth();

    // Listen to real-time global deletion events
    const onPostDeleted = (e: any) => {
      const deletedId = e.detail?.postId;
      if (deletedId) {
        setPosts((prev) => prev.filter((p) => p.id !== deletedId));
      }
    };
    window.addEventListener("babygram:post_deleted", onPostDeleted);
    return () => window.removeEventListener("babygram:post_deleted", onPostDeleted);
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

  const fetchSupabasePosts = async () => {
    setIsLoadingFeed(true);
    try {
      const deletedIds = getDeletedPostIds();

      const { data, error } = await supabase
        .from("forum_posts")
        .select("*")
        .neq("title", "__SYSTEM_RECIPE_OVERRIDES__")
        .order("created_at", { ascending: false })
        .limit(40);

      // Locally saved posts
      let localPosts: Post[] = [];
      try {
        const saved = localStorage.getItem(COMMUNITY_LOCAL_POSTS_KEY);
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

      const initialPool = [
        ...localPosts,
        ...mappedSupabase,
        ...SAMPLE_COMMUNITY_POSTS,
      ];

      // Filter out deleted posts (Requirement 1)
      const deduplicated = Array.from(new Map(initialPool.map((p) => [p.id, p])).values())
        .filter((p) => !deletedIds.includes(p.id));

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
    if (!authorName) return;
    setFollowedMoms((prev) => {
      const isCurrentlyFollowing = !!prev[authorName];
      const nextState = !isCurrentlyFollowing;
      const updated = { ...prev, [authorName]: nextState };
      if (nextState) {
        toast.success(`You are now following ${authorName}! 🌸`);
      } else {
        toast.info(`Unfollowed ${authorName}`);
      }
      return updated;
    });
  };

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

  const handleSharePost = (post: Post) => {
    const shareText = `Check out this weaning milestone from ${post.author_name} on BabyGram: "${post.title}"`;
    if (navigator.share) {
      navigator.share({
        title: post.title,
        text: shareText,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${shareText}\n${window.location.href}`);
      toast.success("Post link copied to clipboard!");
    }
  };

  // Requirement 2: Open Report Modal
  const handleReportPost = (post: Post) => {
    setPostToReport(post);
    setIsReportOpen(true);
  };

  // Requirement 1: Delete Post Globally
  const handleDeletePost = async (postId: string) => {
    try {
      await deletePostGlobally(postId);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      toast.success("Post deleted permanently from the Community! 🗑️");
    } catch (e) {
      console.error(e);
      toast.error("Could not delete post.");
    }
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

      const newCommentObj: CommentItem = {
        id: "c-" + Date.now(),
        post_id: post.id,
        user_id: session?.user?.id || currentUserId,
        author_name: currentUserName,
        author_baby: currentUserBaby,
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

  const handleOpenMotherProfile = (authorName: string, isCurrentUser = false) => {
    const isSelf = isCurrentUser || authorName === currentUserName || authorName === "You" || authorName === "You (Mom)" || authorName === "Loving Mom";
    const userPosts = posts.filter((p) => p.author_name === authorName);
    const isAuthorAdmin = (isSelf && isAdminUser) || authorName.toLowerCase().includes("admin") || authorName === "Sarah Jenkins";
    let userPinnedBadges = isAuthorAdmin 
      ? BADGES.map(b => b.id) 
      : ['pioneer_mother', 'recipes_10', 'master_planner'];

    if (isSelf && !isAdminUser) {
      try {
        const raw = localStorage.getItem("babybites_pinned_badges_v1");
        if (raw) userPinnedBadges = JSON.parse(raw);
      } catch {}
    }

    // Strict rule: Emily has 500 followers. Every other mother starts with 0 followers!
    const isEmily = authorName.toLowerCase().includes("emily");
    const followers = isEmily ? 500 : 0;
    const following = isEmily ? 12 : (isSelf ? Object.keys(followedMoms).length : 0);

    let storedBio = "";
    if (isSelf) {
      try {
        storedBio = localStorage.getItem("babybites_mother_bio_v1") || "";
      } catch {}
    }

    const profileData: MotherProfileData = {
      id: isSelf ? currentUserId : authorName.toLowerCase().replace(/\s+/g, "-"),
      name: isSelf ? currentUserName : authorName,
      babyName: isSelf ? currentUserBaby : authorName === "Sarah Jenkins" ? "Noah" : "Maya",
      babyAge: authorName === "Sarah Jenkins" ? "7 months" : "11 months",
      avatar: isSelf
        ? currentUserAvatar
        : authorName === "Sarah Jenkins"
        ? "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80"
        : "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
      bio: isSelf
        ? (storedBio ? storedBio.slice(0, 50) : "Loving mom on BabyBites! 🥑✨")
        : (isEmily ? "Mom loving baby-led weaning & healthy finger foods." : "Loving mother exploring the magic of weaning!"),
      followersCount: followers,
      followingCount: following,
      posts: userPosts.map(p => ({
        id: p.id,
        title: p.title,
        mediaUrl: (p.image_urls && p.image_urls[0]) || p.video_url || "",
        mediaType: p.media_type,
        likesCount: p.likes_count,
      })),
      isVerifiedMother: true,
      pinnedBadges: userPinnedBadges,
      isAdmin: isAuthorAdmin,
      isCurrentUser: isSelf,
      isFollowing: isSelf ? false : !!followedMoms[authorName],
    };
    setProfileModalState({ open: true, profile: profileData });
  };

  return (
    <div className="max-w-xl mx-auto px-3 sm:px-4 py-4 pb-24 text-stone-900 dark:text-stone-100 min-h-screen">
      {/* 1. Authentic Instagram-Style Top Bar */}
      <div className="flex items-center justify-between pb-3.5 mb-3 border-b border-[#EBE8DF]/80 dark:border-stone-800/80">
        <div className="flex items-center gap-2">
          <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-[#1E5E3A] dark:text-emerald-400 tracking-tight flex items-center gap-1.5 cursor-pointer">
            <span>BabyGram</span>
            <span className="text-xs text-stone-400 dark:text-stone-500 font-sans font-normal pt-1">⌄</span>
          </h1>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#EAF5EF] dark:bg-emerald-950/80 text-[#1E5E3A] dark:text-emerald-300 border border-[#CCE0D2] dark:border-emerald-800/60 hidden sm:inline-block">
            Moms Club
          </span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Create Post Button (+) - Opens Instagram Creation Flow (Image 3 & 4) */}
          <button
            onClick={() => setIsNewPostOpen(true)}
            title="Create New Post"
            className="w-9 h-9 rounded-full bg-white dark:bg-stone-800/90 border border-[#EBE8DF] dark:border-stone-700/60 text-gray-700 dark:text-stone-300 hover:text-forest dark:hover:text-emerald-400 hover:border-[#CCE0D2] flex items-center justify-center shadow-xs transition-transform hover:scale-105"
          >
            <Plus className="w-5 h-5 stroke-[2.3]" />
          </button>

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
              src={currentUserAvatar}
              alt="My Profile"
              className="w-full h-full rounded-full object-cover border border-white dark:border-stone-900"
            />
          </button>
        </div>
      </div>

      {/* 2. Instagram Stories Bar (Requirement 4: Unviewed first, viewed last with gray ring) */}
      <CommunityStories
        onAddStoryClick={() => setIsStoryModalOpen(true)}
        followedMoms={followedMoms}
        isAdminUser={isAdminUser}
        onAuthorClick={(name) => handleOpenMotherProfile(name)}
      />

      {/* 3. Instagram-Style Continuous Feed */}
      <div className="space-y-6">
        {isLoadingFeed ? (
          <div className="text-center py-16 text-gray-400 text-xs flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-[#1E5E3A]" />
            <span>Loading community feed...</span>
          </div>
        ) : posts.length === 0 ? (
          <div className="rounded-[28px] bg-white dark:bg-[#161c18] border border-[#EBE8DF] dark:border-stone-800 p-10 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-[#EAF5EF] dark:bg-emerald-950 text-[#1E5E3A] dark:text-emerald-300 flex items-center justify-center mx-auto shadow-xs">
              <Sparkles className="w-8 h-8 stroke-[1.5]" />
            </div>
            <h3 className="font-serif text-xl font-bold text-gray-900 dark:text-stone-100">
              Welcome to Moms' Community!
            </h3>
            <p className="text-xs text-gray-500 dark:text-stone-400 max-w-sm mx-auto leading-relaxed">
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
            const isOwnPost = Boolean(
              (currentUserId && currentUserId !== "guest" && post.user_id === currentUserId) ||
              post.author_name === currentUserName ||
              post.author_name === "You" ||
              post.author_name === "You (Mom)" ||
              post.author_name === "Loving Mom"
            );
            const canDelete = isAdminUser || isOwnPost;

            return (
              <article
                key={post.id}
                className="rounded-[28px] bg-white dark:bg-[#161c18] border border-[#EBE8DF] dark:border-stone-800 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.06)] overflow-hidden transition-all duration-200 mb-6"
              >
                {/* 1. Instagram Post Header */}
                <div className="p-3 sm:p-4 flex items-center justify-between">
                  <div
                    className="flex items-center gap-3 cursor-pointer"
                    onClick={() => handleOpenMotherProfile(post.author_name, isOwnPost)}
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
                        <h4 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-stone-100 leading-tight hover:underline flex items-center gap-1.5">
                          {post.author_name}
                          <CheckCircle2 className="w-3.5 h-3.5 text-sky-500 fill-sky-500 text-white shrink-0" />
                        </h4>
                        <span className="text-[10px] bg-[#EAF5EF] dark:bg-emerald-950/70 text-[#1E5E3A] dark:text-emerald-300 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                          {post.author_baby}
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-400 dark:text-stone-500">
                        {new Date(post.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })} • BabyGram {post.location ? `• 📍 ${post.location}` : ""}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Follow Button - Never allow following oneself */}
                    {!isOwnPost && (
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
                    )}

                    {/* 3-dots Menu with Delete & Report */}
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

                        {/* Requirement 1: Delete Post */}
                        {canDelete && (
                          <DropdownMenuItem
                            onClick={() => handleDeletePost(post.id)}
                            className="cursor-pointer text-rose-600 focus:text-rose-600 font-semibold"
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-2 text-rose-600" />
                            Delete Post
                          </DropdownMenuItem>
                        )}

                        {/* Requirement 2: Report Post */}
                        <DropdownMenuItem
                          onClick={() => handleReportPost(post)}
                          className="cursor-pointer text-amber-600 focus:text-amber-600"
                        >
                          <Flag className="w-3.5 h-3.5 mr-2 text-amber-600" />
                          Report to Admin
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* 
                  Requirement 3: Media displayed in ORIGINAL size/ratio WITHOUT CROPPING!
                  Uses object-contain with max-h-[750px] so full height and width are preserved.
                */}
                {hasMedia && (
                  <div
                    className="relative w-full bg-stone-950/95 dark:bg-black cursor-pointer overflow-hidden select-none flex items-center justify-center min-h-[220px]"
                    onDoubleClick={() => handleDoubleTapPhoto(post.id)}
                  >
                    {isVideo ? (
                      <video
                        src={mediaSrc!}
                        poster={post.video_thumbnail}
                        controls
                        muted={mutedVideos[post.id] ?? false}
                        playsInline
                        className="w-full max-h-[750px] object-contain block mx-auto"
                      />
                    ) : (
                      <img
                        src={mediaSrc!}
                        alt={post.title}
                        className="w-full max-h-[750px] object-contain block mx-auto"
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
                    {post.content}
                  </p>
                </div>

                {/* 6. Expandable Comments Section */}
                <div className="px-4 pb-3">
                  {post.comments_count > 0 && (
                    <button
                      onClick={() => toggleComments(post.id)}
                      className="text-xs text-gray-500 dark:text-stone-400 hover:text-gray-700 font-medium mb-2 block"
                    >
                      {isExpanded
                        ? "Hide comments"
                        : `View all ${post.comments_count} ${post.comments_count === 1 ? "comment" : "comments"}`}
                    </button>
                  )}

                  {isExpanded && (
                    <div className="space-y-2 mb-3 bg-gray-50/70 dark:bg-stone-900/50 p-3 rounded-2xl border border-gray-100 dark:border-stone-800/60 max-h-48 overflow-y-auto no-scrollbar">
                      {postComments.length === 0 ? (
                        <p className="text-[11px] text-gray-400 dark:text-stone-500 italic">No comments yet. Be the first to cheer this mom!</p>
                      ) : (
                        postComments.map((c) => (
                          <div key={c.id} className="text-xs">
                            <span className="font-bold text-gray-900 dark:text-stone-200 mr-1.5">{c.author_name}</span>
                            <span className="text-gray-700 dark:text-stone-300">{c.content}</span>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* 7. Quick Comment Input */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendComment(post);
                    }}
                    className="flex items-center gap-2 pt-1 border-t border-[#EBE8DF]/50 dark:border-stone-800/50"
                  >
                    <input
                      type="text"
                      placeholder="Add a comment with love..."
                      value={currentReply}
                      onChange={(e) =>
                        setReplyInputByPost((prev) => ({ ...prev, [post.id]: e.target.value }))
                      }
                      className="flex-1 text-xs bg-transparent border-0 text-gray-800 dark:text-stone-200 placeholder-gray-400 dark:placeholder-stone-500 focus:outline-none focus:ring-0 py-1 px-0"
                    />
                    {currentReply.trim() && (
                      <button
                        type="submit"
                        disabled={isPostingReply}
                        className="text-xs font-bold text-[#0095F6] hover:text-[#1877F2] transition-colors disabled:opacity-50"
                      >
                        {isPostingReply ? "..." : "Post"}
                      </button>
                    )}
                  </form>
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
        onUpdateProfile={(updated) => {
          if (updated.name) setCurrentUserName(updated.name);
          if (updated.babyName) setCurrentUserBaby(`Mom of ${updated.babyName}`);
          if (profileModalState.profile) {
            setProfileModalState({
              open: true,
              profile: {
                ...profileModalState.profile,
                ...updated,
              },
            });
          }
        }}
      />

      {/* Direct Messages (DM) Modal */}
      <DirectMessagesModal
        isOpen={isDMOpen}
        onClose={() => setIsDMOpen(false)}
        targetMom={targetDMMom}
        isAdminUser={isAdminUser}
        currentUserAvatar={currentUserAvatar}
        currentUserName={currentUserName}
      />

      {/* Requirement 5: Create Story Modal (Instagram 2-step flow: Image 1 & Image 2) */}
      <CreateStoryModal
        isOpen={isStoryModalOpen}
        onClose={() => setIsStoryModalOpen(false)}
        onStoryCreated={(newStory) => {
          toast.success("Story posted! 🌟");
        }}
        currentUserAvatar={currentUserAvatar}
        currentUserName={currentUserName}
      />

      {/* Requirement 5: Create Post Modal (Instagram 2-step flow: Image 3 & Image 4) */}
      <CreatePostModal
        isOpen={isNewPostOpen}
        onClose={() => setIsNewPostOpen(false)}
        onPostCreated={(newPost) => {
          setPosts((prev) => [newPost, ...prev]);
        }}
        currentUser={{
          id: currentUserId,
          name: currentUserName,
          baby: currentUserBaby,
          avatar: currentUserAvatar,
        }}
      />

      {/* Requirement 2: Report Post Modal */}
      <ReportPostModal
        isOpen={isReportOpen}
        onClose={() => {
          setIsReportOpen(false);
          setPostToReport(null);
        }}
        post={postToReport}
        reporterName={currentUserName}
        reporterId={currentUserId}
      />
    </div>
  );
};

export default Community;
