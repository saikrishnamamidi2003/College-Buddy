import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SellModal } from "@/components/marketplace/sell-modal";
import { UploadModal } from "@/components/notes/upload-modal";
import { Store, Upload, MessageCircle, User, ShoppingBag, FileText, Users, Star } from "lucide-react";
import ItemCard from "@/components/marketplace/item-card";
import NoteCard from "@/components/notes/note-card";

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [showSellModal, setShowSellModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/auth");
    }
  }, [isAuthenticated, setLocation]);

  const { data: stats } = useQuery({
    queryKey: ["/api/stats"],
  });

  const { data: items = [] } = useQuery({
    queryKey: ["/api/items"],
  });

  const { data: notes = [] } = useQuery({
    queryKey: ["/api/notes"],
  });

  if (!isAuthenticated) {
    return null;
  }

  const recentItems = items.slice(0, 4);
  const recentNotes = notes.slice(0, 3);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Listings</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.activeListings || 0}</p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <ShoppingBag className="text-primary" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Study Notes</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.studyNotes || 0}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <FileText className="text-green-600" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Students</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.activeStudents || 0}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="text-blue-600" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Your Rating</p>
                  <div className="flex items-center space-x-1">
                    <p className="text-2xl font-bold text-gray-900">4.8</p>
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={16} className="fill-current" />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Star className="text-yellow-600" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button
                variant="outline"
                className="flex flex-col items-center p-4 h-auto border-2 border-dashed border-primary/30 hover:border-primary/50 hover:bg-primary/5"
                onClick={() => setShowSellModal(true)}
              >
                <Store className="text-primary mb-2" size={24} />
                <span className="font-medium text-primary">Sell Item</span>
              </Button>

              <Button
                variant="outline"
                className="flex flex-col items-center p-4 h-auto border-2 border-dashed border-green-300 hover:border-green-500 hover:bg-green-50"
                onClick={() => setShowUploadModal(true)}
              >
                <Upload className="text-green-600 mb-2" size={24} />
                <span className="font-medium text-green-600">Upload Notes</span>
              </Button>

              <Button
                variant="outline"
                className="flex flex-col items-center p-4 h-auto border-2 border-dashed border-blue-300 hover:border-blue-500 hover:bg-blue-50"
                onClick={() => setLocation("/messages")}
              >
                <MessageCircle className="text-blue-600 mb-2" size={24} />
                <span className="font-medium text-blue-600">View Messages</span>
              </Button>

              <Button
                variant="outline"
                className="flex flex-col items-center p-4 h-auto border-2 border-dashed border-purple-300 hover:border-purple-500 hover:bg-purple-50"
                onClick={() => setLocation("/profile")}
              >
                <User className="text-purple-600 mb-2" size={24} />
                <span className="font-medium text-purple-600">My Profile</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Marketplace Items */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <h2 className="text-2xl font-bold text-gray-900">Marketplace</h2>
              <Badge className="bg-primary/10 text-primary">Latest Items</Badge>
            </div>
            <Button onClick={() => setLocation("/marketplace")}>
              View All
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {recentItems.map((item: any) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        </section>

        {/* Recent Study Notes */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <h2 className="text-2xl font-bold text-gray-900">Study Notes</h2>
              <Badge variant="secondary" className="bg-green-100 text-green-800">Recently Added</Badge>
            </div>
            <Button onClick={() => setLocation("/notes")}>
              View All
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentNotes.map((note: any) => (
              <NoteCard key={note.id} note={note} />
            ))}
          </div>
        </section>
      </main>

      <Footer />

      <SellModal 
        isOpen={showSellModal} 
        onClose={() => setShowSellModal(false)} 
      />

      <UploadModal 
        isOpen={showUploadModal} 
        onClose={() => setShowUploadModal(false)} 
      />
    </div>
  );
}
