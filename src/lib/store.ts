import { NewsArticle, Contributor } from "../types";
import { mockArticles, mockContributors } from "../data";
import { db, isFirebaseConfigured } from "./firebase";
import { setDoc, doc, deleteDoc } from "firebase/firestore";

const STORAGE_KEY = "siteget_articles_v1";
const LAST_RANK_KEY = "siteget_last_rank_time";
const CONTRIBUTORS_KEY = "siteget_contributors_v1";
const LAST_CONTRIBUTOR_RANK_KEY = "siteget_last_contributor_rank_time";
const RANKING_INTERVAL_MS = 6 * 60 * 60 * 1000;

export const getContributors = (): Contributor[] => {
  try {
    const data = localStorage.getItem(CONTRIBUTORS_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Failed to parse contributors from localStorage:", err);
  }
  return mockContributors;
};

export const getArticles = (): NewsArticle[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Failed to parse articles from localStorage:", err);
  }
  return mockArticles;
};

export const runRankingJob = (articles: NewsArticle[]): NewsArticle[] => {
  const now = Date.now();
  
  return articles.map(article => {
     // fallback if createdAt is missing, assume it's 24 hours old
     const publishTime = article.createdAt || (now - 24 * 60 * 60 * 1000);
     const ageMs = Math.max(0, now - publishTime);
     const ageHours = ageMs / (1000 * 60 * 60);

     const shares = article.shares || 0;
     const likes = article.likes || 0;
     const views = article.views || 0;
     const comments = article.commentsCount || 0;

     const score = (views * 1 + likes * 5 + comments * 10 + shares * 15) / Math.pow(ageHours + 2, 1.5);

     return {
        ...article,
        trendingScore: Number(score.toFixed(4))
     };
  });
};

export const runContributorRankingJob = (contributors: Contributor[], articles: NewsArticle[]): Contributor[] => {
    const sortedContributors = [...contributors];
    const now = Date.now();

    // Calculate Raw Stats & Scores
    sortedContributors.forEach(c => {
       const userArticles = articles.filter(a => a.authorId === c.id);
       
       let totalViews = 0;
       let totalComments = 0;
       let totalShares = 0;
       let engagementPoints = 0; // Quality factor

       userArticles.forEach(a => {
           totalViews += (a.views || 0);
           totalComments += (a.commentsCount || 0);
           totalShares += (a.shares || 0);
           const mViews = a.views || 0;
           // Quality: log of views + high weight for comments/shares
           engagementPoints += (Math.log10(mViews > 0 ? mViews : 1) * 2) + ((a.commentsCount || 0) * 5) + ((a.shares || 0) * 10);
       });

       c.stats.totalArticles = userArticles.length;
       c.stats.totalViews = totalViews;
       c.stats.totalComments = totalComments;
       c.stats.totalShares = totalShares;

       // Formula: Base engagement / (decayed by article count to prevent spam) 
       // but we still want to reward volume slightly
       const volumeBonus = userArticles.length * 2;
       
       const finalScore = userArticles.length > 0 
            ? (engagementPoints / Math.pow(userArticles.length, 0.2)) + volumeBonus
            : 0;

       c.scores.allTime = Number(finalScore.toFixed(2));
       // For mock purposes, we set monthly/weekly somewhat arbitrary to allTime based on random ratios, or just identical.
       c.scores.monthly = Number((finalScore * 0.4).toFixed(2));
       c.scores.weekly = Number((finalScore * 0.1).toFixed(2));
       
       // Process Badges
       const newBadges = [...c.badges];
       const hasBadge = (badgeId: string) => newBadges.some(b => b.id === badgeId);

       if (c.stats.totalArticles >= 100 && !hasBadge("100_ARTICLES")) {
           newBadges.push({ id: "100_ARTICLES", name: "100 Articles Club", description: "Published 100+ articles", icon: "pen-tool", earnedAt: now });
       }
       if (c.stats.totalViews >= 100000 && !hasBadge("100K_VIEWS")) {
           newBadges.push({ id: "100K_VIEWS", name: "100k Views Club", description: "Reached 100k total views", icon: "eye", earnedAt: now });
       }
       
       c.badges = newBadges;
    });

    // Rank All Time
    sortedContributors.sort((a, b) => b.scores.allTime - a.scores.allTime);
    sortedContributors.forEach((c, index) => {
        c.ranks.allTime = index + 1;
        const hasTop1 = c.badges.some(b => b.id === "TOP_CONTRIBUTOR");
        const hasTop10 = c.badges.some(b => b.id === "TOP_10");
        
        if (c.ranks.allTime === 1 && !hasTop1) {
            c.badges.push({ id: "TOP_CONTRIBUTOR", name: "Top Contributor", description: "Ranked #1 Contributor", icon: "award", earnedAt: now });
        }
        if (c.ranks.allTime <= 10 && c.ranks.allTime > 1 && !hasTop10) {
            c.badges.push({ id: "TOP_10", name: "Top 10 Contributor", description: "Reached Top 10", icon: "medal", earnedAt: now });
        }
    });

    // We skip sorting array for monthly/weekly because we just update the rank fields directly based on scores
    const sortByMonthly = [...sortedContributors].sort((a, b) => b.scores.monthly - a.scores.monthly);
    sortByMonthly.forEach((c, i) => c.ranks.monthly = i + 1);

    const sortByWeekly = [...sortedContributors].sort((a, b) => b.scores.weekly - a.scores.weekly);
    sortByWeekly.forEach((c, i) => c.ranks.weekly = i + 1);

    // Return the original objects which were modified, sorted by All Time
    return sortedContributors;
};

