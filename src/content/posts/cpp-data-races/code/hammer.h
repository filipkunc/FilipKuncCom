// The "run the same code on every core at once" trick from the work-life post.
// It does not find races by reasoning about them. It just makes a rare
// interleaving common: every thread is parked on the same flag, then released
// together, so they all hit the shared state in the same instant. A bug that
// shows up once in a million natural runs shows up on almost every hammered one.
#pragma once

#include <atomic>
#include <cstdint>
#include <thread>
#include <vector>

// #region hammer
// How many hardware threads to use, with a sane fallback for the platforms
// where hardware_concurrency() cannot tell and returns 0.
inline uint32_t hw_threads() {
    uint32_t n = std::thread::hardware_concurrency();
    return n ? n : 4;
}

// Call `body(thread_index, iteration)` on every hardware thread at once,
// `iters` times each, and wait for all of them to finish.
template <typename Body>
void hammer(Body body, uint32_t threads = hw_threads(), int32_t iters = 100000) {
    std::atomic<bool> go{false};          // every thread waits on this
    std::vector<std::thread> pool;
    pool.reserve(threads);
    for (uint32_t t = 0; t < threads; ++t) {
        pool.emplace_back([&, t] {
            while (!go.load(std::memory_order_acquire)) { /* spin */ }
            for (int32_t i = 0; i < iters; ++i) body(t, i);
        });
    }
    go.store(true, std::memory_order_release);   // release them all together
    for (auto& th : pool) th.join();
}
// #endregion hammer
