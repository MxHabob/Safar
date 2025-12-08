# 🧳 Safar - Travel Platform

The smartest, most distinctive, and seamless travel platform in the world.

## 🚀 Quick Start

### Prerequisites

- Node.js 20+ 
- npm or yarn or pnpm
- Environment variables configured (see `.env.example`)

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Update .env.local with your configuration

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
web/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Authentication pages
│   │   ├── (protected)/       # Protected user pages
│   │   ├── (host)/            # Host management pages
│   │   ├── (public)/          # Public pages
│   │   └── api/               # API routes
│   ├── components/            # Reusable components
│   ├── features/              # Feature modules
│   ├── generated/             # Auto-generated API client
│   └── lib/                   # Utilities and helpers
├── public/                    # Static assets
└── package.json
```

## 🛠️ Development

### Available Scripts

```bash
# Development
npm run dev          # Start dev server

# Production
npm run build        # Build for production
npm run start        # Start production server

# Quality
npm run lint         # Run ESLint
npm test            # Run tests
```

## 🔐 Authentication

The app uses JWT-based authentication with:
- Access tokens (short-lived)
- Refresh tokens (long-lived)
- Secure cookie storage
- Automatic token refresh

## 🎨 Design System

- **Framework**: Tailwind CSS 4
- **Components**: Shadcn/ui (Radix UI)
- **Icons**: Lucide React
- **Theme**: Dark-first with light mode support
- **Corners**: 18px rounded corners throughout

## 📦 Key Features

### For Guests
- Browse listings and destinations
- Search and filter
- Book accommodations
- Manage bookings
- Reviews and ratings
- Wishlist
- Messages

### For Hosts
- Create and manage listings
- Manage bookings
- Analytics and insights
- Reviews management
- Earnings tracking
- Settings

## 🔒 Security

- CSRF protection
- XSS prevention
- Rate limiting
- Input validation
- Secure headers
- Authentication middleware

## 📈 Performance

- ISR (Incremental Static Regeneration)
- Image optimization
- Code splitting
- Suspense boundaries
- React Server Components

## 🌐 SEO

- Metadata optimization
- Structured data (JSON-LD)
- Sitemap generation
- robots.txt
- Open Graph tags

## 🚢 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Configure environment variables
4. Deploy

### Other Platforms

```bash
# Build
npm run build

# Start
npm run start
```

## 📝 Environment Variables

See `.env.example` for all required environment variables.

## 🐛 Troubleshooting

### Common Issues

**Build errors**: Check TypeScript and ESLint errors
```bash
npm run lint
```

**API errors**: Verify `NEXT_PUBLIC_API_URL` is set correctly

**Authentication issues**: Check token expiration and refresh logic

## 📚 Documentation

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Shadcn/ui](https://ui.shadcn.com)

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## 📄 License

Proprietary - All rights reserved

## 🆘 Support

For issues and questions, contact the development team.
