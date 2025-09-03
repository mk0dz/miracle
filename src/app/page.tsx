"use client";

import { useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import Image from "next/image";

export default function Home() {
  const { data: session } = useSession();
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0 && files[0].type === "application/pdf") {
      setSelectedFile(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0 && files[0].type === "application/pdf") {
      setSelectedFile(files[0]);
    }
  };

  const handleUpload = async () => {
    if (selectedFile && session) {
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append('file', selectedFile);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();

        if (response.ok && result.success) {
          console.log('Upload successful, extracted content length:', result.content?.length);
          // Pass the content directly to avoid storage issues
          const params = new URLSearchParams({
            resumeId: result.resumeId,
            fileName: result.fileName,
            content: encodeURIComponent(result.content || ''),
          });
          window.location.href = `/editor?${params.toString()}`;
        } else {
          // Show detailed error message
          const errorMsg = result.error || 'Upload failed';
          const details = result.details || '';
          const suggestion = result.suggestion || '';
          
          let fullMessage = `Upload Error: ${errorMsg}`;
          if (details) fullMessage += `\n\nDetails: ${details}`;
          if (suggestion) fullMessage += `\n\nSuggestion: ${suggestion}`;
          
          console.error('Upload failed:', result);
          alert(fullMessage);
        }
      } catch (error) {
        console.error('Upload error:', error);
        alert('Upload failed. Please check your internet connection and try again.');
      } finally {
        setUploading(false);
      }
    }
  };

  return (
    <div className="min-h-screen gradient-bg">
      {/* Navigation */}
      <nav className="relative z-10 glass-morphism">
        <div className="max-w-7xl mx-auto flex items-center justify-between p-6">
          <div className="flex items-center">
            <Image
              src="/miracle.png"
              alt="Miracle Logo"
              width={320}
              height={80}
              className="bg-white p-2"
            />
          </div>
          
          <div className="flex items-center space-x-6">
            {session ? (
              <div className="flex items-center space-x-6">
                <span className="text-white font-semibold text-shadow">
                  Welcome, {session.user?.name}
                </span>
                <button
                  onClick={() => signOut()}
                  className="elegant-button"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => signIn("google")}
                className="elegant-button"
              >
                Sign in with Google
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 flex flex-col">
        {/* Hero Section */}
        <section className="min-h-[50vh] flex items-center px-8 py-16">
          <div className="max-w-7xl mx-auto w-full">
            <div className="text-left max-w-4xl">
              <h1 className="text-6xl md:text-7xl font-bold text-white mb-6 text-shadow leading-tight">
                AI-Powered
                <br />
                <span className="text-white font-bold bg-blue-950 p-2">
                  Resume Builder
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-white font-bold leading-relaxed mb-12 max-w-2xl text-shadow">
                Transform your career with intelligent resume optimization. Get personalized AI feedback, 
                stunning templates, and discover opportunities tailored to your expertise.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
                <div className="feature-card">
                  <div className="mb-4">
                    <div className="w-12 h-12 bg-navy-900 rounded-full flex items-center justify-center mb-4" style={{backgroundColor: '#1e3a8a'}}>
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-white text-shadow">AI Analysis</h3>
                  <p className="text-white font-bold leading-relaxed">
                    Advanced AI algorithms analyze your resume structure, content, and formatting to provide actionable insights
                  </p>
                </div>
                
                <div className="feature-card">
                  <div className="mb-4">
                    <div className="w-12 h-12 bg-navy-900 rounded-full flex items-center justify-center mb-4" style={{backgroundColor: '#1e3a8a'}}>
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-white text-shadow">Beautiful Templates</h3>
                  <p className="text-white font-bold leading-relaxed">
                    Choose from professionally designed templates that make your resume stand out to employers
                  </p>
                </div>
                
                <div className="feature-card">
                  <div className="mb-4">
                    <div className="w-12 h-12 bg-navy-900 rounded-full flex items-center justify-center mb-4" style={{backgroundColor: '#1e3a8a'}}>
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0H8m8 0v2a2 2 0 01-2 2H10a2 2 0 01-2-2V6m8 0H8" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-white text-shadow">Job Matching</h3>
                  <p className="text-white font-bold leading-relaxed">
                    AI-powered job discovery that finds opportunities matching your optimized profile and skills
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Upload Section */}
        <section className="min-h-[50vh] flex items-center justify-center px-8 py-16">
          <div className="max-w-4xl mx-auto w-full">
            {session ? (
              <div className="text-center">
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-12 text-shadow">
                  Upload Your Resume
                </h2>
                
                <div
                  className={`upload-zone ${dragActive ? 'active' : ''} p-16 transition-all duration-300`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  {selectedFile ? (
                    <div className="text-center">
                      <div className="mb-6">
                        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{backgroundColor: '#1e3a8a'}}>
                          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      </div>
                      <p className="text-xl text-white mb-8 text-shadow">
                        Selected: <span className="font-semibold">{selectedFile.name}</span>
                      </p>
                      <div className="flex justify-center space-x-6">
                        <button
                          onClick={handleUpload}
                          disabled={uploading}
                          className="elegant-button disabled:opacity-50"
                        >
                          {uploading ? 'Uploading...' : 'Upload & Analyze'}
                        </button>
                        <button
                          onClick={() => setSelectedFile(null)}
                          disabled={uploading}
                          className="elegant-button disabled:opacity-50"
                        >
                          Choose Different File
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="mb-8">
                        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{backgroundColor: '#1e3a8a'}}>
                          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                        </div>
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-4 text-shadow">
                        Drag & Drop Your Resume
                      </h3>
                      <p className="text-white font-bold mb-8 text-lg">
                        or click below to browse files
                      </p>
                      <label className="elegant-button inline-block cursor-pointer mb-6">
                        Choose PDF File
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                      </label>
                      <p className="text-white font-bold text-sm">
                        PDF files only • Maximum 10MB
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center glass-morphism p-16">
                <h2 className="text-4xl font-bold text-white mb-6 text-shadow">
                  Ready to Transform Your Career?
                </h2>
                <p className="text-xl text-white font-bold mb-10 leading-relaxed text-shadow">
                  Sign in with Google to upload your resume and begin your journey to career success
                </p>
                <button
                  onClick={() => signIn("google")}
                  className="elegant-button text-lg px-12 py-4"
                >
                  Get Started
                </button>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
