import { Wand2, Image, FolderHeart, Users, Settings } from "lucide-react";

export type NavItem = {
  name: string;
  href: string;
  icon: any;
  primary?: boolean;
};

export const primaryNav: NavItem[] = [
  { name: "Create", href: "/dashboard", icon: Wand2, primary: true },
  { name: "My Renders", href: "/dashboard/renders", icon: Image },
  { name: "Collections", href: "/dashboard/collections", icon: FolderHeart },
  { name: "Community", href: "/dashboard/community", icon: Users },
];

export const secondaryNav: NavItem[] = [
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];
