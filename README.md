# DevSprint Project Tracker

DevSprint Project Tracker is a modern, high-fidelity project tracking dashboard designed with **Next.js (App Router)** and **Material UI (MUI v6)**. It serves as a centralized hub to track development progress across multiple applications, manage feature pipelines (Kanban), and directly browse local codebases and git history from a single unified interface.

---

## 🚀 Key Features

*   **📊 Unified Kanban Board**: Interactive progress columns (`Backlog`, `In Progress`, `In Review`, `Ready to Test`, `Completed`) with dynamic platform filters.
*   **📂 Codebase Explorer**: A secure, integrated directory browser allowing you to view directory trees and preview code files directly within the dashboard.
*   **🐙 Git Commit Timeline**: Real-time git integration displaying current branch status, uncommitted changes, and isolated commit logs for selected directories or platforms.
*   **🎨 Premium Dark Mode UI**: Built with custom glassmorphic panels, glowing neon accent states, and high-performance layout components designed on top of MUI v6.
*   **💾 Local File Database**: A lightweight, file-based JSON DB layer that persists your workspace state and automatically seeds projects.

---

## 🛠️ Architecture & Tech Stack

*   **Frontend**: React, Next.js (App Router), TypeScript, Material UI (MUI v6)
*   **Styling**: Custom CSS variables, background radial gradients, and modern UI variables in `src/app/globals.css`
*   **Database**: Single-file JSON DB (`db.json`) managed via the async file system in `src/lib/db.ts`
*   **Server Endpoints**:
    *   `/api/projects` - GET all registered projects / POST register a new project.
    *   `/api/projects/[id]` - DELETE a registered project.
    *   `/api/features` - GET project-specific features / POST add a new feature card.
    *   `/api/features/[id]` - PATCH update feature status or contents / DELETE features.
    *   `/api/git` - GET git branches, status, and directory-specific commit logs.
    *   `/api/files` - GET sub-directory structures and file previews (with file-system traversal safety guards).

---

## 📂 Project Structure

```text
├── db.json                 # Local database storage file
├── src/
│   ├── app/
│   │   ├── api/            # Serverless api routes (projects, features, git, files)
│   │   ├── globals.css     # Global styles, fonts, and dark mode variables
│   │   ├── layout.tsx      # Main layout wrapper
│   │   └── page.tsx        # Dashboard entry point
│   ├── components/
│   │   ├── Dashboard.tsx   # Interactive Kanban & Code Explorer UI component
│   │   └── ThemeRegistry.tsx# MUI v6 theme caching & setup
│   └── lib/
│       └── db.ts           # JSON DB helpers, CRUD actions, and models
├── package.json
└── tsconfig.json
```

---

## ⚡ Getting Started

### 1. Prerequisites

Ensure you have [Node.js](https://nodejs.org/) (v18.x or later) installed.

### 2. Install Dependencies

Clone this repository to your projects workspace, navigate to the directory, and install npm packages:

```bash
npm install
```

### 3. Run Development Server

Launch the Next.js development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

### 4. Build for Production

To compile the codebase and create an optimized production bundle:

```bash
npm run build
npm run start
```

---

## 🔒 Security & Safety Guards

The File Explorer includes built-in safeguards to protect your local environment:
*   **Directory Traversal Protection**: All queried sub-paths are validated against the absolute project path using `path.resolve` and strict prefix validation.
*   **Heavy Folder Exclusion**: The tree browser automatically skips heavy directories (`node_modules`, `.git`, `build`, `dist`, `Pods`, etc.).
*   **File Size Capping**: Code previewing is limited to text files smaller than `150KB` to prevent UI lag and high memory consumption.
