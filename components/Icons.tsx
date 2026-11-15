// Minimal stroke icons (Lucide geometry, 24×24) so the UI never relies on emoji.
import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { size?: number };

function Base({ size = 18, children, ...rest }: P & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const IconArrowRight = (p: P) => (
  <Base {...p}><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></Base>
);
export const IconArrowUpRight = (p: P) => (
  <Base {...p}><path d="M7 7h10v10" /><path d="M7 17 17 7" /></Base>
);
export const IconWallet = (p: P) => (
  <Base {...p}><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" /><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" /></Base>
);
export const IconTimer = (p: P) => (
  <Base {...p}><line x1="10" x2="14" y1="2" y2="2" /><line x1="12" x2="15" y1="14" y2="11" /><circle cx="12" cy="14" r="8" /></Base>
);
export const IconFilm = (p: P) => (
  <Base {...p}><rect width="18" height="18" x="3" y="3" rx="2" /><path d="M7 3v18M3 7.5h4M3 12h18M3 16.5h4M17 3v18M17 7.5h4M17 16.5h4" /></Base>
);
export const IconGlobe = (p: P) => (
  <Base {...p}><circle cx="12" cy="12" r="10" /><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" /><path d="M2 12h20" /></Base>
);
export const IconArchive = (p: P) => (
  <Base {...p}><rect width="20" height="5" x="2" y="3" rx="1" /><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" /><path d="M10 12h4" /></Base>
);
export const IconVote = (p: P) => (
  <Base {...p}><path d="m9 12 2 2 4-4" /><path d="M5 7c0-1.1.9-2 2-2h10a2 2 0 0 1 2 2v12H5V7Z" /><path d="M22 19H2" /></Base>
);
export const IconMoon = (p: P) => (
  <Base {...p}><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" /></Base>
);
export const IconEyeOff = (p: P) => (
  <Base {...p}><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" /><path d="M6.61 6.61A13.53 13.53 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" /><line x1="2" x2="22" y1="2" y2="22" /></Base>
);
export const IconTrophy = (p: P) => (
  <Base {...p}><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" /></Base>
);
export const IconLink = (p: P) => (
  <Base {...p}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></Base>
);
export const IconDroplet = (p: P) => (
  <Base {...p}><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z" /></Base>
);
export const IconDownload = (p: P) => (
  <Base {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></Base>
);
export const IconCheck = (p: P) => (
  <Base {...p}><path d="M20 6 9 17l-5-5" /></Base>
);
export const IconCircleDashed = (p: P) => (
  <Base {...p}><path d="M10.1 2.18a9.93 9.93 0 0 1 3.8 0M17.6 3.71a9.95 9.95 0 0 1 2.69 2.7M21.82 10.1a9.93 9.93 0 0 1 0 3.8M20.29 17.6a9.95 9.95 0 0 1-2.7 2.69M13.9 21.82a9.94 9.94 0 0 1-3.8 0M6.4 20.29a9.95 9.95 0 0 1-2.69-2.7M2.18 13.9a9.93 9.93 0 0 1 0-3.8M3.71 6.4a9.95 9.95 0 0 1 2.7-2.69" /></Base>
);
export const IconVolume = (p: P) => (
  <Base {...p}><path d="M11 4.7a.7.7 0 0 0-1.2-.5L6.4 7.6A1.4 1.4 0 0 1 5.4 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.4a1.4 1.4 0 0 1 1 .4l3.4 3.4a.7.7 0 0 0 1.2-.5z" /><path d="M16 9a5 5 0 0 1 0 6" /><path d="M19.4 18.4a9 9 0 0 0 0-12.7" /></Base>
);
export const IconVolumeOff = (p: P) => (
  <Base {...p}><path d="M11 4.7a.7.7 0 0 0-1.2-.5L6.4 7.6A1.4 1.4 0 0 1 5.4 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.4a1.4 1.4 0 0 1 1 .4l3.4 3.4a.7.7 0 0 0 1.2-.5z" /><line x1="22" x2="16" y1="9" y2="15" /><line x1="16" x2="22" y1="9" y2="15" /></Base>
);
export const IconAlert = (p: P) => (
  <Base {...p}><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" /><path d="M12 9v4" /><path d="M12 17h.01" /></Base>
);
export const IconGithub = (p: P) => (
  <Base {...p}><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" /><path d="M9 18c-4.51 2-5-2-7-2" /></Base>
);
