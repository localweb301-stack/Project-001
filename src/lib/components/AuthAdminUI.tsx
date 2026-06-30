import React, { useState, useEffect } from "react";
import { ShieldAlert, LogOut, Twitter, Plus, Trash2, User, KeyRound, AlertCircle, FileText, Lock, X, Edit2 } from "lucide-react";
import { onAuthStateChanged, signInWithPopup, getRedirectResult, signOut } from "firebase/auth";
import { auth, googleProvider, twitterProvider, isFirebaseConfigured } from "../firebase";
import { getWhitelistedUsers, addWhitelistedUser, removeWhitelistedUser, getArticles, deleteArticle, getOpinionPolls, createOpinionPoll, deleteOpinionPoll } from "../store";
import { AdminPanel } from "./AdminPanel";
import { NewsArticle } from "../../types";

export const AuthAdminUI: React.FC<{ onArticleAdded: () => void }> = ({ onArticleAdded }) => {
  const [user, setUser] = useState<any>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [whitelist, setWhitelist] = useState<string[]>([]);
  const [newWhitelistedUser, setNewWhitelistedUser] = useState("");
  const [authError, setAuthError] = useState("");
  const [localArticles, setLocalArticles] = useState<NewsArticle[]>([]);
  const [editingArticle, setEditingArticle] = useState<NewsArticle | null>(null);
  
  const [polls, setPolls] = useState<any[]>([]);
  const [newPollQuestion, setNewPollQuestion] = useState("");
  const [newPollOpt1, setNewPollOpt1] = useState("");
  const [newPollOpt2, setNewPollOpt2] = useState("");
  
  const superAdminEmails = ["dipeshnalawade1234@gmail.com", "localweb301@gmail.com"];

  useEffect(() => {
    setWhitelist(getWhitelistedUsers());
    setLocalArticles(getArticles());
    setPolls(getOpinionPolls());

    if (!isFirebaseConfigured) {
      setLoadingAuth(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth!, (user) => {
      setUser(user);
      setLoadingAuth(false);
    });

    getRedirectResult(auth!).catch((err) => {
      console.error(err);
      if (err.code === 'auth/unauthorized-domain') {
        setAuthError("Firebase: Your domain (siteget.in) is not authorized in Firebase Console > Authentication > Settings > Authorized domains.");
      } else {
        setAuthError(err.message);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    if (!isFirebaseConfigured) {
      setAuthError("Firebase keys missing");
      return;
    }
    setAuthError("");
    try {
      await signInWithPopup(auth!, googleProvider);
    } catch (err: any) {
      if (err.code === 'auth/configuration-not-found') {
        setAuthError("Please enable 'Google' sign-in provider in your Firebase Console > Authentication > Sign-in method.");
      } else {
        setAuthError(err.message);
      }
    }
  };

  const handleTwitterLogin = async () => {
    if (!isFirebaseConfigured) {
      setAuthError("Firebase keys missing");
      return;
    }
    setAuthError("");
    try {
      await signInWithPopup(auth!, twitterProvider);
    } catch (err: any) {
      if (err.code === 'auth/configuration-not-found') {
        setAuthError("Please enable 'Twitter' sign-in provider in your Firebase Console > Authentication > Sign-in method.");
      } else {
        setAuthError(err.message);
      }
    }
  };

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
    }
  };

  const handleAddWhitelist = () => {
    if (!newWhitelistedUser.trim()) return;
    const handle = newWhitelistedUser.trim().replace('@', ''); // Remove @ if they typed it
    addWhitelistedUser(handle);
    setWhitelist(getWhitelistedUsers());
    setNewWhitelistedUser("");
  };

  const handleRemoveWhitelist = (handle: string) => {
    if (window.confirm(`Are you sure you want to remove @${handle} from the whitelist?`)) {
      removeWhitelistedUser(handle);
      setWhitelist(getWhitelistedUsers());
    }
  };

  const handleDeleteArticle = (id: string) => {
    if (window.confirm("Are you sure you want to delete this article?")) {
      deleteArticle(id);
      setLocalArticles(getArticles());
      onArticleAdded();
    }
  };

  const handleCreatePoll = () => {
    if (!newPollQuestion.trim() || !newPollOpt1.trim() || !newPollOpt2.trim()) return;
    const poll = {
       id: "poll_" + Date.now().toString(),
       question: newPollQuestion,
       options: [
         { id: "opt_" + Date.now() + "1", text: newPollOpt1, votes: 0 },
         { id: "opt_" + Date.now() + "2", text: newPollOpt2, votes: 0 }
       ],
       createdAt: Date.now(),
       isActive: true
    };
    createOpinionPoll(poll);
    setPolls(getOpinionPolls());
    setNewPollQuestion("");
    setNewPollOpt1("");
    setNewPollOpt2("");
  };

  const handleDeletePoll = (id: string) => {
    if (window.confirm("Are you sure you want to delete this poll?")) {
      deleteOpinionPoll(id);
      setPolls(getOpinionPolls());
    }
  };

  if (loadingAuth) {
    return (
      <div className="bg-white p-4 rounded shadow-sm border border-gray-200 flex justify-center py-10">
        <div className="h-6 w-6 border-4 border-red-700 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Not logged in State
  if (!user) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mt-8 max-w-md mx-auto">
        <div className="p-8 text-center bg-gray-50 border-b border-gray-100">
          <div className="h-14 w-14 bg-white border border-gray-200 shadow-sm rounded-2xl flex items-center justify-center mx-auto mb-4">
            <User className="h-6 w-6 text-slate-800" />
          </div>
          <h2 className="text-2xl font-sans font-black text-gray-900 tracking-tight">Login</h2>
          <p className="text-sm text-gray-500 mt-2 font-medium">Sign in to access your publisher dashboard.</p>
        </div>
        
        <div className="p-8 space-y-4">
          {authError && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm border border-red-100 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 font-bold py-3.5 px-4 text-sm rounded-xl hover:bg-gray-50 hover:shadow-sm transition-all"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>
          
          <button
            onClick={handleTwitterLogin}
            className="w-full flex items-center justify-center gap-3 bg-black text-white font-bold py-3.5 px-4 text-sm rounded-xl hover:bg-gray-800 hover:shadow-sm transition-all"
          >
            <Twitter className="h-5 w-5" fill="currentColor" />
            Continue with X
          </button>
        </div>
      </div>
    );
  }

  const isSuperAdmin = superAdminEmails.includes(user?.email || "");
  const isTwitterUser = user?.providerData?.some((p: any) => p.providerId === 'twitter.com');
  const twitterScreenName = 
    user?.reloadUserInfo?.screenName || 
    user?.providerData?.find((p: any) => p.providerId === 'twitter.com')?.uid || 
    "";
    
  const isWhitelisted = (whitelist || []).map(w => (w || "").toLowerCase()).includes((twitterScreenName || "").toLowerCase());
  const canAccessEditorial = isSuperAdmin || (isTwitterUser && isWhitelisted);

  return (
    <div className="space-y-6 mt-6 max-w-4xl mx-auto animate-in fade-in zoom-in-95 duration-300">
      <div className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-slate-100 border border-slate-200 p-0.5 rounded-full overflow-hidden flex items-center justify-center shrink-0">
             {user.photoURL ? (
               <img src={user.photoURL} alt="Avatar" className="w-full h-full rounded-full object-cover" />
             ) : (
               <User className="h-5 w-5 text-slate-400" />
             )}
          </div>
          <div className="truncate">
            <h3 className="font-black font-serif text-gray-900 truncate">{user.displayName || "Author"}</h3>
            <div className="text-[11px] text-gray-500 font-medium">
              {isSuperAdmin ? (
                <span className="text-red-600 font-bold tracking-widest uppercase flex items-center gap-1">
                  <KeyRound className="h-3 w-3" /> System Admin
                </span>
              ) : (
                <span className="font-mono">@{twitterScreenName || "unknown"}</span>
              )}
            </div>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-1.5 justify-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer hover:-translate-y-0.5"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>

      {isSuperAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-sans font-bold text-gray-900 mb-4 border-b pb-3 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-slate-800" />
              Whitelist Publishers
            </h3>

            <div className="flex gap-2 mb-4">
              <input 
                type="text" 
                value={newWhitelistedUser}
                onChange={e => setNewWhitelistedUser(e.target.value)}
                placeholder="X Username"
                className="flex-1 min-w-0 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition-shadow"
              />
              <button 
                onClick={handleAddWhitelist}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-lg flex items-center gap-1 text-sm shrink-0 cursor-pointer shadow-sm transition-all hover:-translate-y-0.5"
              >
                <Plus className="h-4 w-4" /> Add
              </button>
            </div>

            <div className="space-y-2 max-h-40 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200">
               {whitelist.length === 0 ? (
                 <p className="text-xs text-gray-400 font-medium text-center py-4 bg-gray-50 rounded-lg">No accounts whitelisted.</p>
               ) : (
                 whitelist.map(handle => (
                   <div key={handle} className="flex items-center justify-between p-2.5 bg-gray-50 border border-gray-100 rounded-lg text-sm group hover:border-gray-200 transition-colors">
                     <span className="font-mono font-bold text-gray-700 truncate">@{handle}</span>
                     <button 
                       onClick={() => handleRemoveWhitelist(handle)}
                       className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-md shrink-0 cursor-pointer transition-colors"
                     >
                       <Trash2 className="h-4 w-4" />
                     </button>
                   </div>
                 ))
               )}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-sans font-bold text-gray-900 mb-4 border-b pb-3 flex items-center gap-2">
              <FileText className="h-4 w-4 text-slate-800" />
              Opinion Polls
            </h3>
            
            <div className="space-y-3 mb-4">
              <input 
                type="text" 
                value={newPollQuestion}
                onChange={e => setNewPollQuestion(e.target.value)}
                placeholder="Poll Question"
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition-shadow"
              />
              <div className="flex flex-col sm:flex-row gap-2">
                <input 
                  type="text" 
                  value={newPollOpt1}
                  onChange={e => setNewPollOpt1(e.target.value)}
                  placeholder="Option 1"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition-shadow"
                />
                <input 
                  type="text" 
                  value={newPollOpt2}
                  onChange={e => setNewPollOpt2(e.target.value)}
                  placeholder="Option 2"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition-shadow"
                />
              </div>
              <button 
                onClick={handleCreatePoll}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 rounded-lg flex items-center justify-center gap-1 text-sm cursor-pointer shadow-sm transition-all hover:-translate-y-0.5"
              >
                <Plus className="h-4 w-4" /> Publish Poll
              </button>
            </div>

            <div className="space-y-2 max-h-40 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200">
               {polls.length === 0 ? (
                 <p className="text-xs text-gray-400 font-medium text-center py-4 bg-gray-50 rounded-lg">No active polls.</p>
               ) : (
                 polls.map(p => (
                   <div key={p.id} className="flex flex-col gap-2 p-3 bg-gray-50 border border-gray-100 rounded-lg text-sm group hover:border-gray-200 transition-colors">
                     <div className="flex items-start justify-between gap-2">
                       <span className="font-bold text-gray-800 leading-tight block">{p.question}</span>
                       <button 
                         onClick={() => handleDeletePoll(p.id)}
                         className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-md shrink-0 cursor-pointer transition-colors"
                       >
                         <Trash2 className="h-4 w-4" />
                       </button>
                     </div>
                     <div className="flex gap-3 text-xs font-mono text-slate-500 font-bold bg-white p-1.5 rounded border border-gray-100">
                       {p.options.map((opt: any) => (
                         <span key={opt.id} className="flex-1 text-center truncate">{opt.text}: <span className="text-slate-800">{opt.votes}</span></span>
                       ))}
                     </div>
                   </div>
                 ))
               )}
            </div>
          </div>
        </div>
      )}

      {canAccessEditorial && (
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-sans font-bold text-gray-900 mb-4 border-b pb-3 flex items-center gap-2">
              <FileText className="h-4 w-4 text-slate-800" />
              Manage {isSuperAdmin ? "All Articles" : "My Articles"}
            </h3>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200">
               {(isSuperAdmin ? localArticles || [] : (localArticles || []).filter(a => a.authorId === user?.uid)).length === 0 ? (
                 <p className="text-xs text-gray-400 font-medium text-center py-4 bg-gray-50 rounded-lg">No articles found.</p>
               ) : (
                 (isSuperAdmin ? localArticles || [] : (localArticles || []).filter(a => a.authorId === user?.uid)).map(article => (
                   <div key={article.id} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-xl gap-3 group hover:border-gray-200 transition-colors">
                     <div className="min-w-0 flex-1">
                       <h4 className="text-sm font-bold text-gray-800 truncate">{article.title}</h4>
                       <p className="text-xs text-gray-500 truncate mt-0.5">{article.date} • {article.category} • {article.views || 0} Views</p>
                     </div>
                     <div className="flex items-center gap-1 transition-opacity">
                       <button 
                         onClick={() => {
                           setEditingArticle(article);
                           window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                         }}
                         className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 p-2 rounded-lg shrink-0 cursor-pointer transition-colors"
                         title="Edit Article"
                       >
                         <Edit2 className="h-4 w-4" />
                       </button>
                       <button 
                         onClick={() => handleDeleteArticle(article.id)}
                         className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg shrink-0 cursor-pointer transition-colors"
                         title="Delete Article"
                       >
                         <Trash2 className="h-4 w-4" />
                       </button>
                     </div>
                   </div>
                 ))
               )}
            </div>
          </div>
        </div>
      )}

      {canAccessEditorial ? (
        <AdminPanel 
           key={editingArticle ? editingArticle.id : "new-article"}
           onArticleAdded={() => {
             setLocalArticles(getArticles());
             setEditingArticle(null);
             onArticleAdded();
           }} 
           uid={user?.uid}
           authorHandle={twitterScreenName}
           authorName={user?.displayName || "Author"}
           editingArticle={editingArticle}
           onCancelEdit={() => setEditingArticle(null)}
        />
      ) : (
         <div className="bg-white border border-red-100 rounded-2xl p-8 text-center shadow-lg mt-6 max-w-sm mx-auto animate-in fade-in zoom-in-95">
            <div className="h-16 w-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="h-8 w-8 text-red-500" />
            </div>
            <h2 className="text-lg font-black font-serif text-gray-900 mb-2">Access Denied</h2>
            <p className="text-sm text-gray-500">
              You are not an authorized publisher. Contact an admin to whitelist <strong className="text-gray-900">@{twitterScreenName}</strong>.
            </p>
         </div>
      )}
    </div>
  );
};

