import React, { useState } from 'react';
import { Mail, Send } from 'lucide-react';

export const AboutSection: React.FC = () => {
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [formStatus, setFormStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus('loading');
    setErrorMessage('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactForm),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      setFormStatus('success');
      setContactForm({ name: '', email: '', message: '' });
    } catch (error: any) {
      setFormStatus('error');
      setErrorMessage(error.message || 'Something went wrong. Please try again.');
    }
  };

  return (
    <div className="prose prose-slate max-w-none font-serif">
      <h1 className="text-4xl font-black mb-8 text-gray-900 tracking-tight">आमच्याबद्दल (About Us)</h1>
      
      <div className="space-y-6 text-lg leading-relaxed text-gray-700">
        <p className="text-xl font-medium text-gray-900">
          Welcome to <span className="text-red-700 font-bold">देशाचे लोक</span>, a premium platform built for passionate writers and avid readers who care deeply about social issues, truth, and meaningful journalism.
        </p>

        <p>
          We created this platform because we didn't want to waste our writing skills on legacy, cluttered platforms like Blogspot or generic article directories. We wanted a space that feels like a premium news publication—where typography, layout, and reading experience take center stage, giving your words the respect they deserve. If you're looking for the best, most elegant alternative to Blogspot, you've found it here.
        </p>
        
        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 shadow-sm my-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-red-600"></div>
          <h3 className="text-xl font-bold mb-2 mt-0 text-gray-900">Breaking the Character Limit</h3>
          <p className="mb-0">
            We noticed a massive community of brilliant writers and social commentators on X (formerly Twitter). These individuals possess an incredible capability to dissect complex social issues and write compelling arguments. However, the restrictive character limit often forces them to truncate their thoughts into confusing threads. <strong className="text-gray-900">We built this platform for these very voices.</strong> Here, there are no character limits. You can explore nuances, provide deep context, and write comprehensive, premium articles that truly capture the essence of your message.
          </p>
        </div>

        <p>
          'देशाचे लोक' (Deshache Lok) is more than just a digital newspaper; it's a movement towards truthful journalism and unbiased reporting of local and global events. Our platform is dedicated to amplifying the voices of the people and shedding light on stories that matter, from agricultural revolutions to political shifts, sports, and entertainment.
        </p>
        
        <h2 className="text-2xl font-bold mt-10 mb-4 text-gray-900 border-b border-gray-200 pb-2">Our Vision (आमचे व्हिजन)</h2>
        <p>
          To become the authentic voice of every citizen and build a well-informed, empowered society by bringing all sections of the community together through powerful, unrestricted writing.
        </p>
      </div>

      <div className="mt-16 pt-10 border-t border-gray-200">
        <h2 className="text-3xl font-black mb-2 text-gray-900">Message Us</h2>
        <p className="text-gray-600 mb-8 font-sans">Have a story idea, feedback, or want to contribute? Send us a message directly!</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="md:col-span-1 space-y-6 font-sans">
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                <Mail className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Direct Email</h3>
              <p className="text-gray-600 mb-0">siteget1234@gmail.com</p>
              <a href="mailto:siteget1234@gmail.com" className="text-red-700 font-semibold text-sm mt-3 inline-block hover:underline">
                Open in Email App &rarr;
              </a>
            </div>
          </div>
          
          <div className="md:col-span-2">
            <form onSubmit={handleContactSubmit} className="space-y-5 font-sans bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-200">
              {formStatus === 'success' ? (
                <div className="bg-green-50 border border-green-200 text-green-800 p-6 rounded-xl text-center">
                  <h4 className="text-xl font-bold mb-2">Message Sent Successfully!</h4>
                  <p>Thank you for reaching out. We will get back to you shortly.</p>
                  <button 
                    onClick={() => setFormStatus('idle')}
                    className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label htmlFor="name" className="block text-sm font-semibold text-gray-700">Full Name</label>
                      <input 
                        type="text" 
                        id="name"
                        required
                        value={contactForm.name}
                        onChange={(e) => setContactForm({...contactForm, name: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                        placeholder="John Doe"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="email" className="block text-sm font-semibold text-gray-700">Email Address</label>
                      <input 
                        type="email" 
                        id="email"
                        required
                        value={contactForm.email}
                        onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label htmlFor="message" className="block text-sm font-semibold text-gray-700">Your Message</label>
                    <textarea 
                      id="message"
                      required
                      rows={5}
                      value={contactForm.message}
                      onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all resize-none"
                      placeholder="What's on your mind?..."
                    ></textarea>
                  </div>
                  
                  {formStatus === 'error' && (
                    <div className="text-red-600 text-sm font-medium bg-red-50 p-3 rounded-lg border border-red-100">
                      {errorMessage}
                    </div>
                  )}
                  
                  <button 
                    type="submit" 
                    disabled={formStatus === 'loading'}
                    className="w-full sm:w-auto px-8 py-3.5 bg-red-700 hover:bg-red-800 text-white font-bold rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {formStatus === 'loading' ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <span>Send Message</span>
                        <Send className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </button>
                </>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
