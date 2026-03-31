SUN PROACTIVE BY (ALLAU) - AI-POWRED SOCIAL TASK EXCHANGE
============================================

Sun Proactive is a modern platform designed for automating and optimizing social task management for the Sun Foundation. It uses advanced AI to simplify interaction between the foundation and volunteers.

CORE FEATURES:
--------------
* AI-Interviewer: Automatically gathers detailed task information through conversation.
* Volunteer Support: RAG-based AI consultant to assist volunteers with queries.
* Smart Matching: Semantic search using vector embeddings to match tasks with suitable volunteers.
* AI-Manager: Autonomous module for proactive task fulfillment.
* CV Verification: Computer vision algorithms for automated task status verification.
* Trust UI: Explainable AI insights for transparent decision making.

TECH STACK:
-----------
* Next.js 14
* Supabase (PostgreSQL + pgvector)
* OpenRouter API (Access to latest LLMs)
* Tailwind CSS

GETTING STARTED:
----------------
1. Prerequisites:
   - Node.js (Latest LTS)
   - Supabase project credentials
   - OpenRouter API key

2. Installation:
   Run 'install.bat' or use:
   npm install

3. Environment Setup:
   Create a '.env.local' file based on existing .env.local (fill in yours):
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - OPENROUTER_API_KEY

4. Database Setup:
   Run the SQL scripts from 'supabase-setup.sql' in your Supabase SQL Editor.

5. Development:
   Run 'run-dev.bat' or use:
   npm run dev

Open http://localhost:3000 to view the application.


