## 楔子

Python 标准库提供了一个 collections 模块，里面提供了很多的数据类，在工作中使用这些类能够简化我们的开发。

下面就来看看这个模块能够帮助我们做哪些事情？

## 搜索多个字典

假设当前有 3 个字典：dct1、dct2、dct3，现在要通过 key 查找对应的 value。如果 key 在 dct1 里面存在，那么直接返回，否则从 dct2 里面找。dct2 里面如果不存在，那么从 dct3 里面找。

这个需求该怎么实现呢？

~~~python
dct1 = {"a": 1, "b": 2, "c": 3}
dct2 = {"d": 4, "e": 5, "f": 6}
dct3 = {"e": 7, "f": 8, "g": 9}

def get_value_by_key(key):
    if key in dct1:
        return dct1[key]
    elif key in dct2:
        return dct2[key]
    elif key in dct3:
        return dct3[key]
    else:
        raise KeyError

print(get_value_by_key("b"))  # 2
print(get_value_by_key("d"))  # 4
print(get_value_by_key("f"))  # 6
~~~

实现起来非常简单，但通过 ChainMap 对象可以更方便地做到这一点。

```python
from collections import ChainMap

dct1 = {"a": 1, "b": 2, "c": 3}
dct2 = {"b": 4, "c": 5, "d": 6}

# 将多个字典传进去，
dct = ChainMap(dct1, dct2)

# 如果多个字典存在相同的 key，那么返回第一次出现的 key 对应的 value
print(dct["b"], dct["d"])
"""
2 6
"""

# 字典的 API 都可以使用
print(dct.items())
"""
ItemsView(ChainMap({'a': 1, 'b': 2, 'c': 3}, {'b': 4, 'c': 5, 'd': 6}))
"""

# 也可以使用 get，如果 key 在所有的字典中都不存在，则返回默认值
print(dct.get("k", 333))
"""
333
"""

# ChainMap 对象有一个 maps 属性，存储了要搜索的映射列表
# 这个列表是可变的，所以可以直接增加新映射，或者改变元素的顺序以控制查找和更新行为。
print(dct.maps)
"""
[{'a': 1, 'b': 2, 'c': 3}, {'b': 4, 'c': 5, 'd': 6}]
"""

# dct.maps 保存了原始的字典，修改 dct.maps 会影响原字典
print(dct1)
"""
{'a': 1, 'b': 2, 'c': 3}
"""
dct.maps[0]["a"] = 11111111
print(dct1)
"""
{'a': 11111111, 'b': 2, 'c': 3}
"""
# 同理修改原字典，也会影响 dct.maps
```

以上就是 ChainMap 对象的用法，当你需要从多个字典中进行搜索的话，它会很有用。

## 统计可散列的对象

我们经常会遇到数量统计相关的问题，比如有一个序列，计算里面每个元素出现了多少次。一般情况下，我们会这么做。

```python
words = ["hello", "world",
         "hello", "beautiful", "world",
         "hello", "cruel", "world"]

counter = {}
for word in words:
    if word in counter:
        counter[word] += 1
    else:
        counter[word] = 1

print(counter)
"""
{'hello': 3, 'world': 3, 'beautiful': 1, 'cruel': 1}
"""
```

实现方法没有任何问题，但通过 Counter 会更方便，并且还提供了更多功能。

~~~python
from collections import Counter

words = ["hello", "world",
         "hello", "beautiful", "world",
         "hello", "cruel", "world"]

# 将序列传进去即可
counter = Counter(words)
print(counter)
"""
Counter({'hello': 3, 'world': 3, 'beautiful': 1, 'cruel': 1})
"""

# Counter 继承 dict，所以字典的 API 它也是都支持的
counter = Counter(hello=3, world=3, beautiful=1, cruel=1)
print(counter)
"""
Counter({'hello': 3, 'world': 3, 'beautiful': 1, 'cruel': 1})
"""
~~~

Counter 对象还支持动态更新操作，举个例子：

