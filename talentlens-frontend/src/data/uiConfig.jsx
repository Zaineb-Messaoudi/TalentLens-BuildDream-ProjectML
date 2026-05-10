import {
  Activity,
  BarChart3,
  BriefcaseBusiness,
  Building2,
  Gauge,
  HeartPulse,
  Layers3,
  LayoutDashboard,
  Map,
  SearchCode,
  ShieldAlert,
  Target,
  TrendingUp,
  UserRoundSearch,
  Users,
  Workflow,
} from "lucide-react";

export const iconMap = {
  Activity,
  BarChart3,
  BriefcaseBusiness,
  Building2,
  Gauge,
  HeartPulse,
  Layers3,
  LayoutDashboard,
  Map,
  SearchCode,
  ShieldAlert,
  Target,
  TrendingUp,
  UserRoundSearch,
  Users,
  Workflow,
};

export function hydrateNavigation(groups = []) {
  return groups.map((group) => ({
    ...group,
    items: (group.items || []).map((item) => ({
      ...item,
      icon: iconMap[item.icon] || LayoutDashboard,
    })),
  }));
}

export function getIconComponent(iconKey) {
  return iconMap[iconKey] || LayoutDashboard;
}
