import React, { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Send, ArrowLeft, Heart, Sparkles, MessageCircle, 
  Smile, CheckCheck, Search, ChevronRight, User 
} from "lucide-react";
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
  isAdminUser?: boolean;
}

const STORAGE_KEY = "babybites_direct_messages_v1";

const SAMPLE_DEMO_CHATS: Record<string, DMMessage[]> = {
  "Sarah Jenkins": [
    {
      id: "m-1",
      sender_id: "sarah",
      sender_name: "Sarah Jenkins",
      sender_avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80",
      recipient_id: "me",
      recipient_name: "You",
      content: "Hi! I saw your baby is around 7 months too. Have you tried the pumpkin oat puree from the app?",
      created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
    {
      id: "m-2",
      sender_id: "me",
      sender_name: "You",
      sender_avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
      recipient_id: "sarah",
      recipient_name: "Sarah Jenkins",
      content: "Hello Sarah! Yes, he loved it! First time he ate without making funny faces haha 🥰",
      created_at: new Date(Date.now() - 3600000 * 1).toISOString(),
    },
    {
      id: "m-3",
      sender_id: "sarah",
      sender_name: "Sarah Jenkins",
      sender_avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80",
      recipient_id: "me",
      recipient_name: "You",
      content: "That's wonderful! This milestone stage is so precious. Feel free to message anytime if you want to swap recipe ideas!",
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
      recipient_name: "You",
      content: "Hey mama! Those banana oat biscuits I shared keep fresh for up to 5 days in an airtight jar! Super convenient.",
      created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    },
  ],
};

export const DirectMessagesModal: React.FC<DirectMessagesModalProps> = ({
  isOpen,
  onClose,
  targetMom,
  isAdminUser = false,
}) => {
  const [messagesByMom, setMessagesByMom] = useState<Record<string, DMMessage[]>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
      return isAdminUser ? SAMPLE_DEMO_CHATS : {};
    } catch {
      return isAdminUser ? SAMPLE_DEMO_CHATS : {};
    }
  });

  // Views: 'inbox' (list of conversations) or 'chat' (active conversation)
  const [currentView, setCurrentView] = useState<"inbox" | "chat">("inbox");
  const [activeMomName, setActiveMomName] = useState<string | null>(null);
  const [inputText, setInputText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // If opened with targetMom, switch directly to chat
  useEffect(() => {
    if (targetMom) {
      setActiveMomName(targetMom.name);
      setCurrentView("chat");
    } else {
      setCurrentView("inbox");
    }
  }, [targetMom, isOpen]);

  // Persist messages
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messagesByMom));
    } catch (e) {
      console.error(e);
    }
  }, [messagesByMom]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (currentView === "chat") {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeMomName, messagesByMom, currentView]);

  const activeMessages = activeMomName ? messagesByMom[activeMomName] || [] : [];
  const conversationNames = Object.keys(messagesByMom);

  const handleOpenConversation = (momName: string) => {
    setActiveMomName(momName);
    setCurrentView("chat");
  };

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || !activeMomName) return;

    const newMessage: DMMessage = {
      id: "msg-" + Date.now(),
      sender_id: "me",
      sender_name: "You",
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

    // Friendly auto-reply in demo mode
    if (isAdminUser && (activeMomName === "Sarah Jenkins" || activeMomName === "Emily Rodriguez")) {
      setTimeout(() => {
        const replies = [
          "Thanks for sharing! I will make that for my baby tomorrow ❤️",
          "Loved the tip! Our community of moms is truly the best 🥰🥦",
          "Definitely! Let's keep supporting each other on this weaning journey!",
        ];
        const randomReply = replies[Math.floor(Math.random() * replies.length)];
        const replyMsg: DMMessage = {
          id: "reply-" + Date.now(),
          sender_id: activeMomName,
          sender_name: activeMomName,
          sender_avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80",
          recipient_id: "me",
          recipient_name: "You",
          content: randomReply,
          created_at: new Date().toISOString(),
        };

        setMessagesByMom((prev) => ({
          ...prev,
          [activeMomName]: [...(prev[activeMomName] || []), replyMsg],
        }));
      }, 2000);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md w-full h-[620px] rounded-[28px] p-0 overflow-hidden bg-white border border-[#EBE8DF] flex flex-col">
        {currentView === "inbox" ? (
          /* ================= VIEW 1: INBOX CONVERSATIONS LIST ================= */
          <div className="flex flex-col h-full">
            {/* Inbox Header */}
            <div className="p-4 border-b border-[#EBE8DF] bg-[#FAF9F5] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-[#1E5E3A] text-white flex items-center justify-center shadow-xs">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-gray-900 text-lg leading-tight">
                    Messages
                  </h3>
                  <span className="text-[11px] text-gray-500 font-medium">
                    Private chats with fellow mothers
                  </span>
                </div>
              </div>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto divide-y divide-stone-100 no-scrollbar">
              {conversationNames.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-8 text-center text-gray-400">
                  <div className="w-14 h-14 rounded-full bg-[#EAF5EF] text-[#1E5E3A] flex items-center justify-center mb-3">
                    <MessageCircle className="w-7 h-7 stroke-[1.5]" />
                  </div>
                  <h4 className="font-bold text-gray-800 text-sm">No messages yet</h4>
                  <p className="text-xs text-gray-500 mt-1 max-w-xs leading-relaxed">
                    Tap on any mother's profile in the community feed and press <strong>"Message"</strong> to start a conversation!
                  </p>
                </div>
              ) : (
                conversationNames.map((momName) => {
                  const thread = messagesByMom[momName] || [];
                  const lastMsg = thread[thread.length - 1];
                  const avatar =
                    thread.find((m) => m.sender_name === momName)?.sender_avatar ||
                    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80";

                  return (
                    <div
                      key={momName}
                      onClick={() => handleOpenConversation(momName)}
                      className="p-3.5 hover:bg-stone-50 cursor-pointer flex items-center justify-between transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={avatar}
                          alt={momName}
                          className="w-12 h-12 rounded-full object-cover border border-stone-200 shrink-0"
                        />
                        <div className="min-w-0">
                          <h4 className="font-semibold text-gray-900 text-xs sm:text-sm truncate">
                            {momName}
                          </h4>
                          <p className="text-xs text-gray-500 truncate mt-0.5">
                            {lastMsg ? lastMsg.content : "Tap to chat..."}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                        {lastMsg && (
                          <span className="text-[10px] text-gray-400">
                            {new Date(lastMsg.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        )}
                        <ChevronRight className="w-4 h-4 text-gray-300" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          /* ================= VIEW 2: ACTIVE CHAT WINDOW ================= */
          <div className="flex flex-col h-full">
            {/* Chat Header with Back Button */}
            <div className="p-3.5 border-b border-[#EBE8DF] bg-[#FAF9F5] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setCurrentView("inbox")}
                  className="p-1.5 rounded-full hover:bg-stone-200 transition-colors"
                  title="Back to Messages"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-700" />
                </button>

                <div className="w-9 h-9 rounded-full overflow-hidden border border-stone-200">
                  <img
                    src={
                      activeMessages.find((m) => m.sender_name === activeMomName)?.sender_avatar ||
                      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80"
                    }
                    alt={activeMomName || "Mom"}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div>
                  <h3 className="font-bold text-gray-900 text-sm leading-tight">
                    {activeMomName}
                  </h3>
                  <span className="text-[10px] text-[#1E5E3A] font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#48B774] inline-block animate-pulse" />
                    BabyBites Community Mom
                  </span>
                </div>
              </div>
            </div>

            {/* Messages Thread */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#FAF9F5]/40 no-scrollbar">
              {activeMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400">
                  <MessageCircle className="w-12 h-12 stroke-[1.2] text-[#1E5E3A]/40 mb-2" />
                  <p className="text-xs font-medium text-gray-700">Send your first message to {activeMomName}!</p>
                  <p className="text-[11px] text-gray-400 mt-1">Ask questions, share recipes, or celebrate baby milestones together.</p>
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
                        className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-xs shadow-xs leading-relaxed ${
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
              <span className="text-[10px] text-gray-400 font-medium">Quick reaction:</span>
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
                placeholder={`Message ${activeMomName}...`}
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
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DirectMessagesModal;
