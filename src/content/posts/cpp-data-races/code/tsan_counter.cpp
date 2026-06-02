// The same race as counter.cpp, shrunk to two threads, built to be run under
// ThreadSanitizer (clang++ -fsanitize=thread). TSan does not need the race to
// actually lose an increment: it watches the memory accesses and reports the
// conflicting read and write with file and line.
#include <cstdint>
#include <thread>

// #region tsan
int32_t counter = 0;

int main() {
    std::thread t1([] { for (int32_t i = 0; i < 100000; ++i) counter++; });
    std::thread t2([] { for (int32_t i = 0; i < 100000; ++i) counter++; });
    t1.join();
    t2.join();
    return 0;
}
// #endregion tsan
