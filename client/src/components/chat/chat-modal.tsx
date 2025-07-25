import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/use-auth";
import { useWebSocket } from "@/hooks/use-websocket";
import { Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getAuthHeaders } from "@/lib/auth";
import type { User, Item, Message } from "@shared/schema";

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  otherUser: User;
  item?: Item;
  note?: any;
}

export function ChatModal({ isOpen, onClose, otherUser, item, note }: ChatModalProps) {
  const [messageText, setMessageText] = useState("");
  const { user } = useAuth();
  const { sendMessage, messages: wsMessages } = useWebSocket();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: existingMessages = [] } = useQuery({
    queryKey: ["/api/messages", { otherUserId: otherUser.id }],
    enabled: isOpen && !!user,
    queryFn: () => {
      const params = new URLSearchParams();
      params.append("otherUserId", otherUser.id);
      return fetch(`/api/messages?${params}`, {
        headers: getAuthHeaders(),
      }).then(res => res.json());
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const messageData = {
        senderId: user!.id,
        receiverId: otherUser.id,
        content,
        itemId: item?.id,
        noteId: note?.id,
      };

      // Send via WebSocket for real-time delivery
      sendMessage(messageData);

      // Also save to database via HTTP
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(messageData),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      setMessageText("");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !user) return;
    
    sendMessageMutation.mutate(messageText.trim());
  };

  // Combine existing messages with WebSocket messages
  const allMessages = [...existingMessages, ...wsMessages].filter((message: Message) => 
    (message.senderId === user?.id && message.receiverId === otherUser.id) ||
    (message.senderId === otherUser.id && message.receiverId === user?.id)
  );

  // Sort messages by timestamp
  const sortedMessages = allMessages.sort((a: Message, b: Message) => 
    new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime()
  );

  // Remove duplicates based on content and timestamp
  const uniqueMessages = sortedMessages.filter((message: Message, index: number, arr: Message[]) => 
    index === arr.findIndex(m => 
      m.content === message.content && 
      Math.abs(new Date(m.createdAt!).getTime() - new Date(message.createdAt!).getTime()) < 1000
    )
  );

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [uniqueMessages]);

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md h-[600px] flex flex-col p-0">
        {/* Header */}
        <DialogHeader className="flex-shrink-0 p-4 border-b">
          <div className="flex items-center space-x-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={otherUser.avatar} />
              <AvatarFallback>
                {otherUser.name?.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div>
              <DialogTitle className="text-base">{otherUser.name}</DialogTitle>
              <Badge variant="secondary" className="text-xs bg-green-100 text-green-600">
                Online
              </Badge>
            </div>
          </div>
          
          {/* Context info */}
          {item && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-900">About: {item.title}</p>
              <p className="text-sm text-gray-600">${parseFloat(item.price).toFixed(2)}</p>
            </div>
          )}
          
          {note && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-900">About: {note.title}</p>
              <p className="text-sm text-gray-600">{note.subject}</p>
            </div>
          )}
        </DialogHeader>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {uniqueMessages.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 text-sm">No messages yet. Start the conversation!</p>
              </div>
            ) : (
              uniqueMessages.map((message: Message, index: number) => {
                const isOwnMessage = message.senderId === user.id;
                const messageUser = isOwnMessage ? user : otherUser;
                
                return (
                  <div
                    key={index}
                    className={`flex items-start space-x-2 ${
                      isOwnMessage ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {!isOwnMessage && (
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={messageUser.avatar} />
                        <AvatarFallback className="text-xs">
                          {messageUser.name?.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    
                    <div className={`max-w-xs ${isOwnMessage ? 'order-first' : ''}`}>
                      <div
                        className={`rounded-lg p-3 ${
                          isOwnMessage
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                      </div>
                      <span
                        className={`text-xs text-gray-500 mt-1 block ${
                          isOwnMessage ? 'text-right' : 'text-left'
                        }`}
                      >
                        {formatTime(new Date(message.createdAt!))}
                      </span>
                    </div>
                    
                    {isOwnMessage && (
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={messageUser.avatar} />
                        <AvatarFallback className="text-xs">
                          {messageUser.name?.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Message Input */}
        <div className="flex-shrink-0 p-4 border-t">
          <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
            <Input
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Type your message..."
              className="flex-1"
              disabled={sendMessageMutation.isPending}
            />
            <Button
              type="submit"
              size="sm"
              disabled={!messageText.trim() || sendMessageMutation.isPending}
            >
              <Send size={16} />
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
