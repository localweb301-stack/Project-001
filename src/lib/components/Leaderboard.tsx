import React, { useState } from 'react';
import { Trophy, Medal, Star, Filter, Verified } from 'lucide-react';
import { Contributor } from '../../types';

interface LeaderboardProps {
  contributors: Contributor[];
  onSelectContributor: (id: string) => void;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ contributors, onSelectContributor }) => {
  const [period, setPeriod] = useState<"allTime" | "monthly" | "weekly">("allTime");
  
  // Create a sorted list based on the chosen period
  const sortedContributors = [...contributors].sort((a, b) => {
     if (period === "allTime") return a.ranks.allTime - b.ranks.allTime;
     if (period === "monthly") return a.ranks.monthly - b.ranks.monthly;
     if (period === "weekly") return a.ranks.weekly - b.ranks.weekly;
     return 0;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="border-b border-gray-200 pb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-3xl font-sans font-black text-gray-900 tracking-tight">
              लेखक लीडरबोर्ड
            </h1>
            <p className="text-gray-500 font-sans mt-2">आमचे उत्कृष्ट लेखक आणि त्यांचे योगदान</p>
          </div>
          
          <div className="flex bg-gray-100 rounded-lg p-1">
             <button
                onClick={() => setPeriod('weekly')}
                className={`px-4 py-1.5 rounded-md text-[13px] font-bold transition-colors ${period === 'weekly' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
             >Weekly</button>
             <button
                onClick={() => setPeriod('monthly')}
                className={`px-4 py-1.5 rounded-md text-[13px] font-bold transition-colors ${period === 'monthly' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
             >Monthly</button>
             <button
                onClick={() => setPeriod('allTime')}
                className={`px-4 py-1.5 rounded-md text-[13px] font-bold transition-colors ${period === 'allTime' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
             >All Time</button>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        {/* Table Header */}
        <div className="hidden md:flex items-center gap-4 p-4 border-b border-gray-200 bg-gray-50 text-[11px] font-bold text-gray-500 uppercase tracking-widest">
            <div className="w-12 text-center">Rank</div>
            <div className="flex-1">Contributor</div>
            <div className="w-24 text-center">Articles</div>
            <div className="w-24 text-center">Views</div>
            <div className="w-24 text-right pr-4">Score</div>
        </div>

        <div className="divide-y divide-gray-100">
        {sortedContributors.map((c, idx) => {
           let rank = c.ranks.allTime;
           let score = c.scores.allTime;
           if (period === 'monthly') { rank = c.ranks.monthly; score = c.scores.monthly; }
           if (period === 'weekly') { rank = c.ranks.weekly; score = c.scores.weekly; }

           return (
             <div 
               key={c.id} 
               onClick={() => onSelectContributor(c.id)}
               className="flex items-center gap-4 p-4 cursor-pointer hover:bg-gray-50 transition-colors group"
             >
               <div className="w-8 md:w-12 text-center flex-shrink-0">
                 {rank === 1 ? <span className="font-serif font-black text-xl text-yellow-600">1</span> :
                  rank === 2 ? <span className="font-serif font-black text-xl text-slate-400">2</span> :
                  rank === 3 ? <span className="font-serif font-black text-xl text-orange-700">3</span> :
                  <span className="font-serif font-bold text-lg text-gray-400">{rank}</span>}
               </div>
               
               <div className="relative w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden shrink-0 border border-gray-200">
                 <img src={c.avatarUrl} alt={c.displayName} className="w-full h-full object-cover" />
               </div>
               
               <div className="flex-1 min-w-0">
                 <h3 className="font-sans font-bold text-gray-900 md:text-lg flex items-center gap-1.5 truncate group-hover:text-red-700 transition-colors">
                   {c.displayName}
                   {c.badges.some(b => b.id === 'TOP_CONTRIBUTOR') && <Verified className="w-3.5 h-3.5 text-blue-500"/>}
                 </h3>
                 <p className="text-[13px] font-medium text-gray-500">{c.handle}</p>
               </div>

               <div className="hidden md:flex items-center gap-4">
                  <div className="w-24 text-center">
                    <p className="font-mono font-bold text-gray-700">{c.stats.totalArticles}</p>
                  </div>
                  <div className="w-24 text-center">
                    <p className="font-mono font-bold text-gray-700">{(c.stats.totalViews / 1000).toFixed(1)}k</p>
                  </div>
               </div>

               <div className="w-20 md:w-24 text-right md:pr-4 flex-shrink-0">
                 <div className="inline-flex font-mono font-black text-lg text-gray-900 items-baseline gap-1">
                   {score}
                 </div>
               </div>
             </div>
           );
        })}
        </div>
      </div>
    </div>
  );
};
