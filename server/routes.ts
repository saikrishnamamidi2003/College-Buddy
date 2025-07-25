import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertItemSchema, insertNoteSchema, insertMessageSchema, insertRatingSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";

// Multer configuration
const storage_multer = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'server/uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage_multer,
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'images') {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed'));
      }
    } else if (file.fieldname === 'note') {
      if (file.mimetype === 'application/pdf') {
        cb(null, true);
      } else {
        cb(new Error('Only PDF files are allowed for notes'));
      }
    } else {
      cb(new Error('Unknown field'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

// Auth middleware - now uses sessions instead of JWT
const requireAuth = (req: any, res: any, next: any) => {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ error: 'Authentication required' });
};

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Setup authentication first
  setupAuth(app);

  // WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  const connectedClients = new Map<string, WebSocket>();

  wss.on('connection', (ws, req) => {
    console.log('New WebSocket connection');
    
    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'authenticate') {
          // For now, accept any authentication - in a real app you'd verify the user session
          const userId = message.userId;
          if (userId) {
            connectedClients.set(userId, ws);
            ws.send(JSON.stringify({ type: 'authenticated', userId }));
          }
        } else if (message.type === 'sendMessage') {
          const newMessage = await storage.createMessage(message.data);
          
          // Send to receiver if connected
          const receiverWs = connectedClients.get(message.data.receiverId);
          if (receiverWs && receiverWs.readyState === WebSocket.OPEN) {
            receiverWs.send(JSON.stringify({ type: 'newMessage', data: newMessage }));
          }
          
          // Send confirmation to sender
          ws.send(JSON.stringify({ type: 'messageSent', data: newMessage }));
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
      }
    });

    ws.on('close', () => {
      // Remove from connected clients
      for (const [userId, client] of connectedClients.entries()) {
        if (client === ws) {
          connectedClients.delete(userId);
          break;
        }
      }
    });
  });

  // Stats route
  app.get('/api/stats', async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Items routes
  app.get('/api/items', async (req, res) => {
    try {
      const { category, search, sellerId } = req.query;
      const items = await storage.getItems({
        category: category as string,
        search: search as string,
        sellerId: sellerId as string,
      });
      
      // Populate seller info
      const itemsWithSeller = await Promise.all(
        items.map(async (item) => {
          const seller = await storage.getUser(item.sellerId);
          return { ...item, seller: seller ? { ...seller, password: undefined } : null };
        })
      );
      
      res.json(itemsWithSeller);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/items/:id', async (req, res) => {
    try {
      const item = await storage.getItem(req.params.id);
      if (!item) {
        return res.status(404).json({ message: 'Item not found' });
      }
      
      const seller = await storage.getUser(item.sellerId);
      res.json({ ...item, seller: seller ? { ...seller, password: undefined } : null });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/items', requireAuth, upload.array('images', 5), async (req: any, res) => {
    try {
      const itemData = insertItemSchema.parse(req.body);
      const images = req.files ? req.files.map((file: any) => `/uploads/${file.filename}`) : [];
      
      const item = await storage.createItem({
        ...itemData,
        images,
        sellerId: req.user.id,
      });
      
      res.status(201).json(item);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch('/api/items/:id', requireAuth, async (req: any, res) => {
    try {
      const item = await storage.getItem(req.params.id);
      if (!item) {
        return res.status(404).json({ message: 'Item not found' });
      }
      
      if (item.sellerId !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized' });
      }
      
      const updatedItem = await storage.updateItem(req.params.id, req.body);
      res.json(updatedItem);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Notes routes
  app.get('/api/notes', async (req, res) => {
    try {
      const { subject, search, uploaderId } = req.query;
      const notes = await storage.getNotes({
        subject: subject as string,
        search: search as string,
        uploaderId: uploaderId as string,
      });
      
      // Populate uploader info
      const notesWithUploader = await Promise.all(
        notes.map(async (note) => {
          const uploader = await storage.getUser(note.uploaderId);
          return { ...note, uploader: uploader ? { ...uploader, password: undefined } : null };
        })
      );
      
      res.json(notesWithUploader);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/notes/:id', async (req, res) => {
    try {
      const note = await storage.getNote(req.params.id);
      if (!note) {
        return res.status(404).json({ message: 'Note not found' });
      }
      
      const uploader = await storage.getUser(note.uploaderId);
      res.json({ ...note, uploader: uploader ? { ...uploader, password: undefined } : null });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/notes', requireAuth, upload.single('note'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'PDF file is required' });
      }
      
      const noteData = insertNoteSchema.parse(req.body);
      
      const note = await storage.createNote({
        ...noteData,
        filePath: `/uploads/${req.file.filename}`,
        fileSize: req.file.size,
        uploaderId: req.user.id,
      });
      
      res.status(201).json(note);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get('/api/notes/:id/download', requireAuth, async (req: any, res) => {
    try {
      const note = await storage.getNote(req.params.id);
      if (!note) {
        return res.status(404).json({ message: 'Note not found' });
      }
      
      // Increment download count
      await storage.updateNote(req.params.id, { 
        downloadCount: (note.downloadCount || 0) + 1 
      });
      
      const filePath = path.join(process.cwd(), 'server', note.filePath);
      res.download(filePath);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Messages routes
  app.get('/api/messages', requireAuth, async (req: any, res) => {
    try {
      const { otherUserId } = req.query;
      const messages = await storage.getMessages(req.user.id, otherUserId as string);
      
      // Populate sender and receiver info
      const messagesWithUsers = await Promise.all(
        messages.map(async (message) => {
          const sender = await storage.getUser(message.senderId);
          const receiver = await storage.getUser(message.receiverId);
          return {
            ...message,
            sender: sender ? { ...sender, password: undefined } : null,
            receiver: receiver ? { ...receiver, password: undefined } : null,
          };
        })
      );
      
      res.json(messagesWithUsers);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/messages', requireAuth, async (req: any, res) => {
    try {
      const messageData = insertMessageSchema.parse({
        ...req.body,
        senderId: req.user.id,
      });
      
      const message = await storage.createMessage(messageData);
      res.status(201).json(message);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Ratings routes
  app.post('/api/ratings', requireAuth, async (req: any, res) => {
    try {
      const ratingData = insertRatingSchema.parse({
        ...req.body,
        raterId: req.user.id,
      });
      
      const rating = await storage.createRating(ratingData);
      
      // Update average rating
      if (ratingData.ratedUserId) {
        const userRatings = await storage.getRatings({ ratedUserId: ratingData.ratedUserId });
        const avgRating = userRatings.reduce((sum, r) => sum + r.rating, 0) / userRatings.length;
        await storage.updateUser(ratingData.ratedUserId, { 
          rating: avgRating.toFixed(1),
          ratingCount: userRatings.length,
        });
      }
      
      if (ratingData.noteId) {
        const noteRatings = await storage.getRatings({ noteId: ratingData.noteId });
        const avgRating = noteRatings.reduce((sum, r) => sum + r.rating, 0) / noteRatings.length;
        await storage.updateNote(ratingData.noteId, { 
          rating: avgRating.toFixed(1),
          ratingCount: noteRatings.length,
        });
      }
      
      res.status(201).json(rating);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Serve uploaded files
  app.use('/uploads', express.static(path.join(process.cwd(), 'server/uploads')));

  return httpServer;
}
