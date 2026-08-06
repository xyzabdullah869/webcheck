import type {
  Category,
  Course,
  Instructor,
  Testimonial,
  BlogPost,
  PricingPlan,
  FaqItem,
  Stat,
} from './types';

export const categories: Category[] = [
  {
    id: '1',
    name: 'Bioinformatics',
    slug: 'bioinformatics',
    description: 'Genomics, sequence analysis, and computational biology.',
    icon: 'Dna',
    color: 'from-blue-500 to-cyan-500',
    coursesCount: 0,
    image:
      'https://images.pexels.com/photos/8442543/pexels-photo-8442543.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  },
  {
    id: '2',
    name: 'Biotechnology',
    slug: 'biotechnology',
    description: 'Lab techniques, molecular biology, and bioprocessing.',
    icon: 'Microscope',
    color: 'from-emerald-500 to-teal-500',
    coursesCount: 0,
    image:
      'https://images.pexels.com/photos/8940471/pexels-photo-8940471.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  },
  {
    id: '3',
    name: 'Artificial Intelligence',
    slug: 'artificial-intelligence',
    description: 'Machine learning, deep learning, and neural networks.',
    icon: 'BrainCircuit',
    color: 'from-violet-500 to-purple-500',
    coursesCount: 0,
    image:
      'https://images.pexels.com/photos/177598/pexels-photo-177598.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  },
  {
    id: '4',
    name: 'Programming',
    slug: 'programming',
    description: 'Python, R, and software development for science.',
    icon: 'Code2',
    color: 'from-orange-500 to-amber-500',
    coursesCount: 0,
    image:
      'https://images.pexels.com/photos/1181271/pexels-photo-1181271.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  },
  {
    id: '5',
    name: 'Data Science',
    slug: 'data-science',
    description: 'Statistics, data visualization, and predictive modeling.',
    icon: 'BarChart3',
    color: 'from-sky-500 to-blue-500',
    coursesCount: 0,
    image:
      'https://images.pexels.com/photos/5475750/pexels-photo-5475750.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  },
  {
    id: '6',
    name: 'Digital Marketing',
    slug: 'digital-marketing',
    description: 'SEO, social media, and growth strategies.',
    icon: 'Megaphone',
    color: 'from-rose-500 to-pink-500',
    coursesCount: 0,
    image:
      'https://images.pexels.com/photos/1181298/pexels-photo-1181298.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  },
  {
    id: '7',
    name: 'Graphic Design',
    slug: 'graphic-design',
    description: 'Visual communication, branding, and UI design.',
    icon: 'Palette',
    color: 'from-fuchsia-500 to-pink-500',
    coursesCount: 0,
    image:
      'https://images.pexels.com/photos/270373/pexels-photo-270373.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  },
  {
    id: '8',
    name: 'Microsoft Office',
    slug: 'microsoft-office',
    description: 'Excel, PowerPoint, Word, and productivity mastery.',
    icon: 'FileSpreadsheet',
    color: 'from-blue-600 to-indigo-600',
    coursesCount: 0,
    image:
      'https://images.pexels.com/photos/574070/pexels-photo-574070.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  },
  {
    id: '9',
    name: 'English Language',
    slug: 'english-language',
    description: 'Academic, business, and scientific English skills.',
    icon: 'Languages',
    color: 'from-cyan-500 to-sky-500',
    coursesCount: 0,
    image:
      'https://images.pexels.com/photos/4260479/pexels-photo-4260479.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  },
];

// Instructors start empty — admin will add real instructors
export const instructors: Instructor[] = [];

export const courses: Course[] = [];

export const testimonials: Testimonial[] = [];

export const blogPosts: BlogPost[] = [];

export const pricingPlans: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    period: 'forever',
    description: 'Perfect for exploring the platform and getting started.',
    features: [
      'Access to 20+ introductory lessons',
      'Community forum access',
      'Basic progress tracking',
      'Mobile & web access',
      'Weekly newsletter',
    ],
    cta: 'Start Free',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 29,
    period: 'per month',
    description: 'For serious learners building real bioinformatics skills.',
    features: [
      'Unlimited access to all courses',
      'Verified certificates',
      'Hands-on projects & labs',
      'Progress analytics dashboard',
      'Priority community support',
      'Downloadable resources',
      'No ads',
    ],
    highlighted: true,
    cta: 'Start 7-Day Trial',
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 79,
    period: 'per month',
    description: 'Everything in Pro plus dedicated mentorship and teams.',
    features: [
      'Everything in Pro',
      '1-on-1 mentor sessions',
      'Career coaching & resume review',
      'Team workspace (up to 10)',
      'Early access to new courses',
      'Priority instructor Q&A',
      'Annual certification renewal',
    ],
    cta: 'Go Premium',
  },
];

export const faqs: FaqItem[] = [
  {
    id: '1',
    question: 'Do I need a biology background to start?',
    answer:
      'Not at all. We offer beginner-friendly courses that introduce both the biology and the programming you need, side by side. You can start from scratch and build up.',
  },
  {
    id: '2',
    question: 'Are the certificates recognized?',
    answer:
      'Yes. Our certificates verify the skills you completed and are shareable on LinkedIn and with employers. Premium plans include verified certificates with unique IDs.',
  },
  {
    id: '3',
    question: 'Can I learn at my own pace?',
    answer:
      'Absolutely. Every course is self-paced. You get lifetime access with Pro and Premium plans, so you can revisit lessons and materials whenever you need.',
  },
  {
    id: '4',
    question: 'What tools and languages will I learn?',
    answer:
      'You will work with Python, R, BioPython, Bioconductor, PyTorch, Snakemake, and industry-standard tools used daily in research and biotech labs.',
  },
  {
    id: '5',
    question: 'Is there a free trial?',
    answer:
      'Yes — the Pro plan includes a 7-day free trial with full access. You can cancel anytime before the trial ends and you will not be charged.',
  },
  {
    id: '6',
    question: 'Do you offer team or institutional plans?',
    answer:
      'We do. Premium plans include a team workspace for up to 10 members. For larger institutions, contact us and we will tailor a plan to your needs.',
  },
];

export const stats: Stat[] = [
  { id: 'students', label: 'Active Students', value: 0, suffix: '+', icon: 'Users' },
  { id: 'courses', label: 'Expert Courses', value: 0, suffix: '+', icon: 'BookOpen' },
  { id: 'certificates', label: 'Certificates Issued', value: 0, suffix: '+', icon: 'Award' },
  { id: 'countries', label: 'Countries Reached', value: 0, suffix: '', icon: 'Globe2' },
];

export const trustedBy: string[] = [];

// Student dashboard data — empty until backend integration
export const continueLearning: {
  id: string;
  title: string;
  instructor: string;
  progress: number;
  nextLesson: string;
  thumbnail: string;
  category: string;
}[] = [];

export const weeklyActivity: { day: string; hours: number }[] = [
  { day: 'Mon', hours: 0 },
  { day: 'Tue', hours: 0 },
  { day: 'Wed', hours: 0 },
  { day: 'Thu', hours: 0 },
  { day: 'Fri', hours: 0 },
  { day: 'Sat', hours: 0 },
  { day: 'Sun', hours: 0 },
];

export const skillProgress: { skill: string; value: number }[] = [];

export const recentActivity: {
  id: string;
  action: string;
  detail: string;
  time: string;
  icon: string;
}[] = [];

export const achievements: { id: string; title: string; icon: string; date: string }[] = [];

// Admin dashboard data — all empty/placeholder until backend integration
export const adminStats: {
  id: string;
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: string;
}[] = [
  { id: 'students', label: 'Total Students', value: '—', change: '—', trend: 'up', icon: 'Users' },
  { id: 'courses', label: 'Total Courses', value: '—', change: '—', trend: 'up', icon: 'BookOpen' },
  { id: 'revenue', label: 'Revenue (MTD)', value: '—', change: '—', trend: 'up', icon: 'DollarSign' },
  { id: 'active', label: 'Active Users', value: '—', change: '—', trend: 'up', icon: 'Activity' },
];

export const adminRevenueChart: { month: string; revenue: number; students: number }[] = [];

export const adminCategoryDistribution: { name: string; value: number; color: string }[] = [];

export const recentRegistrations: {
  id: string;
  name: string;
  email: string;
  avatar: string;
  plan: string;
  date: string;
}[] = [];

export const adminActivities: {
  id: string;
  action: string;
  detail: string;
  time: string;
  icon: string;
}[] = [];
