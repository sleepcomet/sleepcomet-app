# Sleepcomet Console 🚀

![Sleepcomet Console](public/logo.svg)

> **The Command Center.** Monitor endpoints, manage incidents, and keep your services online.

[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22-2D3748)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-336791)](https://www.postgresql.org/)
[![Better Auth](https://img.shields.io/badge/Auth-Better_Auth-success)](https://www.better-auth.com/)

## 📖 About

The **Sleepcomet Console** is the heart of the Sleepcomet platform. It provides a comprehensive dashboard for developers and DevOps engineers to monitor their infrastructure, receive real-time alerts, and manage public status pages. It is built to be robust, scalable, and developer-friendly.

## ✨ Key Features

- **🔍 Endpoint Monitoring:** Real-time HTTP/HTTPS monitoring with detailed latency and uptime tracking.
- **🚨 Incident Management:** Create, track, and resolve incidents with a collaborative workflow.
- **📈 Status Pages:** Public-facing status pages to keep your users informed during outages.
- **📊 Analytics:** Beautiful interactive charts powered by `Recharts` to visualize performance trends.
- **🔐 Secure Authentication:** Enterprise-grade auth handled by `Better Auth` with Google Sign-In support.
- **⚡ Real-time Data:** Powered by `TanStack Query` for instant UI updates.

## 🛠️ Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router)
- **Database:** [PostgreSQL](https://www.postgresql.org/) managed via [Prisma ORM](https://www.prisma.io/)
- **Authentication:** [Better Auth](https://www.better-auth.com/)
- **UI Components:** [Shadcn UI](https://ui.shadcn.com/) & [Tailwind CSS v4](https://tailwindcss.com/)
- **State Management:** [TanStack Query (React Query)](https://tanstack.com/query/latest)
- **Email:** [Resend](https://resend.com/)

## 🚀 Getting Started

Follow these instructions to get a local copy up and running.

### Prerequisites

- Node.js 20+
- PostgreSQL Database
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
    BETTER_AUTH_SECRET="your_generated_secret"
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

1.  **Fork** the repository.
2.  **Clone** your fork.
3.  **Create a branch** for your feature (`git checkout -b feature/my-new-feature`).
4.  **Commit** your changes.
5.  **Push** to your branch.
6.  **Submit a Pull Request**.

Please ensure your code follows the existing style and conventions.

## 📄 License

This project is licensed under the MIT License - see the `LICENSE` file for details.

## 📬 Contact

- **Issues:** [GitHub Issues](https://github.com/sleepcomet/sleepcomet-app/issues)
- **Website:** [sleepcomet.com](https://www.sleepcomet.com/)
- **Console:** [console.sleepcomet.com](https://console.sleepcomet.com/)

