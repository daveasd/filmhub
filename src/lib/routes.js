/** URL paths for FilmHub (browser history / React Router) */

export const ROUTES = {
  home: '/',
  search: '/search',
  watchlist: '/watchlist',
  reviews: '/reviews',
  ai: '/ai',
  profile: '/profile',
  about: '/about',
  developer: '/developer',
  contact: '/contact',
  report: '/report',
  feedback: '/feedback',
  privacy: '/privacy',
  terms: '/terms',
  movie: (id) => `/movie/${id}`,
  leaderboard: '/leaderboard',
  wrapped: '/wrapped',
  publicProfile: (username) => `/u/${username}`,
};

/** Legacy page ids used in a few callbacks → path */
export const PAGE_TO_PATH = {
  home: ROUTES.home,
  search: ROUTES.search,
  watchlist: ROUTES.watchlist,
  watched: ROUTES.watchlist,
  favorites: ROUTES.watchlist,
  reviews: ROUTES.reviews,
  'ai-recommendations': ROUTES.ai,
  profile: ROUTES.profile,
  about: ROUTES.about,
  developer: ROUTES.developer,
  contact: ROUTES.contact,
  report: ROUTES.report,
  feedback: ROUTES.feedback,
  privacy: ROUTES.privacy,
  terms: ROUTES.terms,
};

export function pageIdToPath(pageId) {
  return PAGE_TO_PATH[pageId] ?? ROUTES.home;
}

export function pathToPageId(pathname) {
  if (pathname.startsWith('/movie/')) return 'detail';
  const match = Object.entries(PAGE_TO_PATH).find(([, path]) => path === pathname);
  return match?.[0] ?? 'home';
}
