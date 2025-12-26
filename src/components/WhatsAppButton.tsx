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
      className="fixed bottom-24 right-4 z-[60] h-12 w-12 rounded-full bg-gradient-to-br from-[#25D366] to-[#128C7E] hover:from-[#20BD5A] hover:to-[#0F7A68] shadow-elegant hover:shadow-glow transition-all duration-300 hover:scale-110 group lg:bottom-6 lg:right-6 lg:h-14 lg:w-14"
      size="icon"
      aria-label="WhatsApp Support"
    >
      <MessageCircle className="h-5 w-5 lg:h-6 lg:w-6 text-white group-hover:rotate-12 transition-transform duration-300" />
      <span className="absolute -top-1 -right-1 h-3 w-3 lg:h-4 lg:w-4 bg-red-500 rounded-full animate-pulse" />
    </Button>
  );
};

export default WhatsAppButton;
