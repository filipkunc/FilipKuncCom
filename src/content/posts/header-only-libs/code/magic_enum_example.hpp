#pragma once

// forward declaration speeds up compilation time
// we do not need to know the enum values to get the enum name

enum class Color;

const char* ColorToString(Color color);
Color ColorForIndex(int index);
int GetColorCount();

