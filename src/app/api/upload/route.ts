import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';

// Declare global type
declare global {
  var resumeStore: Map<string, any>;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF files are allowed' }, { status: 400 });
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    
    console.log(`Processing PDF file: ${file.name}, size: ${buffer.length} bytes`);
    
    // Extract text from PDF - NO FALLBACK, NO MOCKING
    let extractedText = '';
    
    try {
      console.log('Starting PDF parsing with pdf2json...');
      console.log('Buffer length:', buffer.length);
      
      const PDFParser = (await import('pdf2json')).default;
      
      const pdfParser = new PDFParser();
      
      // Parse PDF and extract text
      const parsePromise = new Promise<string>((resolve, reject) => {
        pdfParser.on("pdfParser_dataReady", (pdfData: any) => {
          try {
            let text = '';
            if (pdfData.Pages) {
              for (const page of pdfData.Pages) {
                if (page.Texts) {
                  for (const textItem of page.Texts) {
                    if (textItem.R) {
                      for (const run of textItem.R) {
                        if (run.T) {
                          text += decodeURIComponent(run.T) + ' ';
                        }
                      }
                    }
                  }
                  text += '\n';
                }
              }
            }
            resolve(text.trim());
          } catch (error) {
            reject(error);
          }
        });
        
        pdfParser.on("pdfParser_dataError", (error: any) => {
          reject(error);
        });
        
        pdfParser.parseBuffer(buffer);
      });
      
      extractedText = await parsePromise;
      
      console.log('PDF parsing completed');
      console.log('Extracted text length:', extractedText.length);
      
      if (!extractedText || extractedText.length === 0) {
        console.log('No text extracted from PDF');
        return NextResponse.json({ 
          error: 'No text found in PDF',
          details: 'The PDF appears to contain no extractable text. This usually happens with image-based PDFs or scanned documents.',
          suggestion: 'Please try with a PDF that contains selectable text, or use OCR software to convert image-based PDFs to text-based ones.',
          debug: {
            pages: pdfData.numpages,
            rawTextLength: pdfData.text ? pdfData.text.length : 0
          }
        }, { status: 400 });
      }
      
      console.log(`Successfully extracted ${extractedText.length} characters from PDF`);
      console.log('First 200 characters:', extractedText.substring(0, 200));
      
    } catch (pdfError) {
      console.error('PDF extraction failed:', pdfError);
      
      const errorMessage = pdfError instanceof Error ? pdfError.message : 'Unknown PDF parsing error';
      
      return NextResponse.json({ 
        error: 'Failed to process PDF file',
        details: errorMessage,
        suggestion: 'Please ensure the PDF file is not corrupted, password-protected, or damaged. Try with a different PDF file.',
        debug: {
          errorType: pdfError instanceof Error ? pdfError.constructor.name : 'Unknown',
          fileSize: buffer.length
        }
      }, { status: 400 });
    }

    // Store the resume data (in a real app, you'd save to database)
    const resumeData = {
      id: Date.now().toString(),
      userId: session.user?.email,
      fileName: file.name,
      content: extractedText,
      uploadedAt: new Date().toISOString(),
    };

    // Store in memory (in production, use a database)
    global.resumeStore = global.resumeStore || new Map();
    global.resumeStore.set(resumeData.id, resumeData);

    return NextResponse.json({
      success: true,
      resumeId: resumeData.id,
      content: extractedText,
      fileName: file.name
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}