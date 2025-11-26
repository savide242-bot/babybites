import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Sparkles } from "lucide-react";
import { toast } from "sonner";

const Onboarding = () => {
  const [motherName, setMotherName] = useState("");
  const [babyName, setBabyName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!motherName.trim() || !babyName.trim()) {
      toast.error("Please fill in both names");
      return;
    }

    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const { error } = await supabase
          .from('profiles')
          .update({
            mother_name: motherName.trim(),
            baby_name: babyName.trim(),
          })
          .eq('id', session.user.id);

        if (error) throw error;

        toast.success(`Welcome to BabyBites, ${motherName}!`);
        navigate('/');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error("Failed to save information. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-300 via-pink-200 to-cyan-100 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/20 rounded-full blur-3xl animate-blob" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-blob animation-delay-2000" />
      </div>

      <Card className="w-full max-w-md relative z-10 border-2 border-white/50 shadow-2xl animate-fade-in">
        <CardContent className="p-8 space-y-6">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary to-mint mb-2">
              <Heart className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Welcome to BabyBites!</h1>
            <p className="text-muted-foreground">Let's personalize your experience</p>
          </div>

          <form onSubmit={handleContinue} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="motherName" className="text-foreground font-medium">
                Your Name
              </Label>
              <Input
                id="motherName"
                type="text"
                placeholder="How should we call you?"
                value={motherName}
                onChange={(e) => setMotherName(e.target.value)}
                className="border-2 focus:border-primary transition-colors"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="babyName" className="text-foreground font-medium">
                Baby's Name
              </Label>
              <Input
                id="babyName"
                type="text"
                placeholder="Your little one's name"
                value={babyName}
                onChange={(e) => setBabyName(e.target.value)}
                className="border-2 focus:border-primary transition-colors"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-primary to-mint text-white font-semibold py-6 text-lg hover:shadow-glow transition-all duration-300 hover:scale-105"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Continue
                  <Sparkles className="w-5 h-5" />
                </span>
              )}
            </Button>
          </form>

          <div className="text-center text-sm text-muted-foreground">
            This helps us personalize your baby nutrition journey
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Onboarding;
