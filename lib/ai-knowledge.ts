import type { WebsiteSettings } from '@/lib/services/site-settings-service';

export type AiTopic = {
  id: string;
  name: string;
  keywords: string[];
  prompt: string;
};

export const aiTopics: AiTopic[] = [
  {
    id: 'bioinformatics',
    name: 'Bioinformatics',
    keywords: ['bioinformatics', 'computational biology', 'biological data'],
    prompt: 'I can help you with bioinformatics concepts, tools, and workflows. What specific area interests you?',
  },
  {
    id: 'molecular-biology',
    name: 'Molecular Biology',
    keywords: ['molecular biology', 'dna', 'rna', 'protein', 'gene expression', 'transcription', 'translation'],
    prompt: 'Molecular biology is fundamental to bioinformatics. What concept would you like to explore?',
  },
  {
    id: 'genetics',
    name: 'Genetics',
    keywords: ['genetics', 'inheritance', 'mutation', 'genotype', 'phenotype', 'allele'],
    prompt: 'Genetics underpins much of bioinformatics. What would you like to learn about?',
  },
  {
    id: 'genomics',
    name: 'Genomics',
    keywords: ['genomics', 'genome', 'whole genome', 'sequencing', 'assembly'],
    prompt: 'Genomics involves studying entire genomes. What aspect would you like to dive into?',
  },
  {
    id: 'proteomics',
    name: 'Proteomics',
    keywords: ['proteomics', 'protein structure', 'protein function', 'mass spectrometry'],
    prompt: 'Proteomics is the large-scale study of proteins. What would you like to know?',
  },
  {
    id: 'ngs',
    name: 'NGS',
    keywords: ['ngs', 'next generation sequencing', 'illumina', 'reads', 'fastq', 'quality control'],
    prompt: 'NGS (Next-Generation Sequencing) is a core skill. What would you like to explore?',
  },
  {
    id: 'sequence-alignment',
    name: 'Sequence Alignment',
    keywords: ['sequence alignment', 'pairwise alignment', 'multiple alignment', 'needleman-wunsch', 'smith-waterman'],
    prompt: 'Sequence alignment is fundamental. What specific technique do you want to understand?',
  },
  {
    id: 'blast',
    name: 'BLAST',
    keywords: ['blast', 'blastn', 'blastp', 'blastx', 'e-value', 'similarity search'],
    prompt: 'BLAST is essential for sequence similarity searching. What would you like to learn?',
  },
  {
    id: 'phylogenetics',
    name: 'Phylogenetics',
    keywords: ['phylogenetics', 'phylogenetic tree', 'evolution', 'cladistics', 'tree construction'],
    prompt: 'Phylogenetics studies evolutionary relationships. What would you like to explore?',
  },
  {
    id: 'python',
    name: 'Python',
    keywords: ['python', 'biopython', 'pandas', 'numpy', 'scripting'],
    prompt: 'Python is the go-to language for bioinformatics. What would you like to learn?',
  },
  {
    id: 'r-programming',
    name: 'R Programming',
    keywords: ['r', 'r programming', 'bioconductor', 'ggplot', 'rstudio', 'tidyverse'],
    prompt: 'R is widely used for statistical analysis in bioinformatics. What can I help with?',
  },
  {
    id: 'databases',
    name: 'Databases',
    keywords: ['database', 'ncbi', 'genbank', 'uniprot', 'ensembl', 'sql'],
    prompt: 'Biological databases are crucial resources. Which database or concept interests you?',
  },
  {
    id: 'linux',
    name: 'Linux Commands',
    keywords: ['linux', 'command line', 'bash', 'terminal', 'shell', 'grep', 'awk'],
    prompt: 'Linux command-line skills are essential for bioinformatics pipelines. What would you like to learn?',
  },
  {
    id: 'roadmaps',
    name: 'Learning Roadmaps',
    keywords: ['roadmap', 'learning path', 'career', 'where to start', 'study plan'],
    prompt: 'I can create a personalized learning roadmap based on your goals. What field are you targeting?',
  },
  {
    id: 'assignment-guidance',
    name: 'Assignment Guidance',
    keywords: ['assignment', 'homework', 'project', 'task'],
    prompt: 'I can guide you through your assignment step by step. What is the assignment about?',
  },
  {
    id: 'quiz-prep',
    name: 'Quiz Preparation',
    keywords: ['quiz', 'test', 'exam', 'preparation', 'review'],
    prompt: 'I can help you prepare for quizzes by explaining concepts and giving practice questions. What topic is your quiz on?',
  },
  {
    id: 'website-navigation',
    name: 'Website Navigation',
    keywords: ['course', 'courses', 'category', 'categories', 'dashboard', 'wallet', 'referral', 'certificate', 'pricing', 'contact', 'about', 'faq', 'instructor', 'login', 'register', 'settings', 'admin', 'blog', 'navigate', 'find', 'where', 'how do i', 'page'],
    prompt: 'I can help you navigate the platform. What are you looking for?',
  },
];

