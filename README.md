# Sleepcomet Console 🚀

![Sleepcomet Console](public/logo.svg)

> **The Command Center.** Monitor endpoints, manage incidents, and keep your services online.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Better Auth](https://img.shields.io/badge/Auth-Better_Auth-success?style=for-the-badge&logo=security&logoColor=white)](https://www.better-auth.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Turbo Drive](https://img.shields.io/badge/Turbo_Drive-8.0-red?style=for-the-badge&logo=hotwire&logoColor=white)](https://turbo.hotwired.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

---

## 📖 About

The **Sleepcomet Console** is the heart of the Sleepcomet platform. It provides a comprehensive dashboard for developers and DevOps engineers to monitor their infrastructure, receive real-time alerts, and manage public status pages. It is built to be robust, scalable, and developer-friendly.

We believe in **Open Source** and building tools that developers love to use.

## ✨ Key Features

- **🔍 Endpoint Monitoring:** Real-time HTTP/HTTPS monitoring with detailed latency and uptime tracking.
- **🚨 Incident Management:** Create, track, and resolve incidents with a collaborative workflow.
- **📈 Status Pages:** Public-facing status pages to keep your users informed during outages.
- **📊 Analytics:** Beautiful interactive charts powered by `Recharts` to visualize performance trends.
- **🔐 Secure Authentication:** Enterprise-grade auth handled by `Better Auth` with Google Sign-In support.
- **⚡ Real-time Data:** Powered by `TanStack Query` for instant UI updates.
- **🎨 Modern UI:** Built with Shadcn UI and Tailwind CSS v4 for a sleek, accessible interface.

## 🛠️ Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router)
- **Database:** [PostgreSQL](https://www.postgresql.org/) managed via [Prisma ORM](https://www.prisma.io/)
- **Authentication:** [Better Auth](https://www.better-auth.com/)
- **UI Components:** [Shadcn UI](https://ui.shadcn.com/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Navigation:** [Turbo Drive (@hotwired/turbo)](https://turbo.hotwired.dev/)
- **State Management:** [TanStack Query (React Query)](https://tanstack.com/query/latest)
- **Email:** [Resend](https://resend.com/)

## 📂 Project Structure

```bash
console/
├── prisma/                # Database schema and migrations
├── public/                # Static assets (images, icons)
├── src/
│   ├── app/               # Next.js App Router pages and layouts
│   │   ├── (dashboard)/   # Authenticated dashboard routes
│   │   ├── api/           # API routes (Endpoints, Incidents, etc.)
│   │   └── auth/          # Authentication pages
│   ├── components/        # Reusable React components
│   │   ├── ui/            # Shadcn UI primitives
│   │   └── ...            # Feature-specific components
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utility functions, DB clients, Auth config
│   └── ...
└── ...
```

## 🚀 Getting Started

Follow these instructions to get a local copy up and running.

### Prerequisites

- Node.js 20+
- PostgreSQL Database (Local or Cloud)
- npm or pnpm

### Environment Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/sleepcomet/sleepcomet-app.git
    cd sleepcomet-app
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Environment Variables:**
    Create a `.env` file in the root directory and add the following:

    ```env
    # Database
    DATABASE_URL="postgresql://user:password@localhost:5432/sleepcomet"

    # Authentication (Better Auth)
    BETTER_AUTH_SECRET="your_generated_secret_here"
    BETTER_AUTH_URL="http://localhost:3000"
    
    # OAuth Providers (Google)
    GOOGLE_CLIENT_ID="your_google_client_id"
    GOOGLE_CLIENT_SECRET="your_google_client_secret"
    ```

4.  **Database Migration:**
    ```bash
    npx prisma generate
    npx prisma db push
    ```

### Running the App

Run the development server:

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## 🤝 Contributing

We welcome contributions from the community! Whether it's fixing a bug, adding a new feature, or improving documentation, your help is valuable.

### How to Contribute

1.  **Fork** the repository.
2.  **Clone** your fork.
3.  **Create a branch** for your feature (`git checkout -b feature/my-new-feature`).
4.  **Commit** your changes (`git commit -m 'Add some feature'`).
5.  **Push** to your branch (`git push origin feature/my-new-feature`).
6.  **Submit a Pull Request**.

Please ensure your code follows the existing style and conventions. We use ESLint and Prettier to maintain code quality.

## 🗺️ Roadmap

- [ ] Mobile App (React Native)
- [ ] Slack & Discord Notifications
- [ ] Synthetic Monitoring (Browser Checks)
- [ ] Team Management & RBAC
- [ ] API Documentation

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<p align="center">
  Built with ❤️ by the Sleepcomet Team
</p>
