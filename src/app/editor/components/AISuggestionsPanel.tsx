"use client";

import { useState, useEffect, useCallback } from "react";

interface Suggestion {
  id: string;
  type: 'content' | 'format' | 'keyword' | 'structure';
  section: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  suggestion: string;
  applied: boolean;
}

interface AISuggestionsPanelProps {
  resumeContent: string;
  targetRole: string;
  targetArea: string;
  onApplySuggestion: (suggestion: Suggestion) => void;
  currentSection?: string;
}

export default function AISuggestionsPanel({ 
  resumeContent, 
  targetRole, 
  targetArea, 
  onApplySuggestion,
  currentSection 
}: AISuggestionsPanelProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [realTimeAnalysis, setRealTimeAnalysis] = useState(true);

  // Debounced content analysis
  const analyzeContent = useCallback(
    debounce(async (content: string, role: string, area: string) => {
      if (!content || !role) return;
      
      setLoading(true);
      try {
        const newSuggestions = await generateRealTimeSuggestions(content, role, area, currentSection);
        setSuggestions(newSuggestions);
      } catch (error) {
        console.error('Failed to analyze content:', error);
      }
      setLoading(false);
    }, 2000), // 2 second delay
    [currentSection]
  );

  useEffect(() => {
    if (realTimeAnalysis && resumeContent && targetRole) {
      analyzeContent(resumeContent, targetRole, targetArea || '');
    }
  }, [resumeContent, targetRole, targetArea, analyzeContent, realTimeAnalysis]);

  const generateRealTimeSuggestions = async (content: string, role: string, area: string, section?: string): Promise<Suggestion[]> => {
    // Smart real-time suggestions based on content analysis
    const suggestions: Suggestion[] = [];
    
    // Content analysis
    const wordCount = content.split(/\s+/).length;
    const hasQuantifiedAchievements = /\d+%|\d+\+|\$\d+|increased|improved|reduced/gi.test(content);
    const hasActionVerbs = /led|managed|developed|created|implemented|designed|optimized/gi.test(content);
    
    // Role-specific keywords
    const roleKeywords = getRoleSpecificKeywords(role, area);
    const missingKeywords = roleKeywords.filter(keyword => 
      !content.toLowerCase().includes(keyword.toLowerCase())
    );

    // Generate suggestions based on analysis
    if (wordCount < 200) {
      suggestions.push({
        id: 'word-count',
        type: 'content',
        section: section || 'overall',
        priority: 'high',
        title: 'Expand Content',
        description: 'Your resume is too brief. Add more detailed achievements.',
        suggestion: 'Add 2-3 more bullet points with specific accomplishments and metrics.',
        applied: false
      });
    }

    if (!hasQuantifiedAchievements) {
      suggestions.push({
        id: 'quantify',
        type: 'content',
        section: section || 'experience',
        priority: 'high',
        title: 'Add Quantified Results',
        description: 'Include specific numbers and percentages to show impact.',
        suggestion: 'Replace generic statements with metrics like "Increased efficiency by 40%" or "Managed team of 5+".',
        applied: false
      });
    }

    if (!hasActionVerbs) {
      suggestions.push({
        id: 'action-verbs',
        type: 'content',
        section: section || 'experience',
        priority: 'medium',
        title: 'Use Strong Action Verbs',
        description: 'Start bullet points with powerful action verbs.',
        suggestion: 'Begin achievements with words like: Led, Architected, Optimized, Implemented, Designed.',
        applied: false
      });
    }

    // Missing keywords
    if (missingKeywords.length > 0) {
      suggestions.push({
        id: 'keywords',
        type: 'keyword',
        section: 'skills',
        priority: 'high',
        title: `Add ${role} Keywords`,
        description: `Missing key terms for ${role} positions.`,
        suggestion: `Consider adding: ${missingKeywords.slice(0, 5).join(', ')}`,
        applied: false
      });
    }

    // Section-specific suggestions
    if (section) {
      const sectionSuggestions = getSectionSpecificSuggestions(section, content, role);
      suggestions.push(...sectionSuggestions);
    }

    return suggestions;
  };

  const getRoleSpecificKeywords = (role: string, area: string): string[] => {
    const keywordMap: { [key: string]: string[] } = {
      'software engineer': ['JavaScript', 'Python', 'React', 'Node.js', 'API', 'Git', 'Agile'],
      'data scientist': ['Python', 'R', 'Machine Learning', 'SQL', 'Statistics', 'TensorFlow'],
      'research scientist': ['Research', 'Publications', 'Statistical Analysis', 'Data Analysis', 'Methodology'],
      'product manager': ['Product Strategy', 'Roadmap', 'Stakeholder Management', 'Analytics', 'User Research'],
      'default': ['Leadership', 'Problem Solving', 'Communication', 'Teamwork', 'Project Management']
    };

    const roleKey = role.toLowerCase();
    return keywordMap[roleKey] || keywordMap['default'];
  };

  const getSectionSpecificSuggestions = (section: string, content: string, role: string): Suggestion[] => {
    const suggestions: Suggestion[] = [];

    if (section === 'summary' || section === 'professional-summary') {
      if (content.length < 100) {
        suggestions.push({
          id: 'summary-expand',
          type: 'content',
          section: 'summary',
          priority: 'high',
          title: 'Expand Professional Summary',
          description: 'Your summary should be 2-3 sentences highlighting key achievements.',
          suggestion: `Write a compelling summary mentioning your ${role} experience and key accomplishments.`,
          applied: false
        });
      }
    }

    if (section === 'skills' || section === 'technical-skills') {
      if (!content.includes('•') && !content.includes('-')) {
        suggestions.push({
          id: 'skills-format',
          type: 'format',
          section: 'skills',
          priority: 'medium',
          title: 'Format Skills Section',
          description: 'Use bullet points to organize your skills.',
          suggestion: 'Organize skills into categories with bullet points for better readability.',
          applied: false
        });
      }
    }

    return suggestions;
  };

  const handleApplySuggestion = (suggestion: Suggestion) => {
    setSuggestions(prev => prev.map(s => 
      s.id === suggestion.id ? { ...s, applied: true } : s
    ));
    onApplySuggestion(suggestion);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500/20 border-red-400';
      case 'medium': return 'bg-yellow-500/20 border-yellow-400';
      case 'low': return 'bg-green-500/20 border-green-400';
      default: return 'bg-blue-500/20 border-blue-400';
    }
  };

  return (
    <div className="w-80 glass-morphism m-4 p-6 h-full overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">AI Assistant</h2>
        <button
          onClick={() => setRealTimeAnalysis(!realTimeAnalysis)}
          className={`text-xs px-3 py-1 elegant-button ${realTimeAnalysis ? 'bg-green-500/30' : ''}`}
          title="Toggle real-time analysis"
        >
          {realTimeAnalysis ? '🟢 Live' : '⚫ Off'}
        </button>
      </div>

      {loading && (
        <div className="text-center text-white/80 mb-4">
          <div className="animate-spin w-6 h-6 border-2 border-white/30 border-t-white rounded-full mx-auto mb-2"></div>
          Analyzing content...
        </div>
      )}

      {suggestions.length === 0 && !loading ? (
        <div className="text-white/80 text-center p-8">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">✅</span>
          </div>
          <p>Great job! Your resume looks good for the {targetRole} position.</p>
          <p className="text-sm mt-2">Keep editing to get more suggestions.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {suggestions.map((suggestion) => (
            <div
              key={suggestion.id}
              className={`p-4 border backdrop-blur-sm transition-all ${getPriorityColor(suggestion.priority)} ${
                suggestion.applied ? 'opacity-50' : ''
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="text-white font-bold text-sm">{suggestion.title}</h4>
                  <span className={`text-xs px-2 py-1 rounded ${
                    suggestion.priority === 'high' ? 'bg-red-500' :
                    suggestion.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                  }`}>
                    {suggestion.priority} priority
                  </span>
                </div>
                <span className="text-xs text-white/60">{suggestion.section}</span>
              </div>
              
              <p className="text-white/90 text-xs mb-3">{suggestion.description}</p>
              
              <div className="bg-white/10 p-2 rounded text-xs text-white/80 mb-3">
                💡 {suggestion.suggestion}
              </div>
              
              {!suggestion.applied ? (
                <button
                  onClick={() => handleApplySuggestion(suggestion)}
                  className="elegant-button text-xs w-full"
                >
                  Apply Suggestion
                </button>
              ) : (
                <div className="text-green-400 text-xs text-center">
                  ✅ Applied
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Debounce utility function
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function debounce<T extends (...args: any[]) => any>(func: T, delay: number): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}