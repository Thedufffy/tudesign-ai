export type ReferenceItem = {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  featured: boolean;
};

export const references: ReferenceItem[] = [
  {
    id: "1",
    title: "Residential / Istanbul",
    subtitle: "AI Assisted Interior Redesign",
    image:
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
    featured: true,
  },
  {
    id: "2",
    title: "Retail / Ankara",
    subtitle: "Premium Space Transformation",
    image:
      "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80",
    featured: true,
  },
  {
    id: "3",
    title: "Hospitality / Bodrum",
    subtitle: "Concept to Atmosphere",
    image:
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
    featured: false,
  },
  {
    id: "4",
    title: "Residential / Izmir",
    subtitle: "Calm, Refined, Contemporary",
    image:
      "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80",
    featured: true,
  },
  {
    id: "5",
    title: "Commercial / Istanbul",
    subtitle: "Spatial Identity Upgrade",
    image:
      "https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&w=1200&q=80",
    featured: false,
  },
  {
    id: "6",
    title: "Boutique / Ankara",
    subtitle: "Elegant Visual Direction",
    image:
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
    featured: true,
  },
];