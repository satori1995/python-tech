假设有这样一种数据：

~~~python
data = [
    ("apple", 30), ("apple", 35),
    ("apple", 32), ("pear", 60),
    ("pear", 32), ("pear", 60),
    ("banana", 102), ("banana", 104)
]

# 我们需要变成如下格式
"""
[('apple', [30, 35, 32]),
 ('pear', [60, 32, 60]),
 ('banana', [102, 104])]
"""
~~~

如果是你的话，你会怎么做呢？很容易想到的一种解决方案是构造一个字典：

~~~python
data = [
    ("apple", 30), ("apple", 35),
    ("apple", 32), ("pear", 60),
    ("pear", 32), ("pear", 60),
    ("banana", 102), ("banana", 104)
]

data_dict = {}
for name, count in data:
    if name not in data_dict:
        data_dict[name] = []
    data_dict[name].append(count)

print(data_dict)
"""
{'apple': [30, 35, 32], 
 'pear': [60, 32, 60], 
 'banana': [102, 104]}
"""
print(list(data_dict.items()))
"""
[('apple', [30, 35, 32]), 
 ('pear', [60, 32, 60]), 
 ('banana', [102, 104])]
"""
~~~

这种方案完全没有问题，不过我们还可以写的更优雅一些，也就是使用字典的 setdefault 方法：

~~~Python
data = [
    ("apple", 30), ("apple", 35),
    ("apple", 32), ("pear", 60),
    ("pear", 32), ("pear", 60),
    ("banana", 102), ("banana", 104)
]

data_dict = {}
for name, count in data:
    # setdefault(k, v) 含义如下
    # 当 k 不存在时，将 k: v 设置在字典中，并返回 v
    # 当 k 存在时，直接返回 k 对应值
    data_dict.setdefault(name, []).append(count)

print(list(data_dict.items()))
"""
[('apple', [30, 35, 32]), 
 ('pear', [60, 32, 60]), 
 ('banana', [102, 104])]
"""
~~~

setdefault 是一个非常方便的方法，但是使用频率却不怎么高，或者说该方法不太让人喜欢。主要是每次调用都要给一个初始值，比如代码中的空列表 []。另外这里的初始值可以任意，如果你希望添加的时候还能实现去重效果，那么就将空列表换成空集合即可。

或者我们还可以使用 defaultdict，它位于 collections 模块中。

~~~Python
from collections import defaultdict

data = [
    ("apple", 30), ("apple", 35),
    ("apple", 32), ("pear", 60),
    ("pear", 32), ("pear", 60),
    ("banana", 102), ("banana", 104)
]

# 里面接收一个 callable
# 当访问的 k 不存在时，返回 callable 调用之后的值
data_dict1 = defaultdict(list)
for name, count in data:
    data_dict1[name].append(count)

print(list(data_dict1.items()))
"""
[('apple', [30, 35, 32]),
 ('pear', [60, 32, 60]), 
 ('banana', [102, 104])]
"""

# 也可以指定为 set
data_dict2 = defaultdict(set)
for name, count in data:
    data_dict2[name].add(count)

print(list(data_dict2.items()))
"""
[('apple', {32, 35, 30}), 
 ('pear', {32, 60}), 
 ('banana', {104, 102})]
"""
~~~

总的来说，defaultdict 和字典的 setdefault 方法非常类似，我们使用 setdefault 即可，因为 setdefault 其实更加方便。我们不妨再看个更复杂的例子。

~~~Python
data = [
    ("a", "x", 1),
    ("a", "x", 2),
    ("a", "x", 3),
    ("a", "y", 4),
    ("a", "y", 5),
    ("a", "z", 6),
    
    ("b", "x", 7),
    ("b", "x", 8),
    ("b", "y", 9),
    ("b", "z", 10),
]
# 如果我想得到下面的结果，怎么做呢？
"""
{'a': {'x': [1, 2, 3], 'y': [4, 5], 'z': [6]}, 
 'b': {'x': [7, 8], 'y': [9], 'z': [10]}}
"""
# 使用 setdefault 会非常方便
data_dict = {}
for first, second, value in data:
    data_dict.setdefault(first, {}).setdefault(second, []).append(value)

print(data_dict)
~~~

以上就是数据分组，比较简单，setdefault 这个方法非常方便，但总是容易被遗忘。