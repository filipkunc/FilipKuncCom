// A plain shared int incremented from every thread. The canonical data race.
#include <cstdint>
#include <print>

#include "hammer.h"

// #region counter
int32_t counter = 0;        // a plain int, shared by every thread

void increment() {
    counter++;              // load counter, add one, store it back: three steps,
}                           // and another thread can slip in between them
// #endregion counter

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
    std::print("\nlost increments in {} of {} trials\n", lost_in, trials);
    std::print("counter reached {:.0f}% of the expected total on average\n",
               100.0 * static_cast<double>(sum) / trials / expected);
    return 0;
}
