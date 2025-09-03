import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';


export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { resumeContent, targetRole, targetArea } = await request.json();
    
    if (!resumeContent || !targetRole) {
      return NextResponse.json({ error: 'Resume content and target role are required' }, { status: 400 });
    }

    // Using Google Gemini API for resume analysis
    console.log('Analyzing resume for:', targetRole, 'in', targetArea);
    
    let analysis;
    
    try {
      // Use Google Gemini API
      const { GoogleGenAI } = await import('@google/genai');
      const genai = new GoogleGenAI({
        apiKey: process.env.GOOGLE_AI_API_KEY,
      });

      const prompt = `Analyze this resume for a ${targetRole} position in ${targetArea || 'general'}.

IMPORTANT: Return ONLY a valid JSON object with these exact fields:
- overallScore: number (0-100)
- strengths: array of strings
- improvements: array of objects with {category, issue, suggestion, priority, section}
- missingKeywords: array of strings
- enhancementAreas: array of strings
- contentSuggestions: array of objects with {section, currentText, suggestedText, reason}

Resume Content:
${resumeContent}

Return only the JSON, no other text.`;

      const response = await genai.models.generateContent({
        model: "gemini-2.0-flash-exp",
        contents: prompt,
        config: {
          temperature: 0.3,
          maxOutputTokens: 2000,
        }
      });

      const analysisText = response.text;
      console.log('Gemini response:', analysisText);
      
      if (!analysisText) {
        throw new Error('No response text received from Gemini');
      }
      
      // Clean the response to ensure it's valid JSON
      let cleanedResponse = analysisText.trim();
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/```json/g, '').replace(/```/g, '');
      }
      
      analysis = JSON.parse(cleanedResponse);
      
    } catch (geminiError) {
      console.error('Gemini analysis failed:', geminiError);
      return NextResponse.json({ 
        error: 'AI analysis failed', 
        details: geminiError instanceof Error ? geminiError.message : 'Gemini service unavailable'
      }, { status: 503 });
    }

    return NextResponse.json({
      success: true,
      analysis
    });

  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json({ 
      error: 'Analysis failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}