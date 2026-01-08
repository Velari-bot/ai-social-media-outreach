# AI Creator Outreach Assistant

An AI assistant that finds creators, emails them from your inbox, handles the replies, and builds your creator list automatically.

## Features

- **Automated Creator Discovery**: Find creators based on platform, niche, country, followers, and views
- **Email Integration**: Connect Gmail or Outlook to send outreach from your inbox
- **AI-Powered Replies**: Automatically handles responses, extracts rates, and organizes information
- **Campaign Management**: Launch and monitor multiple campaigns simultaneously
- **Creator Database**: Organized list of all contacted creators with rates and contact info

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
├── app/
│   ├── page.tsx              # Landing page
│   ├── signup/
│   │   └── page.tsx          # Sign up page
│   ├── login/
│   │   └── page.tsx          # Login page
│   ├── onboarding/
│   │   └── page.tsx          # 3-step onboarding flow
│   ├── dashboard/
│   │   └── page.tsx          # Main dashboard
│   ├── layout.tsx            # Root layout
│   └── globals.css            # Global styles
├── package.json
├── tailwind.config.ts        # Tailwind configuration
└── tsconfig.json             # TypeScript configuration
```

## User Flow

1. **Landing Page** → User sees value proposition and clicks "Get Started"
2. **Sign Up** → User creates account (email/password or OAuth)
3. **Onboarding**:
   - Step 1: Select purpose (Brand/Agency/Personal)
   - Step 2: Connect email inbox (Gmail/Outlook)
   - Step 3: Set up first campaign (platform, niches, countries, thresholds, message)
4. **Dashboard** → User monitors campaigns, views creators, and manages outreach

## Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **React Hot Toast** - Toast notifications
- **JetBrains Mono** - Monospace font

## Design Principles

- Dark mode by default
- Minimal animations (respects prefers-reduced-motion)
- Toast notifications for feedback
- Proper cursor states (pointer, text, not-allowed)
- Clean, professional UI

## Next Steps

- [ ] Implement backend API integration
- [ ] Add real OAuth flow for Gmail/Outlook
- [ ] Connect to creator discovery APIs
- [ ] Implement email sending functionality
- [ ] Add AI reply handling
- [ ] Build creator database/export functionality
- [ ] Add team collaboration features

