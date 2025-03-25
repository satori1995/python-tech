假设有一个可迭代对象，现在想要对它内部的元素进行排序，我们一般会使用内置函数 sorted，举个例子：

~~~python
data = (3, 4, 1, 2, 5)
print(sorted(data))  # [1, 2, 3, 4, 5]

data = (3.14, 2, 1.75)
print(sorted(data))  # [1.75, 2, 3.14]

data = ["satori", "koishi", "marisa"]
print(sorted(data))  # ['koishi', 'marisa', 'satori']
~~~

如果可迭代对象里面的元素是数值，那么会按照数值的大小进行排序；如果是字符串，那么会按照字符串的字典序进行排序，并且 sorted 函数会返回一个新的列表。

> sorted 函数默认是升序排序，如果想要降序，那么可以传递一个关键字参数 reverse=True。

~~~python
data = [
    (3, 4), (3, 1), (2, 3)
]
print(sorted(data))  # [(2, 3), (3, 1), (3, 4)]
~~~

如果可迭代对象里面都是元组的话，也是可以的，元组在比较大小的时候，会先按照元组的第一个元素比较；第一个元素相等，再按照第二个元素比较，依次类推。

因此在使用 sorted 函数的时候，可迭代对象内部的元素，要满足彼此之间都是可比较的，否则报错。

~~~Python
data = [123, 456, "123"]
try:
    print(sorted(data))
except TypeError as e:
    print(e)  # '<' not supported between instances of 'str' and 'int'

data = [{"a": 1}, {"b": 2}, {"c": 3}]
try:
    print(sorted(data))
except TypeError as e:
    print(e)  # '<' not supported between instances of 'dict' and 'dict'

~~~

我们看到，由于 data 里面存在不可比较的元素，因此报错了。那么问题来了，假设有这样一个列表：

~~~Python
data = [{"name": "satori", "age": 17}, 
        {"name": "marisa", "age": 15}, 
        {"name": "koishi", "age": 16}]

# 字典是不可比较大小的，因此直接使用 sorted 会报错
# 我们希望按照字典内部的 "age" 字段进行排序，得到下面的结果

[{'name': 'marisa', 'age': 15}, 
 {'name': 'koishi', 'age': 16}, 
 {'name': 'satori', 'age': 17}]
~~~

如果是你的话，你会怎么做呢？很明显，我们将每个 "age" 字段的值取出来，和所在的字典拼接成一个元组（或列表）不就行了，然后对元组进行排序，举个例子：

~~~Python
data = [{"name": "satori", "age": 17}, 
        {"name": "marisa", "age": 15}, 
        {"name": "koishi", "age": 16}]

data = [(d["age"], d) for d in data]
print(data)
"""
[(17, {'name': 'satori', 'age': 17}), 
 (15, {'name': 'marisa', 'age': 15}), 
 (16, {'name': 'koishi', 'age': 16})]
"""

# 由于 data 内部的元素是一个元组
# 所以排序的时候会按照元组的第一个元素排序
sorted_data = sorted(data)
print(sorted_data)
"""
[(15, {'name': 'marisa', 'age': 15}), 
 (16, {'name': 'koishi', 'age': 16}), 
 (17, {'name': 'satori', 'age': 17})]
"""

# 此时顺序就排好了，然后再把字典取出来
sorted_data = [item[-1] for item in sorted_data]
print(sorted_data)
"""
[{'name': 'marisa', 'age': 15}, 
 {'name': 'koishi', 'age': 16}, 
 {'name': 'satori', 'age': 17}]
"""
~~~

显然这样就实现了基于字典内部某个字段的值，来对字典进行排序，只不过上面的代码还有一点点缺陷。我们说元组在比较的时候会先比较第一个元素，第一个元素相同的话，会比较第二个元素。

而我们上面 data 里面的元组，由于第一个元素都不相等，所以直接就比较出来了。但如果是下面这种情况呢？

~~~Python
data = [{"name": "satori", "age": 17}, 
        {"name": "marisa", "age": 16}, 
        {"name": "koishi", "age": 16}]

data = [(d["age"], d) for d in data]
print(data)
"""
[(17, {'name': 'satori', 'age': 17}), 
 (16, {'name': 'marisa', 'age': 16}), 
 (16, {'name': 'koishi', 'age': 16})]
"""
try:
    sorted_data = sorted(data)
except TypeError as e:
    print(e)  # '<' not supported between instances of 'dict' and 'dict'
