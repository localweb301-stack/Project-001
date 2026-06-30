import React, { useState } from 'react';
import { Contributor, NewsArticle } from '../../types';
import { ArrowLeft, User, Eye, MessageCircle, Share2, PenTool, Award, Medal, Clock, TrendingUp, Star } from 'lucide-react';
import { getMarathiShortDateString } from '../dateUtils';

interface ContributorProfileProps {
  contributor: Contributor;
  articles: NewsArticle[];
  onBack: () => void;
  onViewArticle: (article: NewsArticle) => void;
}

export const ContributorProfile: React.FC<ContributorProfileProps> = ({ contributor, articles, onBack, onViewArticle }) => {
  const [tab, setTab] = useState<"latest" | "popular">("latest");
  
  const userArticles = articles.filter(a => a.authorId === contributor.id);
  
  const latestArticles = [...userArticles].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  const popularArticles = [...userArticles].sort((a, b) => {
      const gS = (x: NewsArticle) => (x.views * 1) + (x.commentsCount * 5) + ((x.shares||0)*10);
      return gS(b) - gS(a);
  });

  const displayArticles = tab === 'latest' ? latestArticles : popularArticles;

  const joinDateStr = getMarathiShortDateString(contributor.joinDate);

  return (
    <div className="max-w-4xl mx-auto animate-in slide-in-from-bottom-4 duration-500 pb-12">
      <button 
        onClick={onBack}
        className="mb-6 flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      {/* Profile Header */}
      <div className="bg-white rounded-2xl p-6 md:p-10 border border-gray-200 shadow-sm relative overflow-hidden mb-8">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-red-800 to-red-900 opacity-90"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row gap-6 md:gap-8 items-start pt-12">
            <div className="w-28 h-28 md:w-36 md:h-36 rounded-full border-4 border-white shadow-lg overflow-hidden bg-white shrink-0">
                <img src={contributor.avatarUrl} alt={contributor.displayName} className="w-full h-full object-cover" />
            </div>
            
            <div className="flex-1 w-full space-y-4">
               <div>
                  <h1 className="text-3xl md:text-4xl font-sans font-black text-gray-900 tracking-tight">{contributor.displayName}</h1>
                  <p 
                    className="text-blue-500 font-bold mt-1 text-base cursor-pointer hover:underline flex items-center gap-1"
                    onClick={(e) => { e.stopPropagation(); window.open(`https://x.com/${contributor.handle}`, '_blank'); }}
                  >
                    𝕏 @{contributor.handle}
                  </p>
               </div>
               <p className="text-gray-600 font-sans leading-relaxed text-lg max-w-2xl">{contributor.bio}</p>
               
               <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-gray-500 pt-2">
                 <span className="flex items-center gap-1.5 bg-gray-100 px-3 py-1 rounded-full"><Clock className="w-4 h-4"/> Joined {joinDateStr}</span>
                 {contributor.ranks.allTime > 0 && (
                   <span className="flex items-center gap-1.5 bg-yellow-50 text-yellow-800 border border-yellow-200 px-3 py-1 rounded-full font-bold">
                     <Award className="w-4 h-4"/> #{contributor.ranks.allTime} All-Time
                   </span>
                 )}
               </div>
            </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10 p-6 bg-slate-50 rounded-xl border border-slate-100">
           <div className="text-center space-y-1">
             <div className="flex items-center justify-center gap-1.5 text-gray-500 text-[11px] uppercase tracking-widest font-bold font-sans">
               <PenTool className="w-3.5 h-3.5" /> Articles
             </div>
             <div className="text-2xl font-mono font-black text-gray-900">{contributor.stats.totalArticles}</div>
           </div>
           <div className="text-center space-y-1 border-l border-slate-200">
             <div className="flex items-center justify-center gap-1.5 text-gray-500 text-[11px] uppercase tracking-widest font-bold font-sans">
               <Eye className="w-3.5 h-3.5" /> Views
             </div>
             <div className="text-2xl font-mono font-black text-gray-900">{contributor.stats.totalViews}</div>
           </div>
           <div className="text-center space-y-1 border-l border-slate-200">
             <div className="flex items-center justify-center gap-1.5 text-gray-500 text-[11px] uppercase tracking-widest font-bold font-sans">
               <MessageCircle className="w-3.5 h-3.5" /> Comments
             </div>
             <div className="text-2xl font-mono font-black text-gray-900">{contributor.stats.totalComments}</div>
           </div>
           <div className="text-center space-y-1 border-l border-slate-200">
             <div className="flex items-center justify-center gap-1.5 text-gray-500 text-[11px] uppercase tracking-widest font-bold font-sans">
               <Share2 className="w-3.5 h-3.5" /> Shares
             </div>
             <div className="text-2xl font-mono font-black text-gray-900">{contributor.stats.totalShares}</div>
           </div>
        </div>

        {/* Badges Section */}
        {contributor.badges.length > 0 && (
          <div className="mt-8 pt-8 border-t border-gray-100">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-4">Achievements</h3>
            <div className="flex flex-wrap gap-4">
               {contributor.badges.map(b => (
                 <div key={b.id} className="group relative flex flex-col items-center p-3 rounded-xl hover:bg-slate-50 transition-colors w-24 text-center cursor-default">
                    <div className="w-12 h-12 bg-white rounded-full shadow border border-gray-100 flex items-center justify-center mb-2 text-red-600">
                       {b.icon === 'award' ? <Award className="w-6 h-6"/> : 
                        b.icon === 'medal' ? <Medal className="w-6 h-6"/> :
                        b.icon === 'eye' ? <Eye className="w-6 h-6"/> :
                        b.icon === 'pen-tool' ? <PenTool className="w-6 h-6"/> :
                        <Star className="w-6 h-6"/>}
                    </div>
                    <span className="text-[10px] font-bold text-gray-700 leading-tight">{b.name}</span>
                    <div className="absolute opacity-0 group-hover:opacity-100 bottom-full mb-2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded w-32 left-1/2 -translate-x-1/2 pointer-events-none transition-opacity z-20">
                      {b.description}
                    </div>
                 </div>
               ))}
            </div>
          </div>
        )}
      </div>

      {/* Articles Section */}
      <div className="space-y-6">
         <div className="flex border-b border-gray-200">
            <button 
              onClick={() => setTab('latest')}
              className={`pb-3 px-4 font-bold text-sm tracking-wide ${tab === 'latest' ? 'border-b-2 border-red-700 text-gray-900' : 'text-gray-400 hover:text-gray-700'}`}
            >
               LATEST ARTICLES
            </button>
            <button 
              onClick={() => setTab('popular')}
              className={`pb-3 px-4 font-bold text-sm tracking-wide ${tab === 'popular' ? 'border-b-2 border-red-700 text-gray-900' : 'text-gray-400 hover:text-gray-700'}`}
            >
               MOST POPULAR
            </button>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {displayArticles.map(art => (
              <article
                  key={art.id}
                  className="bg-white group cursor-pointer flex flex-col rounded-xl overflow-hidden border border-gray-200 hover:shadow-md transition-all"
                  onClick={() => onViewArticle(art)}
              >
                  <div className="w-full h-48 overflow-hidden">
                     <img
                       src={art.imageUrl}
                       alt={art.title}
                       referrerPolicy="no-referrer"
                       className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                     />
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                     <span className="text-[11px] font-bold text-red-700 uppercase tracking-widest mb-1">{art.category}</span>
                     <h4 className="font-sans font-bold text-gray-900 text-[18px] leading-[1.3] line-clamp-2 group-hover:text-red-700 transition-colors mb-3">
                       {art.title}
                     </h4>
                     <p className="text-sm font-serif text-gray-600 line-clamp-2 mb-4 leading-relaxed">
                       {art.excerpt}
                     </p>
                     <div className="mt-auto flex items-center justify-between text-[11px] text-gray-500 font-medium pt-3 border-t border-gray-100">
                        <span className="flex items-center gap-1.5"><Eye className="w-3.5 h-3.5"/> {art.views}</span>
                        <span>{art.date}</span>
                     </div>
                  </div>
              </article>
            ))}
            {displayArticles.length === 0 && (
                <div className="col-span-full py-12 text-center text-gray-500 font-serif border border-dashed rounded-xl">
                    No articles found.
                </div>
            )}
         </div>
      </div>
    </div>
  );
};
