export type Member = {
  slug: string;
  name: string;
  role: string;
  group: "Faculty" | "Board" | "Leads" | "Member";
  order: number;
  department: string;
  year?: string;
  bio: string;
  focus: string[];
  email: string;
  linkedin?: string;
  github?: string;
  art: string;
  photo?: string;
};

export const initials = (name: string) =>
  name
    .replace(/^Dr\.\s*/, "")
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
