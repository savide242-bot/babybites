import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Send, Loader2, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useLanguage } from "@/hooks/useLanguage";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const Chat = () => {
  const { t } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [conversationId, setConversationId] = useState<string>("");
  const [showSuggestions, setShowSuggestions] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const suggestionQuestions = [
    "What foods should I introduce at 6 months?",
    "How can I tell if my baby is ready for solid food?",
    "What are the best first foods for babies?",
    "How do I know if my baby has a food allergy?",
    "How much should my 9-month-old eat per day?"
  ];

  useEffect(() => {
    checkUserAndLoadHistory();
  }, []);

  const checkUserAndLoadHistory = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    
    if (user) {
      await loadChatHistory(user.id);
    }
  };

  const loadChatHistory = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
        .limit(50);

      if (error) throw error;

      if (data && data.length > 0) {
        const loadedMessages = data.map(msg => ({
          role: msg.role as "user" | "assistant",
          content: msg.content
        }));
        setMessages(loadedMessages);
        setConversationId(data[0].conversation_id);
        setShowSuggestions(false);
      } else {
        // No history, show welcome message
        setMessages([{
          role: "assistant",
          content: t('chat.welcome')
        }]);
        // Generate new conversation ID
        setConversationId(crypto.randomUUID());
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
      setMessages([{
        role: "assistant",
        content: t('chat.welcome')
      }]);
      setConversationId(crypto.randomUUID());
    }
  };

  const saveChatMessage = async (role: "user" | "assistant", content: string) => {
    if (!user || !conversationId) return;

    try {
      await supabase.from('chat_messages').insert({
        user_id: user.id,
        conversation_id: conversationId,
        role,
        content
      });
    } catch (error) {
      console.error('Error saving message:', error);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const streamChat = async (userMessage: Message) => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error("Not authenticated");
    }

    const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bibi-chat`;
    
    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ messages: [...messages, userMessage] }),
    });

    if (!resp.ok || !resp.body) {
      throw new Error("Failed to start stream");
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let streamDone = false;
    let assistantContent = "";

    setMessages(prev => [...prev, { role: "assistant", content: "" }]);

    while (!streamDone) {
      const { done, value } = await reader.read();
      if (done) break;
      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") {
          streamDone = true;
          break;
        }

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) {
            assistantContent += content;
            setMessages(prev => {
              const newMessages = [...prev];
              newMessages[newMessages.length - 1] = {
                role: "assistant",
                content: assistantContent
              };
              return newMessages;
            });
          }
        } catch {
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }

    // Save complete assistant message
    if (assistantContent) {
      await saveChatMessage("assistant", assistantContent);
    }
  };

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input.trim();
    if (!textToSend || isLoading) return;

    if (!user) {
      toast({
        title: t('chat.signInRequired'),
        description: t('chat.signInToChat'),
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    const userMessage: Message = { role: "user", content: textToSend };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setShowSuggestions(false);

    // Save user message
    await saveChatMessage("user", textToSend);

    try {
      await streamChat(userMessage);
    } catch (error) {
      console.error("Error:", error);
      const errorMessage = error instanceof Error && error.message === "Not authenticated" 
        ? t('chat.notAuthenticated')
        : t('chat.error');
      
      const assistantError: Message = {
        role: "assistant",
        content: errorMessage
      };
      
      setMessages(prev => [...prev, assistantError]);
      
      if (error instanceof Error && error.message === "Not authenticated") {
        navigate("/auth");
      }
    } finally {
      setIsLoading(true);
    }
  };

  const handleRegenerateResponse = async () => {
    if (messages.length < 2) return;
    
    // Remove last assistant message
    const updatedMessages = messages.slice(0, -1);
    setMessages(updatedMessages);
    
    // Get last user message
    const lastUserMessage = updatedMessages[updatedMessages.length - 1];
    if (lastUserMessage && lastUserMessage.role === "user") {
      setIsLoading(true);
      try {
        await streamChat(lastUserMessage);
      } catch (error) {
        console.error("Error regenerating:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSend(suggestion);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-primary/5 to-background pt-20 pb-8">
      <div className="container max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Bot className="w-12 h-12 text-primary" />
            <h1 className="text-4xl font-bold text-primary">{t('chat.title')}</h1>
          </div>
          <p className="text-lg text-muted-foreground">
            {t('chat.subtitle')}
          </p>
        </div>

        <div className="bg-card rounded-3xl shadow-lg border border-border/50 overflow-hidden">
          <ScrollArea className="h-[500px] p-6" ref={scrollRef}>
            <div className="space-y-4">
              {showSuggestions && messages.length <= 1 && (
                <div className="mb-6">
                  <p className="text-sm text-muted-foreground mb-3 text-center">Try asking:</p>
                  <div className="grid gap-2">
                    {suggestionQuestions.map((question, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSuggestionClick(question)}
                        className="text-left p-3 rounded-lg bg-muted hover:bg-muted/70 transition-colors text-sm"
                      >
                        💡 {question}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-secondary rounded-2xl px-4 py-3 flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-secondary-foreground" />
                    <span className="text-sm text-secondary-foreground">Bibi is typing...</span>
                  </div>
                </div>
              )}
              
              {messages.length > 1 && messages[messages.length - 1]?.role === "assistant" && !isLoading && (
                <div className="flex justify-start">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRegenerateResponse}
                    className="text-xs"
                  >
                    🔄 Regenerate response
                  </Button>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="border-t border-border/50 p-4 bg-background/50">
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t('chat.placeholder')}
                className="min-h-[60px] resize-none"
                disabled={isLoading}
              />
              <Button
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
                size="lg"
                className="px-6"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>{t('chat.tryAsking')}</p>
        </div>
      </div>
    </main>
  );
};

export default Chat;
