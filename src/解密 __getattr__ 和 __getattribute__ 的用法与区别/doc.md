### _\_getattr\_\_

当访问实例对象的某个不存在的属性时，毫无疑问会报错，会抛出 AttributeError。

```python
class A:
    pass

a = A()
a.xxx
"""
AttributeError: 'A' object has no attribute 'xxx'
"""
```

但如果我们希望在找不到某个属性时，不要报错，而是返回默认值，该怎么做呢？这个时候我们就需要定义 \_\_getattr\_\_ 方法了，当实例对象找不到某个属性时会执行此方法。

```python
class Girl:

    def __init__(self):
        self.name = "古明地觉"
        self.age = 17

    def get_info(self):
        return f"name: {self.name}, age: {self.age}"

    def __getattr__(self, item):
        return f"你访问了 {item} 属性"


girl = Girl()
print(girl.name, girl.age)  # 古明地觉 17
print(girl.get_info)  # <bound method Girl.get_info...>
print(girl.get_info())  # name: 古明地觉, age: 17

print(girl.xxx)  # 你访问了 xxx 属性
print(girl.yyy)  # 你访问了 yyy 属性
print(girl.zzz)  # 你访问了 zzz 属性
```

所以非常简单，就是当实例对象访问了一个不存在的属性时，会执行 \_\_getattr\_\_ 方法。当然，如果属性存在的话，就不会执行了，而是返回相应的值。

此外 \_\_getattr\_\_ 还有一个用法，就是在模块导入的时候。假设我们有一个 tools.py，里面代码如下：

```python
def __getattr__(name):
    return f"{__name__} 中不存在 {name}"

name = "古明地觉"
age = 17
```

相信你明白它是干什么的了，我们来导入它：

```python
from tools import name, age, xxx, yyy

print(name, age)  # 古明地觉 17
print(xxx)  # tools 中不存在 xxx
print(yyy)  # tools 中不存在 yyy

import tools
print(tools.zzz)  # tools 中不存在 zzz
```

在获取 tools.py 里面的属性时，如果不存在，那么同样会去执行 \_\_getattr\_\_，应该还是很简单的。

### \_\_getattribute\_\_

\_\_getattribute\_\_ 被称为属性拦截器，它比 \_\_getattr\_\_ 要霸道的多，这两者的区别如下：

- \_\_getattr\_\_：当访问的属性不存在时，才会执行此方法；
- \_\_getattribute\_\_：不管访问的属性是否存在，一律执行此方法；

我们举个例子：

```python
class Girl:

    def __init__(self):
        self.name = "古明地觉"
        self.age = 17

    def __getattribute__(self, item):
        return f"获取属性: {item}"


girl = Girl()
print(girl.name)  # 获取属性: name
print(girl.age)  # 获取属性: age
print(girl.xxx)  # 获取属性: xxx

# 即便你想通过属性字典获取也是没有用的
# 因为不管什么属性，都会执行 __getattribute__
print(girl.__dict__)  # 获取属性: __dict__
```

并且在使用这个方法的时候，一定要谨慎，因为你一不小心就会陷入无限递归。

~~~python
class Girl:

    def __init__(self):
        self.name = "古明地觉"
        self.age = 17

    def __getattribute__(self, item):
        return getattr(self, item)


girl = Girl()
print(girl.name)
# 显然上面的代码会陷入无限递归
# 因为 girl.name 会调用 __getattribute__
# 而在里面又执行了 getattr(self, item)，还是在获取属性
# 所以又会调用 __getattribute__，于是会无限递归

# 可能有人说，那我换一种方式
# 我将 getattr(self, item) 改成 self.__dict__[item] 可以吗
# 答案也是不行的，因为 self.__dict__ 仍是在获取属性
# 只要获取属性，就会触发 __getattribute__，依旧会陷入无限递归
~~~

所以 \_\_getattribute\_\_ 非常霸道，那么我们如何使用它呢？答案是通过父类。

