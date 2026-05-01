import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const WhatsAppButton = () => {
  const handleWhatsAppClick = () => {
    const phoneNumber = "258834220147";
    const message = encodeURIComponent("Hi Emily! I have a question about my baby's nutrition 💕");
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <Button
      onClick={handleWhatsAppClick}
      className="fixed bottom-24 right-4 z-[60] h-11 w-11 rounded-full bg-gradient-to-br from-primary/90 to-gold/90 hover:from-primary hover:to-gold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 group lg:bottom-6 lg:right-6 lg:h-12 lg:w-12 border border-primary/20"
      size="icon"
      aria-label="WhatsApp Support"
    >
      <MessageCircle className="h-4.5 w-4.5 lg:h-5 lg:w-5 text-primary-foreground group-hover:rotate-12 transition-transform duration-300" />
      <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 lg:h-3 lg:w-3 bg-accent rounded-full animate-pulse" />
    </Button>
  );
};

export default WhatsAppButton;
