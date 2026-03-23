import { users, photoSessions, type User, type InsertUser, type PhotoSession, type InsertPhotoSession } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createPhotoSession(session: InsertPhotoSession): Promise<PhotoSession>;
  getPhotoSession(id: number): Promise<PhotoSession | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private photoSessions: Map<number, PhotoSession>;
  private currentUserId: number;
  private currentSessionId: number;

  constructor() {
    this.users = new Map();
    this.photoSessions = new Map();
    this.currentUserId = 1;
    this.currentSessionId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createPhotoSession(insertSession: InsertPhotoSession): Promise<PhotoSession> {
    const id = this.currentSessionId++;
    const session: PhotoSession = { 
      ...insertSession, 
      id,
      createdAt: new Date()
    };
    this.photoSessions.set(id, session);
    return session;
  }

  async getPhotoSession(id: number): Promise<PhotoSession | undefined> {
    return this.photoSessions.get(id);
  }
}

export const storage = new MemStorage();
