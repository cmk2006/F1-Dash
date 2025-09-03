#!/usr/bin/env python3
"""
Lightweight F1 winner predictor for live usage.

Reads a snapshot JSON from stdin and outputs a JSON prediction:
  input: { "session_key": number, "snapshot": [
            {"driver_number": int, "position": int, "gap_to_leader": number|string|null,
             "lap_number": int, "pits": int, "driver": str, "team": str }
          ] }
  output: { "winner_driver_number": int, "probability": float }

This is intentionally dependency-light and deterministic for serverless use.
"""
import json
import math
import sys
from typing import Any, Dict, List, Optional


def parse_gap(g: Any) -> float:
    """Convert a gap value to seconds. Handles numbers and strings like '+2.345' or '+1 LAP'."""
    if g is None:
        return 0.0
    if isinstance(g, (int, float)):
        return float(g)
    s = str(g).upper().strip()
    if "LAP" in s:
        # Treat a lap as a big gap proxy
        return 25.0
    # Extract first number from string
    num = ""
    for ch in s:
        if (ch.isdigit() or ch == "."):
            num += ch
        elif num:
            break
    try:
        return float(num) if num else 0.0
    except Exception:
        return 0.0


def sigmoid(x: float) -> float:
    try:
        return 1.0 / (1.0 + math.exp(-x))
    except OverflowError:
        return 1.0 if x > 0 else 0.0


def predict(snapshot: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    if not snapshot:
        return None
    # Ensure sorted by live position ascending
    ordered = sorted(snapshot, key=lambda r: r.get("position", 99))
    leader = ordered[0]
    p2 = ordered[1] if len(ordered) > 1 else None

    winner_driver_number = int(leader.get("driver_number"))

    # Features
    gap = parse_gap(p2.get("gap_to_leader")) if p2 else 0.0
    max_lap = max(int(r.get("lap_number", 0)) for r in ordered)
    # Normalize race progress (assume 60-lap nominal length, clamp 0..1)
    progress = min(1.0, max(0.0, max_lap / 60.0))
    pits_avg = sum(int(r.get("pits", 0)) for r in ordered) / max(1, len(ordered))
    leader_pits = int(leader.get("pits", 0))
    leader_pit_delta = leader_pits - pits_avg

    # Simple calibrated linear model -> sigmoid
    # Weights tuned to be conservative early, confident late, and reward clean lead.
    w0 = -0.2                # base bias
    w_gap = 0.25             # each +1s gap increases log-odds
    w_prog = 1.8             # later in race -> more confident
    w_pitdelta = -0.6        # more stops than avg reduces confidence

    logit = w0 + w_gap * min(gap, 15.0) + w_prog * progress + w_pitdelta * max(0.0, leader_pit_delta)
    prob = sigmoid(logit)

    # Clamp to reasonable band (leader should be >= 0.5)
    prob = max(0.5, min(0.98, prob))

    return {
        "winner_driver_number": winner_driver_number,
        "probability": float(prob),
    }


def main():
    try:
        raw = sys.stdin.read()
        data = json.loads(raw or "{}")
        snapshot = data.get("snapshot") or []
        result = predict(snapshot)
        if result is None:
            print(json.dumps({}))
        else:
            print(json.dumps(result))
    except Exception:
        # Fail-quietly: output empty JSON so caller can fallback
        print(json.dumps({}))


if __name__ == "__main__":
    main()
