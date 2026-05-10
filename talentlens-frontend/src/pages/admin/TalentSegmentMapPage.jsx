import { useEffect, useState } from "react";
import { ClusterPosition } from "../../components/shared/ClusterPosition.jsx";
import { getMarketPulse } from "../../services/talentlensService.jsx";

export function TalentSegmentMapPage() {
  const [pulse, setPulse] = useState(null);

  useEffect(() => {
    let active = true;
    getMarketPulse().then((response) => {
      if (!active) return;
      setPulse(response.data);
    });
    return () => {
      active = false;
    };
  }, []);

  return <ClusterPosition data={pulse?.segmentation_scatter || []} focusLabel={pulse?.segmentation_scatter?.[0]?.label || "Cross-segment AI talent"} />;
}
