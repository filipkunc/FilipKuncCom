"""Minimal GPU metrics exporter: NVML -> Prometheus on :9835.

Stands in for DCGM on machines without GPU-in-container setup. Exposes the
metrics that matter for serving: utilization, memory, power, temperature,
and memory-controller utilization (a bandwidth saturation proxy).
"""

import time

import pynvml
from prometheus_client import Gauge, start_http_server

LABELS = ["gpu", "name"]
g_util = Gauge("nvml_gpu_utilization_percent", "GPU SM utilization", LABELS)
g_mem_util = Gauge("nvml_memory_controller_utilization_percent", "Memory controller utilization", LABELS)
g_mem_used = Gauge("nvml_memory_used_bytes", "GPU memory used", LABELS)
g_mem_total = Gauge("nvml_memory_total_bytes", "GPU memory total", LABELS)
g_power = Gauge("nvml_power_watts", "Power draw", LABELS)
g_temp = Gauge("nvml_temperature_celsius", "GPU temperature", LABELS)
g_sm_clock = Gauge("nvml_sm_clock_mhz", "SM clock", LABELS)


def main():
    pynvml.nvmlInit()
    count = pynvml.nvmlDeviceGetCount()
    handles = [pynvml.nvmlDeviceGetHandleByIndex(i) for i in range(count)]
    start_http_server(9835)
    print(f"nvml exporter on :9835, {count} gpu(s)")
    while True:
        for i, h in enumerate(handles):
            labels = {"gpu": str(i), "name": pynvml.nvmlDeviceGetName(h)}
            util = pynvml.nvmlDeviceGetUtilizationRates(h)
            mem = pynvml.nvmlDeviceGetMemoryInfo(h)
            g_util.labels(**labels).set(util.gpu)
            g_mem_util.labels(**labels).set(util.memory)
            g_mem_used.labels(**labels).set(mem.used)
            g_mem_total.labels(**labels).set(mem.total)
            g_power.labels(**labels).set(pynvml.nvmlDeviceGetPowerUsage(h) / 1000)
            g_temp.labels(**labels).set(pynvml.nvmlDeviceGetTemperature(h, pynvml.NVML_TEMPERATURE_GPU))
            g_sm_clock.labels(**labels).set(pynvml.nvmlDeviceGetClockInfo(h, pynvml.NVML_CLOCK_SM))
        time.sleep(1)


if __name__ == "__main__":
    main()
