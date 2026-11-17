export type Role = 'admin' | 'member';

export interface AppSession {
  userId: string;
  email: string;
  role: Role;
}

export interface SiteSettings {
  id: number;
  gym_name: string;
  trainer_name: string;
  tagline: string | null;
  bio: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  address: string | null;
  map_url: string | null;
  instagram: string | null;
  youtube: string | null;
  hours: string | null;
  years_experience: number | null;
  clients_trained: number | null;
  certifications: string[] | null;
  tagline_hi: string | null;
  hero_image_url: string | null;
  logo_url?: string | null;
  gallery_urls: string[] | null;
  upi_id: string | null;
}

export interface Plan {
  id: string;
  name: string;
  duration_days: number;
  price: number;
  description: string | null;
  features: string[] | null;
  is_active: boolean;
  sort_order: number;
}

export interface Testimonial {
  id: string;
  name: string;
  text: string;
  result: string | null;
  is_published: boolean;
  created_at?: string;
}

export type LeadStatus = 'new' | 'contacted' | 'joined' | 'lost';
export interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  message: string | null;
  interested_plan: string | null;
  status: LeadStatus;
  created_at: string;
}

export interface Exercise {
  name: string;
  sets: string;
  reps: string;
  notes?: string;
}
export interface WorkoutDay {
  day: string;
  focus: string;
  exercises: Exercise[];
}
export interface WorkoutPlan {
  id: string;
  name: string;
  description: string | null;
  schedule: WorkoutDay[];
}

export interface Meal {
  time: string;
  name: string;
  items: string;
}
export interface DietPlan {
  id: string;
  name: string;
  description: string | null;
  calories: number | null;
  meals: Meal[];
}

export interface Member {
  id: string;
  user_id: string | null;
  full_name: string;
  email: string | null;
  phone: string | null;
  gender: string | null;
  dob: string | null;
  joined_on: string;
  goal: string | null;
  notes: string | null;
  height_cm: number | null;
  photo_url?: string | null;
  workout_plan_id: string | null;
  diet_plan_id: string | null;
  created_at?: string;
}

export interface Subscription {
  id: string;
  member_id: string;
  plan_id: string | null;
  plan_name: string;
  start_date: string;
  end_date: string;
  price: number;
  created_at?: string;
}

export type PaymentMethod = 'cash' | 'upi' | 'card' | 'bank' | 'other';
export interface Payment {
  id: string;
  member_id: string;
  subscription_id: string | null;
  amount: number;
  method: PaymentMethod;
  paid_on: string;
  note: string | null;
}

export interface Attendance {
  id: string;
  member_id: string;
  check_in: string;
}

export interface ProgressLog {
  id: string;
  member_id: string;
  logged_on: string;
  weight_kg: number | null;
  body_fat: number | null;
  waist_cm: number | null;
  notes: string | null;
}

export interface Tables {
  site_settings: SiteSettings;
  plans: Plan;
  testimonials: Testimonial;
  leads: Lead;
  workout_plans: WorkoutPlan;
  diet_plans: DietPlan;
  members: Member;
  subscriptions: Subscription;
  payments: Payment;
  attendance: Attendance;
  progress_logs: ProgressLog;
}
export type TableName = keyof Tables;
