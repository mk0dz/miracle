"use client";

import { useState, useEffect } from "react";

interface ResumeSection {
  id: string;
  title: string;
  content: string;
  editable: boolean;
}

interface ResumeEditorProps {
  initialContent: string;
  onContentChange: (content: string) => void;
  onSectionChange: (sectionId: string, content: string) => void;
}

export default function ResumeEditor({ initialContent, onContentChange, onSectionChange }: ResumeEditorProps) {
  const [sections, setSections] = useState<ResumeSection[]>([]);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [formatOptions, setFormatOptions] = useState({
    bold: false,
    italic: false,
    underline: false,
    alignment: 'left' as 'left' | 'center' | 'right' | 'justify'
  });

  useEffect(() => {
    parseContentIntoSections(initialContent);
  }, [initialContent]);

  const parseContentIntoSections = (content: string) => {
    const lines = content.split('\n');
    const parsedSections: ResumeSection[] = [];
    let currentSection = '';
    let currentContent: string[] = [];

    // Parse content into logical sections
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.match(/^[A-Z\s]+$/) && line.length > 3 && !line.includes('|') && !line.includes('@')) {
        // This looks like a section header
        if (currentSection && currentContent.length > 0) {
          parsedSections.push({
            id: currentSection.toLowerCase().replace(/\s+/g, '-'),
            title: currentSection,
            content: currentContent.join('\n'),
            editable: true
          });
        }
        currentSection = line;
        currentContent = [];
      } else if (line) {
        currentContent.push(line);
      } else if (currentContent.length > 0) {
        currentContent.push('');
      }
    }

    // Add the last section
    if (currentSection && currentContent.length > 0) {
      parsedSections.push({
        id: currentSection.toLowerCase().replace(/\s+/g, '-'),
        title: currentSection,
        content: currentContent.join('\n'),
        editable: true
      });
    }

    // If no sections were found, create a default structure
    if (parsedSections.length === 0) {
      const defaultSections = [
        { id: 'header', title: 'Header', content: 'JOHN DOE\nSoftware Engineer', editable: true },
        { id: 'summary', title: 'Professional Summary', content: 'Experienced professional with...', editable: true },
        { id: 'skills', title: 'Technical Skills', content: '• Skill 1\n• Skill 2\n• Skill 3', editable: true },
        { id: 'experience', title: 'Professional Experience', content: 'Job Title | Company | Dates\n• Achievement 1\n• Achievement 2', editable: true },
        { id: 'education', title: 'Education', content: 'Degree | University | Year', editable: true }
      ];
      setSections(defaultSections);
    } else {
      setSections(parsedSections);
    }
  };

  const updateSectionContent = (sectionId: string, newContent: string) => {
    setSections(prev => prev.map(section => 
      section.id === sectionId ? { ...section, content: newContent } : section
    ));

    // Notify parent component
    onSectionChange(sectionId, newContent);
    
    // Update full content
    const fullContent = sections.map(s => 
      s.id === sectionId ? `${s.title.toUpperCase()}\n${newContent}` : `${s.title.toUpperCase()}\n${s.content}`
    ).join('\n\n');
    onContentChange(fullContent);
  };

  const applyFormatting = (command: string) => {
    document.execCommand(command, false, '');
    updateFormatState();
  };

  const updateFormatState = () => {
    setFormatOptions({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
      alignment: 'left' // Simplified for now
    });
  };

  const handleTextAlign = (alignment: 'left' | 'center' | 'right' | 'justify') => {
    document.execCommand(`justify${alignment === 'left' ? 'Left' : alignment === 'center' ? 'Center' : alignment === 'right' ? 'Right' : 'Full'}`, false, '');
    setFormatOptions(prev => ({ ...prev, alignment }));
  };

  return (
    <div className="glass-morphism p-6 h-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-white">Resume Editor</h2>
        
        {/* Formatting Toolbar */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => applyFormatting('bold')}
            className={`px-3 py-1 text-sm elegant-button ${formatOptions.bold ? 'bg-white/30' : ''}`}
            title="Bold"
          >
            <strong>B</strong>
          </button>
          <button
            onClick={() => applyFormatting('italic')}
            className={`px-3 py-1 text-sm elegant-button ${formatOptions.italic ? 'bg-white/30' : ''}`}
            title="Italic"
          >
            <em>I</em>
          </button>
          <button
            onClick={() => applyFormatting('underline')}
            className={`px-3 py-1 text-sm elegant-button ${formatOptions.underline ? 'bg-white/30' : ''}`}
            title="Underline"
          >
            <u>U</u>
          </button>
          
          <div className="w-px h-6 bg-white/30 mx-2"></div>
          
          <button
            onClick={() => handleTextAlign('left')}
            className={`px-3 py-1 text-sm elegant-button ${formatOptions.alignment === 'left' ? 'bg-white/30' : ''}`}
            title="Align Left"
          >
            ⬅
          </button>
          <button
            onClick={() => handleTextAlign('center')}
            className={`px-3 py-1 text-sm elegant-button ${formatOptions.alignment === 'center' ? 'bg-white/30' : ''}`}
            title="Align Center"
          >
            ↔
          </button>
          <button
            onClick={() => handleTextAlign('right')}
            className={`px-3 py-1 text-sm elegant-button ${formatOptions.alignment === 'right' ? 'bg-white/30' : ''}`}
            title="Align Right"
          >
            ➡
          </button>
        </div>
      </div>

      {/* Resume Sections */}
      <div className="space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
        {sections.map((section) => (
          <div 
            key={section.id} 
            className={`bg-white/10 backdrop-blur-sm p-4 transition-all ${
              selectedSection === section.id ? 'ring-2 ring-white/50' : ''
            }`}
          >
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-bold text-white">{section.title}</h3>
              <button
                onClick={() => setSelectedSection(selectedSection === section.id ? null : section.id)}
                className="text-xs elegant-button py-1 px-2"
              >
                {selectedSection === section.id ? 'Collapse' : 'Edit'}
              </button>
            </div>
            
            {selectedSection === section.id ? (
              <textarea
                value={section.content}
                onChange={(e) => updateSectionContent(section.id, e.target.value)}
                className="w-full h-32 p-3 bg-white/20 border border-white/30 text-white resize-none backdrop-blur-sm font-mono text-sm"
                placeholder={`Enter ${section.title.toLowerCase()} content...`}
                onFocus={updateFormatState}
                onMouseUp={updateFormatState}
                onKeyUp={updateFormatState}
              />
            ) : (
              <div 
                className="text-white/90 text-sm whitespace-pre-wrap cursor-pointer min-h-[60px] p-2 hover:bg-white/5 transition-colors"
                onClick={() => setSelectedSection(section.id)}
              >
                {section.content || `Click to edit ${section.title.toLowerCase()}...`}
              </div>
            )}
          </div>
        ))}
        
        {/* Add New Section Button */}
        <button
          onClick={() => {
            const newSection: ResumeSection = {
              id: `custom-${Date.now()}`,
              title: 'New Section',
              content: '',
              editable: true
            };
            setSections(prev => [...prev, newSection]);
            setSelectedSection(newSection.id);
          }}
          className="w-full py-3 elegant-button border-2 border-dashed border-white/30 hover:border-white/50"
        >
          + Add New Section
        </button>
      </div>
    </div>
  );
}