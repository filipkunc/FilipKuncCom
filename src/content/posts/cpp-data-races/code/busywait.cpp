// The busy-wait people get wrong. The producer writes data, then sets a flag;
// the consumer spins on the flag, then reads the data. Making the flag atomic
// is not enough: with relaxed ordering the flag says nothing about the data
// written before it, so the consumer can read data that has not landed yet.
// The bug hides on x86, whose hardware does not reorder these accesses, but
// ThreadSanitizer reports it on any machine because it checks the C++ memory
// model, not the hardware. Built with -fsanitize=thread.
#include <atomic>
#include <cstdint>
#include <print>
#include <string_view>
#include <thread>

int32_t data = 0;
std::atomic<bool> ready{false};

// #region busywait-wrong
void produce_relaxed() {
    data = 42;                                     // 1. write the data
    ready.store(true, std::memory_order_relaxed);  // 2. announce it, relaxed
}
void consume_relaxed() {
    while (!ready.load(std::memory_order_relaxed)) {}  // busy-wait on the flag
    int32_t got = data;                            // 3. read, unordered with step 1
    std::print("data = {}\n", got);
}
// #endregion busywait-wrong

// #region busywait-right
void produce_release() {
    data = 42;
    ready.store(true, std::memory_order_release);  // release: orders step 1 before it
}
void consume_acquire() {
    while (!ready.load(std::memory_order_acquire)) {}  // acquire: receives step 1
    int32_t got = data;
    std::print("data = {}\n", got);
}
// #endregion busywait-right

int main(int argc, char** argv) {
    std::string_view mode = argc > 1 ? argv[1] : "wrong";
    bool fixed = mode == "right";

    std::thread producer(fixed ? produce_release : produce_relaxed);
    std::thread consumer(fixed ? consume_acquire : consume_relaxed);
    producer.join();
    consumer.join();
    return 0;
}
