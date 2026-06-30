import React, { useState } from "react";
import { ArrowLeft, Clock, Share2, ThumbsUp, Eye, Maximize2, Tag, ChevronRight } from "lucide-react";
import { NewsArticle, Contributor } from "../../types";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ArticlePageProps {
  article: NewsArticle;
  contributors: Contributor[];
  onLikeUpdate: (id: string, newLikes: number) => void;
  allArticles?: NewsArticle[];
  onViewArticle?: (article: NewsArticle) => void;
  onClose?: () => void;
  onCategoryClick?: (category: string) => void;
}

export const ArticlePage: React.FC<ArticlePageProps> = ({ article, contributors, onLikeUpdate, allArticles = [], onViewArticle, onClose, onCategoryClick }) => {
  const [likes, setLikes] = useState(article.likes);
  const [isLiking, setIsLiking] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);

    try {
      // Simulate network request
      await new Promise(resolve => setTimeout(resolve, 300));
      const newLikesCount = likes + 1;
      setLikes(newLikesCount);
      onLikeUpdate(article.id, newLikesCount);
    } catch (err) {
      console.error("Error liking article:", err);
    } finally {
      setIsLiking(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <article className="animate-fade-in relative pb-10">

      {/* Breadcrumb Navigation */}
      <nav className="flex text-sm text-gray-500 font-medium mb-6 mt-2" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1 md:space-x-2">
          <li className="inline-flex items-center hover:text-red-700 cursor-pointer transition-colors" onClick={() => onClose ? onClose() : window.history.back()}>
            Home
          </li>
          <li>
            <div className="flex items-center">
              <ChevronRight className="w-4 h-4 text-gray-400 mx-1" />
              <span 
                className="hover:text-red-700 cursor-pointer transition-colors"
                onClick={() => onCategoryClick && onCategoryClick(article.category)}
              >
                {article.category}
              </span>
            </div>
          </li>
          <li aria-current="page">
            <div className="flex items-center">
              <ChevronRight className="w-4 h-4 text-gray-400 mx-1" />
              <span className="text-gray-400 line-clamp-1 w-32 md:w-64">{article.title}</span>
            </div>
          </li>
        </ol>
      </nav>

      <div className="space-y-4">
        
        {/* Category Header */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-gray-900 text-base font-black tracking-wider select-none uppercase">
            {article.category}
          </span>
        </div>

        {/* Title */}
        <h1 className="text-[30px] md:text-[42px] font-sans font-extrabold text-gray-900 leading-[1.25] md:leading-[1.2] tracking-tight">
          {article.title}
        </h1>

        {/* Excerpt */}
        <p className="text-[18px] md:text-[22px] text-gray-700 leading-relaxed font-sans font-medium mb-4">
          {article.excerpt}
        </p>

        {/* Hero Image */}
        <figure className="relative w-full overflow-hidden bg-slate-100 rounded-xl mt-4 mb-5 shadow-sm">
          <img
            src={article.imageUrl}
            alt={article.title}
            referrerPolicy="no-referrer"
            className="w-full h-auto object-cover max-h-[500px]"
          />
        </figure>

        {/* Meta Info: Author & Date Block */}
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-200 pb-4 pt-2 select-none gap-4">
          <div className="flex items-center gap-2 text-slate-700">
            <div className="flex flex-col space-y-1">
              <span className="text-[15px] font-bold text-slate-900 flex items-center gap-1.5">
                {article.source}
                {article.authorHandle && <span className="text-blue-500 hover:text-blue-600 font-mono text-[12px] opacity-80 mt-0.5 cursor-pointer" onClick={(e) => { e.stopPropagation(); window.open(`https://x.com/${article.authorHandle}`, '_blank'); }}>𝕏 {article.authorHandle}</span>}
              </span>
              <span className="text-[13px] text-slate-500 font-medium">
                Updated on: {article.date} | 10:25 am IST
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 font-bold font-mono pt-2 md:pt-0">
            <span className="flex items-center gap-1.5" title="वाचकांचे समाधान">
              <Eye className="h-5 w-5" />
              {article.views.toLocaleString('en-IN')}
            </span>
            <button 
              onClick={handleLike}
              disabled={isLiking}
              className="flex items-center gap-1.5 hover:text-red-700 transition-colors cursor-pointer active:scale-95"
              title="आवडले"
            >
              <ThumbsUp className={`h-5 w-5 ${isLiking ? 'text-red-700' : ''}`} />
              {likes.toLocaleString('en-IN')}
            </button>
            <div className="flex items-center gap-2">
               <button
                 onClick={() => window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(window.location.href)}`, '_blank')}
                 className="p-1.5 bg-[#25D366] text-white rounded hover:opacity-90 transition-opacity"
                 title="Share on WhatsApp"
               >
                 <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
               </button>
               <button
                 onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(article.title)}`, '_blank')}
                 className="p-1.5 bg-black text-white rounded hover:opacity-90 transition-opacity"
                 title="Share on X"
               >
                 <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
               </button>
               <button
                 onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank')}
                 className="p-1.5 bg-[#1877F2] text-white rounded hover:opacity-90 transition-opacity"
                 title="Share on Facebook"
               >
                 <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
               </button>
               <button
                 onClick={handleShare}
                 className="p-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                 title="Copy Link"
               >
                 <Share2 className="h-4 w-4" />
               </button>
            </div>
            {isCopied && <span className="text-xs text-green-600 font-sans">कॉपी केले!</span>}
          </div>
        </div>

        {/* Content Section */}
        <section className="pt-2">
          {article.fullText ? (
            <div className="prose max-w-none font-sans 
                            prose-headings:font-sans prose-headings:font-black prose-headings:tracking-tight prose-headings:text-gray-900 
                            prose-h2:text-[28px] md:prose-h2:text-[32px] prose-h2:mt-10 prose-h2:mb-4 prose-h2:border-none
                            prose-h3:text-[24px] prose-h3:mt-8 prose-h3:mb-3 
                            prose-p:text-[18px] md:prose-p:text-[20px] prose-p:text-gray-800 prose-p:leading-[1.8] prose-p:mb-5 
                            prose-strong:font-bold prose-strong:text-black prose-strong:bg-transparent 
                            prose-ul:my-5 prose-ul:bg-transparent prose-ul:p-0 prose-ul:pl-6 prose-ul:rounded-none prose-ul:border-none prose-ul:list-disc
                            prose-li:marker:text-black prose-li:text-[18px] md:prose-li:text-[20px] prose-li:text-gray-800 prose-li:my-1.5 prose-li:pl-1 
                            prose-blockquote:border-l-[5px] prose-blockquote:border-gray-300 prose-blockquote:bg-gray-50/50 prose-blockquote:py-3 prose-blockquote:px-5 prose-blockquote:my-6 prose-blockquote:rounded-none prose-blockquote:not-italic prose-blockquote:font-sans prose-blockquote:font-medium prose-blockquote:text-gray-900 prose-blockquote:text-[20px] 
                            prose-a:text-[#0056b3] hover:prose-a:text-[#003d82] prose-a:underline-offset-4 prose-a:decoration-[#0056b3]/30">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {article.fullText}
              </ReactMarkdown>
            </div>
          ) : (
            <div className="prose max-w-none font-sans text-gray-800 leading-[1.8] tracking-wide text-[18px] md:text-[20px]">
              संपूर्ण बातमी लवकरच उपलब्ध होईल...
            </div>
          )}
        </section>

        {/* Footer Tags & End mark */}
        <footer className="pt-8 border-t border-gray-200 mt-8 select-none mb-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-gray-400" />
              <div className="flex gap-2">
                <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded uppercase tracking-wider">{article.category}</span>
                <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded uppercase tracking-wider">ताज्या घडामोडी</span>
              </div>
            </div>
            
            <div className="h-1 w-12 bg-red-700 rounded-full"></div>
          </div>
        </footer>
        
        {/* Related Articles */}
        {allArticles && allArticles.length > 0 && (
          <section className="pt-8 border-t border-gray-200">
             <h3 className="text-xl font-sans font-black text-gray-900 mb-6 flex items-center gap-2">
                <div className="w-1.5 h-6 bg-red-700 rounded-full"></div>
                अधिक बातम्या (Related News)
             </h3>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {allArticles
                  .filter(a => a.id !== article.id && (a.category === article.category || a.category === "महाराष्ट्र"))
                  .slice(0, 4)
                  .map(related => (
                    <article 
                      key={related.id} 
                      className="group cursor-pointer flex flex-col bg-white border border-gray-150 rounded-xl overflow-hidden hover:shadow-md transition-shadow"
                      onClick={() => onViewArticle && onViewArticle(related)}
                    >
                      <div className="w-full h-36 overflow-hidden">
                        <img 
                          src={related.imageUrl} 
                          alt={related.title} 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="p-4 flex flex-col flex-1">
                        <span className="text-[11px] font-bold text-red-700 tracking-wider mb-1.5">{related.category}</span>
                        <h4 className="font-sans font-bold text-gray-900 text-[16px] leading-[1.3] line-clamp-2 group-hover:text-red-700 transition-colors mb-2">
                          {related.title}
                        </h4>
                        <div className="mt-auto flex items-center justify-between text-[11px] text-gray-500 font-medium pt-3 border-t border-gray-100">
                          <span>{related.source}</span>
                          <span>{related.date}</span>
                        </div>
                      </div>
                    </article>
                ))}
             </div>
          </section>
        )}

      </div>
    </article>
  );
};
