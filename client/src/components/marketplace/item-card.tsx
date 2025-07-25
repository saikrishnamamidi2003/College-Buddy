import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Rating } from "@/components/ui/rating";
import { ChatModal } from "@/components/chat/chat-modal";
import { useState } from "react";
import type { Item, User } from "@shared/schema";

interface ItemCardProps {
  item: Item & { seller?: User };
  showActions?: boolean;
}

export default function ItemCard({ item, showActions = false }: ItemCardProps) {
  const [showChatModal, setShowChatModal] = useState(false);

  const formatPrice = (price: string) => {
    return `$${parseFloat(price).toFixed(2)}`;
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'textbooks': return 'bg-blue-100 text-blue-800';
      case 'electronics': return 'bg-purple-100 text-purple-800';
      case 'lab equipment': return 'bg-green-100 text-green-800';
      case 'stationery': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <div className="aspect-[4/3] relative overflow-hidden rounded-t-lg">
          {item.images && item.images.length > 0 ? (
            <img 
              src={item.images[0]} 
              alt={item.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-400">No image</span>
            </div>
          )}
          {item.sold && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <Badge variant="secondary" className="bg-red-600 text-white">
                SOLD
              </Badge>
            </div>
          )}
        </div>
        
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <Badge className={getCategoryColor(item.category)}>
              {item.category}
            </Badge>
            <span className="text-sm text-gray-500">
              {formatTimeAgo(new Date(item.createdAt!))}
            </span>
          </div>
          
          <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{item.title}</h3>
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>
          
          <div className="flex items-center justify-between mb-3">
            <span className="text-xl font-bold text-green-600">
              {formatPrice(item.price)}
            </span>
            <Badge variant="outline" className="text-xs">
              {item.condition}
            </Badge>
          </div>
          
          {item.seller && (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Avatar className="w-6 h-6">
                  <AvatarImage src={item.seller.avatar} />
                  <AvatarFallback className="text-xs">
                    {item.seller.name?.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-gray-600">{item.seller.name}</span>
                <Rating value={parseFloat(item.seller.rating || "0")} size="sm" />
              </div>
            </div>
          )}
          
          {!showActions && !item.sold && (
            <Button 
              className="w-full mt-3" 
              onClick={() => setShowChatModal(true)}
            >
              Contact Seller
            </Button>
          )}
        </CardContent>
      </Card>

      {item.seller && (
        <ChatModal
          isOpen={showChatModal}
          onClose={() => setShowChatModal(false)}
          otherUser={item.seller}
          item={item}
        />
      )}
    </>
  );
}
