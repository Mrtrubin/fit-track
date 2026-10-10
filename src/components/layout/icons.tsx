import type { SVGProps } from "react";

/**
 * 简洁线性图标集（stroke 风格）
 */
type P = SVGProps<SVGSVGElement>;

function base(props: P) {
  return {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    ...props,
  };
}

export const HomeIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5 9.5V21h14V9.5" />
    <path d="M9 21v-6h6v6" />
  </svg>
);

export const DietIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M5 3v6a3 3 0 0 0 3 3h1" />
    <path d="M5 21v-6a3 3 0 0 1 3-3h1" />
    <path d="M19 3v18" />
    <path d="M15 3h3.5v4H15z" />
  </svg>
);

export const WorkoutIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M6.5 6.5 8 5l4 4-1.5 1.5" />
    <path d="M17.5 6.5 16 5l-4 4 1.5 1.5" />
    <path d="M6.5 17.5 8 19l4-4-1.5-1.5" />
    <path d="M17.5 17.5 16 19l-4-4 1.5-1.5" />
  </svg>
);

export const DataIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 20V10" />
    <path d="M10 20V4" />
    <path d="M16 20v-7" />
    <path d="M22 20H2" />
  </svg>
);

export const ProfileIcon = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-3.3 3.6-5 8-5s8 1.7 8 5" />
  </svg>
);

export const PlusIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const ArrowLeftIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M15 18l-6-6 6-6" />
  </svg>
);

export const ChevronRightIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M9 6l6 6-6 6" />
  </svg>
);

export const SearchIcon = (p: P) => (
  <svg {...base(p)}>
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4.3-4.3" />
  </svg>
);

export const EditIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </svg>
);

export const TrashIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 7h16" />
    <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    <path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
  </svg>
);

export const ClockIcon = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);

export const FireIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 22c4 0 7-2.7 7-6.5 0-3-2-5.3-3.5-7-.5-.6-1.5-.2-1.5.6v1.2c0 .5-.6.8-1-.4C12.4 8 12 6.5 12 4.5c0-.7-.8-1.1-1.3-.6C9 5.6 5 9 5 15.5 5 19.3 8 22 12 22Z" />
  </svg>
);

export const ScaleIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 3v4" />
    <path d="M4 7h16" />
    <path d="M6 7l-2 10a4 4 0 0 0 8 0L10 7" />
    <path d="M14 7l-2 10a4 4 0 0 0 8 0l-2-10" />
  </svg>
);

export const CheckIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M5 13l4 4L19 7" />
  </svg>
);

export const XIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);
