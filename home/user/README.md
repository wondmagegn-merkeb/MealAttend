
# MealAttend: QR-Based Meal Attendance System

MealAttend is a robust and modern web application designed to streamline meal attendance tracking in organizational settings like schools or corporate cafeterias. It replaces manual check-ins with a fast, touchless QR code scanning system, providing real-time data and comprehensive reporting.

The system is built with a powerful tech stack including Next.js, Prisma, and Tailwind CSS, featuring a complete admin dashboard, user and student management, and detailed analytics.

## ✨ Key Features

- **🚀 Fast QR Code Scanning**: Touchless, real-time attendance recording using unique QR codes for each student.
- **👤 Comprehensive User & Student Management**: Admins can easily add, edit, delete, and manage profiles for both system users and students.
- **🔒 Role-Based Access Control (RBAC)**: Granular permission system with roles like Super Admin, Admin, and User to control access to different features.
- **📊 Interactive Dashboard**: A central dashboard providing a real-time overview of meal attendance statistics, student demographics, and recent system activity.
- **📄 Detailed Reporting & Exports**: Generate and export attendance and student list reports in both PDF and Excel formats, with powerful filtering options.
- **🆔 Customizable ID Cards**: Automatically generate and print professional student ID cards complete with photos, details, and a scannable QR code.
- **🎨 Customizable Theming**: Super Admins can customize the application's color theme, site name, and logos to match their organization's branding.
- **🌐 Public Homepage**: An optional, customizable homepage to showcase the system's features and introduce the team behind it.

## 🛠️ Technology Stack

- **Framework**: [Next.js](https://nextjs.org/) (with App Router)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [ShadCN UI](https://ui.shadcn.com/)
- **Database ORM**: [Prisma](https://www.prisma.io/)
- **Database**: PostgreSQL
- **Authentication**: Custom implementation using Bcrypt.js
- **Generative AI**: [Google's Genkit](https://firebase.google.com/docs/genkit) for AI-powered features.

## 🚀 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

- Node.js (v18 or later recommended)
- npm or yarn
- A running PostgreSQL database instance

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-repo/meal-attend.git
    cd meal-attend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the root directory by copying the example file:
    ```bash
    cp .env.example .env
    ```
    Now, open the `.env` file and fill in your PostgreSQL database connection string.
    ```env
    # Example:
    DATABASE_URL="postgresql://user:password@host:port/database?schema=public"
    ```

4.  **Apply database migrations:**
    This command will sync your Prisma schema with your database, creating all the necessary tables.
    ```bash
    npx prisma db push
    ```

5.  **Seed the database with initial data:**
    To get started with some sample users, students, and settings, run the seed script.
    ```bash
    npm run db:seed
    ```
    This will create default users with passwords you can find in `prisma/seed.ts`. The default Super Admin login is `superadmin@example.com`.

### Running the Application

Once the setup is complete, you can start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:9002`.

## 📜 Available Scripts

- `npm run dev`: Starts the Next.js development server with Turbopack.
- `npm run build`: Creates an optimized production build of the application.
- `npm run start`: Starts the production server after a build.
- `npm run lint`: Lints the codebase using Next.js's built-in ESLint configuration.
- `npm run typecheck`: Runs the TypeScript compiler to check for type errors.
- `npm run db:seed`: Seeds the database with the data defined in `prisma/seed.ts`.
- `npx prisma studio`: Opens the Prisma Studio to view and manage your database.

