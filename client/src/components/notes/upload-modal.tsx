import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { FileUpload } from "@/components/ui/file-upload";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertNoteSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { getAuthHeaders } from "@/lib/auth";
import type { InsertNote } from "@shared/schema";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UploadModal({ isOpen, onClose }: UploadModalProps) {
  const [files, setFiles] = useState<File[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<InsertNote & { tags: string }>({
    resolver: zodResolver(insertNoteSchema.extend({
      tags: insertNoteSchema.shape.tags.optional().transform(val => val || [])
    })),
    defaultValues: {
      title: "",
      description: "",
      subject: "",
      unit: "",
      tags: "",
      filePath: "",
    },
  });

  const uploadNoteMutation = useMutation({
    mutationFn: async (data: InsertNote & { tags: string }) => {
      if (files.length === 0) {
        throw new Error("Please select a PDF file to upload");
      }

      const formData = new FormData();
      
      // Append note data
      formData.append('title', data.title);
      formData.append('description', data.description);
      formData.append('subject', data.subject);
      if (data.unit) formData.append('unit', data.unit);
      
      // Process tags - convert string to array
      const tagsArray = data.tags ? data.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) : [];
      formData.append('tags', JSON.stringify(tagsArray));
      
      // Append PDF file
      formData.append('note', files[0]);

      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to upload note');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notes'] });
      toast({
        title: "Note uploaded successfully!",
        description: "Your study notes are now available for download.",
      });
      form.reset();
      setFiles([]);
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to upload note",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertNote & { tags: string }) => {
    uploadNoteMutation.mutate(data);
  };

  const subjects = [
    "Mathematics", 
    "Physics", 
    "Chemistry", 
    "Biology", 
    "Computer Science", 
    "Engineering",
    "Economics",
    "Psychology",
    "Literature",
    "History"
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Study Notes</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FileUpload
              onFilesChange={setFiles}
              accept={{ "application/pdf": [".pdf"] }}
              multiple={false}
              maxFiles={1}
              className="mb-6"
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Calculus II - Integration Techniques" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select subject" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {subjects.map((subject) => (
                          <SelectItem key={subject} value={subject}>
                            {subject}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit/Chapter (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Unit 3" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe what these notes cover, key topics, and any special features..."
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., integration, derivatives, calculus (separate with commas)" 
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center justify-end space-x-4 pt-6 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={uploadNoteMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                {uploadNoteMutation.isPending ? "Uploading..." : "Upload Notes"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
