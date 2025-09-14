import { Wand2, Image, FolderHeart, Users, Settings } from "lucide-react";
import runtimeConfig from "@/libs/app-config/runtime";

export type NavItem = {
  name: string;
  href: string;
  icon: any;
  primary?: boolean;
};

const collectionsEnabled = !!runtimeConfig.featureFlags?.collections;
const communityEnabled = !!runtimeConfig.featureFlags?.community;

const baseNav: NavItem[] = [
  { name: "Create", href: "/dashboard", icon: Wand2, primary: true },
  { name: "My Renders", href: "/dashboard/renders", icon: Image },
];

export const primaryNav: NavItem[] = [
  ...baseNav,
  ...(collectionsEnabled ? [{ name: "Collections", href: "/dashboard/collections", icon: FolderHeart }] : []),
  ...(communityEnabled ? [{ name: "Community", href: "/dashboard/community", icon: Users }] : []),
];

export const secondaryNav: NavItem[] = [
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];
