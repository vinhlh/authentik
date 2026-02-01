import { FavoritesClient } from "./favorites-client";
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "My Favorite Places | Authentik",
  description: "My personal collection of favorite restaurants in Da Nang.",
  openGraph: {
    title: "My Favorite Places | Authentik",
    description: "My personal collection of favorite restaurants in Da Nang.",
    images: [{
      url: "/og-favorites.jpg", // Placeholder
      width: 1200,
      height: 630,
      alt: "Authentik Collections"
    }],
  },
};

export default function FavoritesPage() {
  return <FavoritesClient />;
}
