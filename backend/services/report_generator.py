"""Report generation service for SafeSense AI."""
from typing import List, Dict, Any
from datetime import datetime

def generate_summary_report(reports: List[Dict], metadata: Dict = None) -> Dict:
    if not reports:
        return {"error": "No reports provided"}

    total = len(reports)
    sif = [r for r in reports if r.get("sif_potential") == "YES"]
    critical = [r for r in reports if r.get("severity") == "Critical" or r.get("risk_level") == "CRITICAL"]

    lsr_counts: Dict[str, int] = {}
    barrier_counts: Dict[str, int] = {}
    for r in reports:
        lsr = r.get("life_saving_rule") or "Unknown"
        barrier = r.get("barrier_failure") or "Unknown"
        lsr_counts[lsr] = lsr_counts.get(lsr, 0) + 1
        barrier_counts[barrier] = barrier_counts.get(barrier, 0) + 1

    top_lsr = sorted(lsr_counts.items(), key=lambda x: -x[1])[:5]
    top_barriers = sorted(barrier_counts.items(), key=lambda x: -x[1])[:5]

    return {
        "generated_at": datetime.now().isoformat(),
        "executive_summary": {
            "total_reports": total,
            "sif_potential": len(sif),
            "sif_percentage": round(len(sif) / total * 100, 1) if total else 0,
            "critical_count": len(critical),
        },
        "top_life_saving_rules": [{"rule": k, "count": v} for k, v in top_lsr],
        "top_barrier_failures": [{"barrier": k, "count": v} for k, v in top_barriers],
        "disclaimer": "Prototype report — not a certified safety analysis.",
    }
