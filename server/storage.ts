import { type User, type InsertUser, type Item, type InsertItem, type Note, type InsertNote, type Message, type InsertMessage, type Rating, type InsertRating, users, items, notes, messages, ratings } from "@shared/schema";
import { db } from "./db";
import { eq, and, or, like, ilike } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

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

  sessionStore: session.SessionStore;
}

const PostgresSessionStore = connectPg(session);

export class DatabaseStorage implements IStorage {
  public sessionStore: session.SessionStore;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  // Items
  async getItem(id: string): Promise<Item | undefined> {
    const [item] = await db.select().from(items).where(eq(items.id, id));
    return item || undefined;
  }

  async getItems(filters?: { category?: string; search?: string; sellerId?: string }): Promise<Item[]> {
    let query = db.select().from(items);
    
    const conditions = [];
    
    if (filters?.category) {
      conditions.push(eq(items.category, filters.category));
    }
    
    if (filters?.search) {
      conditions.push(
        or(
          ilike(items.title, `%${filters.search}%`),
          ilike(items.description, `%${filters.search}%`)
        )
      );
    }
    
    if (filters?.sellerId) {
      conditions.push(eq(items.sellerId, filters.sellerId));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(items.createdAt);
  }

  async createItem(item: InsertItem & { sellerId: string }): Promise<Item> {
    const [newItem] = await db
      .insert(items)
      .values(item)
      .returning();
    return newItem;
  }

  async updateItem(id: string, updates: Partial<Item>): Promise<Item | undefined> {
    const [item] = await db
      .update(items)
      .set(updates)
      .where(eq(items.id, id))
      .returning();
    return item || undefined;
  }

  async deleteItem(id: string): Promise<boolean> {
    const result = await db.delete(items).where(eq(items.id, id));
    return result.rowCount > 0;
  }

  // Notes
  async getNote(id: string): Promise<Note | undefined> {
    const [note] = await db.select().from(notes).where(eq(notes.id, id));
    return note || undefined;
  }

  async getNotes(filters?: { subject?: string; search?: string; uploaderId?: string }): Promise<Note[]> {
    let query = db.select().from(notes);
    
    const conditions = [];
    
    if (filters?.subject) {
      conditions.push(eq(notes.subject, filters.subject));
    }
    
    if (filters?.search) {
      conditions.push(
        or(
          ilike(notes.title, `%${filters.search}%`),
          ilike(notes.description, `%${filters.search}%`)
        )
      );
    }
    
    if (filters?.uploaderId) {
      conditions.push(eq(notes.uploaderId, filters.uploaderId));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(notes.createdAt);
  }

  async createNote(note: InsertNote & { uploaderId: string }): Promise<Note> {
    const [newNote] = await db
      .insert(notes)
      .values(note)
      .returning();
    return newNote;
  }

  async updateNote(id: string, updates: Partial<Note>): Promise<Note | undefined> {
    const [note] = await db
      .update(notes)
      .set(updates)
      .where(eq(notes.id, id))
      .returning();
    return note || undefined;
  }

  async deleteNote(id: string): Promise<boolean> {
    const result = await db.delete(notes).where(eq(notes.id, id));
    return result.rowCount > 0;
  }

  // Messages
  async getMessage(id: string): Promise<Message | undefined> {
    const [message] = await db.select().from(messages).where(eq(messages.id, id));
    return message || undefined;
  }

  async getMessages(userId: string, otherUserId?: string): Promise<Message[]> {
    let query = db.select().from(messages);
    
    if (otherUserId) {
      query = query.where(
        or(
          and(eq(messages.senderId, userId), eq(messages.receiverId, otherUserId)),
          and(eq(messages.senderId, otherUserId), eq(messages.receiverId, userId))
        )
      );
    } else {
      query = query.where(
        or(eq(messages.senderId, userId), eq(messages.receiverId, userId))
      );
    }
    
    return await query.orderBy(messages.createdAt);
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db
      .insert(messages)
      .values(message)
      .returning();
    return newMessage;
  }

  async markMessageAsRead(id: string): Promise<boolean> {
    const result = await db
      .update(messages)
      .set({ read: true })
      .where(eq(messages.id, id));
    return result.rowCount > 0;
  }

  // Ratings
  async getRating(id: string): Promise<Rating | undefined> {
    const [rating] = await db.select().from(ratings).where(eq(ratings.id, id));
    return rating || undefined;
  }

  async getRatings(filters: { ratedUserId?: string; itemId?: string; noteId?: string }): Promise<Rating[]> {
    let query = db.select().from(ratings);
    
    const conditions = [];
    
    if (filters.ratedUserId) {
      conditions.push(eq(ratings.ratedUserId, filters.ratedUserId));
    }
    
    if (filters.itemId) {
      conditions.push(eq(ratings.itemId, filters.itemId));
    }
    
    if (filters.noteId) {
      conditions.push(eq(ratings.noteId, filters.noteId));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query;
  }

  async createRating(rating: InsertRating): Promise<Rating> {
    const [newRating] = await db
      .insert(ratings)
      .values(rating)
      .returning();
    return newRating;
  }

  // Stats
  async getStats(): Promise<{ activeListings: number; studyNotes: number; activeStudents: number }> {
    const [activeListingsResult] = await db
      .select({ count: items.id })
      .from(items)
      .where(eq(items.sold, false));
      
    const [studyNotesResult] = await db
      .select({ count: notes.id })
      .from(notes);
      
    const [activeStudentsResult] = await db
      .select({ count: users.id })
      .from(users);
    
    return {
      activeListings: activeListingsResult?.count || 0,
      studyNotes: studyNotesResult?.count || 0,
      activeStudents: activeStudentsResult?.count || 0,
    };
  }
}

export const storage = new DatabaseStorage();
