
export interface Project {
  id: string;
  title: string;
  category: string;
  description: string;
  icon: string;
  color: string;
  link?: string;
  logo?: string;
  logoBg?: string; // Optional background color for the logo container (e.g., 'bg-white')
  achievements?: string[];
}

export interface Skill {
  id: string;
  title: string;
  icon: string;
  color: string;
  items: string[];
}

export interface TimelineItem {
  id: string;
  date: string;
  title: string;
  subtitle: string;
  description: string;
  details: string[];
  type: 'education' | 'leadership' | 'achievement' | 'professional' | 'creative' | 'volunteer';
  icon: string;
}

export interface Award {
  id: string;
  title: string;
  detail: string;
  icon: string;
}

export interface NewsComment {
  id: string;
  userName: string;
  text: string;
  date: string;
}

export interface NewsPost {
  id: string;
  title: string;
  content: string;
  date: string;
  author: string;
  image?: string;
  likes: number;
  comments: NewsComment[];
}

export interface Profile {
  name: string;
  fullName: string;
  email: string;
  phone: string;
  location: string;
  bio: string;
  profilePic: string;
  coverPhoto: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  image?: string;
}

export interface PortfolioData {
  profile: Profile;
  projects: Project[];
  skills: Skill[];
  timeline: TimelineItem[];
  awards: Award[];
  news: NewsPost[];
}