```python
from collections import Counter

# Counter 需要接收一个可迭代对象，然后会遍历它
# 所以结果就是 a 出现了三次，b 出现了两次，c 出现了一次
counter = Counter("aaabbc")
print(counter)
"""
Counter({'a': 3, 'b': 2, 'c': 1})
"""

# 也可以动态更新，比如又来了一个序列，需要和当前的 counter 组合起来进行统计
counter.update("bcd")
print(counter)
"""
Counter({'a': 3, 'b': 3, 'c': 2, 'd': 1})
"""
# 可以看到 b 和 c 的值都增加了 1，并且出现了 d
# 需要注意的是：update 方法同样接收一个可迭代对象，然后进行遍历
# 如果我希望添加一个 key 叫 "bcd" 的话，那么要这么做
counter.update(["bcd"])
print(counter)
"""
Counter({'a': 3, 'b': 3, 'c': 2, 'd': 1, 'bcd': 1})
"""

# 访问计数，Counter 对象可以像字典一样访问
print(counter["a"])  
"""
3
"""
# 如果访问一个不存在的 key，不会引发 KeyError
# 而是会返回 0，表示对象中没有这个 key
print(counter["mmp"])  
"""
0
"""

# 还可以计算出现最多的元素，这是用的最频繁的一个功能
# 统计 string 中前三个出现次数最多的元素
string = "sasaxzsdsadfscxzcasdscxzdfscxsasadszczxczxcsds"
counter = Counter(string)
print(counter)
"""
Counter({'s': 13, 'c': 7, 'a': 6, 'x': 6, 'z': 6, 'd': 6, 'f': 2})
"""
print(counter.most_common(3))
"""
[('s', 13), ('c', 7), ('a', 6)]
"""
```

Counter 对象还有一个强大的功能，就是它支持算数操作以及位运算。

```python
from collections import Counter

counter1 = Counter("aabbccc")
counter2 = Counter("bbbccdd")
print(counter1)  
print(counter2)  
"""
Counter({'a': 2, 'b': 2, 'c': 3})
Counter({'b': 3, 'c': 2, 'd': 2})
"""
# 如果 counter1 的元素出现在了 counter2 中，就把该元素减去，记住：减的是次数
print(counter1 - counter2)  
"""
Counter({'a': 2, 'c': 1})
"""
# a 在 counter1 中出现了 2 次，在 counter2 中没有出现，所以是 a: 2
# b 在 counter1 中出现了 2 次，在 counter2 中出现 3 次，所以一减就没有了
# c 在 counter1 中出现了 3 次，在 counter2 中出现 2 次，所以相减还剩下一次
# 至于 counter1 中没有的元素就不用管了


# 相加就很好理解了
print(counter1 + counter2) 
"""
Counter({'b': 5, 'c': 5, 'a': 2, 'd': 2}) 
"""

# 相交的话，查找公共的元素，并且取次数出现较小的那个
print(counter1 & counter2)  
"""
Counter({'b': 2, 'c': 2})
"""

# 并集的话，取较大的，记住不是相加
# 所以 b 和 c 出现的次数不会增加，只是取较大的那个
print(counter1 | counter2)  
"""
Counter({'b': 3, 'c': 3, 'a': 2, 'd': 2})
"""
```

以上就是 Counter 的用法，更多的还是统计次数，求 topK。

## 缺少的键返回默认值

很明显，这是针对于字典的。首先字典也支持这种操作，通过 setdefault 和 get 两个方法，可以用来获取 key 对应的 value，并且还能在 key 不存在的时候给一个默认值。

如果 key 存在，两者会获取 key 对应的 value；但如果 key 不存在，setdefault 会先将 key 和指定的默认值设置进去，然后再将设置的值返回，而 get 则只会返回默认值，不会进行设置。

```python
d = {"a": 1}
# 如果 key 存在，直接返回 value
print(d.get("a", 0))  # 1
print(d.setdefault("a", 0))  # 1
# 原字典不受影响
print(d)  # {"a": 1}

# key 不存在，则返回指定的默认值
print(d.get("b", 0))  # 0
# 原字典不受影响
print(d)  # {"a": 1}

# key 不存在的话，会将 key 和默认值组成键值对，设置在字典中
print(d.setdefault("b", 0))  # 0
print(d)  # {"a": 1, "b": 0}
```

指的一提的是，setdefault 是一个非常实用且简洁的方法，但用的却不多。我们举一个例子：

```python
data = [
    ("banana", 15), ("banana", 17), ("banana", 22),
    ("apple", 31), ("apple", 30), ("apple", 33),
    ("orange", 45), ("orange", 47), ("orange", 44),
]
# 如果我希望将 data 转成以下格式，该怎么办呢？
"""
{'banana': [15, 17, 22], 
 'apple': [31, 30, 33], 
 'orange': [45, 47, 44]}
"""

def change_data1():
    result = {}
    for product, count in data:
        if product not in result:
            result[product] = [count]
        else:
            result[product].append(count)
    return result

print(change_data1())
"""
{'banana': [15, 17, 22], 
 'apple': [31, 30, 33], 
 'orange': [45, 47, 44]}
"""

# 结果没问题，但如果用 setdefault 的话会更方便
def change_data2():
    result = {}
    for product, count in data:
        result.setdefault(product, []).append(count)
    return result

print(change_data2())
"""
{'banana': [15, 17, 22], 
 'apple': [31, 30, 33], 
 'orange': [45, 47, 44]}
"""
```

