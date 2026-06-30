export interface ContributorStats {
  totalArticles: number;
  totalViews: number;
  totalComments: number;
  totalShares: number;
}

export interface ContributorBadge {
  id: string;
  name: string;
  icon: string;
  description: string;
  earnedAt: number;
}

export interface Contributor {
  id: string;
  handle: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
  joinDate: number;
  stats: ContributorStats;
  badges: ContributorBadge[];
  scores: {
    allTime: number;
    monthly: number;
    weekly: number;
  };
  ranks: {
    allTime: number;
    monthly: number;
    weekly: number;
  };
}

export interface NewsArticle {
  id: string;
  title: string;
  excerpt: string;
  fullText: string;
  category: string;
  imageUrl: string;
  date: string;
  source: string;
  views: number;
  likes: number;
  commentsCount: number;
  shares?: number;
  trendingScore?: number;
  createdAt?: number;
  authorId?: string;
  authorHandle?: string;
  slug?: string;
}

export interface WeatherCity {
  id: string;
  city: string;
  temp: number;
  condition: string;
  icon: string;
}

export interface OpinionPoll {
  id: string;
  question: string;
  options: {
    id: string;
    text: string;
    votes: number;
  }[];
  createdAt: number;
  isActive: boolean;
}
