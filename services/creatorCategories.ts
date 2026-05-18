import type { Creator } from '@/services/feed';

export interface CreatorCategory {
  id: string;
  slug: string;
  name: string;
  description: string;
  coverSrc: string;
}

const DEMO_CREATORS_BY_CATEGORY: Record<string, Creator[]> = {
  fitness: [
    {
      id: 101,
      username: 'arjun_fitness',
      name: 'Arjun Kumar',
      avatar: '/sample-media/id-card-1.png',
      niche: 'Fitness Coach',
      subscriber_count: 89000,
      is_subscribed: false,
    },
    {
      id: 102,
      username: 'maya_yoga',
      name: 'Maya Singh',
      avatar: '/sample-media/id-card-2.png',
      niche: 'Yoga & Wellness',
      subscriber_count: 54000,
      is_subscribed: false,
    },
    {
      id: 103,
      username: 'rohan_strength',
      name: 'Rohan Mehta',
      avatar: '/sample-media/id-card-3.png',
      niche: 'Strength Training',
      subscriber_count: 72000,
      is_subscribed: true,
    },
    {
      id: 104,
      username: 'kavya_cardio',
      name: 'Kavya Reddy',
      avatar: '/sample-media/tom.png',
      niche: 'HIIT & Cardio',
      subscriber_count: 41000,
      is_subscribed: false,
    },
  ],
  fashion: [
    {
      id: 201,
      username: 'priya_sharma',
      name: 'Priya Sharma',
      avatar: '/sample-media/id-card-1.png',
      niche: 'Fashion & Lifestyle',
      subscriber_count: 125000,
      is_subscribed: false,
    },
    {
      id: 202,
      username: 'ananya_style',
      name: 'Ananya Iyer',
      avatar: '/sample-media/id-card-2.png',
      niche: 'Street Style',
      subscriber_count: 98000,
      is_subscribed: false,
    },
    {
      id: 203,
      username: 'dev_luxury',
      name: 'Dev Kapoor',
      avatar: '/sample-media/id-card-3.png',
      niche: 'Luxury Fashion',
      subscriber_count: 156000,
      is_subscribed: false,
    },
  ],
  music: [
    {
      id: 301,
      username: 'neha_music',
      name: 'Neha Patel',
      avatar: '/sample-media/id-card-1.png',
      niche: 'Singer & Musician',
      subscriber_count: 210000,
      is_subscribed: true,
    },
    {
      id: 302,
      username: 'dj_rahul',
      name: 'Rahul Verma',
      avatar: '/sample-media/id-card-2.png',
      niche: 'DJ & Producer',
      subscriber_count: 87000,
      is_subscribed: false,
    },
    {
      id: 303,
      username: 'soul_ria',
      name: 'Ria Fernandes',
      avatar: '/sample-media/tom.png',
      niche: 'Indie Artist',
      subscriber_count: 63000,
      is_subscribed: false,
    },
  ],
  beauty: [
    {
      id: 401,
      username: 'isha_glam',
      name: 'Isha Malhotra',
      avatar: '/sample-media/id-card-1.png',
      niche: 'Makeup Artist',
      subscriber_count: 142000,
      is_subscribed: false,
    },
    {
      id: 402,
      username: 'tara_skincare',
      name: 'Tara Nair',
      avatar: '/sample-media/id-card-2.png',
      niche: 'Skincare',
      subscriber_count: 76000,
      is_subscribed: false,
    },
    {
      id: 403,
      username: 'meera_hair',
      name: 'Meera Joshi',
      avatar: '/sample-media/id-card-3.png',
      niche: 'Hair Styling',
      subscriber_count: 52000,
      is_subscribed: false,
    },
    {
      id: 404,
      username: 'nina_nails',
      name: 'Nina Desai',
      avatar: '/sample-media/tom.png',
      niche: 'Nail Art',
      subscriber_count: 38000,
      is_subscribed: false,
    },
  ],
  gaming: [
    {
      id: 501,
      username: 'vivek_streams',
      name: 'Vivek Rao',
      avatar: '/sample-media/id-card-1.png',
      niche: 'FPS Streamer',
      subscriber_count: 198000,
      is_subscribed: false,
    },
    {
      id: 502,
      username: 'zara_plays',
      name: 'Zara Khan',
      avatar: '/sample-media/id-card-2.png',
      niche: 'Mobile Gaming',
      subscriber_count: 112000,
      is_subscribed: false,
    },
    {
      id: 503,
      username: 'ace_esports',
      name: 'Aditya Shah',
      avatar: '/sample-media/id-card-3.png',
      niche: 'Esports',
      subscriber_count: 245000,
      is_subscribed: true,
    },
  ],
  food: [
    {
      id: 601,
      username: 'chef_amit',
      name: 'Amit Deshmukh',
      avatar: '/sample-media/id-card-1.png',
      niche: 'Home Chef',
      subscriber_count: 67000,
      is_subscribed: false,
    },
    {
      id: 602,
      username: 'bake_with_sara',
      name: 'Sara Thomas',
      avatar: '/sample-media/id-card-2.png',
      niche: 'Baking',
      subscriber_count: 89000,
      is_subscribed: false,
    },
    {
      id: 603,
      username: 'spice_route',
      name: 'Kabir Ali',
      avatar: '/sample-media/tom.png',
      niche: 'Street Food',
      subscriber_count: 103000,
      is_subscribed: false,
    },
    {
      id: 604,
      username: 'vegan_pooja',
      name: 'Pooja Menon',
      avatar: '/sample-media/id-card-3.png',
      niche: 'Plant-Based',
      subscriber_count: 48000,
      is_subscribed: false,
    },
  ],
};

export const CREATOR_CATEGORIES: CreatorCategory[] = [
  {
    id: 'fitness',
    slug: 'fitness',
    name: 'Fitness',
    description: 'Workouts, wellness, and training creators',
    coverSrc: '/sample-media/id-card-1.png',
  },
  {
    id: 'fashion',
    slug: 'fashion',
    name: 'Fashion',
    description: 'Style, outfits, and lifestyle inspiration',
    coverSrc: '/sample-media/id-card-2.png',
  },
  {
    id: 'music',
    slug: 'music',
    name: 'Music',
    description: 'Artists, DJs, and musicians',
    coverSrc: '/sample-media/id-card-3.png',
  },
  {
    id: 'beauty',
    slug: 'beauty',
    name: 'Beauty',
    description: 'Makeup, skincare, and grooming',
    coverSrc: '/sample-media/tom.png',
  },
  {
    id: 'gaming',
    slug: 'gaming',
    name: 'Gaming',
    description: 'Streamers and esports creators',
    coverSrc: '/sample-media/id-card-1.png',
  },
  {
    id: 'food',
    slug: 'food',
    name: 'Food',
    description: 'Recipes, chefs, and food explorers',
    coverSrc: '/sample-products/check-grey-shirt.png',
  },
];

export function getCreatorCategories(): CreatorCategory[] {
  return CREATOR_CATEGORIES.map((cat) => ({
    ...cat,
  }));
}

export function getCategoryBySlug(slug: string): CreatorCategory | undefined {
  return CREATOR_CATEGORIES.find((c) => c.slug === slug);
}

export function getCreatorsByCategorySlug(slug: string): Creator[] {
  return DEMO_CREATORS_BY_CATEGORY[slug] ?? [];
}

export function getCategoryCreatorCount(slug: string): number {
  return getCreatorsByCategorySlug(slug).length;
}
