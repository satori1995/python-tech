Python 有一个内置模块 itertools，从名字可以看出它是专门用来处理可迭代对象的，那么它都支持哪些操作呢？一起来看一下吧。

<font color="darkblue">**itertools.chain**</font>

接收多个可迭代对象（或者迭代器）作为参数，返回一个迭代器。它会生成所有输入迭代器的元素，就好像这些元素来自一个迭代器一样。

```python
import itertools

c = itertools.chain([1, 2, 3], "abc", {"k1": "v1", "k2": "v2"})
# 直接打印的话是一个对象
print(c) 
"""
<itertools.chain object at 0x00000000029745F8>
"""
print(list(c)) 
"""
1 2 3 a b c k1 k2
"""

# 还可以使用 chain.from_iterable
# 参数接收多个可迭代对象组成的一个可迭代对象
c = itertools.chain.from_iterable(
    [[1, 2, 3], "abc", {"k1": "v1", "k2": "v2"}]
)
print(list(c)) 
"""
1 2 3 a b c k1 k2
"""
```

<font color="darkblue">**itertools.zip_longest**</font>

从名字上可以看出，功能和内置的 zip 类似。确实如此，就是将多个可迭代对象对应位置的元素组合起来，像拉链（zip）一样。只不过内置的 zip 是 "木桶原理"，一方匹配到头了，那么就不匹配了，而 zip_longest 是以长的那一方为基准。

```python
import itertools

# 内置的 zip 是把多个迭代器对象中的每一个元素按照顺序组合到一个元组中
name = ["高老师", "猪哥", "S 佬"]
where = ["江苏", "北京", "深圳"]
z = zip(name, where)
print(z)
"""
<zip object at 0x00000257F3FEBEC0>
"""
print(list(z))
"""
[('高老师', '江苏'), ('猪哥', '北京'), ('S 佬', '深圳')]
"""

# 但如果两者长度不一致怎么办？
name = ["高老师", "猪哥", "S 佬", "xxx"]
where = ["江苏", "北京", "深圳"]
print(list(zip(name, where)))
"""
[('高老师', '江苏'), ('猪哥', '北京'), ('S 佬', '深圳')]
"""
# 可以看到，长度不一致的时候，当一方结束之后就停止匹配

# 如果想匹配长的，那么可以使用 itertools 下面的 zip_longest
print(list(itertools.zip_longest(name, where))) 
"""
[('高老师', '江苏'), ('猪哥', '北京'), ('S 佬', '深圳'), ('xxx', None)]
"""
# 默认使用 None 进行匹配，当然我们也可以指定内容
print(list(itertools.zip_longest(name, where, fillvalue="中国")))
"""
[('高老师', '江苏'), ('猪哥', '北京'), ('S 佬', '深圳'), ('xxx', '中国')]
"""
```

<font color="darkblue">**itertools.islice**</font>

如果一个迭代器里面包含了很多元素，我们只想要一部分的话，可以使用 islice，按照索引从迭代器中返回所选择的元素，并且得到的还是一个迭代器。

```python
import itertools

num = range(20)
# 选择 index=5 到 index=10（不包含）的位置
s = itertools.islice(num, 5, 10)
print(list(s))  # [5, 6, 7, 8, 9]

# 选择开头到 index=5 的位置
s = itertools.islice(num, 5)
print(list(s))  # [0, 1, 2, 3, 4]

# 选择从 index=5 到 index=15（不包含）的位置，步长为 3
s = itertools.islice(num, 5, 15, 3)
print(list(s))  # [5, 8, 11, 14]
```

注意：islice 不支持负数索引，因为不知道迭代器有多长，除非全部读取，可是那样的话干嘛不直接转为列表之后再用切片获取呢？之所以使用 islice 这种形式，就是为了在不全部读取的情况下，也能选择出我们想要的部分，所以这种方式只支持从前往后，不能从后往前。

<font color="darkblue">**itertools.tee**</font>

将一个可迭代对象拷贝 n 份。

```python
import itertools

r = [1, 2, 3, 4, 5]
i1, i2 = itertools.tee(r, 2)
print(list(i1))  # [1, 2, 3, 4, 5]
print(list(i2))  # [1, 2, 3, 4, 5]
```

<font color="darkblue">**itertools.count**</font>

~~~python
import itertools

"""
count(start=0, step=1) 返回一个迭代器，负责无限地生成连续的整数
接收两个参数：起始（默认为0）和步长（默认为1）
等价于：
def count(firstval=0, step=1):
    x = firstval
    while 1:
        yield x
        x += step
"""
# 起始值为 5，步长为 2
c1 = itertools.count(5, 2)
print(list(itertools.islice(c1, 5))) 
"""
[5, 7, 9, 11, 13]
"""
~~~

<font color="darkblue">**itertools.cycle**</font>

~~~python
import itertools

"""
cycle(iterable) 返回一个迭代器，会无限重复里面的内容，直到内存耗尽
"""
c2 = itertools.cycle("abc")
print(list(itertools.islice(c2, 10)))
"""
['a', 'b', 'c', 'a', 'b', 'c', 'a', 'b', 'c', 'a']
"""
~~~

<font color="darkblue">**itertools.repeat**</font>

~~~python
import itertools

"""
repeat(obj, times=None)，无限重复 obj，除非指定 times
"""
# 重复指定的次数
print(list(itertools.repeat("abc", 3))) 
"""
['abc', 'abc', 'abc']
"""
~~~

<font color="darkblue">**itertools.dropwhile**</font>

删除满足条件的值，注意：是删除。

