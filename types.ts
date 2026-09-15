export interface Poet {
  id: string;
  nameUrdu: string;
  nameEnglish: string;
  titleOrEra?: string;
  totalPoems?: number;
  totalLikes?: number;
  sampleVerse?: string;
  featured?: boolean;
  order?: number;
  createdAt?: string;
}

export interface Category {
  id: string;
  nameUrdu: string;
  nameEnglish: string;
  order: number;
  description?: string;
  createdAt?: string;
}

export interface Poetry {
  id: string;
  poetId?: string;
  poetNameUrdu: string;
  poetNameEnglish: string;
  categoryId: string;
  versesUrdu: string[]; // Lines of the shair / ghazal
  poetryType?: 'ashar' | 'ghazal' | 'kalam' | 'nazm';
  status: 'published' | 'draft';
  likesCount: number;
  featured?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface PoetryFilter {
  categoryId?: string;
  poetId?: string;
  searchQuery?: string;
  status?: 'all' | 'published' | 'draft';
}

export interface Banner {
  id: string;
  title?: string;
  subtitle?: string;
  imageUrl: string;
  linkUrl?: string;
  isActive: boolean;
  order?: number;
  createdAt: string;
  updatedAt?: string;
}
