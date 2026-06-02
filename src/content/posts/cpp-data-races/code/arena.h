// A bump allocator (an arena). It does almost nothing per allocation: move a
// cursor forward and hand back the slice it passed. There is no per-object
// free. You call reset() once, at the end of a phase, and the whole buffer is
// free again. Giving up individual frees is exactly why it is hard to beat.
#pragma once

#include <atomic>
#include <cstddef>
#include <cstdint>
#include <new>

// #region arena-single
class Arena {
    std::byte* base_;
    std::size_t cap_, next_ = 0;
public:
    explicit Arena(std::size_t bytes)
        : base_(static_cast<std::byte*>(::operator new(bytes))), cap_(bytes) {}
    ~Arena() { ::operator delete(base_); }

    void* allocate(std::size_t n) {
        if (next_ + n > cap_) return nullptr;   // full: time to reset()
        void* p = base_ + next_;
        next_ += n;                              // a read-modify-write, like counter++
        return p;
    }
    void reset() { next_ = 0; }                  // "frees" everything at once
};
// #endregion arena-single

// #region arena-atomic
// The same arena, made safe to share. The only mutable state is the cursor, so
// the only fix needed is to bump it atomically. fetch_add is one instruction,
// it is lock-free, and there is no ABA problem here because the cursor only ever
// moves forward, it is never rewound to memory still in use. To stay bounded it
// wraps within a power-of-two buffer, which suits transient, touch-and-discard
// allocation (one slot is only reused a whole buffer's worth of allocations
// later, long after that slot was last handed out).
class AtomicArena {
    std::byte* base_;
    std::size_t mask_;                                   // bytes - 1, bytes a power of two
    std::atomic<std::size_t> next_{0};
public:
    explicit AtomicArena(std::size_t bytes)
        : base_(static_cast<std::byte*>(::operator new(bytes))), mask_(bytes - 1) {}
    ~AtomicArena() { ::operator delete(base_); }

    void* allocate(std::size_t n) {
        std::size_t o = next_.fetch_add(n, std::memory_order_relaxed);   // the counter fix, again
        return base_ + (o & mask_);                      // wrap, never out of bounds
    }
};
// #endregion arena-atomic
