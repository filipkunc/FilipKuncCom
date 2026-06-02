// A mutex stops the data race. Two mutexes taken in two different orders start a
// deadlock. A watchdog turns the hang into a printed line so the demo can finish.
#include <atomic>
#include <chrono>
#include <cstdint>
#include <cstdio>
#include <cstdlib>
#include <mutex>
#include <print>
#include <string_view>
#include <thread>

#include "hammer.h"

using namespace std::chrono_literals;

// #region deadlock
std::mutex a, b;

void wants_a_then_b() {
    std::lock_guard<std::mutex> la(a);   // take a ...
    std::this_thread::sleep_for(20ms);   // (a window to make the deadlock certain)
    std::lock_guard<std::mutex> lb(b);   // ... then wait for b
}
void wants_b_then_a() {
    std::lock_guard<std::mutex> lb(b);   // take b ...
    std::this_thread::sleep_for(20ms);
    std::lock_guard<std::mutex> la(a);   // ... then wait for a
}
// #endregion deadlock

// #region scoped-fix
std::mutex c, d;

void takes_both() {
    std::scoped_lock lk(c, d);   // locks both at once in a deadlock-free order
    // ... work on whatever c and d protect ...
}
// #endregion scoped-fix

// Run f1 and f2 once each, but give up after `ms` and report a hang instead of
// blocking forever. The stuck threads are detached; a and b are global so they
// outlive the leaked threads.
bool finishes(void (*f1)(), void (*f2)(), int32_t ms) {
    std::atomic<int32_t> done{0};
    std::thread t1([&] { f1(); done.fetch_add(1); });
    std::thread t2([&] { f2(); done.fetch_add(1); });
    auto deadline = std::chrono::steady_clock::now() + std::chrono::milliseconds(ms);
    while (done.load() < 2 && std::chrono::steady_clock::now() < deadline)
        std::this_thread::sleep_for(1ms);
    if (done.load() < 2) {
        t1.detach();
        t2.detach();
        return false;
    }
    t1.join();
    t2.join();
    return true;
}

int main(int argc, char** argv) {
    std::string_view mode = argc > 1 ? argv[1] : "deadlock";

    if (mode == "scoped") {
        std::print("two locks taken with std::scoped_lock(c, d), on every thread\n");
        hammer([](uint32_t, int32_t) { takes_both(); }, hw_threads(), 100000);
        std::print("  finished: every thread took both locks, no deadlock in any run\n");
        return 0;
    }

    std::print("opposite lock orders (thread 1: a then b, thread 2: b then a)\n");
    if (finishes(wants_a_then_b, wants_b_then_a, 500))
        std::print("  finished -- got lucky, run it again\n");
    else
        std::print("  DEADLOCK: nobody finished in 500 ms.\n"
                   "            thread 1 holds a and waits for b, thread 2 holds b and waits for a\n");

    // The two deadlocked threads are still holding a and b and can never be
    // joined. Leave through _Exit so the runtime does not destroy those locked
    // mutexes on the way out. Flush first, since _Exit skips that too.
    std::fflush(stdout);
    std::_Exit(0);
}
