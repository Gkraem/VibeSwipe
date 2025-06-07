import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Send, Bot, User } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Song } from "@shared/schema";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatInterfaceProps {
  onSuggestionsGenerated: (songs: Song[], prompt: string) => void;
}

export function ChatInterface({ onSuggestionsGenerated }: ChatInterfaceProps) {
  const [currentMessage, setCurrentMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi! I'm your AI playlist curator. Tell me about the vibe you're looking for - maybe something like \"upbeat songs for a road trip\" or \"chill indie for studying\"?"
    }
  ]);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest("POST", "/api/chat/send", {
        message,
        conversationId,
      });
      return await response.json();
    },
    onSuccess: (data) => {
      console.log("Chat API response:", data);
      console.log("Suggestions received:", data.suggestions?.length || 0);
      
      setConversationId(data.conversationId);
      setMessages(prev => [...prev, {
        role: "assistant",
        content: data.message
      }]);
      
      if (data.suggestions && data.suggestions.length > 0) {
        console.log("Calling onSuggestionsGenerated with", data.suggestions.length, "songs");
        onSuggestionsGenerated(data.suggestions, currentMessage);
      } else {
        console.log("No suggestions in response");
      }
    },
    onError: (error) => {
      console.error("Error sending message:", error);
      
      // Check if it's an OpenAI quota error
      if (error.message.includes("OpenAI API quota exceeded") || error.message.includes("402")) {
        setMessages(prev => [...prev, {
          role: "assistant",
          content: "The OpenAI API quota has been exceeded. Please provide a valid API key with available credits to generate song recommendations. You can get one from https://platform.openai.com/api-keys"
        }]);
      } else {
        setMessages(prev => [...prev, {
          role: "assistant",
          content: "I'm having trouble connecting right now, but I'd love to help you create an amazing playlist! Could you try again?"
        }]);
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMessage.trim() || sendMessageMutation.isPending) return;

    const userMessage = currentMessage.trim();
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setCurrentMessage("");
    sendMessageMutation.mutate(userMessage);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <Card className="bg-gray-900 border-gray-700">
      <CardContent className="p-6">
        <h2 className="text-2xl font-bold mb-4 text-center text-white">
          Describe Your Perfect Playlist
        </h2>
        
        {/* Chat History */}
        <div className="space-y-4 mb-6 max-h-60 overflow-y-auto" id="chatHistory">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex items-start space-x-4 chat-message ${
                message.role === "user" ? "justify-end" : ""
              }`}
            >
              {message.role === "assistant" && (
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="text-white text-sm" />
                </div>
              )}
              
              <div
                className={`rounded-2xl p-4 max-w-xs ${
                  message.role === "user"
                    ? "bg-green-600 text-white rounded-tr-md"
                    : "bg-gray-700/50 text-gray-200 rounded-tl-md"
                }`}
              >
                <p className="text-sm">{message.content}</p>
              </div>
              
              {message.role === "user" && (
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="text-white text-sm" />
                </div>
              )}
            </div>
          ))}
          {sendMessageMutation.isPending && (
            <div className="flex items-start space-x-3 chat-message">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                <Bot className="text-white text-sm" />
              </div>
              <div className="bg-gray-700/50 rounded-2xl rounded-tl-md p-4 max-w-xs">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-75"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-150"></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Input Field */}
        <form onSubmit={handleSubmit} className="relative">
          <Input
            type="text"
            placeholder="Describe your playlist vibe... (e.g., 'chill songs for rainy days')"
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={sendMessageMutation.isPending}
            className="w-full bg-gray-800 border-gray-600 text-white placeholder-gray-400 pr-12 focus:border-green-500"
          />
          <Button
            type="submit"
            size="sm"
            disabled={!currentMessage.trim() || sendMessageMutation.isPending}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-0 h-6 w-6 bg-transparent hover:bg-transparent text-green-500 hover:text-emerald-400"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
