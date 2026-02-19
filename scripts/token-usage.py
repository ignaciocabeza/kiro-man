#!/usr/bin/env python3
"""Analyze Claude Code token usage for a project.

Usage:
    python3 token-usage.py <project-dir>
"""

import json
import os
import sys
import glob
from datetime import datetime

# Claude Opus pricing (per 1M tokens)
PRICING = {
    "input": 15.00,
    "output": 75.00,
    "cache_read": 1.50,
    "cache_create": 18.75,
}


def fmt_tokens(n):
    if n >= 1_000_000:
        return f"{n / 1_000_000:.1f}M"
    if n >= 1_000:
        return f"{n / 1_000:.1f}K"
    return str(n)


def fmt_duration(minutes):
    if minutes < 1:
        return "<1m"
    h = int(minutes // 60)
    m = int(minutes % 60)
    if h > 0:
        return f"{h}h {m}m"
    return f"{m}m"


def parse_session(fpath):
    input_t = 0
    output_t = 0
    cache_read = 0
    cache_create = 0
    assistant_msgs = 0
    user_msgs = 0
    first_ts = None
    last_ts = None

    for line in open(fpath):
        d = json.loads(line)
        ts = d.get("timestamp")
        if ts and not first_ts:
            first_ts = ts
        if ts:
            last_ts = ts

        if d.get("type") == "user":
            user_msgs += 1

        if d.get("type") == "assistant":
            msg = d.get("message", {})
            if isinstance(msg, dict) and "usage" in msg:
                assistant_msgs += 1
                u = msg["usage"]
                input_t += u.get("input_tokens", 0)
                output_t += u.get("output_tokens", 0)
                cache_read += u.get("cache_read_input_tokens", 0)
                cache_create += u.get("cache_creation_input_tokens", 0)

    duration_min = 0
    if first_ts and last_ts:
        try:
            t1 = datetime.fromisoformat(first_ts.replace("Z", "+00:00"))
            t2 = datetime.fromisoformat(last_ts.replace("Z", "+00:00"))
            duration_min = (t2 - t1).total_seconds() / 60
        except ValueError:
            pass

    total = input_t + output_t + cache_read + cache_create
    cost = (
        input_t * PRICING["input"]
        + output_t * PRICING["output"]
        + cache_read * PRICING["cache_read"]
        + cache_create * PRICING["cache_create"]
    ) / 1_000_000

    return {
        "sid": os.path.basename(fpath).replace(".jsonl", "")[:8],
        "date": first_ts[:10] if first_ts else "?",
        "duration": fmt_duration(duration_min),
        "duration_min": duration_min,
        "turns": user_msgs,
        "api_calls": assistant_msgs,
        "input": input_t,
        "output": output_t,
        "cache_read": cache_read,
        "cache_write": cache_create,
        "total": total,
        "cost": cost,
    }


def main():
    if len(sys.argv) < 2:
        print("Usage: python3 token-usage.py <project-dir>")
        print("Example: python3 token-usage.py ~/.claude/projects/-Users-me-Projects-my-app")
        sys.exit(1)

    project_dir = os.path.expanduser(sys.argv[1])
    if not os.path.isdir(project_dir):
        print(f"Error: directory not found: {project_dir}")
        sys.exit(1)

    files = sorted(glob.glob(os.path.join(project_dir, "*.jsonl")))
    if not files:
        print("No session files found.")
        return

    sessions = [parse_session(f) for f in files]

    # Header
    print()
    print(
        "| # | Session    | Date       | Duration | Turns | API Calls "
        "| Input   | Output | Cache Read | Cache Write | Total  | Est. Cost |"
    )
    print(
        "|---|------------|------------|----------|-------|----------"
        "|---------|--------|------------|-------------|--------|-----------|"
    )

    # Rows
    for i, s in enumerate(sessions, 1):
        print(
            f"| {i} "
            f"| `{s['sid']}` "
            f"| {s['date']} "
            f"| {s['duration']:>8} "
            f"| {s['turns']:>5} "
            f"| {s['api_calls']:>9} "
            f"| {fmt_tokens(s['input']):>7} "
            f"| {fmt_tokens(s['output']):>6} "
            f"| {fmt_tokens(s['cache_read']):>10} "
            f"| {fmt_tokens(s['cache_write']):>11} "
            f"| {fmt_tokens(s['total']):>6} "
            f"| ${s['cost']:>8.2f} |"
        )

    # Totals
    ti = sum(s["input"] for s in sessions)
    to = sum(s["output"] for s in sessions)
    cr = sum(s["cache_read"] for s in sessions)
    cw = sum(s["cache_write"] for s in sessions)
    tt = sum(s["total"] for s in sessions)
    tc = sum(s["cost"] for s in sessions)
    turns = sum(s["turns"] for s in sessions)
    apis = sum(s["api_calls"] for s in sessions)
    total_min = sum(s["duration_min"] for s in sessions)

    print(
        f"| "
        f"| **TOTAL**  "
        f"|            "
        f"| {fmt_duration(total_min):>8} "
        f"| **{turns:>3}** "
        f"| **{apis:>7}** "
        f"| **{fmt_tokens(ti):>5}** "
        f"| **{fmt_tokens(to):>4}** "
        f"| **{fmt_tokens(cr):>8}** "
        f"| **{fmt_tokens(cw):>9}** "
        f"| **{fmt_tokens(tt):>4}** "
        f"| **${tc:>6.2f}** |"
    )
    print()


if __name__ == "__main__":
    main()