export const checkAndRunScheduledRanking = () => {
    const lastRankTimeStr = localStorage.getItem(LAST_RANK_KEY);
    const lastRankTime = lastRankTimeStr ? parseInt(lastRankTimeStr, 10) : 0;
    
    // Also check if contributor ranking has ever run
    const lastContribRankTimeStr = localStorage.getItem(LAST_CONTRIBUTOR_RANK_KEY);
    const lastContribRankTime = lastContribRankTimeStr ? parseInt(lastContribRankTimeStr, 10) : 0;
    
    const now = Date.now();

    const needsArticleRank = now - lastRankTime >= RANKING_INTERVAL_MS;
    const needsContribRank = now - lastContribRankTime >= RANKING_INTERVAL_MS;

    if (needsArticleRank || needsContribRank) {
        let currentArticles = getArticles();
        if (needsArticleRank) {
            currentArticles = runRankingJob(currentArticles);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(currentArticles));
            localStorage.setItem(LAST_RANK_KEY, now.toString());
        }

        let currentContributors = getContributors();
        if (needsContribRank) {
            currentContributors = runContributorRankingJob(currentContributors, currentArticles);
            localStorage.setItem(CONTRIBUTORS_KEY, JSON.stringify(currentContributors));
            localStorage.setItem(LAST_CONTRIBUTOR_RANK_KEY, now.toString());
        }

        return { articles: currentArticles, contributors: currentContributors };
    }
    return null;
};

export const updateArticle = (updatedArticle: NewsArticle): NewsArticle => {
  const currentArticles = getArticles();
  const index = currentArticles.findIndex(a => a.id === updatedArticle.id);
  if (index !== -1) {
    currentArticles[index] = updatedArticle;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentArticles));
    
    // Sync to Firestore if configured
    if (isFirebaseConfigured && db) {
      try {
        setDoc(doc(db, "articles", updatedArticle.id), updatedArticle, { merge: true }).catch(err => {
           if (err.message && err.message.includes("Missing or insufficient permissions")) {
             console.log("Firestore update failed due to permissions. Ensure rules are deployed.");
           } else {
             console.warn("Failed to update article in Firestore async:", err);
           }
        });
      } catch (err) {
        console.warn("Failed to update article in Firestore:", err);
      }
    }
  }
  return updatedArticle;
};

