import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
  Heart, MessageCircle, Share2, Bookmark, Plus, 
  Sparkles, Send, Bell, Loader2, ChevronDown, ChevronUp, Check, User,
  Camera, Image as ImageIcon, Video, X, Smile, UserPlus, UserCheck, 
  MoreHorizontal, Flag, Film, Baby, ShieldCheck
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
  likes_count: number;
  comments_count: number;
  created_at: string;
  author_name: string;
  author_baby: string;
  author_avatar?: string;
  user_has_liked?: boolean;
  age_tag: string;
  topic?: string;
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

const SAMPLE_POSTS: Post[] = [
  {
    id: "sample-1",
    user_id: "usr-1",
    title: "Primeira vez com brócolos cozidos no vapor! 🥦👶",
    content: "Ele fez uma careta super engraçada no início, mas depois mastigou os raminhos por 10 minutos seguidos! O BLW é maravilhoso.",
    image_urls: ["https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80"],
    media_type: "image",
    likes_count: 24,
    comments_count: 2,
    created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
    author_name: "Sarah Jenkins",
    author_baby: "Noah • 7m",
    author_avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80",
    user_has_liked: true,
    age_tag: "6-8 Months",
    topic: "🥦 BLW & Introdução Alimentar",
  },
  {
    id: "sample-video-1",
    user_id: "usr-demo-video",
    author_name: "Mariana Costa",
    author_baby: "Tomás • 8m",
    title: "Vídeo fofo: Primeira vez a segurar a própria colher! 🥄✨",
    content: "Olhem só a concentração dele a tentar levar a papinha de abóbora à boca sozinho. O coração da mamã derrete!",
    image_urls: ["https://assets.mixkit.co/videos/preview/mixkit-mother-feeding-her-baby-boy-41318-large.mp4"],
    media_type: "video",
    video_url: "https://assets.mixkit.co/videos/preview/mixkit-mother-feeding-her-baby-boy-41318-large.mp4",
    likes_count: 36,
    comments_count: 4,
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    author_avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
    user_has_liked: false,
    age_tag: "6-8 Months",
    topic: "✨ Conquistas do Bebê",
  },
  {
    id: "sample-2",
    user_id: "usr-2",
    title: "Fornada da semana: Biscoitinhos de Banana & Aveia sem açúcar! 🍌✨",
    content: "Fiz 50 mini biscoitos em 20 minutos direto da secção de receitas do BabyBites. Congelei metade para a próxima semana. A Maya adorou!",
    image_urls: ["https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=800&q=80"],
    media_type: "image",
    likes_count: 42,
    comments_count: 2,
    created_at: new Date(Date.now() - 3600000 * 8).toISOString(),
    author_name: "Emily Rodriguez",
    author_baby: "Maya • 11m",
    author_avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
    user_has_liked: false,
    age_tag: "9-11 Months",
    topic: "🥣 Papinhas & Receitas",
  },
  {
    id: "sample-3",
    user_id: "usr-3",
    title: "Pratinho Colorido de Toddler: Tostinhas de batata doce & abacate! 🥑🍠",
    content: "Alimentação independente consolidada! Comeu tudinho sem birra. Cardápio inspirado no planejador semanal da aplicação.",
    image_urls: ["https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80"],
    media_type: "image",
    likes_count: 38,
    comments_count: 2,
    created_at: new Date(Date.now() - 3600000 * 16).toISOString(),
    author_name: "Elena Gomez",
    author_baby: "Sofia • 14m",
    author_avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=200&q=80",
    user_has_liked: true,
    age_tag: "12-23 Months",
    topic: "💡 Dicas de Mãe",
  },
];

