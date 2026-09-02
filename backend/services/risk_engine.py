"""
SafeSense AI — Backend Risk Engine
Rule-based NLP analysis with scaffolding for ML model integration.
"""
from typing import Dict, Any, List, Optional
import re

# ─── Life-Saving Rules ────────────────────────────────────────────────────────
LSR_RULES = {
    "Confined Space": ["confined space", "vessel entry", "tank entry", "gas test", "atmospheric", "oxygen", "h2s", "drain", "pit", "sump", "chamber"],
    "Energy Isolation": ["lockout", "tagout", "loto", "isolation", "energized", "de-energize", "live circuit", "electrical", "voltage", "stored energy"],
    "Hot Work": ["welding", "cutting", "grinding", "hot work", "sparks", "flame", "arc", "torch", "fire watch", "flammable"],
    "Working at Height": ["height", "scaffold", "ladder", "roof", "platform", "harness", "fall arrest", "elevated", "guardrail", "edge protection"],
    "Line of Fire": ["line of fire", "suspended load", "crane", "lift", "rigging", "exclusion zone", "struck by", "falling object"],
    "Vehicle Movement": ["vehicle", "forklift", "hgv", "truck", "reversing", "pedestrian", "banksman", "traffic", "collision", "seat belt"],
    "Chemical Handling": ["chemical", "acid", "caustic", "toxic", "corrosive", "spill", "ppe", "inhalation", "exposure", "gas leak"],
    "Fire Prevention": ["fire", "smoke", "detector", "suppression", "extinguisher", "flammable", "combustible"],
}

BARRIER_PATTERNS = {
    "Gas Testing Not Completed": ["without gas test", "no gas test", "without atmospheric", "not tested"],
    "Permit Not Obtained": ["without permit", "no permit", "permit not obtained", "without authorization"],
    "Isolation Not Applied": ["without isolat", "no isolation", "not isolated", "isolation not applied", "without lockout"],
    "Lockout/Tagout Not Completed": ["lockout not applied", "tag not applied", "loto not completed"],
    "Fall Protection Not Used": ["without harness", "no harness", "no fall arrest", "no edge protection"],
    "Exclusion Zone Not Established": ["exclusion zone", "no exclusion", "zone not established", "standing under"],
    "Fire Watch Not Posted": ["no fire watch", "without fire watch"],
    "Standby Person Not Assigned": ["no standby", "no attendant", "standby not"],
    "PPE Not Available": ["without ppe", "no ppe", "without protection", "without gloves"],
    "Pressure Not Released": ["not depressurized", "pressure not released", "still under pressure"],
}

def detect_lsr(text: str) -> str:
    lower = text.lower()
    best, best_score = "General Safety", 0
    for rule, keywords in LSR_RULES.items():
        score = sum(1 for k in keywords if k in lower)
        if score > best_score:
            best_score = score
            best = rule
    return best

def detect_barrier(text: str) -> str:
    lower = text.lower()
    for barrier, patterns in BARRIER_PATTERNS.items():
        if any(p in lower for p in patterns):
            return barrier
    return "Unknown Barrier Failure"

def extract_evidence(text: str) -> List[str]:
    lower = text.lower()
    key_phrases = [
        "confined space", "without gas testing", "without permit", "no permit",
        "without isolation", "lockout", "live circuit", "without harness",
        "welding", "without fire watch", "exclusion zone", "without standby",
    ]
    evidence = [p for p in key_phrases if p in lower]
    pattern_matches = re.findall(r"(?:without|no|not|missing)\s+\w+(?:\s+\w+)?", lower)
    evidence += [m for m in pattern_matches if m not in evidence]
    return list(set(evidence))[:6]

def calculate_risk_score(report: Dict) -> Dict:
    text = report.get("report_text", "").lower()
    lsr = report.get("life_saving_rule") or detect_lsr(text)
    barrier = report.get("barrier_failure") or detect_barrier(text)
    severity = (report.get("severity") or "").lower()
    report_type = (report.get("report_type") or "").lower()

    hazard_severity = 28 if (lsr != "General Safety" or "critical" in severity) else (
        22 if "high" in severity else (14 if "medium" in severity else 6)
    )
    barrier_score = 25 if "Not Completed" in barrier or "Not Applied" in barrier or "Not Obtained" in barrier else (
        22 if barrier != "Unknown Barrier Failure" else 5
    )
    exposure_score = 20 if any(w in text for w in ["two worker", "crew", "multiple"]) else (
        16 if any(w in text for w in ["worker", "technician", "operator"]) else 8
    )
    activity_score = 10 if any(a in lsr for a in ["Confined Space", "Energy Isolation", "Hot Work", "Working at Height"]) else 5
    recurrence_score = 15 if "incident" in report_type else (
        12 if "near miss" in report_type else (10 if "unsafe act" in report_type else 8)
    )

    total = min(100, hazard_severity + barrier_score + exposure_score + activity_score + recurrence_score)
    level = "CRITICAL" if total > 80 else ("HIGH" if total > 60 else ("MEDIUM" if total > 30 else "LOW"))
    return {
        "risk_score": total,
        "risk_level": level,
        "factors": [
            {"name": "Hazard Severity", "score": hazard_severity, "max_score": 30},
            {"name": "Barrier Failure", "score": barrier_score, "max_score": 25},
            {"name": "Exposure", "score": exposure_score, "max_score": 20},
            {"name": "Activity Criticality", "score": activity_score, "max_score": 10},
            {"name": "Recurrence Weight", "score": recurrence_score, "max_score": 15},
        ],
    }