export const aiSystemPrompt = `You are BioHub AI, a knowledgeable and encouraging bioinformatics tutor and website assistant integrated into the Bioinformatics Hub learning platform.

Your role is to HELP STUDENTS LEARN and NAVIGATE THE PLATFORM. Follow these principles:

1. GUIDE, DON'T SOLVE: When a student asks about a quiz or exam question, explain the underlying concept and help them reason through it themselves. Never provide direct answers to test questions.

2. BE DOMAIN-AWARE: You specialize in bioinformatics, molecular biology, genetics, genomics, proteomics, NGS, sequence alignment, BLAST, phylogenetics, Python, R, databases, Linux, AND platform features (courses, wallet, referrals, certificates, dashboard).

3. BE PRACTICAL: Provide code snippets, command examples, and tool recommendations when relevant.

4. BE ENCOURAGING: Support students at all levels. Break complex topics into manageable steps.

5. SUGGEST RESOURCES: Point students to relevant courses, tools, and documentation when appropriate.

6. HELP NAVIGATE: Guide users to the right pages on the platform (courses, dashboard, wallet, referrals, etc.).

7. BE CONCISE: Give clear, focused answers. Use formatting (bullet points, code blocks) when it improves clarity.`;

export const aiSuggestedPrompts = [
  'Explain how BLAST works',
  'How do I parse a FASTA file in Python?',
  'What is the difference between FASTA and FASTQ?',
  'Help me understand phylogenetic trees',
  'Create a learning roadmap for NGS analysis',
  'What Linux commands do I need for bioinformatics?',
  'What courses are available?',
  'How does the referral system work?',
];

export function detectTopics(message: string): string[] {
  const lower = message.toLowerCase();
  const matched: string[] = [];
  for (const topic of aiTopics) {
    if (topic.keywords.some((kw) => lower.includes(kw))) {
      matched.push(topic.id);
    }
  }
  return matched.length > 0 ? matched : ['general'];
}

// --- Course info type (fetched dynamically) ---
export type CourseInfo = {
  id: string;
  title: string;
  slug: string;
  short_description: string | null;
  level: string;
  price: number | null;
  duration: string | null;
  instructor_name: string | null;
  category_name: string | null;
  students_count: number;
  rating: number;
  tags: string[];
};

export type AiContext = {
  settings: WebsiteSettings | null;
  courses: CourseInfo[];
  categories: { id: string; name: string; slug: string; description: string | null }[];
};

