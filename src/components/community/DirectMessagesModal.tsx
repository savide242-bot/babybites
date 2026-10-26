import React, { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, ArrowLeft, Heart, Sparkles, MessageCircle, Smile, CheckCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MotherProfileData } from "./MotherProfileModal";

export interface DMMessage {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_avatar: string;
  recipient_id: string;
  recipient_name: string;
  content: string;
  created_at: string;
}

interface DirectMessagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetMom?: MotherProfileData | null;
}

const STORAGE_KEY = "babybites_direct_messages_v1";

const INITIAL_CONVERSATIONS: Record<string, DMMessage[]> = {
  "Sarah Jenkins": [
    {
      id: "m-1",
      sender_id: "sarah",
      sender_name: "Sarah Jenkins",
      sender_avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80",
      recipient_id: "me",
      recipient_name: "Você",
      content: "Olá querida! Vi que o teu bebé tem a mesma idade do Noah (7m). Já experimentaste a papinha de abóbora com aveia?",
      created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
    {
      id: "m-2",
      sender_id: "me",
      sender_name: "Você",
      sender_avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
      recipient_id: "sarah",
      recipient_name: "Sarah Jenkins",
      content: "Olá Sarah! Sim, adorou! Foi a primeira que comeu sem fazer caretas haha 🥰",
      created_at: new Date(Date.now() - 3600000 * 1).toISOString(),
    },
    {
      id: "m-3",
      sender_id: "sarah",
      sender_name: "Sarah Jenkins",
      sender_avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80",
      recipient_id: "me",
      recipient_name: "Você",
      content: "Que maravilha! Essa fase de descobertas é tão linda. Qualquer dúvida podemos trocar receitas!",
      created_at: new Date(Date.now() - 1800000).toISOString(),
    },
  ],
  "Emily Rodriguez": [
    {
      id: "m-4",
      sender_id: "emily",
      sender_name: "Emily Rodriguez",
      sender_avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
      recipient_id: "me",
      recipient_name: "Você",
      content: "Olá mamã! Aqueles biscoitos de banana e aveia que postei duram até 5 dias num pote de vidro hermético! Ficam ótimos.",
      created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    },
  ],
};

export const DirectMessagesModal: React.FC<DirectMessagesModalProps> = ({
  isOpen,
  onClose,
  targetMom,
}) => {
  const [messagesByMom, setMessagesByMom] = useState<Record<string, DMMessage[]>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : INITIAL_CONVERSATIONS;
    } catch {
      return INITIAL_CONVERSATIONS;
    }
  });

  const [activeMomName, setActiveMomName] = useState<string | null>(null);
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // If a specific target mom is passed, select her immediately
  useEffect(() => {
    if (targetMom) {
      setActiveMomName(targetMom.name);
    } else if (!activeMomName) {
      setActiveMomName("Sarah Jenkins");
    }
  }, [targetMom, isOpen]);

  // Persist messages to storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messagesByMom));
    } catch (e) {
      console.error(e);
    }
  }, [messagesByMom]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeMomName, messagesByMom]);

  const activeMessages = activeMomName ? messagesByMom[activeMomName] || [] : [];

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || !activeMomName) return;

    const newMessage: DMMessage = {
      id: "msg-" + Date.now(),
      sender_id: "me",
      sender_name: "Você",
      sender_avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
      recipient_id: activeMomName,
      recipient_name: activeMomName,
      content: text,
      created_at: new Date().toISOString(),
    };

    setMessagesByMom((prev) => ({
      ...prev,
      [activeMomName]: [...(prev[activeMomName] || []), newMessage],
    }));

    setInputText("");

    // Simulate friendly auto-reply after 2.5 seconds if talking to one of the community moms
    if (activeMomName === "Sarah Jenkins" || activeMomName === "Emily Rodriguez") {
      setTimeout(() => {
        const replies = [
          "Obrigada por partilhar! Vou experimentar também com o meu bebé hoje ❤️",
          "Adorei a dica! A nossa comunidade de mães é fantástica 🥰🥦",
          "Com certeza! Vamos nos apoiando nesta jornada!",
        ];
        const randomReply = replies[Math.floor(Math.random() * replies.length)];
        const replyMsg: DMMessage = {
          id: "reply-" + Date.now(),
          sender_id: activeMomName,
          sender_name: activeMomName,
          sender_avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80",
          recipient_id: "me",
          recipient_name: "Você",
          content: randomReply,
          created_at: new Date().toISOString(),
        };

        setMessagesByMom((prev) => ({
          ...prev,
          [activeMomName]: [...(prev[activeMomName] || []), replyMsg],
        }));
      }, 2500);
    }
  };

  const momNamesList = Object.keys(messagesByMom);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md w-full h-[620px] rounded-[28px] p-0 overflow-hidden bg-white border border-[#EBE8DF] flex flex-col">
        {/* DM Header */}
        <div className="p-4 border-b border-[#EBE8DF] bg-[#FAF9F5] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {activeMomName && (
              <button
                onClick={() => setActiveMomName(null)}
                className="sm:hidden p-1 rounded-full hover:bg-stone-200"
              >
                <ArrowLeft className="w-4 h-4 text-gray-700" />
              </button>
            )}
            <div className="w-9 h-9 rounded-full bg-[#1E5E3A] text-white flex items-center justify-center">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-gray-900 text-base leading-tight">
                {activeMomName ? activeMomName : "Mensagens Diretas"}
              </h3>
              <span className="text-[10px] text-[#1E5E3A] font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#48B774] inline-block animate-pulse" />
                Comunidade de Mães Conectadas
              </span>
            </div>
          </div>

          {/* Quick select other moms */}
          {activeMomName && (
            <div className="flex gap-1.5">
              {momNamesList.map((mName) => (
                <button
                  key={mName}
                  onClick={() => setActiveMomName(mName)}
                  title={mName}
                  className={`w-7 h-7 rounded-full text-xs font-bold transition-all border ${
                    activeMomName === mName
                      ? "bg-[#1E5E3A] text-white border-[#1E5E3A]"
                      : "bg-white text-gray-600 border-gray-200"
                  }`}
                >
                  {mName[0]}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Message Thread */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#FAF9F5]/40 no-scrollbar">
          {activeMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400">
              <MessageCircle className="w-12 h-12 stroke-[1.2] text-[#1E5E3A]/40 mb-2" />
              <p className="text-xs font-medium text-gray-600">Envie a primeira mensagem para {activeMomName}!</p>
              <p className="text-[11px] text-gray-400 mt-1">Troque experiências sobre introdução alimentar e receitas.</p>
            </div>
          ) : (
            activeMessages.map((msg) => {
              const isMe = msg.sender_id === "me";
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-xs shadow-xs leading-relaxed ${
                      isMe
                        ? "bg-[#1E5E3A] text-white rounded-br-none"
                        : "bg-white text-gray-800 border border-[#EBE8DF] rounded-bl-none"
                    }`}
                  >
                    <p>{msg.content}</p>
                    <div
                      className={`text-[9px] mt-1 flex items-center justify-end gap-1 ${
                        isMe ? "text-white/70" : "text-gray-400"
                      }`}
                    >
                      <span>
                        {new Date(msg.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {isMe && <CheckCheck className="w-3 h-3 text-white/90" />}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Reaction Emojis */}
        <div className="px-4 py-1.5 bg-white border-t border-stone-100 flex items-center gap-2">
          <span className="text-[10px] text-gray-400 font-medium">Reagir rápido:</span>
          {["❤️", "🥑", "🥦", "👏", "🥰", "🥣"].map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleSendMessage(emoji)}
              className="text-base hover:scale-125 transition-transform"
            >
              {emoji}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white border-t border-[#EBE8DF] flex items-center gap-2">
          <Input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder={`Conversar com ${activeMomName || "mãe"}...`}
            className="rounded-full border-[#E3DFD3] text-xs h-10 px-4 focus-visible:ring-[#1E5E3A]"
          />
          <Button
            onClick={() => handleSendMessage()}
            disabled={!inputText.trim()}
            className="rounded-full w-10 h-10 p-0 bg-[#1E5E3A] hover:bg-[#16472c] text-white shrink-0 shadow-sm"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DirectMessagesModal;