~~~

此时就报错了，因为第二个元组和第三个元组内部的第一个元素都是 16，所以第一个元素相等，那么会比较第二个元素。而第二个元素是字典，字典之间无法比较，所以报错了。

但我们只是希望让字典的 "age" 字段的值参与比较，如果相等的话，那么就不用再比较了，相对顺序就保持现状。所以我们可以这么做：

~~~Python
data = [{"name": "satori", "age": 17}, 
        {"name": "marisa", "age": 16}, 
        {"name": "koishi", "age": 16}]

# 将索引也加进去
data = [(d["age"], i, d) for i, d in enumerate(data)]
print(data)
"""
[(17, 0, {'name': 'satori', 'age': 17}), 
 (16, 1, {'name': 'marisa', 'age': 16}), 
 (16, 2, {'name': 'koishi', 'age': 16})]
"""

# 如果 "age" 字段的值、或者说元组的第一个元素相等
# 那么就按照索引比较，而索引一定是不重复的
sorted_data = sorted(data)
print(sorted_data)
"""
[(16, 1, {'name': 'marisa', 'age': 16}), 
 (16, 2, {'name': 'koishi', 'age': 16}), 
 (17, 0, {'name': 'satori', 'age': 17})]
"""

# 此时就成功排好序了，并且 "age" 字段的值相等的字典之间的相对顺序
# 在排序之前和排序之后都保持一致，这正是我们想要的结果
sorted_data = [item[-1] for item in sorted_data]
print(sorted_data)
"""
[{'name': 'marisa', 'age': 16}, 
 {'name': 'koishi', 'age': 16}, 
 {'name': 'satori', 'age': 17}]
"""
~~~

再比如，我们想要对元组排序，但我们希望按照元组的第二个元素进行排序：

~~~python
data = [("satori", 17), 
        ("marisa", 15), 
        ("koishi", 16)]

data = [(item[1], i, item) for i, item in enumerate(data)]
print(data)
"""
[(17, 0, ('satori', 17)), 
 (15, 1, ('marisa', 15)), 
 (16, 2, ('koishi', 16))]
"""

sorted_data = sorted(data)
print(sorted_data)
"""
[(15, 1, ('marisa', 15)), 
 (16, 2, ('koishi', 16)), 
 (17, 0, ('satori', 17))]
"""

sorted_data = [item[-1] for item in sorted_data]
print(sorted_data)
"""
[('marisa', 15), 
 ('koishi', 16), 
 ('satori', 17)]
"""
~~~

所以当可迭代对象内部的元素无法进行排序，或者说我们不希望基于整个元素进行排序，那么就可以使用上面这个方法。将用来排序的值、索引、原始值放在一个元组里面，然后对元组排序，排完了再把最后一个值（也就是原始值）筛出来即可。

或者我们还可以做的再复杂一些：

~~~python
data = [-3, -2, 3, 2, -1, 1, 0]
"""
对 data 进行排序，排序规则如下
先按照内部元素的正负进行排序，排序之后正数在后面
如果符号一样，再按照绝对值的大小进行排序
也就是说，排完之后是下面这样一个结果

[-1, -2, -3, 0, 1, 2, 3]
"""

# 如果只按照正负排序
data1 = [(n >= 0, i, n) for i, n in enumerate(data)]
sorted_data = sorted(data1)
print(sorted_data)
"""
[(False, 0, -3), (False, 1, -2), (False, 4, -1), 
 (True, 2, 3), (True, 3, 2), (True, 5, 1), (True, 6, 0)]
"""
sorted_data = [item[-1] for item in sorted_data]
# 此时正数就排在了负数的后面
print(sorted_data)
"""
[-3, -2, -1, 3, 2, 1, 0]
"""

# 如果只按照绝对值排序
data2 = [(abs(n), i, n) for i, n in enumerate(data)]
sorted_data = sorted(data2)
print(sorted_data)
"""
[(0, 6, 0), (1, 4, -1), (1, 5, 1), 
 (2, 1, -2), (2, 3, 2), (3, 0, -3), (3, 2, 3)]
"""
sorted_data = [item[-1] for item in sorted_data]
print(sorted_data)
"""
[0, -1, 1, -2, 2, -3, 3]
"""

