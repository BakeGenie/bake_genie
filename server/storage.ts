import { users, type User, type InsertUser } from "@shared/schema";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  currentId: number;

  constructor() {
    this.users = new Map();
    this.currentId = 1;
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
    const id = this.currentId++;
    
    // Ensure all nullable fields are properly set to null if undefined
    const user: User = { 
      ...insertUser, 
      id,
      createdAt: new Date(),
      businessName: insertUser.businessName ?? null,
      phone: insertUser.phone ?? null,
      address: insertUser.address ?? null,
      city: insertUser.city ?? null,
      state: insertUser.state ?? null,
      zip: insertUser.zip ?? null,
      country: insertUser.country ?? null
    };
    
    this.users.set(id, user);
    return user;
  }
}

export const storage = new MemStorage();
