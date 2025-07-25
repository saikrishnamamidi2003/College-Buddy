import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Rating } from "@/components/ui/rating";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ItemCard from "@/components/marketplace/item-card";
import NoteCard from "@/components/notes/note-card";

export default function Profile() {
  const { isAuthenticated, user } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/auth");
    }
  }, [isAuthenticated, setLocation]);

  const { data: userItems = [] } = useQuery({
    queryKey: ["/api/items", { sellerId: user?.id }],
    enabled: !!user?.id,
    queryFn: () => {
      return fetch(`/api/items?sellerId=${user?.id}`).then(res => res.json());
    },
  });

  const { data: userNotes = [] } = useQuery({
    queryKey: ["/api/notes", { uploaderId: user?.id }],
    enabled: !!user?.id,
    queryFn: () => {
      return fetch(`/api/notes?uploaderId=${user?.id}`).then(res => res.json());
    },
  });

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center">
                  <Avatar className="w-24 h-24 mb-4">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback className="text-lg">
                      {user.name?.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  
                  <h2 className="text-xl font-bold text-gray-900 mb-1">{user.name}</h2>
                  <p className="text-gray-600 mb-2">@{user.username}</p>
                  
                  {user.branch && (
                    <Badge variant="secondary" className="mb-3">
                      {user.branch} {user.year && `• Year ${user.year}`}
                    </Badge>
                  )}
                  
                  <div className="flex items-center space-x-2 mb-4">
                    <Rating value={parseFloat(user.rating || "0")} size="sm" />
                    <span className="text-sm text-gray-600">
                      {user.rating} ({user.ratingCount} reviews)
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 w-full text-center">
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{userItems.length}</p>
                      <p className="text-sm text-gray-600">Items Listed</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{userNotes.length}</p>
                      <p className="text-sm text-gray-600">Notes Shared</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="items" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="items">My Items</TabsTrigger>
                <TabsTrigger value="notes">My Notes</TabsTrigger>
              </TabsList>
              
              <TabsContent value="items" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Listed Items</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {userItems.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-gray-500">You haven't listed any items yet.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {userItems.map((item: any) => (
                          <ItemCard key={item.id} item={item} showActions />
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="notes" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Uploaded Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {userNotes.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-gray-500">You haven't uploaded any notes yet.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {userNotes.map((note: any) => (
                          <NoteCard key={note.id} note={note} />
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
