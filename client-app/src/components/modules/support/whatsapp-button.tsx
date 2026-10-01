"use client";

import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function WhatsAppButton() {
  const handleChat = () => {
    window.open("https://wa.me/6281234567890", "_blank");
  };

  return (
    <Button
      onClick={handleChat}
      className="fixed bottom-20 right-4 z-50 h-14 w-14 rounded-full bg-[#25D366] hover:bg-[#128C7E] shadow-xl md:bottom-8 md:right-8 animate-in zoom-in duration-300"
      size="icon"
    >
      <MessageCircle className="h-8 w-8 text-white" />
      <span className="sr-only">Chat on WhatsApp</span>
    </Button>
  );
}
