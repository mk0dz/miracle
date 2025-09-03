### Core Stack

- **Backend**: Node.js with Express/Fastify + Prisma ORM
- **Database**: PostgreSQL (single database, no file storage needed)
- **Authentication**: NextAuth.js with Google Provider
- **PDF Generation**: React-PDF or Puppeteer for on-demand resume generation
- **Real-time**: Socket.io for live editing suggestions

### Simplified Database Schema (Prisma)

```prisma
// prisma/schema.prisma
model User {
  id            String   @id @default(cuid())
  email         String   @unique
  name          String?
  image         String?
  createdAt     DateTime @default(now())
  
  profile       Profile?
  jobSearches   JobSearch[]
  applications  JobApplication[]
}

model Profile {
  id              String   @id @default(cuid())
  userId          String   @unique
  user            User     @relation(fields: [userId], references: [id])
  
  // Basic Info
  fullName        String
  bio             String?
  phone           String?
  location        String?
  website         String?
  
  // Targeting
  targetRoles     String[] // ["Software Engineer", "Full Stack Developer"]
  targetIndustries String[] // ["Tech", "Fintech"]
  experienceLevel String   // "Entry", "Mid", "Senior"
  
  // Resume Sections (JSON fields)
  experience      Json     // Array of experience objects
  education       Json     // Array of education objects
  skills          Json     // Array of skills with categories
  projects        Json     // Array of projects
  certifications  Json     // Array of certifications
  
  updatedAt       DateTime @updatedAt
}

model JobSearch {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  
  query       String
  location    String?
  results     Json     // Cached job results
  createdAt   DateTime @default(now())
}

model JobApplication {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  
  jobTitle    String
  company     String
  platform    String   // "LinkedIn", "Indeed"
  appliedAt   DateTime @default(now())
  status      String   @default("Applied") // "Applied", "Interview", "Rejected", "Hired"
}
```

## Updated System Architecture

### Frontend Components (Next.js)

```
/pages
├── /auth (Google OAuth) -- Home page 
├── /portfolio (Profile management)
├── /editor (AI-powered resume editor)  
└── /dashboard (AI-powered Job search & listings Analytics & tracking)

/components
├── /portfolio
│   ├── ProfileBuilder
│   ├── ExperienceEditor  
│   └── SkillsManager
├── /editor
│   ├── ResumeEditor (with AI suggestions)
│   ├── AIHighlighter
│   └── SuggestionPanel
├── /jobs
│   ├── JobSearchEngine
│   ├── JobCard
│   └── ApplicationTracker
└── /templates (Resume PDF templates)
```

### Backend Services Architecture

```
/api
├── /auth (NextAuth Google integration)
├── /profile 
│   ├── POST /extract-resume (upload & extract)
│   ├── PUT /update-profile
│   └── GET /get-profile
├── /editor
│   ├── POST /analyze-content (real-time AI analysis)
│   ├── POST /get-suggestions
│   └── POST /generate-pdf
├── /jobs
│   ├── POST /search-jobs (AI agent job search)
│   ├── GET /job-recommendations
│   └── POST /track-application
└── /analytics
    ├── GET /success-metrics
    └── GET /application-stats
```

## Key Implementation Components

### 1. Resume Upload & Extraction Service

```javascript
// /lib/resumeExtractor.js
import { PDFExtract } from 'pdf.js-extract';
import mammoth from 'mammoth';

class ResumeExtractor {
  async extractFromFile(file, userId) {
    const text = await this.parseFile(file);
    const structuredData = await this.extractStructuredData(text);
    
    // Save to profile using Prisma
    await prisma.profile.upsert({
      where: { userId },
      create: { userId, ...structuredData },
      update: structuredData
    });
    
    return structuredData;
  }
  
  async extractStructuredData(text) {
    // Use OpenAI to structure the resume data
    const prompt = `Extract resume data into JSON structure...`;
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }]
    });
    
    return JSON.parse(response.choices[0].message.content);
  }
}
```

### 2. Real-time AI Editor Integration

