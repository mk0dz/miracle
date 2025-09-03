"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";

export default function SmartResumeEditor() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  
  const [resumeContent, setResumeContent] = useState('');
  const [targetRole, setTargetRole] = useState('Junior Scientist');
  const [targetArea, setTargetArea] = useState('Quantum Computing');
  const [autoImproving, setAutoImproving] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [processingChat, setProcessingChat] = useState(false);
  const [fileName, setFileName] = useState('resume.pdf');
  const [lastMessage, setLastMessage] = useState('');
  const [messageTime, setMessageTime] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const urlContent = searchParams.get('content');
    const urlFileName = searchParams.get('fileName');
    
    if (urlFileName) setFileName(urlFileName);
    
    if (urlContent) {
      try {
        let decodedContent = decodeURIComponent(urlContent);
        decodedContent = decodeURIComponent(decodedContent);
        
        decodedContent = decodedContent
          .replace(/\s+/g, ' ')
          .replace(/([.!?])\s*([A-Z])/g, '$1\n\n$2')
          .replace(/(\d{4})\s*([A-Z][a-z]+)/g, '$1\n$2')
          .replace(/•/g, '\n• ')
          .trim();
        
        setResumeContent(decodedContent);
        
        setTimeout(() => {
          autoImproveContent(decodedContent);
        }, 2000);
        
      } catch (error) {
        console.error('Failed to decode content:', error);
        setResumeContent('Failed to load resume content. Please try uploading again.');
      }
    }
  }, [searchParams]);

  const updateMessage = (message: string) => {
    setLastMessage(message);
    setMessageTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  };

  const autoImproveContent = async (content: string) => {
    if (autoImproving) return;
    
    setAutoImproving(true);
    updateMessage('🤖 Analyzing your resume and applying automatic improvements...');
    
    try {
      const response = await fetch('/api/improve-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeContent: content,
          targetRole,
          targetArea,
          action: 'auto-improve'
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.improvedContent) {
          setResumeContent(data.improvedContent);
          updateMessage('✅ Your resume has been automatically improved! Enhanced formatting, professional language, and optimized keywords.');
        }
      } else {
        updateMessage('⚠️ Auto-improvement failed. You can still edit manually or use chat commands.');
      }
    } catch (error) {
      console.error('Auto-improvement error:', error);
      updateMessage('⚠️ Auto-improvement encountered an error. Manual editing is still available.');
    }
    
    setAutoImproving(false);
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || processingChat) return;

    const userMessage = chatMessage.trim();
    setChatMessage('');
    setProcessingChat(true);
    updateMessage(`Processing: "${userMessage}"`);

    try {
      const response = await fetch('/api/improve-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeContent,
          targetRole,
          targetArea,
          action: 'chat-command',
          command: userMessage
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.improvedContent) {
          setResumeContent(data.improvedContent);
          updateMessage(data.message || `✅ Applied your request: "${userMessage}"`);
        } else {
          updateMessage(data.message || '🤖 I understand your request. Let me help you with that.');
        }
      } else {
        updateMessage('❌ Sorry, I had trouble processing your request. Please try again.');
      }
    } catch (error) {
      console.error('Chat error:', error);
      updateMessage('❌ Connection error. Please check your internet and try again.');
    }

    setProcessingChat(false);
  };

  const handleFurnishMore = async () => {
    if (processingChat) return;
    
    const userMessage = 'Furnish my resume more';
    setProcessingChat(true);
    updateMessage(`Processing: "${userMessage}"`);

    try {
      const response = await fetch('/api/improve-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeContent,
          targetRole,
          targetArea,
          action: 'chat-command',
          command: userMessage
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.improvedContent) {
          setResumeContent(data.improvedContent);
          updateMessage(data.message || '✅ Your resume has been further furnished!');
        } else {
          updateMessage(data.message || '🤖 I understand your request. Let me help you with that.');
        }
      } else {
        updateMessage('❌ Sorry, I had trouble processing your request. Please try again.');
      }
    } catch (error) {
      console.error('Furnish error:', error);
      updateMessage('❌ Connection error. Please check your internet and try again.');
    }

    setProcessingChat(false);
  };

  return (
    <div 
      className="min-h-screen"
      style={{
        backgroundImage: 'url("https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Glass overlay */}
      <div className="min-h-screen bg-black/20 backdrop-blur-sm">
        
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-md border-b border-white/20 sticky top-0 z-10">
          <div className="max-w-6xl mx-auto px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <h1 className="text-4xl font-bold text-white" style={{ fontFamily: 'Libre Baskerville, serif' }}>
                  Resume Editor
                </h1>
                <div className="text-white/80 text-sm bg-white/10 px-3 py-1 border border-white/30">
                  {fileName}
                </div>
              </div>
              <div className="flex items-center space-x-4">
                {autoImproving && (
                  <div className="flex items-center space-x-2 text-white bg-blue-500/20 px-4 py-2 border border-blue-300/30">
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    <span className="text-sm">AI Improving...</span>
                  </div>
                )}
                <div className="text-white/90 font-medium">
                  Welcome, {session?.user?.name}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Target Position */}
        <div className="max-w-6xl mx-auto px-8 py-6">
          <div className="bg-white/10 backdrop-blur-md p-6 border border-white/30 shadow-2xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
              <div>
                <label className="block text-white/90 font-medium mb-3" style={{ fontFamily: 'Libre Baskerville, serif' }}>
                  Target Role
                </label>
                <input
                  type="text"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder-white/60 focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  style={{ fontFamily: 'Libre Baskerville, serif' }}
                  placeholder="e.g. Junior Scientist"
                />
              </div>
              <div>
                <label className="block text-white/90 font-medium mb-3" style={{ fontFamily: 'Libre Baskerville, serif' }}>
                  Target Area/Industry
                </label>
                <input
                  type="text"
                  value={targetArea}
                  onChange={(e) => setTargetArea(e.target.value)}
                  className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder-white/60 focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  style={{ fontFamily: 'Libre Baskerville, serif' }}
                  placeholder="e.g. Quantum Computing"
                />
              </div>
              <div>
                <button
                  onClick={handleFurnishMore}
                  disabled={autoImproving || processingChat}
                  className="w-full px-8 py-3 bg-gradient-to-r from-blue-600/80 to-purple-600/80 backdrop-blur-sm text-white font-bold hover:from-blue-700/80 hover:to-purple-700/80 disabled:opacity-50 transition-all duration-300 shadow-lg border border-white/20"
                  style={{ fontFamily: 'Libre Baskerville, serif' }}
                >
                  🪄 Furnish More
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-8 pb-8">
          
          {/* Editor */}
          <div className="bg-white/15 backdrop-blur-lg shadow-2xl border border-white/30 overflow-hidden mb-6">
            <div className="bg-white/10 border-b border-white/20 px-8 py-4">
              <h2 className="text-2xl font-bold text-white flex items-center space-x-3" style={{ fontFamily: 'Libre Baskerville, serif' }}>
                <span className="text-3xl">📝</span>
                <span>Your Resume Content</span>
              </h2>
              <p className="text-white/80 mt-2" style={{ fontFamily: 'Libre Baskerville, serif' }}>
                Edit your resume below. The AI will help you improve it automatically and through commands.
              </p>
            </div>

            <div className="p-8">
              <textarea
                ref={textareaRef}
                value={resumeContent}
                onChange={(e) => setResumeContent(e.target.value)}
                className="w-full h-96 p-6 bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder-white/50 focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none leading-relaxed"
                style={{ 
                  fontFamily: 'Libre Baskerville, serif',
                  fontSize: '16px',
                  minHeight: '500px'
                }}
                placeholder="Your resume content will appear here after uploading a PDF file..."
              />
            </div>
          </div>

          {/* AI Assistant */}
          <div className="bg-white/15 backdrop-blur-lg shadow-2xl border border-white/30 overflow-hidden">
            <div className="bg-white/10 border-b border-white/20 px-8 py-4">
              <h3 className="text-xl font-bold text-white flex items-center space-x-3" style={{ fontFamily: 'Libre Baskerville, serif' }}>
                <span className="text-2xl">🤖</span>
                <span>AI Assistant</span>
              </h3>
            </div>

            {/* Message Display */}
            {(lastMessage || processingChat) && (
              <div className="px-8 py-4 bg-white/5 border-b border-white/10">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="text-sm text-white/70 mb-1">AI Assistant - {messageTime}</div>
                    <div className="text-white" style={{ fontFamily: 'Libre Baskerville, serif' }}>
                      {processingChat ? (
                        <div className="flex items-center space-x-2">
                          <div className="animate-bounce h-2 w-2 bg-blue-400 rounded-full"></div>
                          <div className="animate-bounce h-2 w-2 bg-blue-400 rounded-full" style={{animationDelay: '0.1s'}}></div>
                          <div className="animate-bounce h-2 w-2 bg-blue-400 rounded-full" style={{animationDelay: '0.2s'}}></div>
                          <span className="ml-2">AI is thinking...</span>
                        </div>
                      ) : lastMessage}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Command Input */}
            <div className="p-8">
              <form onSubmit={handleChatSubmit} className="flex space-x-4">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  disabled={processingChat}
                  className="flex-1 px-6 py-4 bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder-white/60 focus:ring-2 focus:ring-blue-400 focus:border-transparent disabled:opacity-50"
                  style={{ fontFamily: 'Libre Baskerville, serif' }}
                  placeholder="Ask me to improve your resume... (e.g., 'Make my summary more professional')"
                />
                <button
                  type="submit"
                  disabled={!chatMessage.trim() || processingChat}
                  className="px-8 py-4 bg-gradient-to-r from-green-600/80 to-blue-600/80 backdrop-blur-sm text-white font-bold hover:from-green-700/80 hover:to-blue-700/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg border border-white/20"
                  style={{ fontFamily: 'Libre Baskerville, serif' }}
                >
                  {processingChat ? (
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                  ) : (
                    'Send'
                  )}
                </button>
              </form>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}