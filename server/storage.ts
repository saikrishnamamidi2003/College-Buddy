import { type User, type InsertUser, type Item, type InsertItem, type Note, type InsertNote, type Message, type InsertMessage, type Rating, type InsertRating } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  
  // Items
  getItem(id: string): Promise<Item | undefined>;
  getItems(filters?: { category?: string; search?: string; sellerId?: string }): Promise<Item[]>;
  createItem(item: InsertItem & { sellerId: string }): Promise<Item>;
  updateItem(id: string, updates: Partial<Item>): Promise<Item | undefined>;
  deleteItem(id: string): Promise<boolean>;
  
  // Notes
  getNote(id: string): Promise<Note | undefined>;
  getNotes(filters?: { subject?: string; search?: string; uploaderId?: string }): Promise<Note[]>;
  createNote(note: InsertNote & { uploaderId: string }): Promise<Note>;
  updateNote(id: string, updates: Partial<Note>): Promise<Note | undefined>;
  deleteNote(id: string): Promise<boolean>;
  
  // Messages
  getMessage(id: string): Promise<Message | undefined>;
  getMessages(userId: string, otherUserId?: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessageAsRead(id: string): Promise<boolean>;
  
  // Ratings
  getRating(id: string): Promise<Rating | undefined>;
  getRatings(filters: { ratedUserId?: string; itemId?: string; noteId?: string }): Promise<Rating[]>;
  createRating(rating: InsertRating): Promise<Rating>;
  
  // Stats
  getStats(): Promise<{
    activeListings: number;
    studyNotes: number;
    activeStudents: number;
  }>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private items: Map<string, Item>;
  private notes: Map<string, Note>;
  private messages: Map<string, Message>;
  private ratings: Map<string, Rating>;

  constructor() {
    this.users = new Map();
    this.items = new Map();
    this.notes = new Map();
    this.messages = new Map();
    this.ratings = new Map();
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      ...insertUser,
      id,
      rating: "0",
      ratingCount: 0,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Items
  async getItem(id: string): Promise<Item | undefined> {
    return this.items.get(id);
  }

  async getItems(filters?: { category?: string; search?: string; sellerId?: string }): Promise<Item[]> {
    let items = Array.from(this.items.values());
    
    if (filters?.category) {
      items = items.filter(item => item.category === filters.category);
    }
    
    if (filters?.search) {
      const search = filters.search.toLowerCase();
      items = items.filter(item => 
        item.title.toLowerCase().includes(search) || 
        item.description.toLowerCase().includes(search)
      );
    }
    
    if (filters?.sellerId) {
      items = items.filter(item => item.sellerId === filters.sellerId);
    }
    
    return items.sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async createItem(item: InsertItem & { sellerId: string }): Promise<Item> {
    const id = randomUUID();
    const newItem: Item = {
      ...item,
      id,
      sold: false,
      createdAt: new Date(),
    };
    this.items.set(id, newItem);
    return newItem;
  }

  async updateItem(id: string, updates: Partial<Item>): Promise<Item | undefined> {
    const item = this.items.get(id);
    if (!item) return undefined;
    const updatedItem = { ...item, ...updates };
    this.items.set(id, updatedItem);
    return updatedItem;
  }

  async deleteItem(id: string): Promise<boolean> {
    return this.items.delete(id);
  }

  // Notes
  async getNote(id: string): Promise<Note | undefined> {
    return this.notes.get(id);
  }

  async getNotes(filters?: { subject?: string; search?: string; uploaderId?: string }): Promise<Note[]> {
    let notes = Array.from(this.notes.values());
    
    if (filters?.subject) {
      notes = notes.filter(note => note.subject === filters.subject);
    }
    
    if (filters?.search) {
      const search = filters.search.toLowerCase();
      notes = notes.filter(note => 
        note.title.toLowerCase().includes(search) || 
        note.description.toLowerCase().includes(search) ||
        note.tags.some(tag => tag.toLowerCase().includes(search))
      );
    }
    
    if (filters?.uploaderId) {
      notes = notes.filter(note => note.uploaderId === filters.uploaderId);
    }
    
    return notes.sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async createNote(note: InsertNote & { uploaderId: string }): Promise<Note> {
    const id = randomUUID();
    const newNote: Note = {
      ...note,
      id,
      downloadCount: 0,
      rating: "0",
      ratingCount: 0,
      createdAt: new Date(),
    };
    this.notes.set(id, newNote);
    return newNote;
  }

  async updateNote(id: string, updates: Partial<Note>): Promise<Note | undefined> {
    const note = this.notes.get(id);
    if (!note) return undefined;
    const updatedNote = { ...note, ...updates };
    this.notes.set(id, updatedNote);
    return updatedNote;
  }

  async deleteNote(id: string): Promise<boolean> {
    return this.notes.delete(id);
  }

  // Messages
  async getMessage(id: string): Promise<Message | undefined> {
    return this.messages.get(id);
  }

  async getMessages(userId: string, otherUserId?: string): Promise<Message[]> {
    let messages = Array.from(this.messages.values());
    
    if (otherUserId) {
      messages = messages.filter(msg => 
        (msg.senderId === userId && msg.receiverId === otherUserId) ||
        (msg.senderId === otherUserId && msg.receiverId === userId)
      );
    } else {
      messages = messages.filter(msg => msg.senderId === userId || msg.receiverId === userId);
    }
    
    return messages.sort((a, b) => (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0));
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const id = randomUUID();
    const newMessage: Message = {
      ...message,
      id,
      read: false,
      createdAt: new Date(),
    };
    this.messages.set(id, newMessage);
    return newMessage;
  }

  async markMessageAsRead(id: string): Promise<boolean> {
    const message = this.messages.get(id);
    if (!message) return false;
    message.read = true;
    this.messages.set(id, message);
    return true;
  }

  // Ratings
  async getRating(id: string): Promise<Rating | undefined> {
    return this.ratings.get(id);
  }

  async getRatings(filters: { ratedUserId?: string; itemId?: string; noteId?: string }): Promise<Rating[]> {
    let ratings = Array.from(this.ratings.values());
    
    if (filters.ratedUserId) {
      ratings = ratings.filter(rating => rating.ratedUserId === filters.ratedUserId);
    }
    
    if (filters.itemId) {
      ratings = ratings.filter(rating => rating.itemId === filters.itemId);
    }
    
    if (filters.noteId) {
      ratings = ratings.filter(rating => rating.noteId === filters.noteId);
    }
    
    return ratings;
  }

  async createRating(rating: InsertRating): Promise<Rating> {
    const id = randomUUID();
    const newRating: Rating = {
      ...rating,
      id,
      createdAt: new Date(),
    };
    this.ratings.set(id, newRating);
    return newRating;
  }

  // Stats
  async getStats(): Promise<{ activeListings: number; studyNotes: number; activeStudents: number }> {
    const activeListings = Array.from(this.items.values()).filter(item => !item.sold).length;
    const studyNotes = this.notes.size;
    const activeStudents = this.users.size;
    
    return { activeListings, studyNotes, activeStudents };
  }
}

export const storage = new MemStorage();