# 同时按照正负和绝对值排序
data3 = [(n >= 0, abs(n), i, n) for i, n in enumerate(data)]
sorted_data = sorted(data3)
print(sorted_data)
"""
[(False, 1, 4, -1), (False, 2, 1, -2), 
 (False, 3, 0, -3), (True, 0, 6, 0), 
 (True, 1, 5, 1), (True, 2, 3, 2), (True, 3, 2, 3)]
"""
sorted_data = [item[-1] for item in sorted_data]
# 大功告成
print(sorted_data)
"""
[-1, -2, -3, 0, 1, 2, 3]
"""
~~~

那么接下来，我们就可以封装一个属于我们自己的 my_sorted 函数了。

~~~python
def my_sorted(data, *, key=None, reverse=False):
    """
    :paramdata: 可迭代对象
    :paramkey: callable
    :paramreverse: 是否逆序
    :return:
    """
    if key is not None:
        data = [(key(item), i, item) for i, item in enumerate(data)]
    sorted_data = sorted(data)
    if key is not None:
        sorted_data = [item[-1] for item in sorted_data]
    if reverse:
        sorted_data = sorted_data[:: -1]
    return sorted_data

# 下面来测试一下
data = [-3, -2 ,3, 2, -1, 1, 0]
print(my_sorted(data, key=lambda x: (x >= 0, abs(x))))
"""
[-1, -2, -3, 0, 1, 2, 3]
"""

data = [
    {"name": "satori", 'age': 17},
    {"name": "marisa", 'age': 16},
    {"name": "koishi", 'age': 16}
]
print(my_sorted(data, key=lambda x: x["age"]))
"""
[{'name': 'marisa', 'age': 16},
 {'name': 'koishi', 'age': 16}, 
 {'name': 'satori', 'age': 17}]
"""
~~~

结果一切正常，当然啦，实际工作中我们肯定不会专门封装一个 my_sorted 函数，因为内置的 sorted 已经包含了我们上面的所有功能。

~~~python
data = [-3, -2 ,3, 2, -1, 1, 0]
print(sorted(data, key=lambda x: (x >= 0, abs(x))))
"""
[-1, -2, -3, 0, 1, 2, 3]
"""

data = [
    {"name": "satori", 'age': 17},
    {"name": "marisa", 'age': 16},
    {"name": "koishi", 'age': 16}
]
print(sorted(data, key=lambda x: x["age"]))
"""
[{'name': 'marisa', 'age': 16},
 {'name': 'koishi', 'age': 16}, 
 {'name': 'satori', 'age': 17}]
"""
~~~

内置函数 sorted 除了接收一个可迭代对象之外，还接收两个关键字参数 key 和 reverse，含义就是我们介绍的那样。在 sorted 的内部，它的处理方式和我们上面是一致的，如果指定了 key，也就是自定义排序规则，那么在底层会将可迭代对象内部的值封装成元组，然后对元组排序。排完序之后，再将元组的最后一个值、也就是原始值取出来，并返回。

所以这就是 sorted 函数的全部秘密，它里面的参数 key 赋予了 sorted 函数强大的能力，有了这个参数，我们想怎么排序，就怎么排序。

~~~python
class A:
    
    def __init__(self, a):
        self.a = a
    
    def __repr__(self):
        return f"self.a = {self.a}"
    
    def __hash__(self):
        return self.a
    
a1 = A(1)
a2 = A(2)
a3 = A(3)
a4 = A(4)

data = [a2, a3, a1, a4]
print(data)
"""
[self.a = 2, self.a = 3, self.a = 1, self.a = 4]
"""

# A 的实例对象无法比较，我们希望按照内部的属性 a 进行比较
print(sorted(data, key=lambda x: x.a))
"""
[self.a = 1, self.a = 2, self.a = 3, self.a = 4]
"""

# 或者按照哈希值比较，此时仍相当于按照 self.a 比较
print(sorted(data, key=lambda x: hash(x), reverse=True))
"""
[self.a = 4, self.a = 3, self.a = 2, self.a = 1]
"""
~~~

因此我们想怎么比就怎么比，参数 key 赋予了我们极大的自由，key 接收一个函数（当然其它 callable 也可以，但大部分场景都是匿名函数），此函数接收一个参数，该参数会对应可迭代对象里面的每一个元素。而函数的返回值，决定了 sorted 的比较逻辑。

比如，我们不光可以对元组、列表排序，还可以对字典内部的键值对排序。

~~~Python
data = {"satori": 17, "marisa": 15, "koishi": 16}

