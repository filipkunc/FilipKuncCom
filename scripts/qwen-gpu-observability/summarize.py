#!/usr/bin/env python3
"""Summarize an Nsight Systems SQLite export and matching nvidia-smi CSV.

The operation buckets are intentionally modest claims: they are derived from
kernel-name substrings. They are not semantic annotations emitted by the model.
"""

import argparse
import csv
import json
import sqlite3
from datetime import datetime, timedelta, timezone
from pathlib import Path


def classify(name: str) -> str:
    lowered = name.lower()
    if "flash_attn" in lowered:
        return "flash_attention_name"
    if "gated_delta_net" in lowered:
        return "gated_delta_net_name"
    if "ssm_conv" in lowered:
        return "ssm_convolution_name"
    if "k_set_rows" in lowered:
        return "set_rows_name"
    if "mul_mat" in lowered or "gemm" in lowered:
        return "matrix_multiply_name"
    if "quantize" in lowered or "dequantize" in lowered:
        return "quantize_dequantize_name"
    if "norm" in lowered:
        return "normalization_name"
    if "rope" in lowered:
        return "rotary_embedding_name"
    if any(op in lowered for op in ("sigmoid", "silu", "softplus")):
        return "activation_name"
    return "other"


def percentile(values: list[float], fraction: float) -> float | None:
    if not values:
        return None
    ordered = sorted(values)
    return ordered[round((len(ordered) - 1) * fraction)]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--trace", required=True, type=Path, help="Nsight SQLite export")
    parser.add_argument("--gpu-csv", required=True, type=Path, help="100 ms nvidia-smi CSV")
    parser.add_argument("--manifest", default=Path(__file__).with_name("capture-manifest.json"), type=Path)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    manifest = json.loads(args.manifest.read_text())
    windows = manifest["windowsSecondsFromProfilerStart"]

    db = sqlite3.connect(args.trace)
    capture_epoch_ns = db.execute(
        "SELECT utcEpochNs FROM TARGET_INFO_SESSION_START_TIME"
    ).fetchone()[0]
    capture_wall = datetime.fromtimestamp(capture_epoch_ns / 1_000_000_000, tz=timezone.utc)

    result = {}
    for label, (start_s, end_s) in windows.items():
        rows = db.execute(
            """
            SELECT k.end-k.start, s.value
            FROM CUPTI_ACTIVITY_KIND_KERNEL AS k
            JOIN StringIds AS s ON s.id = k.demangledName
            WHERE k.start >= ? AND k.start < ?
            """,
            (int(start_s * 1_000_000_000), int(end_s * 1_000_000_000)),
        ).fetchall()

        categories = {}
        names = {}
        for duration_ns, name in rows:
            bucket = categories.setdefault(classify(name), {"instances": 0, "gpu_ms": 0.0})
            bucket["instances"] += 1
            bucket["gpu_ms"] += duration_ns / 1_000_000
            named = names.setdefault(name, {"instances": 0, "gpu_ms": 0.0})
            named["instances"] += 1
            named["gpu_ms"] += duration_ns / 1_000_000

        for values in categories.values():
            values["gpu_ms"] = round(values["gpu_ms"], 3)
        top = sorted(names.items(), key=lambda item: item[1]["gpu_ms"], reverse=True)[:10]
        result[label] = {
            "wall_ms": round((end_s - start_s) * 1000, 3),
            "kernel_instances": len(rows),
            "summed_kernel_ms": round(sum(row[0] for row in rows) / 1_000_000, 3),
            "categories": dict(sorted(categories.items(), key=lambda item: item[1]["gpu_ms"], reverse=True)),
            "top_kernels": [
                {"name": name, **{key: round(value, 3) if isinstance(value, float) else value for key, value in values.items()}}
                for name, values in top
            ],
        }

    gpu_rows = []
    with args.gpu_csv.open(newline="") as handle:
        for row in csv.reader(handle):
            gpu_rows.append({
                "timestamp": datetime.strptime(row[0].strip(), "%Y/%m/%d %H:%M:%S.%f").astimezone(),
                "gpu_util": float(row[1]),
                "memory_util": float(row[2]),
                "memory_mib": float(row[3]),
                "power_w": float(row[4]),
                "temperature_c": float(row[5]),
                "sm_clock_mhz": float(row[6]),
                "memory_clock_mhz": float(row[7]),
            })

    for label, (start_s, end_s) in windows.items():
        wall_start = (capture_wall + timedelta(seconds=start_s)).astimezone()
        wall_end = (capture_wall + timedelta(seconds=end_s)).astimezone()
        rows = [row for row in gpu_rows if wall_start <= row["timestamp"] <= wall_end]
        powers = [row["power_w"] for row in rows]
        utils = [row["gpu_util"] for row in rows]
        result[label]["telemetry"] = {
            "samples": len(rows),
            "gpu_util_avg_pct": round(sum(utils) / len(utils), 1),
            "gpu_util_p95_pct": round(percentile(utils, 0.95), 1),
            "gpu_util_peak_pct": round(max(utils), 1),
            "vram_min_mib": round(min(row["memory_mib"] for row in rows)),
            "vram_max_mib": round(max(row["memory_mib"] for row in rows)),
            "power_avg_w": round(sum(powers) / len(powers), 1),
            "power_peak_w": round(max(powers), 1),
            "energy_wh_approx": round((sum(powers) / len(powers)) * (end_s - start_s) / 3600, 3),
            "temperature_peak_c": round(max(row["temperature_c"] for row in rows)),
        }

    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
