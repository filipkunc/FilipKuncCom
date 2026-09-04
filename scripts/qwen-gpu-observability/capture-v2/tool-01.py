import math

target = math.log(10)

def f(x):
    return x*math.log(x) - target

# Newton starting at 2.5
x = 2.5
for _ in range(50):
    fx = x*math.log(x) - target
    dfx = math.log(x) + 1
    x -= fx/dfx
print(x)
print(x**x)
print(x*math.log(x))