const INITIAL_COMMENTS: Record<string, CommentItem[]> = {
  "sample-1": [
    {
      id: "c-1",
      post_id: "sample-1",
      user_id: "u-101",
      author_name: "Hannah Cole",
      author_baby: "Mãe do Theo, 9m",
      content: "A careta do brócolos é um clássico! O meu fez a mesma carinha 3 dias e hoje é o legume favorito dele.",
      created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
    {
      id: "c-2",
      post_id: "sample-1",
      user_id: "u-102",
      author_name: "Dra. Clara Mendes",
      author_baby: "Nutricionista Pediátrica",
      content: "Excelente oferecer o ramo inteiro! Segurar no talo desenvolve a preensão palmar e a mastigação lateral.",
      created_at: new Date(Date.now() - 3600000 * 1).toISOString(),
    },
  ],
  "sample-video-1": [
    {
      id: "c-v1",
      post_id: "sample-video-1",
      user_id: "u-103",
      author_name: "Sofia Santos",
      author_baby: "Mãe da Alice, 7m",
      content: "Que momento mais emocionante! Parabéns mamã, que orgulho lindo ver essa autonomia nascer!",
      created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    },
  ],
};

const COMMUNITY_TOPICS = [
  "🥦 BLW & Introdução Alimentar",
  "🥣 Papinhas & Receitas",
  "🍼 Dúvidas & Pediatria",
  "✨ Conquistas do Bebê",
  "💡 Dicas de Mãe",
];

const COMMENTS_STORAGE_KEY = "babybites_community_comments_v2";
const FOLLOWS_STORAGE_KEY = "babybites_followed_moms_v1";
const LOCAL_POSTS_KEY = "babybites_community_local_posts_v2";

export const Community: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_POSTS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return [...parsed, ...SAMPLE_POSTS];
      }
    } catch (e) {
      console.error(e);
    }
    return SAMPLE_POSTS;
  });

  const [activeTab, setActiveTab] = useState<string>("all");
  const [activeTopic, setActiveTopic] = useState<string>("all");

  // Post creation modal
  const [isNewPostOpen, setIsNewPostOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newAgeTag, setNewAgeTag] = useState("6-8 Months");
  const [newTopic, setNewTopic] = useState(COMMUNITY_TOPICS[0]);
  const [newMediaPreview, setNewMediaPreview] = useState<string | null>(null);
  const [newMediaType, setNewMediaType] = useState<"image" | "video">("image");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [heartPops, setHeartPops] = useState<Record<string, boolean>>({});

  // Modals state
  const [isDMOpen, setIsDMOpen] = useState(false);
  const [targetDMMom, setTargetDMMom] = useState<MotherProfileData | null>(null);
  const [isStoryModalOpen, setIsStoryModalOpen] = useState(false);
  const [profileModalState, setProfileModalState] = useState<{
    open: boolean;
    profile: MotherProfileData | null;
  }>({ open: false, profile: null });

  // Refs for media pickers
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Follow system
  const [followedMoms, setFollowedMoms] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(FOLLOWS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : { "Sarah Jenkins": true, "Mariana Costa": true };
    } catch {
      return { "Sarah Jenkins": true, "Mariana Costa": true };
    }
  });

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
    fetchSupabasePosts();
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
    try {
      const { data, error } = await supabase
        .from("forum_posts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(30);

      if (!error && data && data.length > 0) {
        const mapped: Post[] = data.map((p) => ({
          id: p.id,
          user_id: p.user_id,
          title: p.title,
          content: p.content,
          image_urls: p.image_urls || (p.video_url ? [p.video_url] : null),
          media_type: p.media_type || (p.video_url ? "video" : "image"),
          video_url: p.video_url,
          likes_count: p.likes_count || 0,
          comments_count: p.comments_count || 0,
          created_at: p.created_at,
          author_name: p.author_name || "Mãe da Comunidade",
          author_baby: p.author_baby || "Bebé • 8m",
          author_avatar: p.author_avatar || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80",
          user_has_liked: false,
          age_tag: p.age_tag || "6-8 Months",
          topic: p.topic || "🥦 BLW & Introdução Alimentar",
        }));

        setPosts((prev) => {
          const combined = [...mapped, ...prev];
          return Array.from(new Map(combined.map((item) => [item.id, item])).values());
        });
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
          ? `Agora está a seguir ${authorName}! 💚`
          : `Deixou de seguir ${authorName}`
      );
      return updated;
    });
  };

  const handleSharePost = async (post: Post) => {
    const shareText = `Veja "${post.title}" na Comunidade BabyBites! 🥑👶`;
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
      toast.success("Link da publicação copiado!");
    }
  };

  const handleReportPost = (post: Post) => {
    toast.success("Publicação denunciada. O Administrador avaliará no painel de moderação.");
  };

  const toggleComments = async (postId: string) => {
    const nextState = !expandedComments[postId];
    setExpandedComments((prev) => ({ ...prev, [postId]: nextState }));
  };

  const handleSendComment = async (post: Post) => {
    const text = (replyInputByPost[post.id] || "").trim();
    if (!text) {
      toast.error("Por favor, digite o seu comentário antes de enviar.");
      return;
    }

    setSubmittingComment((prev) => ({ ...prev, [post.id]: true }));

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      let commenterName = "Mamã Cuidadosa";
      let commenterRole = "Mãe de Bebé";

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
          commenterRole = `Mãe do ${profile.baby_name}`;
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
      toast.success("Comentário partilhado com carinho! ❤️");
    } catch (err: any) {
      console.error(err);
      toast.error("Não foi possível enviar o comentário.");
    } finally {
      setSubmittingComment((prev) => ({ ...prev, [post.id]: false }));
    }
  };

  // Handle Photo or Video file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith("video/");
    setNewMediaType(isVideo ? "video" : "image");
    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      setNewMediaPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleCreatePost = async () => {
    if (!newTitle.trim() || !newContent.trim()) {
      toast.error("Por favor adicione um título e uma descrição para o seu post");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      let authorName = "Mamã Conectada";
      let babyRole = "Bebé • 7m";

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
        likes_count: 1,
        comments_count: 0,
        created_at: new Date().toISOString(),
        author_name: authorName,
        author_baby: babyRole,
        author_avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80",
        user_has_liked: true,
        age_tag: newAgeTag,
        topic: newTopic,
        status: "published",
      };

      // Save locally so Admin panel and current view immediately see it
      const updatedPosts = [newPostObj, ...posts];
      setPosts(updatedPosts);
      try {
        localStorage.setItem(LOCAL_POSTS_KEY, JSON.stringify([newPostObj]));
      } catch (e) {
        console.error(e);
      }

      // Sync with Supabase forum_posts
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
      setSelectedFile(null);
      setIsNewPostOpen(false);
      toast.success("Publicação partilhada com sucesso com a comunidade! ❤️");
    } catch (err) {
      toast.error("Não foi possível partilhar a publicação.");
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
      babyName: authorPosts[0]?.author_baby?.split("•")[0]?.trim() || "Bebé",
      babyAge: authorPosts[0]?.author_baby?.split("•")[1]?.trim() || "8 meses",
      avatar: authorPosts[0]?.author_avatar || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80",
      bio: "Mãe dedicada a aprender e partilhar receitas de introdução alimentar saudável no BabyBites! 🥑🥣",
      followersCount: followedMoms[authorName] ? 129 : 128,
      followingCount: 84,
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

  const categories = [
    { id: "all", label: "🌟 Todo o Feed" },
    { id: "following", label: "❤️ A Seguir" },
    { id: "videos", label: "🎥 Vídeos" },
    { id: "6-8", label: "👶 6–8 Meses" },
    { id: "9-11", label: "🥑 9–11 Meses" },
    { id: "12-23", label: "🥞 12–23 Meses" },
    { id: "24+", label: "🎈 24+ Meses" },
  ];

  const filteredPosts = posts.filter((p) => {
    // Tab filter
    if (activeTab === "following" && !followedMoms[p.author_name || ""]) return false;
    if (activeTab === "videos" && p.media_type !== "video") return false;
    if (activeTab === "6-8" && p.age_tag !== "6-8 Months") return false;
    if (activeTab === "9-11" && p.age_tag !== "9-11 Months") return false;
    if (activeTab === "12-23" && p.age_tag !== "12-23 Months") return false;
    if (activeTab === "24+" && p.age_tag !== "24+ Months") return false;

    // Topic filter
    if (activeTopic !== "all" && p.topic !== activeTopic) return false;

    return true;
  });

  return (
    <div className="min-h-screen bg-[#FAF9F5] pb-24 pt-3 px-3 sm:px-4 max-w-2xl mx-auto w-full max-w-full overflow-x-hidden min-w-0">
      {/* Hidden File Inputs for Camera & Gallery */}
      <input
        type="file"
        accept="image/*,video/*"
        ref={fileInputRef}
        onChange={handleFileSelect}
        className="hidden"
      />
      <input
        type="file"
        accept="image/*,video/*"
        capture="environment"
        ref={cameraInputRef}
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Header Banner & Social Action Buttons */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <span className="text-[11px] font-bold tracking-wider uppercase text-[#1E5E3A] flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#48B774] inline-block animate-pulse" />
            Rede Social BabyBites
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-forest mt-0.5">
            Comunidade de Mães
          </h1>
          <p className="text-[11px] text-gray-500">
            Troque experiências, fotos de pratinhos e vídeos com outras mães.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Direct Messages (DMs) Button */}
          <button
            onClick={() => {
              setTargetDMMom(null);
              setIsDMOpen(true);
            }}
            title="Mensagens Diretas (DMs)"
            className="w-10 h-10 rounded-full bg-white border border-[#EBE8DF] text-gray-700 hover:text-forest hover:bg-stone-50 flex items-center justify-center relative shadow-xs transition-colors"
          >
            <Send className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
              2
            </span>
          </button>

          {/* Current Mom Profile Button */}
          <button
            onClick={() => handleOpenMotherProfile("Você (Mamã)", true)}
            title="Meu Perfil"
            className="w-10 h-10 rounded-full p-0.5 bg-gradient-to-tr from-[#1E5E3A] via-[#48B774] to-[#F3A847] shadow-xs hover:scale-105 transition-transform"
          >
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"
              alt="Meu Perfil"
              className="w-full h-full rounded-full object-cover border border-white"
            />
          </button>

          {/* Create Post Button */}
          <Dialog open={isNewPostOpen} onOpenChange={setIsNewPostOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-full bg-[#1E5E3A] hover:bg-[#16472c] text-white font-semibold text-xs px-3.5 py-2 flex items-center gap-1.5 shadow-sm">
                <Camera className="w-4 h-4" />
                <span className="hidden sm:inline">Publicar</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-[28px] max-w-md bg-white border border-[#EBE8DF] max-h-[90vh] overflow-y-auto no-scrollbar">
              <DialogHeader>
                <DialogTitle className="font-serif text-2xl text-forest">
                  Partilhar Foto ou Vídeo
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-3.5 pt-2">
                {/* Topic selector */}
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    Tópico da Publicação
                  </label>
                  <select
                    value={newTopic}
                    onChange={(e) => setNewTopic(e.target.value)}
                    className="w-full rounded-xl border border-[#E3DFD3] text-xs py-2 px-3 bg-white font-medium focus:outline-none focus:ring-1 focus:ring-[#1E5E3A]"
                  >
                    {COMMUNITY_TOPICS.map((topic) => (
                      <option key={topic} value={topic}>
                        {topic}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Age selector */}
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    Idade Recomendada do Bebé
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {["6-8 Months", "9-11 Months", "12-23 Months", "24+ Months"].map((age) => (
                      <button
                        key={age}
                        type="button"
                        onClick={() => setNewAgeTag(age)}
                        className={`py-1.5 text-[10px] font-semibold rounded-lg border text-center transition-all ${
                          newAgeTag === age
                            ? "bg-[#1E5E3A] text-white border-[#1E5E3A]"
                            : "bg-white text-gray-700 border-gray-200"
                        }`}
                      >
                        {age.replace(" Months", "m")}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    Título
                  </label>
                  <Input
                    placeholder="ex: Primeira vez com abacate amassadinho!"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="rounded-xl border-[#E3DFD3] text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    História ou Dicas para outras Mães
                  </label>
                  <Textarea
                    placeholder="Conte como o bebé reagiu, os ingredientes usados ou faça uma pergunta à comunidade..."
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    rows={3}
                    className="rounded-xl border-[#E3DFD3] text-xs"
                  />
                </div>

                {/* Photo & Video Upload (Camera or Gallery) */}
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1.5">
                    Foto ou Vídeo
                  </label>

                  {newMediaPreview ? (
                    <div className="relative rounded-2xl overflow-hidden border border-[#EBE8DF] aspect-video bg-stone-900 flex items-center justify-center">
                      {newMediaType === "video" ? (
                        <video
                          src={newMediaPreview}
                          controls
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <img
                          src={newMediaPreview}
                          alt="Pré-visualização"
                          className="w-full h-full object-cover"
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setNewMediaPreview(null);
                          setSelectedFile(null);
                        }}
                        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black/90 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => cameraInputRef.current?.click()}
                        className="rounded-xl h-14 border-[#E3DFD3] flex flex-col items-center justify-center gap-1 hover:border-[#48B774] hover:bg-[#EAF5EF]/40"
                      >
                        <Camera className="w-5 h-5 text-[#1E5E3A]" />
                        <span className="text-[11px] font-semibold text-gray-700">Tirar Foto / Vídeo</span>
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="rounded-xl h-14 border-[#E3DFD3] flex flex-col items-center justify-center gap-1 hover:border-[#48B774] hover:bg-[#EAF5EF]/40"
                      >
                        <ImageIcon className="w-5 h-5 text-[#1E5E3A]" />
                        <span className="text-[11px] font-semibold text-gray-700">Galeria</span>
                      </Button>
                    </div>
                  )}
                </div>

                <Button
                  onClick={handleCreatePost}
                  disabled={isSubmitting}
                  className="w-full rounded-full bg-[#1E5E3A] hover:bg-[#16472c] text-white font-semibold py-3"
                >
                  {isSubmitting ? "A publicar..." : "Publicar na Comunidade ❤️"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 1. Instagram Stories Bar on Top */}
      <CommunityStories
        onAddStoryClick={() => setIsStoryModalOpen(true)}
        onAuthorClick={(name) => handleOpenMotherProfile(name)}
      />

      {/* 2. Filter Tabs (All, Following, Videos, Age groups) */}
      <div className="flex gap-2 overflow-x-auto pb-2 w-full max-w-full min-w-0 no-scrollbar mb-3">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveTab(cat.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 shrink-0 ${
              activeTab === cat.id
                ? "bg-forest text-white shadow-xs"
                : "bg-white text-gray-600 border border-[#EBE8DF] hover:bg-gray-50"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* 3. Instagram-Style Feed */}
      <div className="space-y-6">
        {filteredPosts.map((post) => {
          const isExpanded = !!expandedComments[post.id];
          const postComments = commentsByPost[post.id] || [];
          const currentReply = replyInputByPost[post.id] || "";
          const isPostingReply = !!submittingComment[post.id];
          const hasImage = post.image_urls && post.image_urls.length > 0;
          const isVideo = post.media_type === "video";
          const mediaSrc = hasImage ? post.image_urls![0] : null;
          const isFollowing = !!followedMoms[post.author_name || ""];
          const isHeartPopping = !!heartPops[post.id];

          return (
            <article
              key={post.id}
              className="rounded-[28px] bg-white border border-[#EBE8DF] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] overflow-hidden transition-all duration-200"
            >
              {/* Instagram Post Header */}
              <div className="p-3 sm:p-4 flex items-center justify-between">
                <div
                  className="flex items-center gap-3 cursor-pointer"
                  onClick={() => handleOpenMotherProfile(post.author_name)}
                >
                  {/* Avatar with Story gradient ring */}
                  <div className="w-10 h-10 rounded-full p-[2px] bg-gradient-to-tr from-[#1E5E3A] via-[#48B774] to-[#F3A847]">
                    <img
                      src={post.author_avatar || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80"}
                      alt={post.author_name}
                      className="w-full h-full rounded-full object-cover border border-white"
                    />
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs sm:text-sm font-bold text-gray-900 leading-tight hover:underline">
                        {post.author_name}
                      </h4>
                      <span className="text-[10px] bg-[#EAF5EF] text-[#1E5E3A] px-2 py-0.5 rounded-full font-semibold">
                        {post.author_baby}
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-400">
                      {new Date(post.created_at).toLocaleDateString("pt-PT", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
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
                        ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        : "bg-[#EAF5EF] text-[#1E5E3A] hover:bg-[#d6ecde]"
                    }`}
                  >
                    {isFollowing ? (
                      <span className="flex items-center gap-1"><UserCheck className="w-3 h-3" /> Seguindo</span>
                    ) : (
                      <span className="flex items-center gap-1"><UserPlus className="w-3 h-3" /> Seguir</span>
                    )}
                  </Button>

                  {/* 3-dots Menu for Reporting */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-xl text-xs">
                      <DropdownMenuItem
                        onClick={() => handleSharePost(post)}
                        className="cursor-pointer"
                      >
                        Copiar link
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleReportPost(post)}
                        className="cursor-pointer text-red-600 focus:text-red-600"
                      >
                        <Flag className="w-3.5 h-3.5 mr-2" />
                        Denunciar para o Admin
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Instagram High-Res Post Media (Photo OR Video) with Double-Tap Like */}
              {hasMedia && (
                <div
                  className="relative w-full aspect-[4/3] bg-stone-900 cursor-pointer overflow-hidden select-none"
                  onDoubleClick={() => handleDoubleTapPhoto(post.id)}
                >
                  {isVideo ? (
                    <video
                      src={mediaSrc!}
                      controls
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

                  {/* Blooming Pop Heart on Double Tap */}
                  {isHeartPopping && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-in fade-in zoom-in duration-300">
                      <Heart className="w-24 h-24 text-white fill-white drop-shadow-2xl scale-125 transition-transform" />
                    </div>
                  )}

                  {/* Topic badge on media bottom-left */}
                  {post.topic && (
                    <div className="absolute bottom-2.5 left-2.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-semibold text-white/90">
                      {post.topic}
                    </div>
                  )}
                </div>
              )}

              {/* Post Actions Bar */}
              <div className="p-4 pt-3 pb-2 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Like Button */}
                  <button
                    onClick={() => handleLike(post.id)}
                    className="flex items-center gap-1.5 text-gray-700 hover:text-red-500 transition-colors focus:outline-none"
                  >
                    <Heart
                      className={`w-6 h-6 transition-all duration-200 active:scale-125 ${
                        post.user_has_liked
                          ? "fill-[#E53E3E] text-[#E53E3E] scale-110"
                          : "text-gray-700 hover:text-red-500"
                      }`}
                    />
                  </button>

                  {/* Comment Button */}
                  <button
                    onClick={() => toggleComments(post.id)}
                    className="text-gray-700 hover:text-forest transition-colors focus:outline-none"
                  >
                    <MessageCircle className="w-6 h-6" />
                  </button>

                  {/* DM author directly */}
                  <button
                    onClick={() => {
                      setTargetDMMom({
                        id: post.author_name,
                        name: post.author_name,
                        babyName: post.author_baby?.split("•")[0]?.trim() || "Bebé",
                        babyAge: post.author_baby?.split("•")[1]?.trim() || "8m",
                        avatar: post.author_avatar || "",
                        bio: "",
                        followersCount: 128,
                        followingCount: 84,
                        posts: [],
                      });
                      setIsDMOpen(true);
                    }}
                    title={`Enviar DM para ${post.author_name}`}
                    className="text-gray-700 hover:text-forest transition-colors focus:outline-none"
                  >
                    <Send className="w-5 h-5" />
                  </button>

                  {/* Share Button */}
                  <button
                    onClick={() => handleSharePost(post)}
                    className="text-gray-700 hover:text-forest transition-colors focus:outline-none"
                  >
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>

                {/* Bookmark */}
                <button
                  onClick={() => toast.success("Guardado nas suas receitas favoritas! 🌟")}
                  className="text-gray-400 hover:text-forest transition-colors"
                >
                  <Bookmark className="w-5 h-5" />
                </button>
              </div>

              {/* Likes Count */}
              <div className="px-4 pb-1">
                <span className="text-xs font-bold text-gray-900">
                  {post.likes_count} {post.likes_count === 1 ? "gosto" : "gostos"}
                </span>
              </div>

              {/* Caption & Content */}
              <div className="px-4 pb-3">
                <p className="text-xs text-gray-800 leading-relaxed">
                  <span
                    onClick={() => handleOpenMotherProfile(post.author_name)}
                    className="font-bold text-gray-900 mr-1.5 cursor-pointer hover:underline"
                  >
                    {post.author_name}
                  </span>
                  <span className="font-semibold text-forest mr-1.5">{post.title} —</span>
                  {post.content}
                </p>
              </div>

              {/* Expandable Comments Drawer */}
              {postComments.length > 0 && !isExpanded && (
                <div className="px-4 pb-2">
                  <button
                    onClick={() => toggleComments(post.id)}
                    className="text-xs text-gray-500 hover:text-forest transition-colors font-medium"
                  >
                    Ver todos os {postComments.length} comentários
                  </button>
                </div>
              )}

              {/* Expanded Comment Thread */}
              {isExpanded && (
                <div className="px-4 pb-3 border-t border-stone-100 pt-3 space-y-2.5 bg-[#FAF9F5]/50">
                  {postComments.map((comment) => (
                    <div key={comment.id} className="text-xs leading-relaxed">
                      <span className="font-bold text-gray-900 mr-1.5">
                        {comment.author_name}
                      </span>
                      <span className="text-gray-700">{comment.content}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Quick Reply Bar */}
              <div className="px-4 py-2 border-t border-stone-100 flex items-center gap-2 bg-white">
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
                  placeholder="Escreva um comentário carinhoso..."
                  className="rounded-full border-[#E3DFD3] text-xs h-9 px-3.5 focus-visible:ring-[#1E5E3A]"
                />
                <Button
                  size="sm"
                  onClick={() => handleSendComment(post)}
                  disabled={isPostingReply || !currentReply.trim()}
                  className="rounded-full bg-[#1E5E3A] hover:bg-[#16472c] text-white text-xs h-9 px-3 font-semibold shrink-0"
                >
                  {isPostingReply ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Enviar"}
                </Button>
              </div>
            </article>
          );
        })}
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
