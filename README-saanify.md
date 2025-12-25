# Saanify – Society Management Platform

A modern SaaS platform for housing society automation. Built with Next.js 15, TypeScript, TailwindCSS, Shadcn UI, and Prisma.

## Features

- **Multi-Panel System**: Client, Admin, and Treasurer panels
- **Authentication & Authorization**: Secure login system with role-based access
- **Financial Management**: Loans, passbook, expenses tracking
- **Member Management**: Complete member database and profiles
- **Real-time Analytics**: Dashboard with comprehensive statistics
- **GitHub Integration**: Backup and restore functionality
- **Responsive Design**: Mobile-first approach with Tailwind CSS

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **UI Components**: Shadcn/ui (New York style)
- **Database**: Prisma ORM with SQLite
- **Authentication**: JWT-based auth system
- **State Management**: Zustand
- **Real-time**: Socket.io
- **Icons**: Lucide React

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up the database:
   ```bash
   npm run db:push
   npm run db:seed
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Demo Credentials

### ADMIN
- Email: `ADMIN@saanify.com`
- Password: `admin123`

### Admin
- Email: `admin@saanify.com`
- Password: `admin123`

### Client
- Email: `client@saanify.com`
- Password: `client123`

## Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── api/               # API routes
│   ├── client/            # Client panel pages
│   ├── admin/             # Admin panel pages
│   └── dashboard/         # Dashboard pages
├── components/            # React components
│   ├── ui/                # Shadcn/ui components
│   ├── client/            # Client-specific components
│   ├── admin/             # Admin-specific components
│   ├── github/            # GitHub integration components
│   └── home/              # Landing page components
├── lib/                   # Utility libraries
├── hooks/                 # Custom React hooks
└── data/                  # Mock data and types
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:push` - Push database schema
- `npm run db:generate` - Generate Prisma client
- `npm run db:seed` - Seed database with sample data

## Database

The project uses Prisma with SQLite. The database schema includes:

- Users and authentication
- Society management
- Member profiles
- Financial transactions
- Loans and passbook entries
- Expense tracking

## GitHub Integration

The platform includes GitHub integration for:

- Automated backups
- Repository management
- Issue tracking
- Analytics and reporting

## Deployment

The application is ready for deployment on Vercel, Netlify, or any other platform that supports Next.js.

## License

This project is licensed under the MIT License.

---

**Note**: This is a complete clone of the original Saanify workspace repository with all features and functionality intact.