"""Run each samples/<model>/solution.py against tree-inversion cases, print a pass-fail table."""

import importlib.util
import signal
from pathlib import Path


class T:
    def __init__(self, v, l=None, r=None):
        self.val, self.left, self.right = v, l, r


def equal(a, b):
    if a is None or b is None:
        return a is b
    return a.val == b.val and equal(a.left, b.left) and equal(a.right, b.right)


def cases():
    return [
        ("empty",       None,                                                 None),
        ("single",      T(1),                                                 T(1)),
        ("simple-3",    T(1, T(2), T(3)),                                     T(1, T(3), T(2))),
        ("balanced",    T(4, T(2, T(1), T(3)), T(7, T(6), T(9))),             T(4, T(7, T(9), T(6)), T(2, T(3), T(1)))),
        ("left-skewed", T(1, T(2, T(3))),                                     T(1, None, T(2, None, T(3)))),
    ]


def _alarm(*_):
    raise TimeoutError()

signal.signal(signal.SIGALRM, _alarm)


def evaluate(model_dir):
    spec = importlib.util.spec_from_file_location(model_dir.name, model_dir / "solution.py")
    mod = importlib.util.module_from_spec(spec)
    try:
        spec.loader.exec_module(mod)
        fn = mod.invert_tree
    except Exception:
        return ["-"] * 5
    marks = []
    for _, inp, expected in cases():
        signal.alarm(2)
        try:
            marks.append("✓" if equal(fn(inp), expected) else "✗")
        except Exception:
            marks.append("✗")
        finally:
            signal.alarm(0)
    return marks


def main():
    samples = Path(__file__).parent / "samples"
    rows = sorted((d.name, evaluate(d)) for d in samples.iterdir() if d.is_dir())
    names = [c[0] for c in cases()]
    print("| model | " + " | ".join(names) + " | total |")
    print("|" + "---|" * (len(names) + 2))
    for name, marks in rows:
        print(f"| {name} | " + " | ".join(marks) + f" | {sum(m == '✓' for m in marks)}/{len(names)} |")


if __name__ == "__main__":
    main()
