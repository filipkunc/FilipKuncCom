// Show that the plain Arena hands the same slice to two threads under
// contention, and that bumping the cursor with fetch_add never does.
#include <cstdint>
#include <new>
#include <print>
#include <string_view>

#include "arena.h"
#include "hammer.h"

// #region arena-use
struct Widget {
    int32_t id;
    float weight;
    Widget(int32_t i, float w) : id(i), weight(w) {}
};

void example(Arena& arena) {
    void* mem = arena.allocate(sizeof(Widget));   // raw bytes from the buffer
    Widget* w = new (mem) Widget(7, 1.5f);        // placement new: construct in place
    // ... use w ...
    w->~Widget();                                 // run the destructor by hand
    // no free: the bytes come back only when the whole arena is reset()
}
// #endregion arena-use

// #region probe
// Each thread takes a slice, stamps its own id into it, yields, then checks the
// stamp is still its own. A surviving foreign stamp means two threads were
// handed the same slice.
template <typename A>
int64_t collisions(A& arena, uint32_t threads, int32_t iters) {
    std::atomic<int64_t> hits{0};
    hammer(
        [&](uint32_t tid, int32_t) {
            void* p = arena.allocate(64);
            if (!p) return;
            auto* stamp = static_cast<uint32_t*>(p);
            *stamp = tid;
            std::this_thread::yield();
            if (*stamp != tid) hits.fetch_add(1, std::memory_order_relaxed);
        },
        threads, iters);
    return hits.load();
}
// #endregion probe

// Smallest power of two >= x, so the ring AtomicArena is big enough to hold the
// whole probe without wrapping (a wrap would reuse a slot and look like a hit).
static std::size_t pow2_at_least(std::size_t x) {
    std::size_t p = 1;
    while (p < x) p <<= 1;
    return p;
}

int main(int argc, char** argv) {
    std::string_view mode = argc > 1 ? argv[1] : "all";
    const uint32_t threads = hw_threads();
    const std::size_t bytes = static_cast<std::size_t>(threads) * 20000 * 64;

    if (mode == "unsafe" || mode == "all") {
        Arena arena(bytes);
        std::print("Arena       (next_ += n)  : {} slices handed to more than one thread\n",
                   collisions(arena, threads, 20000));
    }
    if (mode == "atomic" || mode == "all") {
        AtomicArena arena(pow2_at_least(bytes));
        std::print("AtomicArena (fetch_add)   : {} slices handed to more than one thread\n",
                   collisions(arena, threads, 20000));
    }
    return 0;
}
