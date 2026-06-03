#include <magic_enum.hpp>

#include "magic_enum_example.hpp"

enum class Color { Red, Green, Blue };

const char* ColorToString(Color color) {
  return magic_enum::enum_name(color).data();
}

Color ColorForIndex(int index) {
  return magic_enum::enum_value<Color>(index);
}

int GetColorCount() {
  return magic_enum::enum_count<Color>();
}
