import React, { useState } from "react";
import { PenTool, Wand2, Plus, AlertCircle, CheckCircle2, AlertTriangle, ImagePlus, X } from "lucide-react";
import { NewsArticle } from "../../types";
import { addArticle, updateArticle } from "../store";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getMarathiShortDateString } from "../dateUtils";

export const AdminPanel: React.FC<{ 
  onArticleAdded: () => void;
  uid?: string;
  authorHandle?: string;
  authorName?: string;
  editingArticle?: NewsArticle | null;
  onCancelEdit?: () => void;
}> = ({ onArticleAdded, uid, authorHandle, authorName, editingArticle, onCancelEdit }) => {
  const [rawText, setRawText] = useState(editingArticle?.fullText || "");
  const [category, setCategory] = useState(editingArticle?.category || "महाराष्ट्र");
  
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhancedData, setEnhancedData] = useState<{ title: string, excerpt: string, fullText: string, slug?: string } | null>(
    editingArticle ? {
      title: editingArticle.title,
      excerpt: editingArticle.excerpt,
      fullText: editingArticle.fullText,
      slug: editingArticle.slug || editingArticle.id,
    } : null
  );
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);

  const [customImage, setCustomImage] = useState<string | null>(editingArticle?.imageUrl || null);

  
  // Advanced Extra Images
  const [extraImages, setExtraImages] = useState<{url: string, context: string}[]>([]);
  const [aiMode, setAiMode] = useState<"strict" | "moderate" | "full">("full");

  const [isCompressing, setIsCompressing] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isExtra: boolean = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressing(true);
    try {
      const compressedDataUrl = await compressImage(file);
      if (isExtra) {
        setExtraImages([...extraImages, { url: compressedDataUrl, context: "" }]);
      } else {
        setCustomImage(compressedDataUrl);
      }
    } catch (err) {
      setErrorMsg("छायाचित्र अपलोड करताना त्रुटी आली. (Error uploading image)");
    } finally {
      setIsCompressing(false);
    }
  };

  const compressImage = (file: File, maxWidth = 800, quality = 0.7): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", quality));
        };
        img.onerror = (error) => reject(error);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const categories = ["महाराष्ट्र", "इतिहास", "राजकारण", "संपादकीय", "मनोरंजन", "राष्ट्रीय"];

  const handleEnhance = async () => {
    if (!rawText.trim()) return;
    setIsEnhancing(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      let imageInstruction = "";
      if (extraImages.length > 0) {
        imageInstruction = `\n7. **Images Integration:** We have additional images. You MUST visually embed them in the markdown using \`![alt text](url)\`. Combine the following image data contextively into the text:\n` + extraImages.map((img, i) => `Image ${i+1} URL: ${img.url}\nContext/Description: ${img.context}`).join("\n") + "\n";
      }

      let systemPrompt = "";
      if (aiMode === "strict") {
         systemPrompt = `You are an elite Marathi News Editor for a premium newspaper.
The reporter provided a complete article draft. You MUST keep the exact original words, meaning, and length intact.
Do NOT add extra paragraphs, do NOT change the tone. Fix ONLY grammatical errors, punctuation, and format it nicely with markdown.
REQUIREMENTS:
1. Fix grammar, syntax, and punctuation without removing or adding unnecessary words.
2. Structure the text properly with paragraphs. Do NOT add a new introduction or conclusion if it's not in the draft.
3. Use bold text (\`**like this**\`) for emphasis on key names/dates.
4. Professional tone.${imageInstruction}`;
      } else if (aiMode === "moderate") {
         systemPrompt = `You are an elite Marathi News Editor for a premium newspaper.
The reporter provided a draft article. Enhance the flow, engagement, and structure (about 50% enhancement), but closely retain the core voice, original phrasing, and overall length.
REQUIREMENTS:
1. Make the writing more engaging but do NOT write a totally new article. Retain original facts and overall structure.
2. Use Subheadings (\`##\` or \`###\`) if appropriate.
3. Use bold text (\`**like this**\`) for emphasis.
4. Keep the tone professional and journalistic.${imageInstruction}`;
      } else {
         systemPrompt = `You are an elite Marathi News Editor for a premium newspaper like Sakal or Loksatta.
The reporter provided raw notes. You must write a comprehensive, highly engaging news article.

REQUIREMENTS FOR THE "fullText" FIELD (RICH MARKDOWN):
1. **Lead Paragraph:** Start with a strong, slightly longer introductory paragraph summarizing the core news. Make it captivating.
2. **Key Highlights:** Include a bulleted list of 3-4 key takeaways (महत्वाचे मुद्दे) right after the lead.
3. **Subheadings:** Use \`##\` (Main sections) and \`###\` (Sub-sections) to break up the article logically. Do NOT just write top-to-bottom plain text.
4. **Emphasis:** Liberally use **bold text** (\`**like this**\`) for important names, numbers, dates, locations, and key phrases throughout all paragraphs to improve scannability.
5. **Quotes/Insights:** Include at least one blockquote (\`> \`) for an expert opinion, official statement, or critical highlight.
6. **Tone:** Professional, authoritative, and engaging journalism. Keep paragraphs relatively short (2-4 sentences) for readability.${imageInstruction}`;
      }

      const prompt = `${systemPrompt}

Raw Notes:
"${rawText}"
Category: ${category}

Respond with ONLY a JSON object exactly matching this schema (do NOT use markdown blocks like \`\`\`json, just return the raw JSON):
{
  "title": "A highly engaging professional Marathi news headline",
  "excerpt": "A short, precise summary (approx 2 sentences)",
  "fullText": "The complete markdown formatted article string.",
  "slug": "An SEO-friendly english URL slug (e.g. 'maratha-reservation-protest-mumbai')"
}`;

      const response = await fetch("/api/enhance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to enhance article via API.");
      }

      const generatedData = await response.json();
      
      if (!generatedData.title || !generatedData.fullText) {
         throw new Error("Invalid format received from AI.");
      }

      setEnhancedData(generatedData);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to enhance article");
    } finally {
      setIsEnhancing(false);
    }
  };

  const handlePublish = async () => {
    if (!enhancedData) return;
    setIsPublishing(true);
    setErrorMsg("");

    try {
      if (editingArticle) {
        updateArticle({
          ...editingArticle,
          title: enhancedData.title,
          excerpt: enhancedData.excerpt,
          fullText: enhancedData.fullText,
          category,
          imageUrl: customImage || editingArticle.imageUrl || "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=800&q=80",
          slug: enhancedData.slug || editingArticle.slug || ""
        });
        setSuccessMsg("बातमी यशस्वीरित्या अद्ययावित झाली! (Article Updated Successfully!)");
      } else {
        const articlePayload = {
          title: enhancedData.title,
          excerpt: enhancedData.excerpt,
          fullText: enhancedData.fullText,
          category,
          imageUrl: customImage || "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=800&q=80",
          date: getMarathiShortDateString(Date.now()),
          source: authorName || "आमचे प्रतिनिधी",
          authorId: uid || "",
          authorHandle: authorHandle || "",
          views: 0,
          likes: 0,
          commentsCount: 0,
          shares: 0,
          createdAt: Date.now(),
          trendingScore: 0,
          slug: enhancedData.slug || ""
        };

        addArticle(articlePayload);
        setSuccessMsg("बातमी यशस्वीरित्या प्रकाशित झाली! (Article Published Successfully!)");
      }
      
      setRawText("");
      setEnhancedData(null);
      setCustomImage(null);
      // Let the success message show briefly before navigating away
      setTimeout(() => {
        onArticleAdded();
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-200 mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-8 border-b border-gray-100 pb-5">
        <div className="bg-slate-900 p-2.5 rounded-xl">
          <PenTool className="text-white h-6 w-6" />
        </div>
        <h2 className="text-2xl font-sans font-black text-gray-900 tracking-tight flex-1">
           {editingArticle ? "Edit Article" : "Publisher Console"}
        </h2>
        {editingArticle && onCancelEdit && (
           <button 
             onClick={onCancelEdit}
             className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold rounded-lg transition-colors cursor-pointer"
           >
             Cancel Edit
           </button>
        )}
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            कच्ची बातमी / मुद्दे (Raw notes or draft in Marathi/English)
          </label>
          <textarea
            value={rawText}
            onChange={e => setRawText(e.target.value)}
            rows={5}
            className="w-full bg-slate-50 border border-gray-200 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all shadow-sm"
            placeholder="येथे बातमीचे मुद्दे किंवा कच्चा मसुदा लिहा..."
          ></textarea>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">विभाग (Category)</label>
          <div className="flex gap-2 flex-wrap">
            {categories.map(c => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all border shadow-sm ${category === c ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">मुख्य छायाचित्र (Feature Image - Optional)</label>
          <div className="flex items-center gap-4">
             <label className={`flex items-center justify-center gap-2 px-5 py-2.5 bg-white border ${isCompressing ? 'border-gray-100 text-gray-400' : 'border-gray-200 text-slate-700 cursor-pointer hover:bg-slate-50 focus-within:ring-2 focus-within:ring-slate-900'} rounded-xl text-sm font-bold shadow-sm transition-all hover:-translate-y-0.5`}>
               {isCompressing ? (
                 <div className="h-4 w-4 border-2 border-gray-300 border-t-gray-500 rounded-full animate-spin"></div>
               ) : (
                 <ImagePlus className="h-4 w-4" />
               )}
               {isCompressing ? 'प्रक्रिया सुरू आहे...' : 'छायाचित्र निवडा (Upload Image)'}
               <input 
                 type="file" 
                 accept="image/*" 
                 className="sr-only" 
                 onChange={(e) => handleImageUpload(e, false)} 
                 disabled={isCompressing}
               />
             </label>
             {customImage && (
               <div className="relative h-14 w-24 rounded-lg bg-gray-100 overflow-hidden border border-gray-200 shadow-sm animate-in fade-in zoom-in">
                 <img src={customImage} alt="Preview" className="w-full h-full object-cover" />
                 <button 
                  type="button"
                  onClick={() => setCustomImage(null)} 
                  className="absolute top-1 right-1 bg-white/90 text-red-600 p-1 rounded-md hover:bg-red-50 cursor-pointer shadow-sm backdrop-blur-sm"
                 >
                   <X className="h-3 w-3" />
                 </button>
               </div>
             )}
          </div>
          <p className="text-[10px] text-gray-500 mt-2 font-medium">
            *फोटो निवडल्यास तो आपोआप वेब-अनुकूल (WebP) स्वरूपात कॉम्प्रेस केला जाईल. (Auto-compressed to save bandwidth)
          </p>
        </div>

        {/* Advanced Images */}
        <div className="bg-slate-50 border border-gray-200 p-5 rounded-2xl shadow-inner">
           <label className="block text-sm font-bold text-gray-700 mb-1">अतिरिक्त छायाचित्रे आणि माहिती (Additional Body Images)</label>
           <p className="text-xs text-gray-500 mb-4 font-medium border-b border-gray-200 pb-3">AI द्वारे बातमीत मध्ये मध्ये छायाचित्रे जोडण्यासाठी (Advanced Settings)</p>
           
           <div className="space-y-3 mb-4">
             {extraImages.map((img, i) => (
                <div key={i} className="flex gap-4 items-start bg-white p-4 border border-gray-100 rounded-xl shadow-sm group">
                   <div className="relative h-20 w-28 rounded-lg overflow-hidden border border-gray-200 shrink-0 bg-gray-50 animate-in fade-in zoom-in">
                     <img src={img.url} alt="Extra" className="w-full h-full object-cover" />
                   </div>
                   <div className="flex-1 space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Image Context</label>
                      <input 
                         type="text" 
                         value={img.context}
                         onChange={e => {
                           const updated = [...extraImages];
                           updated[i].context = e.target.value;
                           setExtraImages(updated);
                         }}
                         placeholder="Description for AI (e.g. Photo of the protest banner)..."
                         className="w-full text-sm p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 bg-gray-50 focus:bg-white transition-all"
                      />
                   </div>
                   <button 
                     onClick={() => setExtraImages(extraImages.filter((_, idx) => idx !== i))}
                     className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg shrink-0 transition-colors opacity-0 group-hover:opacity-100"
                     title="Remove Image"
                   >
                      <X className="h-5 w-5" />
                   </button>
                </div>
             ))}
           </div>
           
           <label className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white border ${isCompressing ? 'border-gray-100 text-gray-400' : 'border-gray-200 text-slate-700 cursor-pointer hover:bg-slate-50 focus-within:ring-2 focus-within:ring-slate-900'} rounded-xl text-sm font-bold shadow-sm transition-all hover:-translate-y-0.5`}>
             <ImagePlus className="h-4 w-4" />
             {isCompressing ? 'प्रक्रिया...' : 'अतिरिक्त छायाचित्र जोडा (Add Image)'}
             <input 
               type="file" 
               accept="image/*" 
               className="sr-only" 
               onChange={(e) => handleImageUpload(e, true)} 
               disabled={isCompressing}
             />
           </label>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 text-red-700 text-sm border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-green-50 text-green-700 text-sm border border-green-200 rounded-lg flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            {successMsg}
          </div>
        )}

        {!enhancedData ? (
          <div className="mt-8 space-y-4">
             <div className="bg-slate-50 border border-gray-200 p-4 rounded-xl shadow-sm">
                <label className="block text-sm font-bold text-gray-700 mb-3">एआय सेटिंग्ज (AI Settings)</label>
                <div className="flex flex-col gap-3">
                   <label className="flex items-start gap-3 cursor-pointer">
                      <input type="radio" name="aiMode" value="strict" checked={aiMode === "strict"} onChange={() => setAiMode("strict")} className="mt-1 w-4 h-4 text-slate-900 border-gray-300 focus:ring-slate-900" />
                      <div>
                         <span className="block text-sm font-semibold text-gray-800">Strict Mode (Grammar & Format Only)</span>
                         <span className="block text-xs text-gray-500">Keep exact original text. Only fix grammar, add formatting, and create metadata.</span>
                      </div>
                   </label>
                   <label className="flex items-start gap-3 cursor-pointer">
                      <input type="radio" name="aiMode" value="moderate" checked={aiMode === "moderate"} onChange={() => setAiMode("moderate")} className="mt-1 w-4 h-4 text-slate-900 border-gray-300 focus:ring-slate-900" />
                      <div>
                         <span className="block text-sm font-semibold text-gray-800">Moderate Enhance (50% AI)</span>
                         <span className="block text-xs text-gray-500">Enhance flow and engagement but keep original phrasing and length mostly intact.</span>
                      </div>
                   </label>
                   <label className="flex items-start gap-3 cursor-pointer">
                      <input type="radio" name="aiMode" value="full" checked={aiMode === "full"} onChange={() => setAiMode("full")} className="mt-1 w-4 h-4 text-slate-900 border-gray-300 focus:ring-slate-900" />
                      <div>
                         <span className="block text-sm font-semibold text-gray-800">Full Generation (Current Default)</span>
                         <span className="block text-xs text-gray-500">Transform raw notes into a fully expanded, comprehensive, rich news article.</span>
                      </div>
                   </label>
                </div>
             </div>

             <button
               onClick={handleEnhance}
               disabled={!rawText.trim() || isEnhancing}
               className="flex items-center justify-center gap-2 w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl shadow-lg disabled:opacity-50 transition-all hover:-translate-y-0.5 cursor-pointer"
             >
               {isEnhancing ? (
                 <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
               ) : (
                 <>
                   <Wand2 className="h-5 w-5 text-yellow-400" />
                   <span className="text-sm">AI द्वारे बातमी सुधारा (Enhance with AI)</span>
                 </>
               )}
             </button>
          </div>
        ) : (
          <div className="border border-green-200 bg-green-50/30 p-5 rounded-lg space-y-4 animate-fade-in">
            <h3 className="font-bold text-green-800 flex items-center gap-2 border-b border-green-200 pb-2">
              <CheckCircle2 className="h-5 w-5" />
              एआय ने तयार केलेली बातमी (AI Enhanced Result)
            </h3>
            
            <div className="bg-white p-4 rounded border border-gray-200 shadow-sm space-y-3">
              <div className="flex flex-col gap-1 border-b border-gray-100 pb-3">
                 <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">URL Slug (SEO English Link)</label>
                 <input 
                    type="text" 
                    value={enhancedData.slug || ""}
                    onChange={e => setEnhancedData({...enhancedData, slug: e.target.value})}
                    className="w-full text-sm font-mono p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 bg-gray-50"
                 />
              </div>
              <h1 className="text-xl font-black font-serif text-gray-900">{enhancedData.title}</h1>
              <p className="font-bold text-sm text-gray-600 italic border-l-4 border-red-500 pl-3">
                {enhancedData.excerpt}
              </p>
              <div className="prose prose-sm max-w-none font-serif 
                              prose-headings:font-sans prose-headings:font-black prose-headings:text-gray-900 
                              prose-h2:text-xl prose-h2:mt-6 prose-h2:mb-3 prose-h2:border-b prose-h2:pb-2 
                              prose-p:leading-[1.9] prose-p:text-gray-800 
                              prose-p:first-of-type:text-base prose-p:first-of-type:font-medium prose-p:first-of-type:text-gray-900 
                              prose-strong:font-black prose-strong:text-gray-900 
                              prose-ul:my-4 prose-ul:bg-gray-50 prose-ul:p-4 prose-ul:rounded prose-ul:border prose-ul:border-gray-200 
                              prose-li:marker:text-red-600 prose-li:font-medium 
                              prose-blockquote:border-l-4 prose-blockquote:border-red-600 prose-blockquote:bg-red-50/50 prose-blockquote:py-3 prose-blockquote:px-4 prose-blockquote:not-italic prose-blockquote:font-bold prose-blockquote:text-red-900 mt-6">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {enhancedData.fullText}
                </ReactMarkdown>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4 mt-6">
              <button
                onClick={() => setEnhancedData(null)}
                className="w-full sm:w-auto px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-bold shadow-sm hover:bg-gray-50 cursor-pointer transition-all hover:-translate-y-0.5"
              >
                पुन्हा तयार करा (Regenerate)
              </button>
              <button
                onClick={handlePublish}
                disabled={isPublishing}
                className="flex-1 w-full px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-bold shadow-lg cursor-pointer flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5"
              >
                {isPublishing ? (
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Plus className="h-4 w-4 shrink-0" />
                    <span>{editingArticle ? "अद्ययावित करा (Update Article)" : "प्रकाशित करा (Publish Article)"}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
