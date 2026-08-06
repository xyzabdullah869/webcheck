export type CourseLevel = 'Beginner' | 'Intermediate' | 'Advanced';
export type CourseStatus = 'Published' | 'Draft' | 'Archived' | 'Pending Review';

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  coursesCount: number;
  image: string;
};

export type Instructor = {
  id: string;
  name: string;
  title: string;
  bio: string;
  avatar: string;
  rating: number;
  students: number;
  courses: number;
  skills: string[];
  social: { twitter?: string; linkedin?: string; github?: string; website?: string };
};

export type Course = {
  id: string;
  title: string;
  slug: string;
  description: string;
  shortDescription?: string;
  whatYouWillLearn?: string[];
  requirements?: string[];
  thumbnail: string;
  trailerUrl?: string;
  category: string;
  categoryId: string;
  instructorId: string;
  instructorName: string;
  instructorAvatar: string;
  duration: string;
  lessons: number;
  level: CourseLevel;
  language?: string;
  rating: number;
  reviews: number;
  students: number;
  price: number;
  pricePkr?: number;
  originalPrice?: number;
  tags: string[];
  bestseller?: boolean;
  isNew?: boolean;
  featured?: boolean;
  certificateEnabled?: boolean;
  status?: CourseStatus;
};

export type Lesson = {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  videoType: 'mp4' | 'youtube' | 'vimeo';
  duration: string;
  durationSeconds: number;
  preview: boolean;
  completed?: boolean;
  resources: { name: string; type: string; size: string }[];
  hasQuiz?: boolean;
  hasAssignment?: boolean;
};

export type Module = {
  id: string;
  courseId: string;
  title: string;
  description: string;
  lessons: Lesson[];
};

export type QuizQuestion = {
  id: string;
  question: string;
  type: 'single' | 'multiple';
  options: { id: string; text: string; correct: boolean }[];
  explanation: string;
};

export type Quiz = {
  id: string;
  title: string;
  description: string;
  passingScore: number;
  timeLimit: number;
  questions: QuizQuestion[];
};

export type Assignment = {
  id: string;
  courseId: string;
  courseName: string;
  title: string;
  description: string;
  dueDate: string;
  maxScore: number;
  allowedTypes: string[];
  submissionStatus: 'Pending' | 'Submitted' | 'Reviewed' | 'Approved';
  submittedDate?: string;
  grade?: number;
  feedback?: string;
};

export type Certificate = {
  id: string;
  certificateId: string;
  courseName: string;
  courseId: string;
  issueDate: string;
  score: number;
  verificationUrl: string;
};

export type Notification = {
  id: string;
  type: 'assignment' | 'quiz' | 'course' | 'announcement' | 'system';
  title: string;
  message: string;
  time: string;
  read: boolean;
};

export type Review = {
  id: string;
  courseId: string;
  studentName: string;
  studentAvatar: string;
  rating: number;
  comment: string;
  date: string;
};

export type Testimonial = {
  id: string;
  name: string;
  role: string;
  avatar: string;
  rating: number;
  text: string;
};

export type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  cover: string;
  author: string;
  authorAvatar: string;
  date: string;
  readTime: string;
  category: string;
};

export type PricingPlan = {
  id: string;
  name: string;
  price: number;
  period: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  cta: string;
};

export type FaqItem = {
  id: string;
  question: string;
  answer: string;
};

export type Stat = {
  id: string;
  label: string;
  value: number;
  suffix: string;
  icon: string;
};

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'Student' | 'Instructor' | 'Admin';
  joined: string;
  status: 'Active' | 'Pending' | 'Suspended';
};

export type StudentProfile = {
  name: string;
  email: string;
  avatar: string;
  bio: string;
  location: string;
  joinedDate: string;
  plan: string;
  totalCourses: number;
  completedCourses: number;
  certificates: number;
  learningHours: number;
};
