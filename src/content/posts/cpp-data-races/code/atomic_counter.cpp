// std::atomic fixes the counter, but only if you let one operation do the whole
// read-modify-write. Spell it as a load then a store and the race is back.
#include <atomic>
#include <cstdint>
#include <print>
#include <string_view>

#include "hammer.h"

// #region atomic-wrong
std::atomic<int32_t> counter{0};

void bump_wrong() {
    counter.store(counter.load() + 1);   // two atomic ops with a gap between them:
}                                        // another thread can store into that gap
// #endregion atomic-wrong

// #region atomic-right
void bump_right() {
    counter.fetch_add(1, std::memory_order_relaxed);   // one indivisible step
}
// #endregion atomic-right

int64_t run(void (*body)(), uint32_t threads, int32_t iters) {
    counter.store(0);
    hammer([body](uint32_t, int32_t) { body(); }, threads, iters);
    return counter.load();
}

int main(int argc, char** argv) {
    std::string_view mode = argc > 1 ? argv[1] : "all";
    const uint32_t threads = hw_threads();
    const int32_t iters = 100000;
    const int64_t expected = static_cast<int64_t>(threads) * iters;

    std::print("{} threads, {} increments each, expected total {}\n\n", threads, iters, expected);

    if (mode == "wrong" || mode == "all") {
        int64_t w = run(bump_wrong, threads, iters);
        std::print("  store(load() + 1) : {}   (lost {})\n", w, expected - w);
    }
    if (mode == "right" || mode == "all") {
        int64_t r = run(bump_right, threads, iters);
        std::print("  fetch_add(1)      : {}   (lost {})\n", r, expected - r);
    }
    return 0;
}