```javascript
// /lib/aiEditor.js
export class AIEditor {
  async analyzeContent(content, targetRoles) {
    const analysis = await this.callLLM({
      content,
      targetRoles,
      prompt: "Analyze this resume content and provide suggestions..."
    });
    
    return {
      highlights: analysis.mistakes, // Areas to highlight in red
      suggestions: analysis.improvements,
      score: analysis.atsScore
    };
  }
  
  // Real-time analysis via Socket.io
  setupRealTimeAnalysis(socket) {
    socket.on('content-change', async (data) => {
      const analysis = await this.analyzeContent(
        data.content, 
        data.targetRoles
      );
      socket.emit('analysis-result', analysis);
    });
  }
}
```

### 3. PDF Generation Service

```javascript
// /lib/pdfGenerator.js
import { Document, Page, Text, View, PDFDownloadLink } from '@react-pdf/renderer';

class PDFGenerator {
  async generateResume(profileData, templateId) {
    const ResumeDocument = () => (
      <Document>
        <Page size="A4">
          {/* Dynamic template based on profileData */}
          <View>
            <Text>{profileData.fullName}</Text>
            {/* Render experience, education, etc. */}
          </View>
        </Page>
      </Document>
    );
    
    return ResumeDocument;
  }
}
```

### 4. AI Job Search Agent

```javascript
// /lib/jobSearchAgent.js
class JobSearchAgent {
  async searchJobs(profile) {
    const searchQueries = this.generateSearchQueries(
      profile.targetRoles,
      profile.skills,
      profile.location
    );
    
    const jobs = await Promise.all([
      this.searchLinkedIn(searchQueries),
      this.searchIndeed(searchQueries),
      this.searchRemote(searchQueries)
    ]);
    
    return this.rankAndFilterJobs(jobs.flat(), profile);
  }
  
  async rankAndFilterJobs(jobs, profile) {
    // Use Gemini Pro for job matching
    const prompt = `Rank these jobs for candidate profile...`;
    // Return ranked and filtered jobs
  }
}
```

## Development Phases

### Phase 0: User Interface

```bash
# Style and aesthitics 
- claude web like fonts and style
- classic taste an colors 
- light theme with dark fonts
- font should have always left alignment
- each and every section should be bordered with no rounded corners
```

## UI - Pages
####  Page 1 - Home

*At top

Nav bar having logo at the right side and buttons at right having links to the other pages (portfolio, editor and dashboard)

*At middle 

Hero section having introduction at left side and lottie animation at right

*At bottom

google auth option for signup/signin

After authentication user should be directed to portfolio section

#### Page 2 - Portfolio

There should be input sections to fill up user details and also at bottom there should be upload resume and option which will extract info and filled up all the information automatically and smartly 

After portfolio creation user should be directed to Editor 
#### Page  3 - Editor

There should be suggestion section with 1/3 width  and editor section with 2/3 width 

Information will be loaded in editor 2/3 section and ai agent will highlight mistakes according to the targeted roles and job areas in portfolio and start giving suggestion 

At 1/3 section suggestions will be come from ai agent along with direct content editing with edit button , user can directly press edit button and automatically  edits will be implemented in editor in 2/3 section 

User will have full Independence to edit information himself in editor

After user can generate resume with setting up fonts and styles with templates,  we have to provide core templates and resume will be generated on the basis of them and then user can download it.

#### Page 4 - Dashboard

*On top

Score and stats cards showing user growth and information

*On middle and bottom

Job listings section having search , filter and sort option and check-mark to mark done and increase success rate


### Phase 1: Core Platform 

```bash
# Setup
npm install prisma @prisma/client next-auth
npx prisma init

# Implement
- Google OAuth integration
- Basic profile creation/editing
- Resume upload & extraction
- Simple portfolio display
  
```

### Phase 2: AI Editor 

```bash
# Add dependencies
npm install socket.io pdf-parse mammoth


# Implement
- Real-time resume editor
- AI analysis integration
- Suggestion panel
- PDF generation
```

### Phase 3: Job Search

```bash
# Job search integration
- Web scraping setup
- LinkedIn API integration
- Job matching algorithm
- Application tracking
```

### Phase 4: Analytics Dashboard 

```bash
# Dashboard features
- Success rate calculations
- Application statistics
- Performance metrics
- Recommendation engine
```

