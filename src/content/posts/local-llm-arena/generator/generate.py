"""Drive llama-server through each model in MODELS, write outputs to samples/.

llama-server's binary needs LD_LIBRARY_PATH pointing at its build/bin/ (libmtmd.so etc live next to it).
Model files are resolved via huggingface_hub, which downloads to ~/.cache/huggingface on first run.
"""

import json
import os
import subprocess
import sys
import threading
import time
import urllib.request
from pathlib import Path

from huggingface_hub import hf_hub_download

sys.path.insert(0, str(Path(__file__).parent))
import call_model


class Sampler:
    """Polls the target process (via /proc) and nvidia-smi while the context is open.
    Reports peak RAM (process RSS), CPU% across cores, peak VRAM, and GPU%."""

    def __init__(self, pid: int, interval: float = 0.2):
        self.pid = pid
        self.interval = interval
        self.gpu: list[tuple[float, float]] = []  # (util%, vram_mib)
        self.ram: list[float] = []                # process RSS in MiB
        self.cpu: list[float] = []                # process CPU% (can exceed 100 with multi-core)
        self._stop = threading.Event()
        self._thread: threading.Thread | None = None
        self._clk_tck = os.sysconf("SC_CLK_TCK")
        self._last_jiffies = 0
        self._last_time = 0.0

    def _sample_proc(self):
        try:
            rss_kib = 0
            with open(f"/proc/{self.pid}/status") as f:
                for line in f:
                    if line.startswith("VmRSS:"):
                        rss_kib = int(line.split()[1])
                        break
            with open(f"/proc/{self.pid}/stat") as f:
                fields = f.read().split()
            # utime + stime + cutime + cstime, in jiffies
            jiffies = sum(int(fields[i]) for i in (13, 14, 15, 16))
        except (FileNotFoundError, ProcessLookupError):
            return
        now = time.monotonic()
        self.ram.append(rss_kib / 1024)
        if self._last_jiffies and now > self._last_time:
            self.cpu.append((jiffies - self._last_jiffies) / self._clk_tck / (now - self._last_time) * 100)
        self._last_jiffies, self._last_time = jiffies, now

    def _sample_gpu(self):
        try:
            out = subprocess.check_output(
                ["nvidia-smi", "--query-gpu=utilization.gpu,memory.used",
                 "--format=csv,noheader,nounits"],
                text=True, timeout=1,
            )
            util, mem = (float(x) for x in out.strip().split(","))
            self.gpu.append((util, mem))
        except Exception:
            pass

    def _run(self):
        while not self._stop.is_set():
            self._sample_proc()
            self._sample_gpu()
            self._stop.wait(self.interval)

    def __enter__(self):
        self._thread = threading.Thread(target=self._run, daemon=True)
        self._thread.start()
        return self

    def __exit__(self, *exc):
        self._stop.set()
        if self._thread:
            self._thread.join(timeout=2)

    def summary(self) -> dict:
        avg = lambda xs: round(sum(xs) / len(xs), 1) if xs else None
        return {
            "ram_peak_mib":     int(max(self.ram)) if self.ram else None,
            "cpu_util_avg_pct": avg(self.cpu),
            "vram_peak_mib":    int(max(s[1] for s in self.gpu)) if self.gpu else None,
            "gpu_util_avg_pct": avg([s[0] for s in self.gpu]),
            "samples":          max(len(self.ram), len(self.gpu)),
        }

HERE = Path(__file__).parent
POST_DIR = HERE.parent
SAMPLES = POST_DIR / "verify" / "arena" / "samples"

LLAMA_BIN = Path.home() / ".unsloth" / "llama.cpp" / "build" / "bin" / "llama-server"

MODELS = [
    # (slug, repo, filename, enable_thinking, ngl).
    # enable_thinking=None: don't forward the flag (Gemma has no thinking mode).
    # enable_thinking=False on Qwen3 suppresses its default chain-of-thought trace,
    # which otherwise produces thousands of reasoning tokens before the answer.
    # ngl=99 offloads all layers to the GPU, ngl=0 runs purely on CPU.
    ("gemma-4-e4b-it-gpu", "unsloth/gemma-4-e4b-it-gguf", "gemma-4-E4B-it-UD-Q4_K_XL.gguf", None,  99),
    ("gemma-4-e4b-it-cpu", "unsloth/gemma-4-e4b-it-gguf", "gemma-4-E4B-it-UD-Q4_K_XL.gguf", None,  0),
    ("qwen3.5-4b-gpu",     "unsloth/Qwen3.5-4B-GGUF",     "Qwen3.5-4B-UD-Q4_K_XL.gguf",     False, 99),
    ("qwen3.5-4b-cpu",     "unsloth/Qwen3.5-4B-GGUF",     "Qwen3.5-4B-UD-Q4_K_XL.gguf",     False, 0),
]


def start_server(model_file, ngl: int):
    env = {**os.environ, "LD_LIBRARY_PATH": str(LLAMA_BIN.parent)}
    proc = subprocess.Popen(
        [str(LLAMA_BIN), "-m", str(model_file), "--port", "8123", "-c", "8192",
         "-ngl", str(ngl), "-np", "1", "--no-context-shift"],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, env=env,
    )
    for _ in range(240):
        try:
            urllib.request.urlopen("http://127.0.0.1:8123/health", timeout=1).read()
            return proc
        except Exception:
            time.sleep(0.5)
    proc.terminate()
    raise RuntimeError("llama-server did not become ready")


def stop_server(proc):
    proc.terminate()
    try:
        proc.wait(timeout=10)
    except subprocess.TimeoutExpired:
        proc.kill()


def main():
    prompt = (HERE / "prompt.md").read_text()
    for slug, repo, filename, enable_thinking, ngl in MODELS:
        print(f"--- {slug} ---", flush=True)
        model_file = hf_hub_download(repo_id=repo, filename=filename)
        proc = start_server(Path(model_file), ngl=ngl)
        try:
            with Sampler(pid=proc.pid) as s:
                raw, timings = call_model.call(prompt, enable_thinking=enable_thinking)
        finally:
            stop_server(proc)
        metrics = {
            "tokens_generated": timings.get("predicted_n"),
            "tokens_per_second": round(timings["predicted_per_second"], 1)
                if timings.get("predicted_per_second") else None,
            "generation_seconds": round(timings["predicted_ms"] / 1000, 2)
                if timings.get("predicted_ms") else None,
            **s.summary(),
        }
        out = SAMPLES / slug
        out.mkdir(parents=True, exist_ok=True)
        (out / "raw-response.txt").write_text(raw)
        (out / "solution.py").write_text(call_model.extract_python(raw))
        (out / "metrics.json").write_text(json.dumps(metrics, indent=2) + "\n")
        print(f"wrote {out.relative_to(POST_DIR)}/", flush=True)


if __name__ == "__main__":
    main()
