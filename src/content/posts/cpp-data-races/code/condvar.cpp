// A condition variable without a predicate loses any notification that arrives
// before the wait. The fix is to wait on a condition, not on the signal.
#include <atomic>
#include <chrono>
#include <condition_variable>
#include <cstdint>
#include <mutex>
#include <print>
#include <string_view>
#include <thread>

using namespace std::chrono_literals;

// #region cv-wrong
std::mutex m;
std::condition_variable cv;
bool ready = false;

void consumer_wrong() {
    std::this_thread::sleep_for(100ms);    // arrive at the wait after the notify
    std::unique_lock<std::mutex> lk(m);
    cv.wait(lk);              // waits for a notify -- even one that already happened
    // ... use the data ...
}
void producer() {
    {
        std::lock_guard<std::mutex> lk(m);
        ready = true;
    }
    cv.notify_one();          // if this runs before the wait, nobody is listening
}
// #endregion cv-wrong

// #region cv-right
std::mutex m2;
std::condition_variable cv2;
bool ready2 = false;

void consumer_right() {
    std::this_thread::sleep_for(100ms);    // same late arrival as the broken one
    std::unique_lock<std::mutex> lk(m2);
    cv2.wait(lk, [] { return ready2; });   // checks the condition first, every wake
    // ... use the data ...
}
// #endregion cv-right

// Start a consumer that waits, let the producer fire first, and see whether the
// consumer ever wakes. Returns false if it was still stuck after `ms`. Either
// way the consumer is joined before returning: a notify now (when it really is
// waiting) frees a predicate-less wait, and we must not leave a thread parked on
// a condition variable that is about to be destroyed.
bool consumer_wakes(void (*consumer)(), void (*produce)(), int32_t ms) {
    std::atomic<bool> woke{false};
    std::thread c([&] { consumer(); woke.store(true); });
    std::this_thread::sleep_for(20ms);   // the consumer is still sleeping, not yet waiting
    produce();                           // ... so this notify lands before the wait
    auto deadline = std::chrono::steady_clock::now() + std::chrono::milliseconds(ms);
    while (!woke.load() && std::chrono::steady_clock::now() < deadline)
        std::this_thread::sleep_for(1ms);
    bool in_time = woke.load();
    // Whether or not it woke in time, never leave it blocked on a cv we are about
    // to destroy: keep nudging until it actually wakes (a predicate-less wait only
    // returns on a notify it is present for), then join.
    while (!woke.load()) {
        produce();
        std::this_thread::sleep_for(5ms);
    }
    c.join();
    return in_time;
}

// The "right" producer sets the other flag and notifies the other cv.
void producer2() {
    {
        std::lock_guard<std::mutex> lk(m2);
        ready2 = true;
    }
    cv2.notify_one();
}

int main(int argc, char** argv) {
    std::string_view mode = argc > 1 ? argv[1] : "all";

    if (mode == "wrong" || mode == "all") {
        std::print("notify sent before the wait, cv.wait(lk) with no predicate\n");
        if (consumer_wakes(consumer_wrong, producer, 500))
            std::print("  consumer woke\n");
        else
            std::print("  LOST WAKEUP: the notify happened before the wait, so the wait never returns\n");
    }
    if (mode == "right" || mode == "all") {
        std::print("notify-before-wait again, cv.wait(lk, [] {{ return ready; }})\n");
        if (consumer_wakes(consumer_right, producer2, 500))
            std::print("  consumer woke immediately: the predicate was already true, so it never waited\n");
        else
            std::print("  still stuck (should not happen)\n");
    }
    return 0;
}