# 对字典调用 sorted，针对的是字典里面的键，所以返回的也是键
print(sorted(data))  # ['koishi', 'marisa', 'satori']

# 匿名函数里面的参数 x 对应可迭代对象里面的每一个元素
# 这里就是字典的键，函数返回 d[x] 表示按照值来排序，但排序之后得到的仍然是键
print(sorted(data, key=lambda x: data[x]))  # ['marisa', 'koishi', 'satori']

# 此时的 x 就是键值对组成的元组，这里按照值来排序
print(
    sorted(data.items(), key=lambda x: x[1])
)  # [('marisa', 15), ('koishi', 16), ('satori', 17)]
~~~

当然啦，还有很多其它排序方式，比如按照数量排序：

~~~python
string = "a" * 4 + "b" * 3 + "c" * 5 + "d" * 2
data = ["a", "b", "c", "d"]

print(
    sorted(data, key=lambda x: string.count(x))
)  # ['d', 'b', 'a', 'c']
~~~

最后再来介绍一个知识点，sorted 在对可迭代对象内部的元素进行排序的时候，肯定要有大小比较的过程，这是肯定的。但问题是比较的时候，用的什么方式呢？举个例子，我想判断 a 和 b 的大小关系（假设不相等），无论是执行 a > b 还是 a < b，根据结果我都能得出它们谁大谁小。

而 sorted 在比较的时候是怎么做的呢，这里给出结论：每次在比较两个对象的时候，都会调用左边对象的 \_\_lt\_\_ 方法。其实关于 sorted 内部是怎么比的，我们无需太关注，但之所以说这一点，是因为在极端场景下可能会遇到。举个例子：

~~~python
# 第一个元素表示 "商品名称"
# 第二个元素表示 "销量"
data = [
    ("apple", 200),
    ("banana", 200),
    ("peach", 150),
    ("cherry", 150),
    ("orange", 150),
]

# 我们需要先按照 "销量" 的大小降序排序
# 如果 "销量" 相同，则按照 "商品名称" 的字典序升序排序
# 该怎么做呢？

# 由于一部分升序，一部分降序
# 我们无法直接使用 reverse 参数，所以就默认按照升序排
# 虽然 "销量" 要求降序排，但可以对它取反
# 这样值越大，取反之后的值就越小，从而实现降序效果
print(
    sorted(data, key=lambda x: (~x[1], x[0]))
)
"""
[('apple', 200), 
 ('banana', 200), 
 ('cherry', 150), 
 ('orange', 150), 
 ('peach', 150)]
"""
~~~

可能有小伙伴觉得这也没什么难的，那么我们将问题稍微换一下。如果让你先按照 "销量" 升序排序，如果 "销量相同"，再按照 "商品名称" 的字典序降序排序，你要怎么做呢？

显然这个问题的难点就在于字符串要怎么降序排，整数可以取反，但字符串是无法取反的。所以我们可以自定义一个类，实现它的 \_\_lt\_\_ 方法。

~~~python
data = [
    ("apple", 200),
    ("banana", 200),
    ("peach", 150),
    ("cherry", 150),
    ("orange", 150),
]

class STR(str):
    def __lt__(self, other):
        # 调用 str 的 __lt__，得到布尔值，然后再取反
        # 当然，把 not 换成 ~ 也是可以的
        # 因此："apple" < "banana" 为 True
        # 但是：STR("apple") < STR("banana") 为 False
        return not super().__lt__(other)

# 销量升序排，直接 x[1] 即可
# 但是商品名称降序排，需要使用类 STR 将 x[0] 包起来
print(sorted(data, key=lambda x: (x[1], STR(x[0]))))
"""
[('peach', 150), 
 ('orange', 150), 
 ('cherry', 150), 
 ('banana', 200), 
 ('apple', 200)]
"""

# 事实上，如果你的思维够灵活，你会发现
# "销量"降序排、"商品名称"升序排，排完之后再整体取反
# 就是这里 "销量"升序排、"商品名称"将序排 的结果
print(
    sorted(data, key=lambda x: (~x[1], x[0]), reverse=True)
    ==
    sorted(data, key=lambda x: (x[1], STR(x[0])))
)  # True
# 当然这个思路也很巧妙
~~~

由于默认是调用 \_\_lt\_\_ 进行比较的，因此我们需要实现 \_\_lt\_\_。

以上就是 Python 中如何对可迭代对象进行排序，还是很有意思的。