/**
 * Database row types matching the Supabase schema.
 * These mirror the tables created by migrations and can be
 * used with the Supabase client for type-safe queries.
 */

export type DbProfile = {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  bio: string;
  location: string;
  role: 'student' | 'instructor' | 'admin';
  created_at: string;
  updated_at: string;
};

export type DbCategory = {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  image: string;
  created_at: string;
};

export type DbCourse = {
  id: string;
  title: string;
  slug: string;
  description: string;
  short_description: string;
  what_you_will_learn: string[];
  requirements: string[];
  thumbnail: string;
  trailer_url: string;
  category_id: string | null;
  instructor_id: string | null;
  duration: string;
  lessons_count: number;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  language: string;
  price: number;
  price_pkr: number;
  original_price: number | null;
  tags: string[];
  rating: number;
  reviews_count: number;
  students_count: number;
  bestseller: boolean;
  is_new: boolean;
  featured: boolean;
  certificate_enabled: boolean;
  status: 'Published' | 'Draft' | 'Archived' | 'Pending Review';
  created_at: string;
  updated_at: string;
};

export type DbModule = {
  id: string;
  course_id: string;
  title: string;
  description: string;
  order_index: number;
  created_at: string;
};

export type DbLesson = {
  id: string;
  module_id: string;
  title: string;
  description: string;
  video_url: string;
  video_type: 'mp4' | 'youtube' | 'vimeo';
  video_storage_path: string;
  duration: string;
  duration_seconds: number;
  order_index: number;
  preview: boolean;
  has_quiz: boolean;
  has_assignment: boolean;
  resources: Record<string, unknown>[];
  created_at: string;
};

export type DbQuiz = {
  id: string;
  course_id: string;
  lesson_id: string | null;
  module_id: string | null;
  title: string;
  description: string;
  passing_score: number;
  time_limit: number;
  created_at: string;
};

export type DbQuizQuestion = {
  id: string;
  quiz_id: string;
  question: string;
  question_type: 'single' | 'multiple' | 'true_false';
  options: Record<string, unknown>[];
  explanation: string;
  order_index: number;
};

export type DbQuizResult = {
  id: string;
  user_id: string;
  quiz_id: string;
  course_id: string;
  score: number;
  passed: boolean;
  answers: Record<string, unknown>[];
  taken_at: string;
};

export type DbAssignment = {
  id: string;
  course_id: string;
  lesson_id: string | null;
  module_id: string | null;
  title: string;
  description: string;
  due_date: string | null;
  max_score: number;
  allowed_file_types: string[];
  created_at: string;
};

export type DbSubmission = {
  id: string;
  assignment_id: string;
  user_id: string;
  course_id: string;
  file_url: string;
  file_name: string;
  file_type: string;
  status: 'Pending' | 'Submitted' | 'Reviewed' | 'Approved';
  submitted_at: string;
  grade: number | null;
  feedback: string | null;
  reviewed_at: string | null;
};

export type DbCertificate = {
  id: string;
  user_id: string;
  course_id: string;
  certificate_id: string;
  course_name: string;
  score: number;
  issue_date: string;
  verification_url: string;
};

export type DbReview = {
  id: string;
  course_id: string;
  user_id: string;
  rating: number;
  comment: string;
  flagged: boolean;
  created_at: string;
};

export type DbBookmark = {
  id: string;
  user_id: string;
  course_id: string | null;
  lesson_id: string | null;
  created_at: string;
};

export type DbNotification = {
  id: string;
  user_id: string;
  type: 'assignment' | 'quiz' | 'course' | 'announcement' | 'system';
  title: string;
  message: string;
  read: boolean;
  created_at: string;
};

export type DbEnrollment = {
  id: string;
  user_id: string;
  course_id: string;
  progress: number;
  enrolled_at: string;
  completed_at: string | null;
};

export type DbLessonProgress = {
  id: string;
  user_id: string;
  lesson_id: string;
  course_id: string;
  completed: boolean;
  watch_position: number;
  updated_at: string;
};

export type DbReferralCode = {
  id: string;
  user_id: string;
  code: string;
  uses: number;
  created_at: string;
};

export type DbReferralHistory = {
  id: string;
  referrer_id: string;
  referred_id: string;
  code_used: string;
  created_at: string;
};

export type DbWallet = {
  id: string;
  user_id: string;
  balance: number;
  currency: string;
  created_at: string;
  updated_at: string;
};

export type DbTransaction = {
  id: string;
  wallet_id: string;
  user_id: string;
  amount: number;
  type: 'credit' | 'debit' | 'refund' | 'payout' | 'referral_bonus' | 'course_purchase';
  description: string;
  reference_id: string | null;
  created_at: string;
};

export type DbAiChatHistory = {
  id: string;
  user_id: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  topics: string[];
  created_at: string;
};

export type DbReferralReward = {
  id: string;
  referral_history_id: string;
  referrer_id: string;
  referred_id: string;
  reward_amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'credited';
  referral_type: 'membership' | 'course';
  credited_at: string | null;
  created_at: string;
};

export type DbReferralSettings = {
  id: string;
  reward_amount: number;
  min_courses_for_reward: number;
  is_active: boolean;
  membership_fee: number;
  membership_referral_reward: number;
  course_referral_commission_percent: number;
  membership_enabled: boolean;
  updated_by: string | null;
  updated_at: string;
};

