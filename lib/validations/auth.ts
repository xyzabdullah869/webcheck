import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
  remember: z.boolean().optional().default(false),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    full_name: z.string().min(2, 'Please enter your full name'),
    email: z.string().email('Enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirm: z.string(),
    agree: z.boolean().refine((v) => v === true, {
      message: 'Please accept the terms to continue',
    }),
  })
  .refine((data) => data.password === data.confirm, {
    message: 'Passwords do not match',
    path: ['confirm'],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email('Enter a valid email address'),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirm: z.string(),
  })
  .refine((data) => data.password === data.confirm, {
    message: 'Passwords do not match',
    path: ['confirm'],
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const profileSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional().default(''),
  location: z.string().optional().default(''),
  avatar_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
});

export type ProfileInput = z.infer<typeof profileSchema>;

export const courseSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  slug: z
    .string()
    .min(3, 'Slug must be at least 3 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase, alphanumeric with dashes'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  short_description: z.string().max(150, 'Keep it under 150 characters').optional().default(''),
  category_id: z.string().uuid('Select a valid category'),
  instructor_id: z.string().uuid('Select a valid instructor'),
  level: z.enum(['Beginner', 'Intermediate', 'Advanced']),
  language: z.string().default('English'),
  price: z.number().min(0, 'Price must be 0 or greater'),
  original_price: z.number().min(0).optional(),
  duration: z.string().default(''),
  tags: z.array(z.string()).default([]),
  what_you_will_learn: z.array(z.string()).default([]),
  requirements: z.array(z.string()).default([]),
  thumbnail: z.string().url().optional().or(z.literal('')),
  trailer_url: z.string().url().optional().or(z.literal('')),
  certificate_enabled: z.boolean().default(true),
  featured: z.boolean().default(false),
  status: z.enum(['Published', 'Draft', 'Archived', 'Pending Review']).default('Draft'),
});

export type CourseInput = z.infer<typeof courseSchema>;

export function getAuthErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const msg = (error as { message: string }).message;
    if (msg.includes('Invalid login credentials')) return 'Invalid email or password.';
    if (msg.includes('User already registered')) return 'An account with this email already exists.';
    if (msg.includes('Password should be at least')) return 'Password must be at least 8 characters.';
    if (msg.includes('Email not confirmed')) return 'Please verify your email before signing in.';
    if (msg.includes('rate limit')) return 'Too many attempts. Please wait a moment and try again.';
    return msg;
  }
  return 'An unexpected error occurred. Please try again.';
}
