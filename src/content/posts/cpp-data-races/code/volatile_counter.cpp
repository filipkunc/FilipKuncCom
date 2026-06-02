// The internet's favourite "fix": mark the shared int volatile. It changes
// nothing about the race, because volatile was never about threads.
#include <cstdint>
#include <print>

#include "hammer.h"

// #region volatile
volatile int32_t counter = 0;   // "volatile makes it thread-safe" -- it does not

void increment() {
    counter++;              // volatile forces the load and the store to really
}                           // happen, but they are still two separate steps
// #endregion volatile

int main() {
    const uint32_t threads = hw_threads();
    const int32_t iters = 100000;
    const int64_t expected = static_cast<int64_t>(threads) * iters;
    const int32_t trials = 10;

    std::print("{} threads, {} increments each, expected total {}\n\n", threads, iters, expected);

    int64_t sum = 0;
    int32_t lost_in = 0;
    for (int32_t t = 0; t < trials; ++t) {
        counter = 0;
        hammer([](uint32_t, int32_t) { increment(); }, threads, iters);
        int64_t got = counter;
        sum += got;
        if (got < expected) ++lost_in;
        if (t < 3)
            std::print("  trial {}: counter = {}  (lost {}, {:.0f}%)\n",
                       t + 1, got, expected - got, 100.0 * (expected - got) / expected);
    }
    std::print("  ...\n");
    std::print("\nlost increments in {} of {} trials, exactly like the plain int\n", lost_in, trials);
    std::print("counter reached {:.0f}% of the expected total on average\n",
               100.0 * static_cast<double>(sum) / trials / expected);
    return 0;
}
