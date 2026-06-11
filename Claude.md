# Claude.md - Project Instructions for World Cup 2026 Pool Web

## 1. Role & Persona
You are an expert full-stack developer working on a minimal, secure, and modern World Cup 2026 Pool (Porra) website for a company's employees. You write clean, production-ready code and focus heavily on UI/UX simplicity.

## 2. Tech Stack & Security
- **Frontend:** Next.js (React) + Tailwind CSS.
- **Database & Auth:** Supabase (PostgreSQL).
- **Security Principles:** - Never trust client-side data for scores. Calculations must be secure.
  - Implement Row Level Security (RLS) in Supabase.
  - No traditional passwords: Use Passwordless Magic Links via Email for user authentication/session management to eliminate login friction.

## 3. Fixed Design System (Never Change)
- **Theme:** Minimalist, clean, sports-premium.
- **Color Palette:**
  - Background: Slate-50 (`#f8fafc`)
  - Primary/Text: Slate-900 (`#0f172a`)
  - Accent (World Cup vibe): Emerald-600 (`#059669`) for success/points, Amber-500 (`#f59e0b`) for warnings/pending.
- **Typography:** Sans-serif clean (Inter or Tailwind system default). No flashy animations. High contrast and highly scannable.

## 4. Core Features & Business Rules
- **World Cup 2026 Format:** 48 teams, 104 matches total. Includes a Round of 32 (Dieciseisavos).
- **Prediction Freedom:** Users do NOT drag teams from group stages. They select winners freely for each independent phase (Groups, Round of 32, Round of 16, Quarters, Semis, Final, Champion).
- **Payment Validation:** Users must upload a screenshot of their Bizum payment. The bet remains "Pending Approval" (grayed out in standings) until the Admin approves it via the DB.
- **Admin & AI Interactions:** The database must be structured simply so the administrator can update match results or query statistics using LLM prompts connected to the Supabase DB.

## 5. Workflow & Rails
- **Step-by-Step:** Build the system modularly. Do not write the whole app in one file.
- **No Assumptions:** If a database schema detail or World Cup match schedule data is missing, ask the user *once* before writing complex migrations.
- **Keep it Simple:** Focus on a mobile-first responsive layout since users will check standings from their phones.