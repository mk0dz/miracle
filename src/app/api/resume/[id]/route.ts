import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';

// Type definitions
interface ResumeData {
  id: string;
  userId: string | null | undefined;
  fileName: string;
  content: string;
  uploadedAt: string;
}

// In a real application, you'd store this in a database
// For now, we'll use the global in-memory store

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const resumeId = resolvedParams.id;
    const resumeStore = global.resumeStore || new Map();
    const resume = resumeStore.get(resumeId);

    console.log('Fetching resume:', resumeId);
    console.log('Resume store size:', resumeStore.size);
    console.log('Resume found:', !!resume);

    if (!resume) {
      console.log('Resume not found in store for ID:', resumeId);
      return NextResponse.json({ 
        error: 'Resume not found',
        details: 'The uploaded resume could not be found. Please upload again.'
      }, { status: 404 });
    }

    // Check if the resume belongs to the current user
    if (resume.userId !== session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      content: resume.content,
      fileName: resume.fileName
    });

  } catch (error) {
    console.error('Resume fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch resume' }, { status: 500 });
  }
}

// Helper function to store resume (called from upload endpoint)
export function storeResume(id: string, data: ResumeData) {
  const resumeStore = global.resumeStore || new Map();
  resumeStore.set(id, data);
}