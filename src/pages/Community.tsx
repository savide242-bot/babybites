import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle, Users, Heart, ExternalLink } from "lucide-react";

const Community = () => {
  const whatsappLink = "https://chat.whatsapp.com/INkLCwAKV3zDpg5z5xJZDs?mode=hqrt3";

  return (
    <main className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 pt-20 pb-24 lg:pb-8">
      <div className="container max-w-2xl mx-auto px-4">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-green-600 mb-4 shadow-lg">
            <MessageCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent mb-2">
            Join Our Community
          </h1>
          <p className="text-muted-foreground">
            Connect with thousands of mothers sharing their journey
          </p>
        </div>

        {/* Main Card */}
        <Card className="overflow-hidden border-0 shadow-xl">
          {/* Gradient Header */}
          <div className="bg-gradient-to-r from-green-500 via-green-400 to-emerald-500 p-8 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0wIDBoNDB2NDBIMHoiLz48cGF0aCBkPSJNMjAgMjBjMC01LjUyMyA0LjQ3Ny0xMCAxMC0xMHMxMCA0LjQ3NyAxMCAxMC00LjQ3NyAxMC0xMCAxMC0xMC00LjQ3Ny0xMC0xMCIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIi8+PC9nPjwvc3ZnPg==')] opacity-30" />
            
            <div className="relative z-10">
              {/* WhatsApp Icon */}
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm mb-4">
                <svg viewBox="0 0 24 24" className="w-10 h-10 text-white" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
              </div>
              
              <h2 className="text-2xl font-bold text-white mb-2">
                BabyBites WhatsApp Community
              </h2>
              <p className="text-white/90 text-sm max-w-md mx-auto">
                Join our exclusive group to share recipes, tips, and support with other amazing mothers!
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Benefits */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 rounded-xl bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/20">
                <Users className="w-8 h-8 text-primary mx-auto mb-2" />
                <h3 className="font-semibold text-sm">Active Community</h3>
                <p className="text-xs text-muted-foreground">Connect with mothers daily</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-900/20 dark:to-cyan-800/20">
                <MessageCircle className="w-8 h-8 text-secondary mx-auto mb-2" />
                <h3 className="font-semibold text-sm">Real-time Support</h3>
                <p className="text-xs text-muted-foreground">Get instant answers</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
                <Heart className="w-8 h-8 text-accent mx-auto mb-2" />
                <h3 className="font-semibold text-sm">Share & Learn</h3>
                <p className="text-xs text-muted-foreground">Exchange recipes & tips</p>
              </div>
            </div>

            {/* CTA Button */}
            <a 
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Button 
                className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              >
                <svg viewBox="0 0 24 24" className="w-6 h-6 mr-3" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                Join WhatsApp Community
                <ExternalLink className="w-5 h-5 ml-2" />
              </Button>
            </a>

            {/* Note */}
            <p className="text-center text-xs text-muted-foreground">
              💕 Click the button above to join our WhatsApp group instantly
            </p>
          </div>
        </Card>
      </div>
    </main>
  );
};

export default Community;
