"use client";
import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  Calendar,
  CloudSun,
  Clock,
  ChevronRight,
  Flame,
  ShieldAlert,
  X,
  User,
  Trophy,
  Verified,
  Home,
  Menu
} from "lucide-react";
import { NewsArticle, WeatherCity, Contributor } from "./types";
import { mockArticles, mockWeather } from "./data";
import { getArticles, getContributors, addArticle, checkAndRunScheduledRanking } from "./lib/store";
import { getMarathiDateString, getMarathiTimeString } from "./lib/dateUtils";
import { collection, getDocs } from "firebase/firestore";
import { db, isFirebaseConfigured } from "./lib/firebase";
import { Leaderboard } from "./lib/components/Leaderboard";
import { ContributorProfile } from "./lib/components/ContributorProfile";
import { BreakingNewsTicker } from "./lib/components/BreakingNewsTicker";
import { OpinionPollCard } from "./lib/components/OpinionPollCard";
import { ArticlePage } from "./lib/components/ArticlePage";
import { AuthAdminUI } from "./lib/components/AuthAdminUI";
import { AboutSection } from "./lib/components/AboutSection";

const App: React.FC = () => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<NewsArticle[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("सर्व");
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [selectedContributor, setSelectedContributor] = useState<Contributor | null>(null);
  const [showLeaderboard, setShowLeaderboard] = useState<boolean>(false);
  const [showAdminPage, setShowAdminPage] = useState<boolean>(false);
  const [showMenuPage, setShowMenuPage] = useState<boolean>(false);
  const [showAboutPage, setShowAboutPage] = useState<boolean>(false);
  const [showHelpPage, setShowHelpPage] = useState<boolean>(false);
  const [weatherList, setWeatherList] = useState<WeatherCity[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [visibleCount, setVisibleCount] = useState<number>(10);

  // Helper to parse URL and set correct states
  const parseUrlState = (currentArticles: NewsArticle[], currentContributors: Contributor[]) => {
    const path = window.location.pathname;
    let articleId = null;
    let page = null;
    let contributorId = null;

    if (path.startsWith('/article/')) {
        const param = path.split('/')[2];
        if (param && param.startsWith('news-local-')) {
            articleId = param;
        } else if (param) {
            const match = param.match(/(news-local-\d+)$/);
            if (match) {
                articleId = match[1];
            } else if (param.includes('-')) {
                articleId = param.substring(param.lastIndexOf('-') + 1);
            } else {
                articleId = param;
            }
        }
    } else if (path.startsWith('/author/')) {
        contributorId = path.split('/')[2];
    } else if (path === '/about') {
        page = 'about';
    } else if (path === '/help') {
        page = 'help';
    } else if (path === '/admin') {
        page = 'admin';
    } else if (path === '/menu') {
        page = 'menu';
    } else if (path === '/leaderboard') {
        page = 'leaderboard';
    } else {
        const params = new URLSearchParams(window.location.search);
        articleId = params.get('article');
        page = params.get('page');
        contributorId = params.get('contributor');
    }

    if (articleId) {
      const found = currentArticles.find(a => a.id === articleId);
      setSelectedArticle(found || null);
    } else {
      setSelectedArticle(null);
    }

    setShowAboutPage(page === 'about');
    setShowHelpPage(page === 'help');
    setShowAdminPage(page === 'admin');
    setShowMenuPage(page === 'menu');
    setShowLeaderboard(page === 'leaderboard');

    if (contributorId) {
      let found = currentContributors.find(c => c.id === contributorId);
      if (!found) {
        // Try to build a dynamic contributor from an article
        const authorArticle = currentArticles.find(a => a.authorId === contributorId);
        if (authorArticle) {
          found = {
            id: contributorId,
            handle: authorArticle.authorHandle || contributorId,
            displayName: authorArticle.source,
            bio: "स्वतंत्र पत्रकार आणि लेखक. (Independent Journalist)",
            avatarUrl: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=400&q=80",
            joinDate: authorArticle.createdAt || Date.now(),
            stats: { totalArticles: 0, totalViews: 0, totalComments: 0, totalShares: 0 },
            badges: [],
            scores: { allTime: 0, monthly: 0, weekly: 0 },
            ranks: { allTime: 0, monthly: 0, weekly: 0 }
          };
        }
      }
      setSelectedContributor(found || null);
    } else {
      setSelectedContributor(null);
    }
  };

  // Helper to trigger navigation and push state to history
  const navigateTo = (route: {
    article?: NewsArticle | null;
    page?: 'about' | 'help' | 'admin' | 'menu' | 'leaderboard' | null;
    contributor?: Contributor | null;
  }) => {
    let url = '/';
    if (route.article) {
       // Create an SEO friendly slug
       let slug = route.article.slug;
       if (!slug) {
           slug = route.article.title
               .toLowerCase()
               .replace(/[^a-z0-9\u0900-\u097F]+/g, '-') // Allow Marathi chars
               .replace(/(^-|-$)+/g, '');
       }
       url = `/article/${encodeURIComponent(slug)}-${route.article.id}`;
    } else if (route.page) {
       url = `/${route.page}`;
    } else if (route.contributor) {
       url = `/author/${route.contributor.id}`;
    }
    
    window.history.pushState({}, '', url);

    setSelectedArticle(route.article || null);
    setShowAboutPage(route.page === 'about');
    setShowHelpPage(route.page === 'help');
    setShowAdminPage(route.page === 'admin');
    setShowMenuPage(route.page === 'menu');
    setShowLeaderboard(route.page === 'leaderboard');
    setSelectedContributor(route.contributor || null);
  };

  // Real-time Marahi running clock state
  const [currentTime, setCurrentTime] = useState<string>("");

  useEffect(() => {
    // Update Marathi Clock in real-time
    const timer = setInterval(() => {
      const now = new Date();
      setSelectedDateStr(getMarathiDateString(now));
      setCurrentTime(getMarathiTimeString(now));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const [selectedDateStr, setSelectedDateStr] = useState<string>("");

  // Fetch standard news from client-side storage & sync with Firestore
  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        
        // Run the scheduled ranking job (if 6 hours have passed)
        const rankData = checkAndRunScheduledRanking();
        
        let data = rankData ? rankData.articles : getArticles();
        const currentContributors = rankData ? rankData.contributors : getContributors();

        // Sync with Firestore if configured
        if (isFirebaseConfigured && db) {
          try {
            const querySnapshot = await getDocs(collection(db, "articles"));
            const firestoreArticles: NewsArticle[] = [];
            querySnapshot.forEach((docSnap) => {
               const data = docSnap.data();
               firestoreArticles.push({ ...data, id: data.id || docSnap.id } as NewsArticle);
            });
            if (firestoreArticles.length > 0) {
               // Merge prioritizing Firestore records
               const articleMap = new Map<string, NewsArticle>();
               const firestoreIds = new Set(firestoreArticles.map(a => a.id));
               
               firestoreArticles.forEach(a => articleMap.set(a.id, a));
               data = Array.from(articleMap.values());
               
               // Persist the synced data to localStorage
               localStorage.setItem("siteget_articles_v1", JSON.stringify(data));
            }
          } catch (fsErr: any) {
            if (fsErr.message && fsErr.message.includes("Missing or insufficient permissions")) {
               console.log("Firebase is connected but rules are not deployed yet. Please go to Firebase Console -> Firestore Database -> Rules and paste the contents of firestore.rules.");
            } else {
               console.warn("Firestore sync issue:", fsErr);
            }
          }
        }
        
        // Ensure base articles array is sorted by date by default
        const uniqueArticles = Array.from(new Map([...data].filter(a => a.id).map(a => [a.id, a])).values());
        const sortedByDate = uniqueArticles.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setArticles(sortedByDate);
        setContributors(currentContributors);
        setWeatherList(mockWeather);

        // Parse current URL and apply the synchronized state
        parseUrlState(sortedByDate, currentContributors);
      } catch (err) {
        console.error("Error loading data:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Sync filtration when category shifts or database alters
  useEffect(() => {
    setVisibleCount(10);
    if (selectedCategory === "सर्व") {
      // "सर्व" is the homepage: sort by trendingScore for Hero and Featured sections
      const sortedByScore = [...articles].sort((a, b) => (b.trendingScore || 0) - (a.trendingScore || 0));
      setFilteredArticles(sortedByScore);
    } else if (selectedCategory === "प्रशासन (Admin)") {
      setFilteredArticles(articles);
    } else {
      // Category pages: filtered, and remain sorted by publish date (which is already the array order, but let's be explicit)
      const sortedByDate = articles
         .filter((a) => a.category === selectedCategory)
         .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setFilteredArticles(sortedByDate);
    }
  }, [selectedCategory, articles]);

  const handleReloadNews = () => {
    const data = getArticles();
    setArticles(data);
  };

  const handleLocalLikeUpdate = (id: string, newLikes: number) => {
    setArticles((prev) =>
      prev.map((art) => (art.id === id ? { ...art, likes: newLikes } : art))
    );
  };

  const categories = [
    "सर्व",
    "महाराष्ट्र",
    "इतिहास",
    "राजकारण",
    "संपादकीय",
    "मनोरंजन",
    "राष्ट्रीय"
  ];

  // Helper view Increment wrapper before modal pop
  const handleViewArticle = (art: NewsArticle) => {
    // Optimistically update view counters localstate
    setArticles((prev) =>
      prev.map((a) => (a.id === art.id ? { ...a, views: a.views + 1 } : a))
    );

    // Update using navigateTo helper to support back button and deep-linking!
    navigateTo({ article: art });
  };

  const goHome = () => {
     window.history.pushState({}, '', '/');
     setShowMenuPage(false);
     setShowAboutPage(false);
     setShowHelpPage(false);
     setShowAdminPage(false);
     setSelectedArticle(null);
     setSelectedContributor(null);
     setShowLeaderboard(false);
     setSelectedCategory("सर्व");
  };

  const PageHeader = ({ title }: { title: string }) => (
    <header className="bg-white px-4 py-3 shadow border-b border-gray-200 flex items-center justify-between sticky top-0 z-50">
       <div className="max-w-5xl mx-auto w-full flex items-center justify-between">
         <div className="flex flex-col">
           <span className="font-sans font-black text-2xl text-gray-900 tracking-tight cursor-pointer hover:text-red-800 transition-colors" onClick={goHome}>
             देशाचे लोक
           </span>
         </div>
         <div className="flex items-center gap-2">
           <span className="text-sm font-serif font-bold text-slate-600 hidden md:block mr-2">{title}</span>
           <button 
              onClick={goHome}
              className="p-1 text-gray-500 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
              title="Home"
           >
              <Home className="h-5 w-5" />
           </button>
         </div>
       </div>
    </header>
  );

  const PageFooter = () => (
    <footer className="mt-16 py-8 border-t border-gray-200 text-center text-xs text-gray-400">
      <p>© २०२६ देशाचे लोक (siteget.in). सर्व हक्क सुरक्षित.</p>
    </footer>
  );

  const handleCloseArticle = () => {
    goHome();
  };

  const handleViewAuthor = (art: NewsArticle) => {
    if (!art.authorId) return;
    let found = contributors.find(c => c.id === art.authorId);
    if (!found) {
      found = {
        id: art.authorId,
        handle: art.authorHandle || art.authorId,
        displayName: art.source,
        bio: "स्वतंत्र पत्रकार आणि लेखक. (Independent Journalist)",
        avatarUrl: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=400&q=80",
        joinDate: art.createdAt || Date.now(),
        stats: { totalArticles: 0, totalViews: 0, totalComments: 0, totalShares: 0 },
        badges: [],
        scores: { allTime: 0, monthly: 0, weekly: 0 },
        ranks: { allTime: 0, monthly: 0, weekly: 0 }
      };
    }
    navigateTo({ contributor: found });
  };

  // Handle back button smoothly
  useEffect(() => {
    const handlePopState = () => {
      parseUrlState(articles, contributors);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [articles, contributors]);

  // Scroll to top when an article opens or closes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [selectedArticle]);

  if (selectedArticle) {
    return (
      <div className="min-h-screen bg-white text-slate-800 font-sans selection:bg-red-700 selection:text-white pb-12">
        {/* Minimal Header for Article Page */}
        <header className="bg-white px-4 py-3 shadow border-b border-gray-200 flex items-center justify-between sticky top-0 z-50">
           <div className="max-w-5xl mx-auto w-full flex items-center justify-between">
             <div className="flex flex-col">
               <span className="font-sans font-black text-2xl text-gray-900 tracking-tight cursor-pointer hover:text-red-800 transition-colors" onClick={handleCloseArticle}>
                 देशाचे लोक
               </span>
             </div>
             <button 
                onClick={handleCloseArticle}
                className="p-1 text-gray-500 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                title="Home"
             >
                <Home className="h-5 w-5" />
             </button>
           </div>
        </header>

        {/* Breaking News Ticker for Article Page */}
        <section className="bg-gray-50 border-b border-gray-200">
          <div className="max-w-3xl mx-auto px-4">
             <BreakingNewsTicker articles={articles} onSelectArticle={handleViewArticle} />
          </div>
        </section>

        <main className="max-w-3xl mx-auto px-4 pt-6 md:pt-10">
           <ArticlePage 
             article={selectedArticle}
             contributors={contributors} 
             onLikeUpdate={handleLocalLikeUpdate} 
             allArticles={articles}
             onViewArticle={handleViewArticle}
             onClose={handleCloseArticle}
             onCategoryClick={(cat) => {
               // First go home (which resets to 'सर्व' by default)
               goHome();
               // Then override the category with the one clicked
               setTimeout(() => {
                 setSelectedCategory(cat);
                 setVisibleCount(10);
               }, 0);
             }}
           />
        </main>
        
        {/* Simple Footer for Article Page */}
        <footer className="mt-16 py-8 border-t border-gray-200 text-center text-xs text-gray-400">
          <p>© २०२६ देशाचे लोक (siteget.in). सर्व हक्क सुरक्षित.</p>
        </footer>
      </div>
    );
  }

  if (showAdminPage) {
    return (
      <div className="min-h-screen bg-white text-slate-800 font-sans selection:bg-red-700 selection:text-white pb-12">
        <PageHeader title="विभागीय संपादक मंडळ" />
        <main className="max-w-3xl mx-auto px-4 pt-6 md:pt-10">
          <div className="border border-gray-200 bg-white shadow-sm p-6 rounded-xl min-h-[50vh]">
             <h4 className="font-serif font-black text-xl text-gray-900 flex items-center gap-2 border-b border-gray-150 pb-3 mb-4">
               <ShieldAlert className="h-6 w-6 text-slate-600" />
               विभागीय संपादक मंडळ (Editorial Section)
             </h4>
             <p className="text-sm font-serif text-gray-600 mb-6">
               केवळ अधिकृत संपादक आणि वार्ताहरांसाठी लेख प्रकाशित करण्याची सुरक्षित सुविधा. (Authorized reporting panel).
             </p>
             <AuthAdminUI onArticleAdded={handleReloadNews} />
          </div>
        </main>
        <PageFooter />
      </div>
    );
  }

  if (showAboutPage) {
    return (
      <div className="min-h-screen bg-white text-slate-800 font-sans selection:bg-red-700 selection:text-white pb-12">
        <PageHeader title="आमच्याबद्दल" />
        <main className="max-w-4xl mx-auto px-4 pt-6 md:pt-10">
          <AboutSection />
        </main>
        <PageFooter />
      </div>
    );
  }

  if (showHelpPage) {
    return (
      <div className="min-h-screen bg-white text-slate-800 font-sans selection:bg-red-700 selection:text-white pb-12">
        <PageHeader title="मदत आणि सपोर्ट" />
        <main className="max-w-3xl mx-auto px-4 pt-6 md:pt-10">
          <div className="prose prose-slate max-w-none font-serif">
            <h1 className="text-3xl font-black mb-6">मदत आणि सपोर्ट (Help & Support)</h1>
            <p className="text-lg leading-relaxed text-gray-700 mb-6">
              आपल्याला काही प्रश्न किंवा तांत्रिक अडचण असल्यास, खालील माहितीचा वापर करून आमच्याशी संपर्क साधा.
            </p>
            
            <div className="bg-gray-50 border border-gray-200 p-6 rounded-xl space-y-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">ईमेल (Email)</h3>
                <p className="text-gray-700">siteget1234@gmail.com</p>
              </div>
              
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">संपादकीय संपर्क</h3>
                <p className="text-gray-700">siteget1234@gmail.com</p>
              </div>
              
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">कार्यालयीन पत्ता</h3>
                <p className="text-gray-700">
                  देशाचे लोक वृत्तपत्र कार्यालय,<br/>
                  पुणे, महाराष्ट्र - ४११००१
                </p>
              </div>
            </div>
            
            <div className="mt-8 p-4 bg-blue-50 text-blue-800 rounded-lg text-sm border border-blue-100">
              <span className="font-bold">नोंद:</span> सर्वसाधारण चौकशीसाठी आम्ही २४-४८ तासांत प्रतिसाद देतो.
            </div>
          </div>
        </main>
        <PageFooter />
      </div>
    );
  }

  if (showMenuPage) {
    return (
      <div className="min-h-screen bg-slate-900 text-white font-sans overflow-hidden fixed inset-0 z-[100] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        <header className="px-6 py-4 flex items-center justify-between border-b border-slate-800">
           <span className="font-serif font-black text-2xl text-white tracking-tight cursor-pointer hover:text-red-400 transition-colors" onClick={goHome}>
             देशाचे लोक
           </span>
           <button 
              onClick={goHome}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
              title="Close Menu"
           >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
           </button>
        </header>

        <main className="flex-1 overflow-y-auto px-6 py-10 flex flex-col justify-center max-w-2xl mx-auto w-full">
           <nav className="flex flex-col gap-6 text-center">
              <button 
                onClick={() => { navigateTo({ page: 'about' }); window.scrollTo(0, 0); }}
                className="text-4xl font-black font-serif text-slate-200 hover:text-white hover:scale-105 transition-all cursor-pointer"
              >
                आमच्याबद्दल <span className="block text-sm font-sans font-medium text-slate-400 mt-1 uppercase tracking-wider">About Us</span>
              </button>
              
              <div className="h-px bg-slate-800 w-1/3 mx-auto my-2"></div>
              
              <button 
                onClick={() => { navigateTo({ page: 'help' }); window.scrollTo(0, 0); }}
                className="text-4xl font-black font-serif text-slate-200 hover:text-white hover:scale-105 transition-all cursor-pointer"
              >
                मदत आणि सपोर्ट <span className="block text-sm font-sans font-medium text-slate-400 mt-1 uppercase tracking-wider">Help & Support</span>
              </button>
              
              <div className="h-px bg-slate-800 w-1/3 mx-auto my-2"></div>

              <button 
                onClick={() => { navigateTo({ page: 'admin' }); window.scrollTo(0, 0); }}
                className="text-4xl font-black font-serif text-slate-200 hover:text-white hover:scale-105 transition-all cursor-pointer"
              >
                संपादकीय मंडळ <span className="block text-sm font-sans font-medium text-slate-400 mt-1 uppercase tracking-wider">Editorial Login</span>
              </button>
           </nav>
        </main>
        
        <footer className="py-6 text-center text-slate-500 text-xs border-t border-slate-800">
           © २०२६ देशाचे लोक (siteget.in). सर्व हक्क सुरक्षित.
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fbfcfa] text-slate-800 font-sans selection:bg-red-700 selection:text-white pb-12">
      
      {/* 1. TOP UTILITY HEADER RAIL */}
      <div className="bg-slate-900 text-slate-350 text-xs py-2 px-4 shadow-sm border-b border-slate-800 select-none">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <div className="flex items-center gap-4">
            <button
               onClick={() => {
                 navigateTo({ page: 'menu' });
               }}
               className="p-1 hover:bg-slate-800 rounded transition-colors cursor-pointer text-slate-400 hover:text-white"
               title="Main Menu"
            >
               <Menu className="h-4 w-4" />
            </button>
            <span className="font-mono text-[10px] text-red-500 font-bold bg-red-950/50 px-2 py-0.5 rounded border border-red-900/30">
              आवृत्ती: डिजिटल विशेष (siteget.in)
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              {selectedDateStr || "८ जून २०२६"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 bg-slate-800 px-2 py-0.5 rounded text-white font-mono font-bold">
              <Clock className="h-3 w-3 text-red-400 animate-pulse" />
              {currentTime || "१:०४:०० PM"}
            </span>
            <span className="text-slate-500">|</span>
            <span className="text-[10px] uppercase font-bold text-slate-400">
              सत्यशोधक व पारदर्शक पत्रकारिता
            </span>
            <button
               onClick={() => {
                 navigateTo({ page: 'admin' });
               }}
               className="p-1 hover:bg-slate-800 rounded transition-colors cursor-pointer text-slate-400 hover:text-white ml-2"
               title="Editorial Login"
            >
               <User className="h-4 w-4" />
            </button>
          </div>

        </div>
      </div>

      {/* 2. CHOSEN BRAND MASTHEAD PLATE - Traditional Double Rulers */}
      <header 
        className="max-w-7xl mx-auto px-4 py-6 text-center select-none cursor-pointer"
        onClick={goHome}
      >
        <div className="flex flex-col items-center justify-center space-y-1">
          <h1 className="font-serif font-black text-5xl md:text-6xl tracking-tight text-gray-900 hover:scale-[1.01] transition-transform duration-300">
            देशाचे लोक
          </h1>
          <p className="text-xs md:text-sm font-serif font-medium text-red-800 tracking-wider">
            सार्वभौमिक व पुरोगामी विचारांचे अग्रगण्य मराठी वृत्त व्यासपीठ
          </p>
        </div>

        {/* Double Border Plate Info Strip */}
        <div className="news-border-double news-border-top-double mt-5 py-2.5 flex flex-col md:flex-row items-center justify-between text-xs text-gray-600 font-semibold gap-3">
          <div>पुणे, मुंबई आणि संपूर्ण महाराष्ट्र • वर्ष १ • अंक ७२</div>
          <div className="font-serif italic text-gray-500">"समृद्ध विचारांचा लोकपंथ"</div>
          <div>डिजिटल कल्पकता: siteget.in • विनामूल्य आवृत्ती</div>
        </div>
      </header>

      {/* 3. BREAKING NEWS TICKER CONTROL */}
      <section className="max-w-7xl mx-auto px-4">
        <BreakingNewsTicker articles={articles} onSelectArticle={handleViewArticle} />
      </section>

      {/* 4. MAIN CATEGORIES NAVIGATION BAR */}
      <nav className="max-w-7xl mx-auto px-4 mt-6">
        <div className="bg-white border-y border-gray-200 py-1 flex items-center overflow-x-auto select-none scrollbar-thin scrollbar-thumb-slate-200">
          <div className="flex mx-auto gap-1 py-1.5 px-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                   setSelectedCategory(cat);
                   setVisibleCount(10);
                   setSelectedContributor(null);
                   navigateTo({}); // Clears page sub-routes but keeps home feed with clicked category
                }}
                className={`px-4 py-2 text-sm font-bold font-serif whitespace-nowrap transition-all duration-150 rounded-lg cursor-pointer ${
                  selectedCategory === cat && !showLeaderboard && !showAdminPage && !showAboutPage && !showHelpPage
                    ? "bg-red-700 text-white shadow"
                    : "text-gray-700 hover:text-red-700 hover:bg-gray-100"
                }`}
              >
                {cat}
              </button>
            ))}
            <button
               onClick={() => {
                  navigateTo({ page: 'leaderboard' });
                  setSelectedCategory("");
               }}
               className={`px-4 py-2 text-sm font-bold font-serif whitespace-nowrap transition-all duration-150 rounded-lg cursor-pointer ${
                  showLeaderboard && !selectedContributor && !showAdminPage && !showAboutPage && !showHelpPage
                    ? "bg-red-700 text-white shadow"
                    : "text-gray-700 hover:text-red-700 hover:bg-gray-100"
               }`}
            >
               लीडरबोर्ड
            </button>
          </div>
        </div>
      </nav>

      {/* 5. MAIN CONTENT BLOCK */}
      <main className="max-w-7xl mx-auto px-4 mt-6">
        {selectedContributor ? (
            <ContributorProfile 
              contributor={selectedContributor}
              articles={articles}
              onBack={goHome}
              onViewArticle={handleViewArticle}
            />
        ) : showLeaderboard ? (
            <Leaderboard 
              contributors={contributors} 
              onSelectContributor={(id) => {
                 const c = contributors.find(x => x.id === id);
                 if (c) {
                    navigateTo({ contributor: c });
                 }
              }} 
            />
        ) : isLoading ? (
          /* Loading states skeletons */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 py-12">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
              <div className="space-y-3">
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
            <div className="space-y-6">
              <div className="h-48 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-48 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* LEFT 2 COLUMNS: FEATURED & FEED NEWS */}
            <div className="lg:col-span-2 space-y-8">
              
                  {/* Category section Title header */}
                  <div className="border-b-2 border-red-700 pb-2 flex items-center justify-between select-none">
                    <h2 className="font-serif font-black text-xl text-gray-900 flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-red-700 animate-pulse" />
                      {selectedCategory === "सर्व" ? "प्रथम मुखपृष्ठ घडामोडी" : `${selectedCategory} विभाग विशेष`}
                    </h2>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 font-bold uppercase tracking-wider">
                      आत्ताचे ताजे अपडेट्स
                    </div>
                  </div>

                  {/* New Clean Stack Layout (Bandwidth Saving) */}
                  <div className="flex flex-col divide-y divide-gray-150">
                    {filteredArticles.slice(0, visibleCount).map((art, index) => {
                      const isTop = index === 0;
                      const isMedium = index === 1 || index === 2;
                      const isTextOnly = index > 2;
                      
                      const minRead = Math.max(1, Math.ceil((art.fullText?.length || art.excerpt?.length || 0) / 1000));
                      
                      if (isTop) {
                        return (
                          <article
                            key={art.id}
                            className={`bg-white group cursor-pointer flex flex-col pb-5 mb-1`}
                            onClick={() => handleViewArticle(art)}
                          >
                            <div className={`w-full h-[220px] md:h-[380px] rounded-xl overflow-hidden mb-3 relative bg-gray-50`}>
                              <img
                                src={art.imageUrl}
                                alt={art.title}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                            </div>
                            
                            <div className="flex flex-col flex-1">
                              <span className="text-[12px] md:text-[13px] font-bold text-red-700 tracking-wide mb-1">
                                {art.category}
                              </span>
                              
                              <h3 className={`font-sans font-extrabold text-gray-900 leading-[1.3] group-hover:text-red-700 transition-colors tracking-tight mb-2 text-[22px] md:text-[30px]`}>
                                {art.title}
                              </h3>
                              
                              <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-[11px] md:text-[12px] text-gray-500 font-medium py-1 mb-2">
                                <span 
                                  className="flex items-center gap-1 cursor-pointer hover:text-gray-800 transition-colors"
                                  onClick={(e) => { e.stopPropagation(); handleViewAuthor(art); }}
                                >
                                  {art.source} 
                                </span>
                                <span>•</span>
                                <span>{art.date}</span>
                                <span>•</span>
                                <span>{minRead} min read</span>
                              </div>
                              
                              {art.excerpt && (
                                 <p className="text-[14px] md:text-[16px] text-gray-600 font-sans leading-[1.5] line-clamp-2 md:line-clamp-3">
                                   {art.excerpt}
                                 </p>
                              )}
                            </div>
                          </article>
                        );
                      }
                      
                      if (isMedium) {
                        return (
                          <article
                            key={art.id}
                            className="bg-white group cursor-pointer py-4 flex gap-3 md:gap-5"
                            onClick={() => handleViewArticle(art)}
                          >
                            <div className="w-[110px] md:w-[180px] h-[75px] md:h-[120px] rounded-lg overflow-hidden shrink-0 bg-gray-50">
                               <img
                                  src={art.imageUrl}
                                  alt={art.title}
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                               />
                            </div>
                            
                            <div className="flex flex-col flex-1 justify-center">
                              <span className="text-[10px] md:text-[12px] font-bold text-red-700 tracking-wide mb-0.5 md:mb-1">
                                {art.category}
                              </span>
                              
                              <h3 className="font-sans font-extrabold text-gray-900 leading-[1.25] group-hover:text-red-700 transition-colors tracking-tight text-[14px] md:text-[18px] line-clamp-2 md:line-clamp-3 mb-1 md:mb-2">
                                {art.title}
                              </h3>
                              
                              <div className="mt-auto flex items-center flex-wrap gap-1.5 md:gap-2 text-[10px] md:text-[11px] text-gray-500 font-medium">
                                <span 
                                  className="flex items-center gap-1 cursor-pointer hover:text-gray-800 transition-colors truncate"
                                  onClick={(e) => { e.stopPropagation(); handleViewAuthor(art); }}
                                >
                                  {art.source} 
                                </span>
                                <span>•</span>
                                <span>{art.date}</span>
                                <span className="hidden sm:inline">•</span>
                                <span className="hidden sm:inline">{minRead} min read</span>
                              </div>
                            </div>
                          </article>
                        );
                      }
                      
                      if (isTextOnly) {
                         return (
                          <article
                            key={art.id}
                            className="bg-white group cursor-pointer py-4 flex flex-col"
                            onClick={() => handleViewArticle(art)}
                          >
                            <div className="flex flex-col flex-1">
                              <span className="text-[10px] md:text-[12px] font-bold text-red-700 tracking-wide mb-0.5 md:mb-1">
                                {art.category}
                              </span>
                              
                              <h3 className="font-sans font-extrabold text-gray-900 leading-[1.25] group-hover:text-red-700 transition-colors tracking-tight text-[15px] md:text-[18px] line-clamp-2 mb-1.5 md:mb-2">
                                {art.title}
                              </h3>
                              
                              <div className="flex items-center flex-wrap gap-1.5 md:gap-2 text-[10px] md:text-[11px] text-gray-500 font-medium">
                                <span 
                                  className="flex items-center gap-1 cursor-pointer hover:text-gray-800 transition-colors"
                                  onClick={(e) => { e.stopPropagation(); handleViewAuthor(art); }}
                                >
                                  {art.source} 
                                </span>
                                <span>•</span>
                                <span>{art.date}</span>
                                <span>•</span>
                                <span>{minRead} min read</span>
                              </div>
                            </div>
                          </article>
                        );
                      }
                    })}

                    {filteredArticles.length === 0 && (
                      <div className="col-span-full bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center text-gray-500 font-sans select-none">
                        या विभागात सध्या कोणतीही बातमी उपलब्ध नाही. (No articles available)
                      </div>
                    )}
                  </div>

                  {/* Load More Button */}
                  {filteredArticles.length > visibleCount && (
                    <div className="mt-8 flex justify-center space-x-2">
                       <button
                         onClick={() => setVisibleCount(prev => prev + 10)}
                         className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 font-bold text-sm rounded-full shadow-sm hover:bg-gray-50 transition-colors cursor-pointer flex items-center justify-center min-w-[150px]"
                       >
                         आणखी बातम्या पहा (See More)
                       </button>
                    </div>
                  )}
            </div>

            {/* RIGHT SIDEBAR (35% WIDTH): AUXILIARY COMPONENT MODULES */}
            <aside className="space-y-8 lg:sticky lg:top-4">

              {/* REGIONAL MAHARASHTRA WEATHER GRID */}
              <div id="weather-sidebar-card" className="bg-white border border-gray-250 rounded-xl p-5 shadow-sm">
                <div className="flex items-center justify-between border-b border-gray-150 pb-3 mb-4 select-none">
                  <h4 className="font-serif font-bold text-gray-900 flex items-center gap-1.5">
                    <CloudSun className="h-5 w-5 text-sky-600" />
                    हवामान वृत्त (Maharashtra Weather)
                  </h4>
                  <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    तपशीलवार
                  </span>
                </div>
                
                {/* Cities grid */}
                <div className="grid grid-cols-2 gap-3">
                  {weatherList.map((c, i) => (
                    <div key={i} className="bg-slate-50 border border-gray-150 p-2.5 rounded-lg text-center space-y-0.5 select-none">
                      <span className="text-xs font-serif font-bold text-gray-800 block">{c.city}</span>
                      <span className="text-base font-mono font-bold text-orange-600 block">{c.temp}°C {c.icon}</span>
                      <span className="text-[10px] text-gray-500 block truncate font-medium font-serif">{c.condition}</span>
                    </div>
                  ))}
                </div>

                <div className="text-[10px] text-slate-400 font-serif italic text-center mt-3 select-none">
                  *अग्रोवन हवामान तज्ज्ञांकडून मिळालेली अधिकृत आकडेवारी.
                </div>
              </div>

              {/* OPINION POLL */}
              <OpinionPollCard />

            </aside>

          </div>
        )}
      </main>

      {/* FOOTER METADATA SHEET */}
      <footer className="border-t border-gray-200 mt-16 pt-8 max-w-7xl mx-auto px-4 text-center select-none">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-b border-gray-150 pb-8 text-sm text-gray-500">
          <div className="space-y-2">
            <h5 className="font-serif font-black text-gray-800 uppercase tracking-widest text-xs">देशाचे लोक</h5>
            <p className="text-xs font-serif leading-relaxed text-justify md:text-center text-gray-600">
              प्रत्येक मराठी मनाचा आवाज, महाराष्ट्रातील अस्सल घडामोडी, कृषी क्रांती, क्रीडा व संपन्न संस्कृतीचे साक्षीदार. आम्ही सत्य आणि केवळ सत्य शोधण्याचे व्रत अंगीकारले आहे.
            </p>
          </div>
          <div className="space-y-2">
            <h5 className="font-serif font-black text-gray-800 uppercase tracking-widest text-xs">विभाग सखोलता</h5>
            <div className="flex flex-wrap justify-center gap-2 text-xs">
              <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded">महाराष्ट्र</span>
              <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded">इतिहास</span>
              <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded">राजकारण</span>
              <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded">संपादकीय विशेष</span>
              <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded">मनोरंजन रंग</span>
            </div>
          </div>
          <div className="space-y-2">
            <h5 className="font-serif font-black text-gray-800 uppercase tracking-widest text-xs">डिजिटल हब</h5>
            <p className="text-xs text-gray-600 leading-relaxed text-justify md:text-center">
              आमच्याशी जुडून राहण्यासाठी आणि ताज्या घडामोडी ई-मेलवर मिळवण्यासाठी <strong className="text-red-700 font-sans">siteget.in</strong> वर आजच आपल्या नावाची नोंदणी करा.
            </p>
          </div>
        </div>

        {/* Legal copyrights details */}
        <div className="pt-6 text-xs text-gray-400 font-semibold uppercase tracking-wider space-y-1">
          <p>© २०२६ देशाचे लोक (siteget.in). सर्व हक्क सुरक्षित.</p>
          <p className="font-serif italic capitalize text-[10px] text-gray-450 font-normal">
            हे एक प्रगत आणि विश्वासार्ह डिजिटल वृत्तपत्र प्रणाली मॉडेल आहे.
          </p>
        </div>
      </footer>

    </div>
  );
};

export default App;
