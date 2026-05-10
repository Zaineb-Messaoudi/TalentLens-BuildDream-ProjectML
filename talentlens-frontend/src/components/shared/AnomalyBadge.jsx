import { AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";
import { Badge } from "../ui/Badge.jsx";

const config = {
  GREEN: { tone: "green", icon: CheckCircle2 },
  YELLOW: { tone: "orange", icon: AlertTriangle },
  RED: { tone: "red", icon: ShieldAlert },
};

export function AnomalyBadge({ label = "GREEN", message }) {
  const item = config[label] || config.GREEN;
  const Icon = item.icon;

  return (
    <Badge tone={item.tone} className="gap-2 px-4 py-2 text-sm">
      <Icon className="h-4 w-4" />
      {message || label}
    </Badge>
  );
}
