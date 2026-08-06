import type {
  Module,
  Quiz,
  Assignment,
  Certificate,
  Notification,
  Review,
  StudentProfile,
} from './types';

// Course modules — kept as sample structure for the video learning page
// Real data will come from the backend
export const courseModules: Module[] = [];

export const sampleQuiz: Quiz = {
  id: 'q1',
  title: 'FASTA & FASTQ Formats Quiz',
  description: 'Test your knowledge of common bioinformatics file formats.',
  passingScore: 70,
  timeLimit: 600,
  questions: [
    {
      id: 'qq1',
      question: 'Which file format is commonly used to store nucleotide or protein sequences?',
      type: 'single',
      options: [
        { id: 'a', text: 'FASTA', correct: true },
        { id: 'b', text: 'BAM', correct: false },
        { id: 'c', text: 'VCF', correct: false },
        { id: 'd', text: 'GFF', correct: false },
      ],
      explanation: 'FASTA format stores raw nucleotide or protein sequences with a header line starting with >.',
    },
    {
      id: 'qq2',
      question: 'What does the quality score in a FASTQ file represent?',
      type: 'single',
      options: [
        { id: 'a', text: 'Sequence length', correct: false },
        { id: 'b', text: 'Phred quality score per base', correct: true },
        { id: 'c', text: 'GC content', correct: false },
        { id: 'd', text: 'Alignment position', correct: false },
      ],
      explanation: 'FASTQ files contain Phred quality scores encoded as ASCII characters for each base call.',
    },
    {
      id: 'qq3',
      question: 'Which of the following are valid FASTA header indicators? (Select all that apply)',
      type: 'multiple',
      options: [
        { id: 'a', text: 'Lines starting with > for nucleotide sequences', correct: true },
        { id: 'b', text: 'Lines starting with ; for comments', correct: true },
        { id: 'c', text: 'Lines starting with @ for quality', correct: false },
        { id: 'd', text: 'Lines starting with # for metadata', correct: false },
      ],
      explanation: 'FASTA uses > for sequence headers and ; for optional comments. @ and # are not FASTA indicators.',
    },
    {
      id: 'qq4',
      question: 'In a FASTQ file, how many lines represent a single sequence record?',
      type: 'single',
      options: [
        { id: 'a', text: '2', correct: false },
        { id: 'b', text: '4', correct: true },
        { id: 'c', text: '6', correct: false },
        { id: 'd', text: '8', correct: false },
      ],
      explanation: 'A FASTQ record has 4 lines: sequence header, sequence, quality header, and quality scores.',
    },
    {
      id: 'qq5',
      question: 'Which tool is commonly used to convert between FASTQ and FASTA formats?',
      type: 'single',
      options: [
        { id: 'a', text: 'BLAST', correct: false },
        { id: 'b', text: 'seqtk', correct: true },
        { id: 'c', text: 'GATK', correct: false },
        { id: 'd', text: 'BWA', correct: false },
      ],
      explanation: 'seqtk is a fast toolkit for processing FASTA/FASTQ files and format conversion.',
    },
  ],
};

export const quizResults: {
  id: string;
  quiz: string;
  course: string;
  score: number;
  passed: boolean;
  date: string;
}[] = [];

export const studentAssignments: Assignment[] = [];

export const studentCertificates: Certificate[] = [];

export const studentNotifications: Notification[] = [];

export const courseReviews: Review[] = [];

export const recentlyWatched: {
  id: string;
  title: string;
  course: string;
  progress: number;
  time: string;
  thumbnail: string;
}[] = [];

export const bookmarkedCourses: {
  id: string;
  courseId: string;
  title: string;
  instructor: string;
  thumbnail: string;
  category: string;
}[] = [];

export const studentProfile: StudentProfile = {
  name: '',
  email: '',
  avatar: '',
  bio: '',
  location: '',
  joinedDate: '',
  plan: 'Free',
  totalCourses: 0,
  completedCourses: 0,
  certificates: 0,
  learningHours: 0,
};

export const popularCoursesAdmin: {
  id: string;
  title: string;
  students: number;
  revenue: number;
  growth: string;
}[] = [];

export const activeStudentsAdmin: {
  id: string;
  name: string;
  avatar: string;
  hours: number;
  courses: number;
  lastActive: string;
}[] = [];

export const adminAnnouncements: {
  id: string;
  title: string;
  body: string;
  date: string;
  status: string;
  audience: string;
}[] = [];

export const pendingReviews: {
  id: string;
  course: string;
  student: string;
  avatar: string;
  rating: number;
  comment: string;
  date: string;
  flagged: boolean;
}[] = [];
