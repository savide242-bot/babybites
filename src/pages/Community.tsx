import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Heart, MessageCircle, Bookmark, Plus } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface Post {
  id: string;
  title: string;
  content: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
  profiles: {
    full_name: string;
    is_verified_pediatrician: boolean;
  } | null;
}

const Community = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [showNewPost, setShowNewPost] = useState(false);
  const [user, setUser] = useState<any>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    checkUser();
    fetchPosts();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from("forum_posts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching posts:", error);
      return;
    }

    // Fetch profiles separately
    if (data && data.length > 0) {
      const userIds = data.map(post => post.user_id);
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, full_name, is_verified_pediatrician")
        .in("id", userIds);

      const postsWithProfiles = data.map(post => ({
        ...post,
        profiles: profilesData?.find(p => p.id === post.user_id) || null,
      }));

      setPosts(postsWithProfiles as Post[]);
    } else {
      setPosts([]);
    }
  };

  const handleCreatePost = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to create posts",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    if (!newTitle.trim() || !newContent.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide both title and content",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase.from("forum_posts").insert({
      title: newTitle,
      content: newContent,
      user_id: user.id,
    });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create post",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Post created successfully!",
    });

    setNewTitle("");
    setNewContent("");
    setShowNewPost(false);
    fetchPosts();
  };

  const handleLike = async (postId: string) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to like posts",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    const { error } = await supabase.from("post_likes").insert({
      post_id: postId,
      user_id: user.id,
    });

    if (error) {
      console.error("Error liking post:", error);
      return;
    }

    fetchPosts();
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-primary/5 to-background pt-20 pb-8">
      <div className="container max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-primary mb-2">Parent Community</h1>
            <p className="text-lg text-muted-foreground">
              Share experiences, ask questions, and connect with other parents
            </p>
          </div>
          <Button onClick={() => setShowNewPost(!showNewPost)}>
            <Plus className="w-4 h-4 mr-2" />
            New Post
          </Button>
        </div>

        {showNewPost && (
          <Card className="p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Create New Post</h2>
            <Input
              placeholder="Post title..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="mb-4"
            />
            <Textarea
              placeholder="Share your thoughts, questions, or experiences..."
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              className="mb-4 min-h-[120px]"
            />
            <div className="flex gap-2">
              <Button onClick={handleCreatePost}>Post</Button>
              <Button variant="outline" onClick={() => setShowNewPost(false)}>
                Cancel
              </Button>
            </div>
          </Card>
        )}

        <div className="space-y-4">
          {posts.map((post) => (
            <Card key={post.id} className="p-6">
              <div className="flex items-start gap-4">
                <Avatar>
                  <AvatarFallback>
                    {post.profiles?.full_name?.[0] || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold">
                      {post.profiles?.full_name || "Anonymous"}
                    </h3>
                    {post.profiles?.is_verified_pediatrician && (
                      <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                        Verified Pediatrician
                      </span>
                    )}
                    <span className="text-sm text-muted-foreground">
                      {new Date(post.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="text-lg font-bold mb-2">{post.title}</h4>
                  <p className="text-muted-foreground mb-4 whitespace-pre-wrap">
                    {post.content}
                  </p>
                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleLike(post.id)}
                    >
                      <Heart className="w-4 h-4 mr-1" />
                      {post.likes_count}
                    </Button>
                    <Button variant="ghost" size="sm">
                      <MessageCircle className="w-4 h-4 mr-1" />
                      {post.comments_count}
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Bookmark className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
};

export default Community;
