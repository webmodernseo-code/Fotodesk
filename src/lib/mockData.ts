export const mockGalleries = [
  {
    id: 'g-wedding-01',
    title: 'Mariage de Sophie & Marc',
    date: '2026-06-12',
    coverImage: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=800&q=80',
    totalPhotos: 3,
    selectedPhotos: 1,
    clientName: 'Sophie',
    status: 'pending',
    clientUsername: 'sophie',
    password: '1234',
    expirationDate: '2026-06-28',
    clientPhone: '+2250707070701',
    clientEmail: 'sophie.k@gmail.com',
    galleryType: 'mixed' as const
  },
  {
    id: 'g-portrait-02',
    title: 'Shooting Mode Studio',
    date: '2026-06-10',
    coverImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
    totalPhotos: 2,
    selectedPhotos: 1,
    clientName: 'Léa',
    status: 'validated',
    clientUsername: 'lea',
    password: 'abcd',
    expirationDate: '2026-06-10',
    clientPhone: '+2250707070702',
    clientEmail: 'lea.konan@hotmail.com',
    galleryType: 'mixed' as const
  },
  {
    id: 'g-video-03',
    title: 'Court-métrage — Horizon Films',
    date: '2026-06-17',
    coverImage: 'https://images.unsplash.com/photo-1536240478700-b869ad10a2eb?auto=format&fit=crop&w=800&q=80',
    totalPhotos: 3,
    selectedPhotos: 0,
    clientName: 'Horizon Films',
    status: 'pending',
    clientUsername: 'horizonfilms',
    password: 'video2026',
    expirationDate: '2026-07-17',
    clientPhone: '+2250708080808',
    clientEmail: 'contact@horizonfilms.ci',
    galleryType: 'video' as const
  },
  {
    id: 'g-photo-04',
    title: 'Corporate Branding — TechCorp CI',
    date: '2026-06-15',
    coverImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
    totalPhotos: 3,
    selectedPhotos: 2,
    clientName: 'TechCorp CI',
    status: 'validated',
    clientUsername: 'techcorp',
    password: 'corp2026',
    expirationDate: '2026-07-15',
    clientPhone: '+2250709090909',
    clientEmail: 'rh@techcorp.ci',
    galleryType: 'photo' as const
  }
];

export const mockPhotos = [
  {
    id: 'p-1',
    galleryId: 'g-wedding-01',
    url: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=800&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=400&q=80',
    selected: false,
    comments: [],
    type: 'image' as const
  },
  {
    id: 'p-2',
    galleryId: 'g-wedding-01',
    url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=800&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=400&q=80',
    selected: true,
    comments: ['J\'adore celle-ci !'],
    type: 'image' as const
  },
  {
    id: 'p-3',
    galleryId: 'g-wedding-01',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-mother-with-her-son-in-a-field-of-flowers-40280-large.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=400&q=80',
    selected: false,
    comments: [],
    type: 'video' as const
  },
  {
    id: 'p-lea-1',
    galleryId: 'g-portrait-02',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    selected: true,
    comments: [],
    type: 'image' as const
  },
  {
    id: 'p-lea-2',
    galleryId: 'g-portrait-02',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-sunset-through-pine-trees-4835-large.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1452587925148-ce544e77e60d?auto=format&fit=crop&w=400&q=80',
    selected: false,
    comments: [],
    type: 'video' as const
  },
  // Galerie vidéo — Horizon Films (montage vidéo)
  {
    id: 'p-horizon-1',
    galleryId: 'g-video-03',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-mother-with-her-son-in-a-field-of-flowers-40280-large.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1536240478700-b869ad10a2eb?auto=format&fit=crop&w=400&q=80',
    selected: false,
    comments: [],
    type: 'video' as const
  },
  {
    id: 'p-horizon-2',
    galleryId: 'g-video-03',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-sunset-through-pine-trees-4835-large.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=400&q=80',
    selected: false,
    comments: ['Super montage, le rythme est parfait !'],
    type: 'video' as const
  },
  {
    id: 'p-horizon-3',
    galleryId: 'g-video-03',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-couples-hands-connecting-each-other-42194-large.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1579762715118-a6f1d4b934f1?auto=format&fit=crop&w=400&q=80',
    selected: false,
    comments: [],
    type: 'video' as const
  },
  // Galerie photo — TechCorp CI (corporate)
  {
    id: 'p-techcorp-1',
    galleryId: 'g-photo-04',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    selected: true,
    comments: [],
    type: 'image' as const
  },
  {
    id: 'p-techcorp-2',
    galleryId: 'g-photo-04',
    url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=800&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80',
    selected: true,
    comments: ['Celle-ci est parfaite pour notre site web.'],
    type: 'image' as const
  },
  {
    id: 'p-techcorp-3',
    galleryId: 'g-photo-04',
    url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
    selected: false,
    comments: [],
    type: 'image' as const
  }
];
