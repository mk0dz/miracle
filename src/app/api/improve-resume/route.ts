import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { resumeContent, targetRole, targetArea, action, command } = await request.json();
    
    if (!resumeContent || !action) {
      return NextResponse.json({ error: 'Resume content and action are required' }, { status: 400 });
    }

    // Using Google Gemini API for resume improvement
    console.log('Processing resume improvement:', action, command || 'auto-improve');
    
    try {
      const { GoogleGenAI } = await import('@google/genai');
      const genai = new GoogleGenAI({
        apiKey: process.env.GOOGLE_AI_API_KEY,
      });

      let prompt = '';
      
      if (action === 'auto-improve') {
        prompt = `You are a professional resume expert. Improve this resume for a ${targetRole} position in ${targetArea || 'general'} field.

INSTRUCTIONS:
1. Enhance the formatting and structure
2. Make the language more professional and impactful
3. Optimize for ATS (Applicant Tracking Systems)
4. Add relevant keywords for the target role
5. Improve bullet points to be more action-oriented
6. Ensure consistent formatting throughout
7. Keep all the original information but present it better

Original Resume:
${resumeContent}

Return the improved resume content directly (no JSON, no explanations, just the improved resume text).`;

      } else if (action === 'chat-command') {
        prompt = `You are a professional resume expert. The user wants you to modify their resume based on this request: "${command}"

Current resume for ${targetRole} in ${targetArea || 'general'}:
${resumeContent}

User's request: ${command}

Apply the requested changes to the resume and return the modified resume content directly (no JSON, no explanations, just the updated resume text).`;
      }

      const response = await genai.models.generateContent({
        model: "gemini-2.0-flash-exp",
        contents: prompt,
        config: {
          temperature: 0.3,
          maxOutputTokens: 3000,
        }
      });

      if (!response.text) {
        throw new Error('No response text received from Gemini');
      }

      let improvedContent = response.text.trim();
      
      // Clean up any formatting issues
      improvedContent = improvedContent
        .replace(/```/g, '')
        .replace(/^(text|resume|content):\s*/i, '')
        .trim();

      // Generate a friendly response message based on the action
      let message = '';
      if (action === 'auto-improve') {
        message = '✅ Your resume has been automatically improved! Key enhancements: better formatting, professional language, ATS optimization, and keyword enhancement.';
      } else if (action === 'chat-command') {
        message = `✅ Applied your request: "${command}". Your resume has been updated!`;
      }

      return NextResponse.json({
        success: true,
        improvedContent,
        message
      });
      
    } catch (geminiError) {
      console.error('Gemini improvement failed:', geminiError);
      return NextResponse.json({ 
        error: 'AI improvement failed', 
        details: geminiError instanceof Error ? geminiError.message : 'Gemini service unavailable'
      }, { status: 503 });
    }

  } catch (error) {
    console.error('Improvement error:', error);
    return NextResponse.json({ 
      error: 'Improvement failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}