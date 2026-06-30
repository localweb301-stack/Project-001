import { NewsArticle, WeatherCity, Contributor } from "./types";

export const mockContributors: Contributor[] = [
  {
    id: "contributor-1",
    handle: "@sandeep_news",
    displayName: "Sandeep Shirguppe",
    bio: "Senior Political Correspondent. Writing about Maharashtra politics for over 10 years.",
    avatarUrl: "https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?auto=format&fit=crop&w=200&q=80",
    joinDate: Date.now() - 365 * 24 * 60 * 60 * 1000,
    stats: { totalArticles: 0, totalViews: 0, totalComments: 0, totalShares: 0 },
    badges: [],
    scores: { allTime: 0, monthly: 0, weekly: 0 },
    ranks: { allTime: 0, monthly: 0, weekly: 0 }
  },
  {
    id: "contributor-2",
    handle: "@payal_ent",
    displayName: "Payal Naik",
    bio: "Entertainment & Lifestyle Journalist. Keeping you updated with the latest trends.",
    avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80",
    joinDate: Date.now() - 120 * 24 * 60 * 60 * 1000,
    stats: { totalArticles: 0, totalViews: 0, totalComments: 0, totalShares: 0 },
    badges: [],
    scores: { allTime: 0, monthly: 0, weekly: 0 },
    ranks: { allTime: 0, monthly: 0, weekly: 0 }
  },
  {
    id: "contributor-3",
    handle: "@rahul_tech",
    displayName: "Rahul Deshmukh",
    bio: "Technology enthusiast and science reporter. Demystifying tech for everyday users.",
    avatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80",
    joinDate: Date.now() - 60 * 24 * 60 * 60 * 1000,
    stats: { totalArticles: 0, totalViews: 0, totalComments: 0, totalShares: 0 },
    badges: [],
    scores: { allTime: 0, monthly: 0, weekly: 0 },
    ranks: { allTime: 0, monthly: 0, weekly: 0 }
  }
];

export const mockArticles: NewsArticle[] = [];

export const mockWeather: WeatherCity[] = [
  { id: "w1", city: "मुंबई", temp: 31, condition: "अंशतः ढगाळ", icon: "🌤" },
  { id: "w2", city: "पुणे", temp: 28, condition: "ढगाळ", icon: "☁" },
  { id: "w3", city: "नागपूर", temp: 41, condition: "निरभ्र", icon: "☀" },
  { id: "w4", city: "च. संभाजीनगर", temp: 34, condition: "पावसाळी", icon: "🌦" }
];
