import { Router, Request, Response } from 'express';
import { pool } from '../db';
import { users, type User } from '../../shared/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

export const router = Router();

// Login validation schema
const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
});

// Registration validation schema
const registerSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  firstName: z.string().min(1, { message: "First name is required" }),
  lastName: z.string().min(1, { message: "Last name is required" }),
  businessName: z.string().optional(), // We'll still accept this but won't use it in the database operation
  phone: z.string().optional(), // We'll still accept this but won't use it in the database operation
});

// Login route
router.post('/login', async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: validation.error.format() 
      });
    }

    const { email, password } = validation.data;

    // Use direct SQL query to avoid schema issues
    const result = await pool.query(
      `SELECT id, username, email, password, first_name, last_name, created_at 
       FROM users 
       WHERE email = $1`,
      [email]
    );
    
    const users = result.rows;
    
    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = users[0];

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Create session with user data mapped to camelCase for frontend compatibility
    (req.session as any).user = {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
    };
    
    await new Promise<void>((resolve, reject) => {
      req.session.save((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });

    // Return user data (excluding password) with proper camelCase keys for frontend
    return res.status(200).json({
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      createdAt: user.created_at
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Register route
router.post('/register', async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validation = registerSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: validation.error.format() 
      });
    }

    const { email, password, firstName, lastName } = validation.data;

    // Check if email already exists using direct connection
    const checkResult = await pool.query(
      `SELECT * FROM users WHERE email = $1`, 
      [email]
    );

    if (checkResult.rows.length > 0) {
      return res.status(409).json({ message: 'Email already in use' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate a username from the email
    const username = email.split('@')[0];

    // Create new user using raw SQL - directly using the column names that exist in the database
    const insertResult = await pool.query(
      `INSERT INTO users (username, email, password, first_name, last_name, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id, username, email, first_name, last_name, created_at`,
      [username, email, hashedPassword, firstName, lastName, new Date()]
    );

    const newUser = insertResult.rows[0];

    // Create session
    (req.session as any).user = {
      id: newUser.id,
      email: newUser.email,
      firstName: newUser.first_name,
      lastName: newUser.last_name,
    };
    
    await new Promise<void>((resolve, reject) => {
      req.session.save((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });

    // Return user data (excluding password)
    return res.status(201).json({
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      firstName: newUser.first_name,
      lastName: newUser.last_name,
      createdAt: newUser.created_at
    });

  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Get current user
router.get('/user', (req: Request, res: Response) => {
  if (req.session && (req.session as any).user) {
    return res.status(200).json((req.session as any).user);
  }
  return res.status(401).json({ message: 'Not authenticated' });
});

// Logout route
router.post('/logout', (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ message: 'Failed to logout' });
    }
    res.clearCookie('connect.sid');
    return res.status(200).json({ message: 'Logged out successfully' });
  });
});

// Middleware to check if a user is authenticated
export const requireAuth = (req: Request, res: Response, next: Function) => {
  if (req.session && (req.session as any).user) {
    return next();
  }
  return res.status(401).json({ message: 'Authentication required' });
};

export default router;