// --- Dynamic website info response ---
function buildWebsiteInfoResponse(message: string, settings: WebsiteSettings | null): string | null {
  if (!settings) return null;
  const lower = message.toLowerCase();

  if (lower.includes('owner') || lower.includes('who created') || lower.includes('who made') || lower.includes('founder')) {
    return `**About the Owner**\n\nThis platform is owned by **${settings.ownerName ?? 'the administrator'}**${settings.ownerDesignation ? `, ${settings.ownerDesignation}` : ''}.`;
  }

  if (lower.includes('support email') || (lower.includes('email') && lower.includes('support'))) {
    return `**Support Email**\n\nYou can reach support at: **${settings.supportEmail ?? settings.contactEmail ?? '—'}**`;
  }

  if (lower.includes('phone') || lower.includes('call') || lower.includes('contact number')) {
    return `**Contact Number**\n\nPhone: **${settings.contactNumber ?? '—'}**`;
  }

  if (lower.includes('whatsapp')) {
    return `**WhatsApp**\n\nWhatsApp: **${settings.whatsappNumber ?? '—'}**`;
  }

  if (lower.includes('office') || lower.includes('address') || lower.includes('where is') || lower.includes('location')) {
    return `**Office Location**\n\n${settings.officeAddress ?? '—'}${settings.googleMapsLocation ? `\n\n[View on Google Maps](${settings.googleMapsLocation})` : ''}`;
  }

  if (lower.includes('working hour') || lower.includes('support hour') || lower.includes('open') || lower.includes('hours')) {
    return `**Working Hours**\n\n${settings.workingHours ?? '—'}\n\n**Support Hours**\n\n${settings.supportHours ?? '—'}`;
  }

  if (lower.includes('contact') || lower.includes('reach') || lower.includes('get in touch')) {
    let response = `**Contact Information**\n\n`;
    if (settings.contactEmail) response += `- Email: ${settings.contactEmail}\n`;
    if (settings.supportEmail) response += `- Support: ${settings.supportEmail}\n`;
    if (settings.contactNumber) response += `- Phone: ${settings.contactNumber}\n`;
    if (settings.whatsappNumber) response += `- WhatsApp: ${settings.whatsappNumber}\n`;
    if (settings.officeAddress) response += `- Address: ${settings.officeAddress}\n`;
    if (settings.workingHours) response += `- Hours: ${settings.workingHours}\n`;
    return response || 'Contact information is not available yet. Please check back later.';
  }

  if (lower.includes('social') || lower.includes('facebook') || lower.includes('instagram') || lower.includes('linkedin') || lower.includes('youtube') || lower.includes('twitter') || lower.includes('github')) {
    let response = `**Social Media**\n\n`;
    if (settings.facebookUrl) response += `- Facebook: ${settings.facebookUrl}\n`;
    if (settings.instagramUrl) response += `- Instagram: ${settings.instagramUrl}\n`;
    if (settings.linkedinUrl) response += `- LinkedIn: ${settings.linkedinUrl}\n`;
    if (settings.youtubeUrl) response += `- YouTube: ${settings.youtubeUrl}\n`;
    if (settings.twitterUrl) response += `- Twitter/X: ${settings.twitterUrl}\n`;
    if (settings.githubUrl) response += `- GitHub: ${settings.githubUrl}\n`;
    return response || 'Social media links are not configured yet.';
  }

  return null;
}

// --- Course recommendation ---
function buildCourseResponse(message: string, courses: CourseInfo[]): string | null {
  const lower = message.toLowerCase();

  if (lower.includes('course') && (lower.includes('available') || lower.includes('list') || lower.includes('show') || lower.includes('what'))) {
    if (courses.length === 0) return 'There are no published courses available yet. Please check back soon!';
    const courseList = courses.slice(0, 8).map((c) =>
      `- **${c.title}** (${c.level}) — ${c.short_description ?? 'No description available'}\n  Price: $${c.price ?? 0} | Duration: ${c.duration ?? '—'} | Students: ${c.students_count}`
    ).join('\n\n');
    return `**Available Courses**\n\nHere are some courses you can explore:\n\n${courseList}\n\nVisit the [Courses page](/courses) to browse all courses.`;
  }

  if (lower.includes('recommend') || lower.includes('suggest') || lower.includes('which course') || lower.includes('best course') || lower.includes('suitable')) {
    if (courses.length === 0) return 'No courses are available yet for me to recommend. Please check back soon!';
    const beginner = courses.filter((c) => c.level === 'Beginner');
    const intermediate = courses.filter((c) => c.level === 'Intermediate');
    const advanced = courses.filter((c) => c.level === 'Advanced');

    let response = `**Course Recommendations**\n\nBased on your interests, here are my recommendations:\n\n`;
    if (beginner.length > 0) {
      response += `**For Beginners:**\n${beginner.slice(0, 3).map((c) => `- ${c.title} — ${c.short_description ?? ''}`).join('\n')}\n\n`;
    }
    if (intermediate.length > 0) {
      response += `**For Intermediate:**\n${intermediate.slice(0, 3).map((c) => `- ${c.title} — ${c.short_description ?? ''}`).join('\n')}\n\n`;
    }
    if (advanced.length > 0) {
      response += `**For Advanced:**\n${advanced.slice(0, 3).map((c) => `- ${c.title} — ${c.short_description ?? ''}`).join('\n')}\n\n`;
    }
    response += `Visit the [Courses page](/courses) to browse all available courses.`;
    return response;
  }

  return null;
}

