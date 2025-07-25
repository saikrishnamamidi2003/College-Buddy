import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Rating } from "@/components/ui/rating";
import { FileText, Download } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { getAuthHeaders } from "@/lib/auth";
import type { Note, User } from "@shared/schema";

interface NoteCardProps {
  note: Note & { uploader?: User };
}

export default function NoteCard({ note }: NoteCardProps) {
  const { toast } = useToast();

  const downloadMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/notes/${note.id}/download`, {
        headers: getAuthHeaders(),
      });
      
      if (!response.ok) {
        throw new Error('Failed to download note');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${note.title}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
    onSuccess: () => {
      toast({
        title: "Download started",
        description: "The note is being downloaded.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Download failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const getSubjectColor = (subject: string) => {
    switch (subject.toLowerCase()) {
      case 'mathematics': return 'bg-red-100 text-red-600';
      case 'physics': return 'bg-blue-100 text-blue-600';
      case 'chemistry': return 'bg-green-100 text-green-600';
      case 'biology': return 'bg-purple-100 text-purple-600';
      case 'computer science': return 'bg-indigo-100 text-indigo-600';
      case 'engineering': return 'bg-orange-100 text-orange-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getSubjectColor(note.subject)}`}>
              <FileText size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 line-clamp-1">{note.title}</h3>
              <p className="text-sm text-gray-600">
                {note.subject} {note.unit && `• ${note.unit}`}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <Rating value={parseFloat(note.rating || "0")} size="sm" />
            <span className="text-sm text-gray-600 ml-1">
              {note.rating}
            </span>
          </div>
        </div>
        
        <p className="text-sm text-gray-600 mb-4 line-clamp-3">{note.description}</p>
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <span className="flex items-center space-x-1">
              <Download size={14} />
              <span>{note.downloadCount} downloads</span>
            </span>
            {note.pageCount && (
              <span className="flex items-center space-x-1">
                <FileText size={14} />
                <span>{note.pageCount} pages</span>
              </span>
            )}
          </div>
          <span className="text-xs text-gray-400">
            {formatTimeAgo(new Date(note.createdAt!))}
          </span>
        </div>

        <div className="flex items-center justify-between">
          {note.uploader && (
            <div className="flex items-center space-x-2">
              <Avatar className="w-6 h-6">
                <AvatarImage src={note.uploader.avatar} />
                <AvatarFallback className="text-xs">
                  {note.uploader.name?.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-gray-600">{note.uploader.name}</span>
              <Rating value={parseFloat(note.uploader.rating || "0")} size="sm" />
            </div>
          )}
          <Button
            size="sm"
            onClick={() => downloadMutation.mutate()}
            disabled={downloadMutation.isPending}
            className="ml-auto"
          >
            {downloadMutation.isPending ? "Downloading..." : "Download"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