但这个功能也可以通过 defaultdict 完成，该类要求调用者传递一个类型，当 key 不存在时会返回对应类型的零值。

```python
from collections import defaultdict

d = defaultdict(int)
print(d)  # defaultdict(<class 'int'>, {})
print(d["a"])  # 0
print(d)  # defaultdict(<class 'int'>, {'a': 0})

d = defaultdict(tuple)
print(d)  # defaultdict(<class 'tuple'>, {})
print(d["a"])  # ()
print(d)  # defaultdict(<class 'tuple'>, {'a': ()})

# 之前的例子就可以这么做
data = [
    ("banana", 15), ("banana", 17), ("banana", 22),
    ("apple", 31), ("apple", 30), ("apple", 33),
    ("orange", 45), ("orange", 47), ("orange", 44),
]

result = defaultdict(list)
for product, count in data:
    result[product].append(count)
# defaultdict 继承 dict，支持字典的 API
print(dict(result))
"""
{'banana': [15, 17, 22], 
 'apple': [31, 30, 33], 
 'orange': [45, 47, 44]}
"""
# 整个过程就是，key 如果存在，那么获取 value
# key 不存在，那么将指定类型的零值作为 value（这里是空列表）
# 并且返回之前，会先将 key、value 添加到键值对中

# 再比如之前的词频统计
string = "aabbccdddddee"
counter = defaultdict(int)
for c in string:
    counter[c] += 1
print(dict(counter))
"""
{'a': 2, 'b': 2, 'c': 2, 'd': 5, 'e': 2}
"""
```

怎么样，是不是很方便呢？在实例化 defaultdict 的时候，指定一个类型即可，获取一个不存在的 key 的时候，会返回指定的类型的零值，并且还会将 key 和零值添加到字典中。

此外 defaultdict 还可以自定义返回值，只需要指定一个不需要参数的函数即可。

```python
from collections import defaultdict

# 此时的默认值就是 default
d = defaultdict(lambda: "default")
print(d["aa"])  # default

# 此外还可以添加参数，因为单独指定了 aa，所以打印的时候以指定的为准
# 如果没有指定，那么才会得到默认值
d4 = defaultdict(lambda: "default", aa="bar")
print(d4["aa"])  # bar
print(d4["bb"])  # default
```

那么估计会有人好奇，这是如何实现的呢？其实主要是实现了一个叫做 \_\_missing\_\_ 的魔法方法。字典在查找元素的时候，会调用 \_\_getitem\_\_，然后在找不到的时候会去调用 \_\_missing\_\_。但是注意：dict 这个类本身并没有实现 \_\_missing\_\_，所以我们需要继承自 dict，然后在子类中实现。

```python
class MyDict(dict):

    def __getitem__(self, item):
        # 执行父类的 __getitem__ 方法
        # 如果 key 不存在，会去执行 __missing__ 方法
        value = super().__getitem__(item)
        # 所以这里的 value 就是 __missing__ 方法的返回值
        return value

    def __missing__(self, key):
        self[key] = "搞事情ﾍ(´ー｀ﾍ)搞事情"
        return self[key]


d = MyDict([("a", 3), ("b", 4)])
print(d)  # {'a': 3, 'b': 4}
print(d["mmm"])  # 搞事情ﾍ(´ー｀ﾍ)搞事情
print(d)  # {'a': 3, 'b': 4, 'mmm': '搞事情ﾍ(´ー｀ﾍ)搞事情'}
```

都是一些基础的内容了，突然想到了，就提一遍。

## 双端队列

如果你需要维护一个序列，并根据需求动态地往序列的尾部添加元素和弹出元素，那么你会选择什么序列呢？很明显，如果只在尾部操作，那么列表一定是最合适的选择。

但如果我们操作的不止是尾部，还有头部呢？比如往序列的头部添加和弹出元素，此时双端队列就是一个不错的选择。

双端队列支持从任意一端添加和删除元素，更为常用的两种数据结构（即栈和队列）就是双端队列的退化形式，它们的输入和输出被限制在某一端。

```python
from collections import deque

# 接收一个可迭代对象，然后进行遍历
d = deque("abcdefg")
print(d) 
"""
deque(['a', 'b', 'c', 'd', 'e', 'f', 'g'])
"""
print(len(d)) 
"""
7
"""
print(d[0]) 
"""
a
"""
print(d[-1])  
"""
g
"""

# 由于 deque 是一种序列容器，因此同样支持 list 的操作
# 如：通过索引获取元素，查看长度，删除元素，反转元素等等
# list 支持的操作，deque 基本上都支持
d.reverse()
print(d)  # deque(['g', 'f', 'e', 'd', 'c', 'b', 'a'])
d.remove("c")
print(d)  # deque(['g', 'f', 'e', 'd', 'b', 'a'])
```

