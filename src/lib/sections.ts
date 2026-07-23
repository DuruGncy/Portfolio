// Single source of truth for navigation targets and journey ordering.

export interface NavLink {
  id: string;
  label: string;
}

export const NAV_LINKS: NavLink[] = [
  { id: "home", label: "Home" },
  { id: "who-i-am", label: "Who I Am" },
  { id: "journey", label: "Journey" },
  { id: "mission-archive", label: "Projects" },
  { id: "skills", label: "Skills" },
  { id: "books", label: "Books" },
  { id: "future-destination", label: "Future Destination" },
  { id: "contact", label: "Contact" },
];

/** Pixels to leave above a target when scrolling, so the sticky nav never covers it. */
export const NAV_SCROLL_OFFSET = -96;