export type DbAiSettings = {
  id: string;
  is_enabled: boolean;
  model_name: string;
  system_prompt: string;
  max_tokens: number;
  temperature: number;
  updated_by: string | null;
  updated_at: string;
};

export type DbWebsiteSettings = {
  id: number;
  website_name: string;
  short_name: string;
  website_logo: string | null;
  website_description: string;
  owner_name: string | null;
  owner_designation: string | null;
  support_email: string | null;
  contact_email: string | null;
  contact_number: string | null;
  whatsapp_number: string | null;
  whatsapp_enabled: boolean;
  whatsapp_default_message: string | null;
  office_address: string | null;
  google_maps_location: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  linkedin_url: string | null;
  youtube_url: string | null;
  twitter_url: string | null;
  github_url: string | null;
  working_hours: string | null;
  support_hours: string | null;
  copyright_text: string | null;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string[];
  usd_to_pkr_exchange_rate: number;
  partners: string[];
  updated_by: string | null;
  updated_at: string;
};

export type DbPaymentSettings = {
  id: number;
  currency: string;
  currency_symbol: string;
  tax_rate: number;
  tax_enabled: boolean;
  platform_commission_percent: number;
  instructor_commission_percent: number;
  fixed_commission_per_sale: number;
  min_withdrawal_amount: number;
  updated_by: string | null;
  updated_at: string;
};

export type DbPaymentGateway = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  is_enabled: boolean;
  is_test_mode: boolean;
  config: Record<string, unknown>;
  display_order: number;
  created_at: string;
  updated_at: string;
};

export type DbCoupon = {
  id: string;
  code: string;
  description: string | null;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_amount: number;
  max_discount_amount: number | null;
  usage_limit: number | null;
  used_count: number;
  expires_at: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type DbOrder = {
  id: string;
  order_number: string;
  user_id: string;
  status: 'pending' | 'paid' | 'failed' | 'refunded' | 'cancelled';
  payment_method: string | null;
  payment_gateway: string | null;
  payment_reference: string | null;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  coupon_code: string | null;
  referral_code: string | null;
  currency: string;
  notes: string | null;
  paid_at: string | null;
  refunded_at: string | null;
  refund_reason: string | null;
  created_at: string;
  updated_at: string;
};

export type DbOrderItem = {
  id: string;
  order_id: string;
  course_id: string;
  course_title: string;
  course_thumbnail: string | null;
  price: number;
  instructor_id: string | null;
  platform_commission: number;
  instructor_earnings: number;
  created_at: string;
};

export type DbInstructorEarning = {
  id: string;
  instructor_id: string;
  order_id: string | null;
  order_item_id: string | null;
  course_id: string | null;
  amount: number;
  platform_fee: number;
  status: 'pending' | 'available' | 'withdrawn';
  created_at: string;
};

export type DbWithdrawalRequest = {
  id: string;
  instructor_id: string;
  amount: number;
  method: 'easypaisa' | 'jazzcash' | 'bank_transfer' | 'paypal' | 'nayapay' | 'sadapay';
  method_details: Record<string, unknown>;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  admin_notes: string | null;
  processed_at: string | null;
  processed_by: string | null;
  created_at: string;
  updated_at: string;
};

export type DbTestimonial = {
  id: string;
  name: string;
  role: string | null;
  content: string;
  avatar_url: string | null;
  rating: number;
  featured: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type DbFaq = {
  id: string;
  question: string;
  answer: string;
  category: string;
  sort_order: number;
  published: boolean;
  created_at: string;
  updated_at: string;
};

export type DbBanner = {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string | null;
  link_url: string | null;
  button_text: string | null;
  position: string;
  active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type DbHeroSection = {
  id: number;
  badge: string;
  title: string;
  subtitle: string;
  primary_button_text: string;
  primary_button_link: string;
  secondary_button_text: string;
  secondary_button_link: string;
  image_url: string | null;
  updated_at: string;
};

// ===== Smart Virtual Classroom Phase 1 =====

export type DbTeacher = {
  id: string;
  name: string;
  display_name: string;
  profile_photo: string | null;
  gender: 'male' | 'female' | null;
  voice_provider: string | null;
  voice_id: string | null;
  teaching_style: 'friendly' | 'professional' | 'casual' | 'academic' | null;
  languages: string[];
  bio: string | null;
  experience: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type DbBatch = {
  id: string;
  batch_name: string;
  course_id: string | null;
  teacher_id: string | null;
  start_date: string;
  end_date: string | null;
  class_days: string[];
  class_time: string;
  class_duration_minutes: number;
  max_students: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type DbBatchStudent = {
  id: string;
  batch_id: string;
  user_id: string;
  enrolled_at: string;
};

export type DbBatchSchedule = {
  id: string;
  batch_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  topic: string | null;
  created_at: string;
};

export type DbTeacherAssignment = {
  id: string;
  teacher_id: string;
  batch_id: string;
  assigned_at: string;
};

export type DbApiProvider = {
  id: string;
  provider_name: 'gemini' | 'openrouter' | 'openai' | 'groq' | 'claude';
  display_name: string;
  base_url: string | null;
  is_default: boolean;
  priority: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type DbApiKey = {
  id: string;
  provider_id: string;
  key_name: string;
  secret_name: string;
  priority: number;
  is_active: boolean;
  daily_limit: number | null;
  usage_count: number;
  last_used_at: string | null;
  last_error: string | null;
  status: 'active' | 'rate_limited' | 'error' | 'disabled';
  created_at: string;
  updated_at: string;
};