deque 还有很多的 API，比如添加元素。

```python
from collections import deque

d = deque("abc")

# 添加元素，可以从两端添加
d.append("Hello")  # 从尾部添加
d.appendleft("World")  # 也可以从头部添加
print(d)
"""
deque(['World', 'a', 'b', 'c', 'Hello'])
"""

# 还可以使用 insert, 如果范围越界，自动添加在两端
d.insert(100, "古明地觉")
print(d)
"""
deque(['World', 'a', 'b', 'c', 'Hello', '古明地觉'])
"""

# 也可以通过extend，extendleft 一次添加多个元素
d = deque([1, 2, 3])
d.extend([4, 5, 6])
print(d)
"""
deque([1, 2, 3, 4, 5, 6])
"""
d.extendleft([7, 8, 9])
print(d)
"""
deque([9, 8, 7, 1, 2, 3, 4, 5, 6])
"""
# 注意添加的顺序，我们是从左边开始添加的
# 先添加 7，然后 8 会跑到 7 的左边，所以是结果是倒过来的
```

再来看看删除元素：

```python
from collections import deque

d = deque(range(1, 7))
print(d)
"""
deque([1, 2, 3, 4, 5, 6])
"""

# 调用 pop 方法可以从尾部弹出一个元素
print(d.pop())  # 6
print(d.pop())  # 5
print(d.pop())  # 4
# pop 是从右端删除一个元素，popleft 是从左端开始删除一个元素
# 但如果想 pop 掉指定索引的元素，则只能用 pop 函数，传入索引值即可
print(d.popleft())  # 1
print(d)
"""
deque([2, 3])
"""
# 注意：deque 和 queue一样，是线程安全的
# 它们均受 GIL 这把超级大锁保护，可以不同的线程中进行消费
# 如果想清空里面的元素，可以像 list、dict 一样，使用 clear 方法
d.clear()
print(d)  
"""
deque([])
"""
```

最后 deque 还有一个非常有意思的方法，叫 rotate，它是做什么的呢？来看一下。

```python
from collections import deque

# 按任意一个方向进行旋转，从而跳过某些元素。
# d.rotate(n)：n 大于0，从右边开始取 n 个元素放到左边
# n 小于 0，从左边取 n 个元素放到右边
d = deque(range(10))
print(d)  
"""
deque([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
"""

# 从右边取 2 个元素放到左边，所以 8 和 9 被放到了左边
d.rotate(2)
print(d)  
"""
deque([8, 9, 0, 1, 2, 3, 4, 5, 6, 7])
"""
d.rotate(-3)
# 从左边取 3 个元素放到右边，所以 8、9、0 被放到了右边
print(d)  
"""
deque([1, 2, 3, 4, 5, 6, 7, 8, 9, 0])
"""
```

当然双端队列默认是容量无限的，但很多时候我们需要给队列加上容量限制，如何加呢？

```python
from collections import deque

# 限制队列的大小
# 我们在初始化一个双端队列的时候，还可以限制它的大小
d = deque("abcdefg", maxlen=5)
# 我们初始化 7 个元素，但是指定最大长度只有 5
# 所以前面两个元素（"a" 和 "b"）就被挤出去了
print(d)
"""
deque(['c', 'd', 'e', 'f', 'g'], maxlen=5)
"""

# 当我往前面添加元素的时候，后面的就被挤出去了
# 因为队列最多只能容纳 5 个元素
d.appendleft("Hello")
print(d)  
"""
deque(['Hello', 'c', 'd', 'e', 'f'], maxlen=5)
"""
```

当你要维护一个从首尾两端添加、删除元素的序列时，使用 deque 是一个非常正确的选择。比如 asyncio 的锁 Lock，当获取锁时，就会创建一个 Future 对象，并保存在双端队列中。

## 带有名字的元组

元组的话，我们都是通过索引来获取元素，但通过索引的话，如果你不手动数一数，你是不知道该索引会对应哪一个元素的。所以问题来了，可不可以给里面的元素一个字段名呢？我们通过字段名来获取对应的值不就行啦，没错，这就是 namedtuple。