def analyze_report(report: Dict) -> Dict:
    text = report.get("report_text", "")
    lsr = report.get("life_saving_rule") or detect_lsr(text)
    barrier = report.get("barrier_failure") or detect_barrier(text)
    evidence = extract_evidence(text)
    risk_data = calculate_risk_score({**report, "life_saving_rule": lsr, "barrier_failure": barrier})
    score = risk_data["risk_score"]
    level = risk_data["risk_level"]

    sif_keywords = ["confined space", "without gas testing", "lockout", "without isolation",
                    "energized", "without harness", "suspended load", "line of fire",
                    "chemical exposure", "oxygen deficient", "pressurized"]
    has_sif = any(k in text.lower() for k in sif_keywords)
    sif_potential = "YES" if (has_sif or score >= 70) else ("NO" if score <= 30 else "UNKNOWN")

    return {
        "sif_potential": sif_potential,
        "risk_level": level,
        "risk_score": score,
        "activity_detected": report.get("activity") or "General Activity",
        "hazard_detected": "See evidence",
        "barrier_failure": barrier,
        "life_saving_rule": lsr,
        "evidence_phrases": evidence,
        "explanation": f"Report flagged: {lsr} life-saving rule with barrier failure '{barrier}'. Score {score}/100. Prototype rule-based analysis.",
        "risk_factors": risk_data["factors"],
        "recommended_actions": ["Stop work.", "Apply required controls.", "Obtain permit.", "Brief all workers."],
        "mode": "rule-based",
    }

def compute_patterns(reports: List[Dict]) -> List[Dict]:
    from collections import Counter
    pattern_map: Dict[str, List] = {}
    for r in reports:
        text = r.get("report_text", "")
        lsr = r.get("life_saving_rule") or detect_lsr(text)
        barrier = r.get("barrier_failure") or detect_barrier(text)
        if lsr != "General Safety" and barrier != "Unknown Barrier Failure":
            key = f"{lsr} + {barrier}"
            pattern_map.setdefault(key, []).append(r)

    result = []
    for i, (name, items) in enumerate(sorted(pattern_map.items(), key=lambda x: -len(x[1]))):
        if len(items) < 2:
            continue
        sites = list(set(r.get("site", "") for r in items if r.get("site")))
        sif_count = sum(1 for r in items if r.get("sif_potential") == "YES")
        pct = sif_count / len(items)
        risk = "CRITICAL" if pct > 0.7 else ("HIGH" if pct > 0.4 else ("MEDIUM" if pct > 0.1 else "LOW"))
        result.append({
            "id": f"PAT-{i+1}", "name": name, "frequency": len(items),
            "risk_level": risk, "sites": sites, "trend": "stable",
            "description": f"Recurring pattern in {len(items)} reports across {len(sites)} site(s).",
        })
    return result

def compute_site_risk(reports: List[Dict]) -> List[Dict]:
    site_map: Dict[str, List] = {}
    for r in reports:
        site = r.get("site") or "Unknown"
        site_map.setdefault(site, []).append(r)

    result = []
    for site, items in site_map.items():
        sif = sum(1 for r in items if r.get("sif_potential") == "YES")
        crit = sum(1 for r in items if r.get("severity") == "Critical" or r.get("risk_level") == "CRITICAL")
        score = round((sif / len(items)) * 70 + (crit / len(items)) * 30)
        level = "CRITICAL" if score > 50 else ("HIGH" if score > 35 else ("MEDIUM" if score > 15 else "LOW"))
        result.append({
            "site": site, "total_reports": len(items),
            "sif_count": sif, "critical_count": crit,
            "risk_level": level, "risk_score": score,
        })
    return sorted(result, key=lambda x: -x["risk_score"])
