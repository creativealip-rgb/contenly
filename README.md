# Camedia / Contently - AI Content Automation Platform

Camedia is a comprehensive AI-powered content generation and management platform designed to streamline the workflow from content discovery to publication. It integrates powerful scraping capabilities, AI rewriting, and seamless WordPress publishing into a unified dashboard.

## 🚀 Key Features

### 1. **Content Lab**
The heart of the content generation workflow.
-   **Smart Scraper**: Extract clean content from any URL using advanced scraping (Puppeteer/Cheerio) with tier-based extraction reliability.
-   **RSS Feed Reader**: Subscribe to RSS feeds to discover trending topics and source material.
-   **AI Rewriter**: Transform source content using customizable AI models.
    -   **Context Awareness**: Preserves original meaning while adjusting tone and style.
    -   **Customization**: Select Tone (Professional, Casual, etc.), Style, and Target Length.
    -   **Metadata Generation**: Automatically generates engaging Titles and SEO metadata.

### 2. **Article Management**
-   **Centralized Repository**: Manage all your content (Drafts, Published, Scheduled) in one place.
-   **Status Tracking**: Real-time status updates (Draft, Publishing, Published, Scheduled, Failed).
-   **Persistence**: All generated articles are securely stored in the database, allowing you to revisit and refine drafts at any time.

### 3. **WordPress Integration**
-   **Multi-Site Support**: Connect and manage multiple WordPress websites.
-   **Secure Connection**: Uses WordPress Application Passwords with encrypted storage.
-   **Category Sync**: Automatically fetch and map WordPress categories.
-   **Direct Publishing**: Publish or schedule articles directly from the dashboard to your WordPress site.

### 4. **Project Structure**

This project is organized as a monorepo containing both the frontend and backend applications.

```
camedia/
├── backend/                # NestJS API Server
│   ├── src/
│   │   ├── modules/        # Feature modules
│   │   │   ├── ai/         # AI Service (OpenAI integration)
│   │   │   ├── articles/   # Article management & persistence
│   │   │   ├── auth/       # Authentication (Better Auth)
│   │   │   ├── scraper/    # Content scraping logic
│   │   │   ├── wordpress/  # WordPress integration & publishing
│   │   │   └── ...
│   │   ├── db/             # Drizzle ORM schema & config
│   │   └── ...
│   └── ...
│
├── frontend/               # Next.js 14 App (App Router)
│   ├── src/
│   │   ├── app/
│   │   │   ├── (dashboard)/ # Protected dashboard routes
│   │   │   │   ├── content-lab/ # Main generation UI
│   │   │   │   ├── articles/    # Article history
│   │   │   │   ├── integrations/# WP Site management
│   │   │   │   └── ...
│   │   ├── components/      # Reusable UI components (Shadcn UI)
│   │   └── ...
│   └── ...
```

## 🛠️ Technology Stack

### Frontend
-   **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
-   **Language**: TypeScript
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
-   **UI Components**: [shadcn/ui](https://ui.shadcn.com/) & [Lucide React](https://lucide.dev/)
-   **State Management**: React Hooks & Context

### Backend
-   **Framework**: [NestJS](https://nestjs.com/)
-   **Language**: TypeScript
-   **Database ORM**: [Drizzle ORM](https://orm.drizzle.team/)
-   **Database**: PostgreSQL (Supabase)
-   **AI**: OpenAI API
-   **Scraping**: Puppeteer / Cheerio

## 🚦 Getting Started

### Prerequisites
-   Node.js (v18+)
-   PostgreSQL Database
-   OpenAI API Key

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/creativealip-rgb/camedia.git
    cd camedia
    ```

2.  **Backend Setup**
    ```bash
    cd backend
    npm install
    # Create .env file with DATABASE_URL, OPENAI_API_KEY, etc.
    npm run start:dev
    ```

3.  **Frontend Setup**
    ```bash
    cd frontend
    npm install
    # Create .env.local file with NEXT_PUBLIC_API_URL
    npm run dev
    ```

4.  **Access the App**
    -   Frontend: `http://localhost:3000`
    -   Backend API: `http://localhost:3001`
    -   API Documentation: `http://localhost:3001/api` (Swagger)

## 📝 License

This project is licensed under the MIT License.