```python
from collections import namedtuple

# 传入名字，和字段
Person = namedtuple("Person", ["name", "age", "gender"])
person1 = Person(name="satori", age=16, gender="f")
print(person1)
"""
Person(name='satori', age=16, gender='f')
"""
print(person1.name, person1.age, person1.gender)
"""
satori 16 f
"""
print(person1[0])
"""
satori
"""
# 不仅可以像普通的 tuple 一样使用索引访问
# 还可以像类一样通过 . 字段名访问

person2 = Person("satori", 16, "f")
# 注意：这个和普通的元组一样，是不可以修改的
try:
    person2.name = "xxx"
except AttributeError as e:
    print(e)  # can't set attribute

# 非法字段名，不能使用 Python 的关键字
try:
    namedtuple("keywords", ["for", "in"])
except ValueError as e:
    print(e)
    """
    Type names and field names cannot be a keyword: 'for'
    """

# 如果字段名重复了，会报错
try:
    namedtuple("Person", ["name", "age", "age"])
except ValueError as e:
    print(e)
    """
    Encountered duplicate field name: 'age'
    """

# 如果非要加上重名字段，可以设置一个参数
Person = namedtuple("Person", ["name", "age", "age"],
                    rename=True)
print(Person)  
"""
<class '__main__.Person'>
"""
person3 = Person("koishi", 15, 15)
# 可以看到重复的字段名会按照索引的值，在前面加上一个下划线
# 比如第二个 age 重复，它的索引是多少呢？是 2，所以默认帮我们把字段名修改为 _2
print(person3)  
"""
Person(name='koishi', age=15, _2=15)
"""
# 此外我们所有的字段名都保存在 _fields 属性中
print(person3._fields)  
"""
('name', 'age', '_2')
"""
```

但 namedtuple 还有一个不完美的地方，就是它无法指定字段的类型，所以我们更推荐使用 typing 模块里的 NamedTuple。

```python
from typing import NamedTuple

class Person(NamedTuple):
    name: str
    age: int
    gender: str

p = Person("satori", 16, "f")
print(p)
"""
Person(name='satori', age=16, gender='f')
"""
# 同样能够基于索引和字段名来获取值
print(p[0], p.name)
"""
satori satori
"""

# 创建类的话，还可以这么创建
Person = NamedTuple('Person', name=str, age=int, gender=str)
Person = NamedTuple(
    'Person', [("name", str), ("age", int), ("gender", str)]
)
```

更建议使用 NamedTuple。

## 记住键值对顺序的字典

从 Python3.6 开始，字典遍历默认是有序的，但我们不应该依赖这个特性。如果希望字典有序，应该使用 OrderDict 字典子类。

```python
from collections import OrderedDict

d = OrderedDict()
d["a"] = "A"
d["b"] = "B"
d["c"] = "C"
for k, v in d.items():
    print(k, v)
"""
a A
b B
c C
"""
# 此外也可以在初始化的时候，添加元素
print(OrderedDict({"a": 1}))  
"""
OrderedDict([('a', 1)])
"""

# 相等性，对于常规字典来说，只要里面元素一样便是相等的，不考虑顺序
# 但是对于OrderDict来说，除了元素，顺序也要一样，否则就不相等
d1 = {"a": 1, "b": 2}
d2 = {"b": 2, "a": 1}
print(d1 == d2)  
"""
True
"""

d1 = OrderedDict({"a": 1, "b": 2})
d2 = OrderedDict({"b": 2, "a": 1})
print(d1 == d2)  
"""
False
"""

# 重排，在 OrderDict 中可以使用 move_to_end 方法
# 将某个键移动到序列的起始位置或末尾位置来改变顺序
d3 = OrderedDict({"a": 1, "b": 2, "c": 3, "d": 4})
# 表示将 key="c" 的键值对移动到末尾
d3.move_to_end("c")  
print(d3)  
"""
OrderedDict([('a', 1), ('b', 2), ('d', 4), ('c', 3)])
"""
# 表示将 key="c" 的这个键值对移动到行首
d3.move_to_end("c", last=False)  
print(d3)  
"""
OrderedDict([('c', 3), ('a', 1), ('b', 2), ('d', 4)])
"""

# 从尾部弹出一个元素
print(d3.popitem())
"""
('d', 4)
"""
# 从头部弹出一个元素
print(d3.popitem(last=False))
"""
('c', 3)
"""
```

使用 OrderDict 要比 dict 更加耗费内存，因此在存储大量键值对的时候，思考一下，是否需要保证键值对有序。

但在实现 LRU 缓存的时候，OrderDict 非常常用，比如某个键被访问了，通过 move_to_end 移到头部。当缓存满了的时候，通过 popitem 弹出尾部元素。

## 小结

以上就是 collections 模块的用法，这个模块还是非常好用的，我们拿出来说一说。