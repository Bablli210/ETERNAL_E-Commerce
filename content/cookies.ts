/**
 * What each cookie choice does, in one place: the banner's switches
 * (components/analytics/ConsentBanner.tsx) and the help page's privacy section
 * both read these, so what a visitor agrees to and what the page explains
 * always say the same thing.
 */
export const cookiePurposes = {
  necessary: { label: "Necessary", note: "Your bag, your cookie choice, and the name of the campaign that brought you here. Always on." },
  analytics: { label: "Analytics", note: "Google Analytics and Vercel count visits and see which pages work, so we can make the site better." },
  marketing: {
    label: "Marketing",
    note: "Meta (Instagram, Facebook) and Google see which scents you looked at and added, so our ads reach the right people and we can see what they sold. The ad you came from travels with your order",
  },
} as const;
