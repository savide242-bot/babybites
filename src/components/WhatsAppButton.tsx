import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const WhatsAppButton = () => {
  const handleWhatsAppClick = () => {
    const phoneNumber = "258834220147";
    const message = encodeURIComponent("Hi! I need support with BabyBites app 💕");
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <Button
      onClick={handleWhatsAppClick}
      className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-gradient-to-br from-[#25D366] to-[#128C7E] hover:from-[#20BD5A] hover:to-[#0F7A68] shadow-elegant hover:shadow-glow transition-all duration-300 hover:scale-110 group"
      size="icon"
      aria-label="WhatsApp Support"
    >
      <MessageCircle className="h-6 w-6 text-white group-hover:rotate-12 transition-transform duration-300" />
      <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full animate-pulse" />
    </Button>
  );
};

export default WhatsAppButton;
