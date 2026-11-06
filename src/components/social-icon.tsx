// Line icons for the club's socials, drawn in the same style as the rest of the icon set
// (lucide dropped brand marks). Matched by label; unknown labels get an arrow.
import type { SVGProps } from "react";

const base = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

export function SocialIcon({ label, ...props }: { label: string } & SVGProps<SVGSVGElement>) {
  const k = label.toLowerCase();
  if (k.includes("instagram"))
    return (
      <svg {...base} {...props}>
        <rect x="2.5" y="2.5" width="19" height="19" rx="5" />
        <circle cx="12" cy="12" r="4.2" />
        <path d="M17.6 6.4h.01" />
      </svg>
    );
  if (k.includes("linkedin"))
    return (
      <svg {...base} {...props}>
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" />
        <rect x="2" y="9" width="4" height="12" />
        <circle cx="4" cy="4" r="2" />
      </svg>
    );
  if (k.includes("github"))
    return (
      <svg {...base} {...props}>
        <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.4 5.4 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
        <path d="M9 18c-4.51 2-5-2-7-2" />
      </svg>
    );
  if (k.includes("whatsapp"))
    return (
      <svg {...base} {...props}>
        <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
      </svg>
    );
  return (
    <svg {...base} {...props}>
      <path d="M7 17 17 7M8 7h9v9" />
    </svg>
  );
}