```python
import itertools

l = [1, 2, 3, 4, 5]
drop_l = itertools.dropwhile(lambda x: x < 3, l)
# 依旧返回迭代器
print(drop_l) 
"""
<itertools.dropwhile object at 0x000001AD63AD0488>
"""
# 可以看到小于3的都被丢掉了
print(list(drop_l))  
"""
[3, 4, 5]
"""
```

<font color="darkblue">**itertools.takewhile**</font>

这个和 filter 是一样的，保留满足条件的值。

```python
import itertools

l = [1, 2, 3, 4, 5]
take_l = itertools.takewhile(lambda x: x < 3, l)
print(take_l) 
"""
<itertools.takewhile object at 0x000001D37F512948>
"""
print(list(take_l)) 
"""
[1, 2]
"""
filter_l = filter(lambda x: x < 3, l)
print(list(filter_l))  
"""
[1, 2]
"""
```

<font color="darkblue">**itertools.compress**</font>

提供了另一种过滤可迭代对象元素的方法。

```python
import itertools

condition = [True, False, True, True, False]
data = [1, 2, 3, 4, 5]
print(list(itertools.compress(data, condition))) 
"""
[1, 3, 4]
"""

# 除了指定 True 和 False，还可以使用 Python 其它类型的值
# 会以其对应的布尔值作为判断依据
condition = [1, 0, "x", "x", {}]  
print(list(itertools.compress(data, condition))) 
"""
[1, 3, 4]
"""
```

<font color="darkblue">**itertools.accumulate**</font>

accumulate 处理输入的序列，得到一个类似于斐波那契的结果。

```python
import itertools

print(list(itertools.accumulate(range(5))))  
"""
[0, 1, 3, 6, 10]
"""
print(list(itertools.accumulate("abcde")))  
"""
["a", "ab", "abc", "abcd", "abcde"]
"""
# 所以这里的相加还要看具体的含义
try:
    print(list(itertools.accumulate([[1, 2], (3, 4)])))
except TypeError as e:
    print(e)  
    """
    can only concatenate list (not "tuple") to list
    """
    # 这里就显示无法将列表和元组相加

# 当然也可以自定义
data = [1, 2, 3, 4, 5]
method = lambda x, y: x * y
print(list(itertools.accumulate(data, method))) 
"""
[1, 2, 6, 24, 120]
"""
# 可以看到这里的结果就改变了
```

<font color="darkblue">**itertools.product**</font>

product 则是会将多个可迭代对象组合成一个笛卡尔积。

```python
import itertools

print(list(itertools.product([1, 2, 3], [2, 3]))) 
"""
[(1, 2), (1, 3), (2, 2), (2, 3), (3, 2), (3, 3)]
"""
```

<font color="darkblue">**itertools.permutations**</font>

~~~python
import itertools

data = [1, 2, 3, 4]
print(list(itertools.permutations(data)))
# 根据排列组合，显然是 A44，总共 4 * 3 * 2 * 1 = 24 种组合
"""
[(1, 2, 3, 4), (1, 2, 4, 3), (1, 3, 2, 4), (1, 3, 4, 2), (1, 4, 2, 3), (1, 4, 3, 2),
(2, 1, 3, 4), (2, 1, 4, 3), (2, 3, 1, 4), (2, 3, 4, 1), (2, 4, 1, 3), (2, 4, 3, 1),
(3, 1, 2, 4), (3, 1, 4, 2), (3, 2, 1, 4), (3, 2, 4, 1), (3, 4, 1, 2), (3, 4, 2, 1),
(4, 1, 2, 3), (4, 1, 3, 2), (4, 2, 1, 3), (4, 2, 3, 1), (4, 3, 1, 2), (4, 3, 2, 1)]
"""

# 结果是 A42，总共 4 * 3 = 12 种组合
print(list(itertools.permutations(data, 2)))
"""
[(1, 2), (1, 3), (1, 4), 
 (2, 1), (2, 3), (2, 4), 
 (3, 1), (3, 2), (3, 4), 
 (4, 1), (4, 2), (4, 3)]
"""
~~~

<font color="darkblue">**itertools.combinations**</font>

permutations 显然是考虑了顺序，相当于排列组合里面 A，而 combinations 只考虑元素是否一致，而不管顺序，相当于排列组合里面的 C。

```python
import itertools

# permutations 只要顺序不同就看做一种结果
# combinations 则保证只要元素相同就是同一种结果
data = "abcd"
print(list(itertools.combinations(data, 3)))  
"""
[('a', 'b', 'c'), ('a', 'b', 'd'), ('a', 'c', 'd'), ('b', 'c', 'd')]
"""
# 如果拿抽小球来作比喻的话，显然 combinations 是不放回的，也就是不会重复单个的输入元素
# 但有时候可能也需要考虑包含重复元素的组合，相当于抽小球的时候有放回
# 对于这种情况，可以使用 combinations_with_replacement
print(list(itertools.combinations_with_replacement(data, 3)))
"""
[('a', 'a', 'a'), ('a', 'a', 'b'), ('a', 'a', 'c'), ('a', 'a', 'd'), ('a', 'b', 'b'),
('a', 'b', 'c'), ('a', 'b', 'd'), ('a', 'c', 'c'), ('a', 'c', 'd'), ('a', 'd', 'd'),
('b', 'b', 'b'), ('b', 'b', 'c'), ('b', 'b', 'd'), ('b', 'c', 'c'), ('b', 'c', 'd'),
('b', 'd', 'd'), ('c', 'c', 'c'), ('c', 'c', 'd'), ('c', 'd', 'd'), ('d', 'd', 'd')]
"""
```

以上就是该模块的用法，但说实话，感觉大部分都没啥卵用。