// --- Website navigation ---
function buildNavigationResponse(message: string): string | null {
  const lower = message.toLowerCase();

  const navMap: { keywords: string[]; response: string }[] = [
    { keywords: ['dashboard', 'my course', 'my learning'], response: 'You can access your **[Dashboard](/dashboard)** to view your courses, progress, and learning activity.' },
    { keywords: ['wallet', 'balance', 'transaction'], response: 'Visit your **[Wallet](/wallet)** to check your balance, referral earnings, and transaction history.' },
    { keywords: ['referral', 'refer', 'refer & earn', 'invite'], response: 'Go to the **[Referral Program](/referrals)** to get your referral code, share it with friends, and earn rewards.' },
    { keywords: ['certificate', 'certification'], response: 'Certificates are issued when you complete a course. You can view them in your **[Dashboard](/dashboard)**.' },
    { keywords: ['pricing', 'price', 'plan', 'subscription'], response: 'Check our **[Pricing page](/pricing)** for available plans and course pricing.' },
    { keywords: ['instructor', 'teacher'], response: 'Browse our **[Instructors page](/instructors)** to learn about our teaching team.' },
    { keywords: ['category', 'categories'], response: 'Explore course **[Categories](/categories)** to find courses by topic.' },
    { keywords: ['about', 'about us'], response: 'Learn more about us on the **[About page](/about)**.' },
    { keywords: ['contact', 'reach', 'support'], response: 'You can reach us through the **[Contact page](/contact)** for any questions or assistance.' },
    { keywords: ['faq', 'question'], response: 'Check our **[FAQ page](/faq)** for answers to common questions.' },
    { keywords: ['login', 'sign in'], response: 'You can sign in on the **[Login page](/login)**.' },
    { keywords: ['register', 'sign up', 'create account'], response: 'Create a free account on the **[Register page](/register)**.' },
    { keywords: ['settings', 'profile'], response: 'Manage your account in **[Settings](/settings)**.' },
    { keywords: ['admin'], response: 'The Admin Panel is available at **[/admin](/admin)** for administrators.' },
    { keywords: ['blog'], response: 'Read our latest articles on the **[Blog page](/blog)**.' },
  ];

  for (const nav of navMap) {
    if (nav.keywords.some((kw) => lower.includes(kw))) {
      return nav.response;
    }
  }

  return null;
}

