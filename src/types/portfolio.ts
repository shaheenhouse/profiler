export interface User {
  id: string;
  username: string;
  email: string;
  password: string; // hashed
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  phone?: string;
  whatsapp?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  image?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RegisterUserInput {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  phone?: string;
  whatsapp?: string;
  linkedinUrl?: string;
  githubUrl?: string;
}

export interface PersonalInfo {
  fullName: string;
  title: string;
  email: string;
  phone?: string;
  whatsapp?: string;
  location: string;
  bio: string;
  profileImage?: string;
  socialLinks: SocialLink[];
}

export interface SocialLink {
  id: string;
  platform: 'github' | 'linkedin' | 'twitter' | 'website' | 'behance' | 'dribbble' | 'youtube' | 'instagram' | 'other';
  url: string;
  label?: string;
}

export interface Education {
  id: string;
  degree: string;
  institution: string;
  field: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  gpa?: string;
  description?: string;
}

export interface Experience {
  id: string;
  title: string;
  company: string;
  location: string;
  locationType: 'onsite' | 'remote' | 'hybrid';
  startDate: string;
  endDate?: string;
  current: boolean;
  description: string;
  technologies: string[];
  responsibilities: string[];
}

export interface Skill {
  id: string;
  name: string;
  level: 'expert' | 'proficient' | 'intermediate' | 'beginner';
  category: string;
}

export interface Role {
  id: string;
  title: string;
  level: 'expert' | 'proficient' | 'intermediate' | 'beginner';
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  issueDate: string;
  expiryDate?: string;
  credentialId?: string;
  credentialUrl?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  url?: string;
  githubUrl?: string;
  imageUrl?: string;
  startDate: string;
  endDate?: string;
  technologies: string[];
  highlights: string[];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  date: string;
  issuer?: string;
}

export interface Language {
  id: string;
  name: string;
  proficiency: 'native' | 'fluent' | 'professional' | 'intermediate' | 'basic';
}

export interface Portfolio {
  id: string;
  userId: string;
  slug: string;
  isPublic: boolean;
  theme: 'dark' | 'light' | 'system';
  personalInfo: PersonalInfo;
  education: Education[];
  experience: Experience[];
  skills: Skill[];
  roles: Role[];
  certifications: Certification[];
  projects: Project[];
  achievements: Achievement[];
  languages: Language[];
  resumes: Resume[];
  createdAt: string;
  updatedAt: string;
}

// Data that each resume can independently own
export interface ResumeData {
  personalInfo: PersonalInfo;
  education: Education[];
  experience: Experience[];
  skills: Skill[];
  certifications: Certification[];
  projects: Project[];
  languages: Language[];
}

export interface Resume {
  id: string;
  name: string;
  templateId: 'classic' | 'modern' | 'minimal';
  isActive: boolean;
  isStandard: boolean; // true = always uses profile data, false = has its own data
  data?: ResumeData;   // custom data for non-standard resumes
  resumeImage?: string; // dedicated image for this resume (used in modern template header)
  createdAt: string;
  updatedAt: string;
}

export interface PortfolioSettings {
  showEducation: boolean;
  showExperience: boolean;
  showSkills: boolean;
  showRoles: boolean;
  showCertifications: boolean;
  showProjects: boolean;
  showAchievements: boolean;
  showLanguages: boolean;
  accentColor: string;
}

// Default empty portfolio template
export const createEmptyPortfolio = (userId: string, slug: string): Portfolio => ({
  id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
  userId,
  slug,
  isPublic: false,
  theme: 'dark',
  personalInfo: {
    fullName: '',
    title: '',
    email: '',
    phone: '',
    whatsapp: '',
    location: '',
    bio: '',
    profileImage: '',
    socialLinks: [],
  },
  education: [],
  experience: [],
  skills: [],
  roles: [],
  certifications: [],
  projects: [],
  achievements: [],
  languages: [],
  resumes: [
    {
      id: '1',
      name: 'My Resume (Profile)',
      templateId: 'classic',
      isActive: true,
      isStandard: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});