export const addArticle = (article: Omit<NewsArticle, "id">): NewsArticle => {
  const currentArticles = getArticles();
  
  const newArticle: NewsArticle = {
    ...article,
    id: `news-local-${Date.now()}`
  };
  
  // Rank just this new article (or fast track its rank to 0 or calculate it properly)
  const [rankedNewArticle] = runRankingJob([newArticle]);
  
  const updatedArticles = [rankedNewArticle, ...currentArticles];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedArticles));

  // Sync to Firestore if configured
  if (isFirebaseConfigured && db) {
    try {
      const sanitizedArticle = Object.fromEntries(
        Object.entries(rankedNewArticle).filter(([_, v]) => v !== undefined)
      );
      setDoc(doc(db, "articles", rankedNewArticle.id), sanitizedArticle).catch(err => {
         if (err.message && err.message.includes("Missing or insufficient permissions")) {
           console.log("Firestore sync failed due to permissions. Ensure rules are deployed.");
         } else {
           console.warn("Failed to sync article to Firestore async:", err);
         }
      });
    } catch (err) {
      console.warn("Failed to write article to Firestore:", err);
    }
  }
  
  return rankedNewArticle;
};

export const deleteArticle = (id: string): void => {
  const currentArticles = getArticles();
  const updatedArticles = currentArticles.filter(a => a.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedArticles));

  // Sync deletion to Firestore if configured
  if (isFirebaseConfigured && db) {
    try {
      deleteDoc(doc(db, "articles", id)).catch(err => {
        if (err.message && err.message.includes("Missing or insufficient permissions")) {
          console.log("Firestore delete failed due to permissions. Ensure rules are deployed.");
        } else {
          console.warn("Failed to sync deletion to Firestore async:", err);
        }
      });
    } catch (err) {
      console.warn("Failed to delete article from Firestore:", err);
    }
  }
};

export const getAdminPasscode = (): string => {
  return localStorage.getItem("siteget_admin_passcode") || "7843";
};

export const setAdminPasscode = (passcode: string): void => {
  localStorage.setItem("siteget_admin_passcode", passcode);
};

export const getWhitelistedUsers = (): string[] => {
  try {
    const data = localStorage.getItem("siteget_whitelist_v1");
    if (data) {
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Failed to parse whitelist from localStorage:", err);
  }
  return [];
};

export const addWhitelistedUser = (username: string) => {
  const current = getWhitelistedUsers();
  if (!current.includes(username)) {
    const updated = [...current, username];
    localStorage.setItem("siteget_whitelist_v1", JSON.stringify(updated));
  }
};

export const removeWhitelistedUser = (username: string) => {
  const current = getWhitelistedUsers();
  const updated = current.filter(u => u !== username);
  localStorage.setItem("siteget_whitelist_v1", JSON.stringify(updated));
};

const POLLS_KEY = "siteget_polls_v1";

export const getOpinionPolls = (): any[] => {
  try {
    const data = localStorage.getItem(POLLS_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Failed to parse polls from localStorage:", err);
  }
  return [{
      id: "default-poll",
      question: "विद्यमान सरकारच्या कार्यपद्धतीवर आपण समाधानी आहात का?",
      options: [
        { id: "yes", text: "होय (Yes)", votes: 65 },
        { id: "no", text: "नाही (No)", votes: 35 }
      ],
      createdAt: Date.now(),
      isActive: true
  }];
};

export const createOpinionPoll = (poll: any) => {
  const current = getOpinionPolls();
  current.unshift(poll);
  localStorage.setItem(POLLS_KEY, JSON.stringify(current));
};

export const deleteOpinionPoll = (id: string) => {
  const current = getOpinionPolls();
  const updated = current.filter(p => p.id !== id);
  localStorage.setItem(POLLS_KEY, JSON.stringify(updated));
};

export const voteOpinionPoll = (pollId: string, optionId: string) => {
  const current = getOpinionPolls();
  const updated = current.map(p => {
     if (p.id === pollId) {
       const opts = p.options.map((o: any) => o.id === optionId ? { ...o, votes: o.votes + 1 } : o);
       return { ...p, options: opts };
     }
     return p;
  });
  localStorage.setItem(POLLS_KEY, JSON.stringify(updated));
  return updated;
};