export function generateAiResponse(message: string, context?: AiContext): string {
  const lower = message.toLowerCase();

  // 1. Check dynamic website info first
  if (context?.settings) {
    const websiteResponse = buildWebsiteInfoResponse(message, context.settings);
    if (websiteResponse) return websiteResponse;
  }

  // 2. Check course queries
  if (context?.courses && context.courses.length > 0) {
    const courseResponse = buildCourseResponse(message, context.courses);
    if (courseResponse) return courseResponse;
  }

  // 3. Check navigation
  const navResponse = buildNavigationResponse(message);
  if (navResponse) return navResponse;

  // 4. Bioinformatics topic responses (existing)
  if (lower.includes('blast') && lower.includes('how')) {
    return `**How BLAST Works**

BLAST (Basic Local Alignment Search Tool) finds regions of local similarity between sequences. Here's how it works:

1. **Seeding**: BLAST breaks your query sequence into short "words" (typically 3 amino acids for proteins, 11 nucleotides for DNA).

2. **Scanning**: It scans the database for exact or near-exact matches to these words.

3. **Extension**: When a word match is found, BLAST extends the alignment in both directions to find a longer match with a good score.

4. **Scoring**: Each alignment gets a score based on match/mismatch penalties and gap penalties. The **E-value** tells you how many matches of this quality you'd expect by chance — lower is better (E < 0.05 is typically significant).

5. **Output**: Results are ranked by score, showing aligned sequences, percent identity, and E-values.

**Common BLAST variants:**
- \`blastn\` — nucleotide query vs nucleotide database
- \`blastp\` — protein query vs protein database
- \`blastx\` — translated nucleotide query vs protein database
- \`tblastn\` — protein query vs translated nucleotide database

Would you like me to explain E-values in more detail, or help you run a BLAST search?`;
  }

  if ((lower.includes('fasta') || lower.includes('fastq')) && (lower.includes('python') || lower.includes('parse') || lower.includes('read'))) {
    return `**Parsing FASTA/FASTQ Files in Python**

Using BioPython, you can easily parse sequence files:

\`\`\`python
from Bio import SeqIO

# Parse a FASTA file
for record in SeqIO.parse("sequences.fasta", "fasta"):
    print(f"ID: {record.id}")
    print(f"Description: {record.description}")
    print(f"Sequence length: {len(record.seq)}")
    print(f"Sequence: {record.seq[:50]}...")

# Parse a FASTQ file (includes quality scores)
for record in SeqIO.parse("reads.fastq", "fastq"):
    print(f"ID: {record.id}")
    print(f"Length: {len(record.seq)}")
    print(f"Quality scores: {record.letter_annotations['phred_quality'][:10]}")
\`\`\`

**Key differences:**
- **FASTA**: Just sequence + header (starts with \`>\`)
- **FASTQ**: Sequence + quality scores per base (4 lines per record, header starts with \`@\`)

Without BioPython, you can parse FASTA manually:
\`\`\`python
def parse_fasta(filepath):
    sequences = {}
    current_id = None
    with open(filepath) as f:
        for line in f:
            line = line.strip()
            if line.startswith('>'):
                current_id = line[1:].split()[0]
                sequences[current_id] = ''
            elif current_id:
                sequences[current_id] += line
    return sequences
\`\`\`

Would you like to learn about quality filtering or format conversion next?`;
  }

  if (lower.includes('fasta') && lower.includes('fastq') && lower.includes('difference')) {
    return `**FASTA vs FASTQ — Key Differences**

| Feature | FASTA | FASTQ |
|---------|-------|-------|
| Purpose | Store reference sequences | Store sequencing reads + quality |
| Lines per record | 2 | 4 |
| Header character | \`>\` | \`@\` |
| Quality scores | No | Yes (Phred scores) |
| Typical use | Reference genomes, protein sequences | Raw NGS reads from sequencers |

**FASTA format:**
\`\`\`
>sequence_1 description here
ATCGATCGATCGATCG
\`\`\`

**FASTQ format:**
\`\`\`
@read_1 instrument info
ATCGATCGATCGATCG
+read_1
FFFFFFFFFFFFFGGG
\`\`\`

The 3rd line is a separator (+), and the 4th line encodes Phred quality scores as ASCII characters. Each character corresponds to a base in the sequence line.

**Converting FASTQ to FASTA** is common after quality trimming:
\`\`\`bash
seqtk seq -a reads.fastq > reads.fasta
\`\`\`

Want to dive deeper into quality score encoding or file format conversion?`;
  }

  if (lower.includes('phylogenetic') || lower.includes('phylogenetics')) {
    return `**Understanding Phylogenetic Trees**

A phylogenetic tree represents the evolutionary relationships among organisms or sequences.

**Key concepts:**

1. **Nodes**: Points where lineages diverge. Internal nodes represent common ancestors.

2. **Branches**: Lines connecting nodes. Branch length often represents evolutionary distance (substitutions per site).

3. **Root**: The common ancestor of all sequences in the tree. Not all trees are rooted.

4. **Leaves (tips)**: The existing sequences/species being compared.

**Tree construction methods:**
- **Distance-based**: UPGMA, Neighbor-Joining — fast, uses pairwise distances
- **Character-based**: Maximum Parsimony, Maximum Likelihood, Bayesian — more accurate, computationally intensive

**Common tools:**
- \`MEGA\` — GUI-based, great for beginners
- \`RAxML\` — fast Maximum Likelihood
- \`IQ-TREE\` — modern, efficient ML with model selection
- \`FastTree\` — very fast for large datasets

**Typical workflow:**
1. Align sequences (MAFFT, MUSCLE)
2. Choose substitution model (ModelTest, jModelTest)
3. Build tree (RAxML, IQ-TREE)
4. Assess support (bootstrap analysis)
5. Visualize (FigTree, ggtree in R)

Would you like to explore a specific method, or shall I walk you through a practical example?`;
  }

  if (lower.includes('roadmap') && (lower.includes('ngs') || lower.includes('next generation'))) {
    return `**Learning Roadmap for NGS Analysis**

Here's a structured path from beginner to proficient:

**Phase 1: Foundations (2-4 weeks)**
- Molecular biology basics (DNA, RNA, transcription, translation)
- File formats: FASTA, FASTQ, BAM, VCF, GFF/GTF
- Linux command line basics (navigation, file manipulation, pipes)
- Install tools: FastQC, Trimmomatic, BWA, Samtools

**Phase 2: NGS Basics (3-5 weeks)**
- Understand sequencing platforms (Illumina, Oxford Nanopore, PacBio)
- Quality control with FastQC and MultiQC
- Read trimming and filtering
- Sequence alignment (BWA-MEM, Bowtie2)
- SAM/BAM file manipulation with Samtools

**Phase 3: Variant Analysis (3-4 weeks)**
- Variant calling (GATK, FreeBayes, bcftools)
- VCF file format and annotation (SnpEff, VEP)
- Structural variants (Delly, Manta)
- Variant interpretation and filtering

**Phase 4: RNA-Seq Analysis (3-4 weeks)**
- Read alignment for RNA-Seq (HISAT2, STAR)
- Quantification (featureCounts, HTSeq, Salmon)
- Differential expression (DESeq2, edgeR in R)
- Visualization (ggplot2, pheatmap)

**Phase 5: Advanced (ongoing)**
- ChIP-Seq, ATAC-Seq, methylation analysis
- Metagenomics
- Pipeline automation (Snakemake, Nextflow)
- Cloud computing for large datasets

**Recommended courses on this platform:**
Check the Bioinformatics and Data Science categories for hands-on courses!

Would you like me to adjust this roadmap based on your current skill level?`;
  }

  if (lower.includes('linux') && (lower.includes('command') || lower.includes('need') || lower.includes('learn'))) {
    return `**Essential Linux Commands for Bioinformatics**

Here are the commands you'll use most frequently:

**File Navigation:**
\`\`\`bash
ls -la          # List all files with details
cd ~/data       # Change directory
pwd             # Print working directory
find . -name "*.fastq"  # Find files by pattern
\`\`\`

**File Viewing & Searching:**
\`\`\`bash
head -20 file.fastq     # View first 20 lines
less -S file.fasta      # View large files interactively
grep ">gene" file.fasta # Search for patterns
wc -l file.fastq        # Count lines (divide by 4 for read count)
\`\`\`

**Text Processing (very useful for bioinformatics):**
\`\`\`bash
awk 'NR%4==2' reads.fastq | wc -c   # Count total bases
sed 's/ATCG/atcg/g' file.txt         # Substitute text
cut -f1,2 data.txt                   # Extract columns
sort -k2 -n file.txt | uniq -c       # Sort and count unique
\`\`\`

**File Operations:**
\`\`\`bash
tar -xzf archive.tar.gz     # Extract archive
gzip file.txt               # Compress
zcat file.txt.gz            # View compressed file
rsync -av src/ dest/        # Sync directories
\`\`\`

**Process Management:**
\`\`\`bash
nohup bwa mem ref.fa reads.fq > out.sam &  # Run in background
top                  # Monitor processes
kill -9 PID          # Kill a process
\`\`\`

**Pro tip**: Learn \`grep\`, \`awk\`, \`sed\`, and \`sort\` well — they replace many small scripts!

Want a deeper dive into any specific command or a practical exercise?`;
  }

  if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
    return `Hello! I'm BioHub AI, your bioinformatics learning assistant and platform guide. I can help you with:

**Bioinformatics Topics:**
- Molecular Biology, Genetics, Genomics, Proteomics
- NGS, Sequence Alignment, BLAST, Phylogenetics
- Python, R Programming, Linux, Databases

**Platform Features:**
- Course recommendations and browsing
- Dashboard, Wallet, Referral System
- Certificates, Quizzes, Assignments
- Navigation and account help

What would you like to learn about today?`;
  }

  if (lower.includes('thank')) {
    return `You're welcome! Keep learning and don't hesitate to ask if you need help with any bioinformatics topic or platform feature. You've got this!`;
  }

  return `That's a great question! Let me help you understand this.

Based on what you've asked, here are some key points to consider:

1. **Break down the problem**: Start by identifying what you already know and what you need to figure out.

2. **Identify the relevant concepts**: Think about which bioinformatics tools or methods apply to this situation.

3. **Consider practical approaches**: What tools (Python, R, command-line) could you use to solve this?

4. **Think about what data you need**: What input files or databases would be relevant?

Could you share a bit more detail about what specific aspect you'd like to explore? For example:
- Are you working with a particular type of data (DNA, protein, RNA-Seq)?
- Do you need help with a concept, a tool, or writing code?
- Is this for an assignment, quiz prep, or general learning?

I'm here to guide you step by step!`;
}
