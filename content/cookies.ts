/**
 * What each cookie choice does, in one place: the banner's switches
 * (components/analytics/ConsentBanner.tsx) and the help page's privacy section
 * both read these, so what a visitor agrees to and what the page explains
 * always say the same thing. Recipients are named by category (analytics
 * providers, advertising partners), never by brand, at the owner's request.
 */
export const cookiePurposes = {
  necessary: {
    label: "Strictly necessary",
    note: "Keep your bag and remember your cookie preferences, so the site works. We also note the name of the campaign link you arrived from, which contains no personal information. These are always on.",
  },
  analytics: {
    label: "Analytics",
    note: "Help us understand how visitors use the site, such as which pages are viewed, so we can improve it. This information is processed by our analytics providers.",
  },
  marketing: {
    label: "Marketing",
    note: "Allow our advertising partners to record the products you view and add to your bag, so we can show you relevant advertising on other websites and social media and measure its results. This includes linking your order to the advertisement you clicked.",
  },
} as const;
