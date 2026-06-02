// Times handing out a 64-byte block in a tight loop, across a range of thread
// counts, three ways:
//
//   new / delete       the global allocator, allocate and free each block
//   AtomicArena        one shared bump arena, cursor moved with fetch_add
//   thread-local Arena one private bump arena per thread, no sharing at all
//
// The arenas never free a single block, they reset() in bulk when full, so they
// are timed the way they are actually used: almost-free allocation. Prints a
// RESULT line per (allocator, threads) that bench-allocators.mjs reads. Run with
// "new-only" to time just new/delete (for the LD_PRELOAD=tcmalloc pass).
#include <algorithm>
#include <atomic>
#include <chrono>
#include <cstdint>
#include <dlfcn.h>
#include <print>
#include <string_view>
#include <thread>
#include <vector>

#include "arena.h"

constexpr std::size_t BLOCK = 64;
constexpr std::size_t ARENA_BYTES = 4096 * BLOCK;   // power of two, stays in cache
constexpr int64_t ITERS = 1'000'000;                // per thread
constexpr int32_t BEST_OF = 5;                      // keep the best; the full-machine point is noisy

// Is a tcmalloc actually loaded into this process? tc_version is gperftools's
// version symbol; dlsym finds it through RTLD_DEFAULT only when libtcmalloc is
// present (e.g. via LD_PRELOAD), so the bench can confirm the preload took
// effect instead of mislabelling plain new/delete as tcmalloc.
static bool tcmalloc_active() { return dlsym(RTLD_DEFAULT, "tc_version") != nullptr; }

// #region thread-local
thread_local Arena tls_arena{ARENA_BYTES};   // one private arena per thread

void* tls_alloc() {
    void* p = tls_arena.allocate(BLOCK);
    if (!p) { tls_arena.reset(); p = tls_arena.allocate(BLOCK); }   // bulk free, then retry
    return p;
}
// #endregion thread-local

// Run `alloc`/`free` on `threads` threads, ITERS times each, released together,
// and return the wall time per operation in nanoseconds (lower is better).
template <typename Alloc, typename Free>
double measure(uint32_t threads, Alloc alloc, Free free_) {
    std::atomic<bool> go{false};
    std::atomic<int64_t> sink{0};
    std::vector<std::thread> pool;
    pool.reserve(threads);
    for (uint32_t t = 0; t < threads; ++t) {
        pool.emplace_back([&] {
            int64_t local = 0;
            while (!go.load(std::memory_order_acquire)) { /* spin */ }
            for (int64_t i = 0; i < ITERS; ++i) {
                auto* c = static_cast<volatile char*>(alloc());
                *c = static_cast<char>(i);     // touch the block so nothing is elided
                local += *c;
                free_(const_cast<char*>(c));
            }
            sink.fetch_add(local, std::memory_order_relaxed);
        });
    }
    auto t0 = std::chrono::steady_clock::now();
    go.store(true, std::memory_order_release);
    for (auto& th : pool) th.join();
    auto t1 = std::chrono::steady_clock::now();
    double ns = std::chrono::duration<double, std::nano>(t1 - t0).count();
    return ns / (static_cast<double>(threads) * ITERS);
}

template <typename Alloc, typename Free>
double best(uint32_t threads, Alloc alloc, Free free_) {
    double b = 1e30;
    for (int32_t r = 0; r < BEST_OF; ++r) b = std::min(b, measure(threads, alloc, free_));
    return b;
}

void emit(std::string_view impl, uint32_t threads, double ns) {
    std::print("RESULT impl={} threads={} ns_per_op={:.3f} mops={:.2f}\n", impl, threads, ns, 1000.0 / ns);
}

int main(int argc, char** argv) {
    std::string_view mode = argc > 1 ? argv[1] : "all";
    const bool newOnly = (mode == "new-only");

    uint32_t hw = std::thread::hardware_concurrency();
    if (hw == 0) hw = 4;
    std::vector<uint32_t> counts;
    for (uint32_t t : {1u, 2u, 4u, 8u, 16u})
        if (t <= hw) counts.push_back(t);
    if (counts.empty() || counts.back() != hw) counts.push_back(hw);

    std::print("CPU threads={} block={} iters={} bestof={}\n", hw, BLOCK, ITERS, BEST_OF);
    std::print("ALLOC active={}\n", tcmalloc_active() ? "tcmalloc" : "system");

    auto noop = [](void*) {};
    for (uint32_t n : counts) {
        emit("new", n, best(n, [] { return ::operator new(BLOCK); },
                            [](void* p) { ::operator delete(p); }));
        if (newOnly) continue;

        {
            AtomicArena arena(ARENA_BYTES);   // shared: the cursor is the contention
            emit("atomic", n, best(n, [&] { return arena.allocate(BLOCK); }, noop));
        }
        emit("threadlocal", n, best(n, tls_alloc, noop));
    }
    return 0;
}
