#include <iostream>

#include "magic_enum_example.hpp"

int main() {
  for (int i = 0, count = GetColorCount(); i < count; ++i) {
    Color color = ColorForIndex(i);
    std::cout << "Color for index " << i << ": " << ColorToString(color) << "\n";
  }

  return 0;
}