```python
class Girl:

    def __init__(self):
        self.name = "古明地觉"
        self.age = 17

    def __getattribute__(self, item):
        return super().__getattribute__(item)


girl = Girl()
print(girl.name)
print(girl.age)
try:
    girl.xxx
except AttributeError:
    print("属性 xxx 不存在")
"""
古明地觉
17
属性 xxx 不存在
"""
```

当我们调用父类的 \_\_getattribute\_\_ 时，如果属性存在，它会直接返回；如果实例没有该属性，那么会检测我们是否定义了 \_\_getattr\_\_，定义了则执行，没定义则抛出 AttributeError。我们将这两个方法结合起来，看一个例子：

~~~python
class Girl:

    def __init__(self):
        self.name = "古明地觉"
        self.age = 17

    def __getattr__(self, item):
        print(f"__getattr__ {item}")
        return f"获取属性 {item}"

    def __getattribute__(self, item):
        print(f"__getattribute__ {item}")
        return super().__getattribute__(item)


girl = Girl()
# 不管属性是否存在，一律调用 __getattribute__
# 然后在里面我们又调用了父类的 __getattribute__
# 那么会检测属性是否存在，存在则直接获取对应的值，然后返回
print(girl.name)
"""
__getattribute__ name
古明地觉
"""
# age 也是相同的逻辑，和 name 一样，这两个属性都是存在的
print(girl.age)
"""
__getattribute__ age
17
"""

# 依旧执行 __getattribute__，然后调用父类的 __getattribute__
# 由于属性 xxx 不存在，于是会执行 __getattr__
print(girl.xxx)
"""
__getattribute__ xxx
__getattr__ xxx
获取属性 xxx
"""
~~~

那么问题来了，这个 \_\_getattribute\_\_ 有啥用呢？该方法被称为属性拦截器，显然它可以起到一个控制属性访问权限的作用。

```python
class Girl:

    def __init__(self):
        self.name = "古明地觉"
        self.age = 17

    def __getattr__(self, item):
        return f"属性 {item} 不存在"

    def __getattribute__(self, item):
        if item == "age":
            return "女人芳龄不可泄露，别问，问就是还不到 18 岁"
        return super().__getattribute__(item)


girl = Girl()
# name 属性存在，所以在 __getattribute__ 中直接返回
print(girl.name)
"""
古明地觉
"""
# age 也是如此，也是在 __getattribute__ 中直接返回
# 只不过它相当于被拦截了
print(girl.age)
"""
女人芳龄不可泄露，别问，问就是还不到 18 岁
"""
# 父类在执行 __getattribute__ 的时候，发现 xxx 属性不存在
# 于是会触发 __getattr__ 的执行（如果没定义则抛出 AttributeError）
print(girl.xxx)
"""
属性 xxx 不存在
"""
```

所以 \_\_getattribute\_\_ 就相当于一个属性拦截器，不管获取啥属性，都要先经过它。如果你发现有一些属性不想让外界访问，那么直接拦截掉即可，比如上面代码中的 age 属性。

然后对于那些可以让外界访问的属性，则需要调用父类的 \_\_getattribute\_\_ 帮我们去获取（因为我们手动获取的话会陷入无线递归），并且在获取不存在的属性时也会自动执行 \_\_getattr\_\_。

当然啦，除了属性，方法也是一样的。

```python
class Girl:

    def __init__(self):
        self.name = "古明地觉"
        self.age = 17

    def get_info(self):
        return f"name: {self.name}, age: {self.age}"

    def __getattribute__(self, item):
        if item == "get_info":
            return "此方法禁止获取"
        return super().__getattribute__(item)


girl = Girl()
print(girl.get_info)
"""
此方法禁止获取
"""
# 默认情况下 girl.get_info 拿到的是一个方法
# 然后再加上小括号就会执行该方法
# 但在 __getattribute__ 中我们将其拦截了，并返回一个字符串
# 所以此时 girl.get_info() 就会报错，因为字符串无法被调用
```

以上就是 \_\_getattr\_\_ 和 \_\_getattribute\_\_ 的区别与用法，在工作中看看能不能让它们派上用场。不过说实话，\_\_getattr\_\_ 用的还是蛮频繁的，而 \_\_getattribute\_\_ 则用的不多，至少我就很少用。