## 楔子

导入一个模块，我们一般都会使用 import 关键字，但有些场景下 import 难以满足我们的需要。所以除了 import 之外还有很多其它导入模块的方式，下面就来介绍一下。

## \_\_import\_\_

这是一个内置函数，解释器在 import 的时候，实际上就执行了这个函数。

~~~python
# import os 等价于如下方式
os = __import__("os")
print(os)  # <module 'os' from 'C:\\python38\\lib\\os.py'>

# 但是这种方式不能多级导入
path = __import__("os.path")
print(path)  # <module 'os' from 'C:\\python38\\lib\\os.py'>
# 可以看到，导入的仍是 os，而不是 os.path

# 如果想导入子模块，需要一个参数 fromlist
# 我们给它传一个非空列表即可
path = __import__("os.path", fromlist=[""])
print(path)  # <module 'ntpath' from 'C:\\python38\\lib\\ntpath.py'>
~~~

但是官方不建议使用这个函数，因为它是专门给解释器用的，我们可以使用一个模块。

```Python
import importlib

os = importlib.import_module("os")
print(os)  # <module 'os' from 'C:\\python38\\lib\\os.py'>

# 可以多级导入
path = importlib.import_module("os.path")
print(path)  # <module 'ntpath' from 'C:\\python38\\lib\\ntpath.py'>
```

所以当导入的模块名以字符串的形式存在时，就可以使用这种方式。

## importlib.machinery

importlib.machinery 里面提供了三种 Loader，可以让我们以打开文件的方式导入一个模块。

```Python
from importlib.machinery import (
    SourceFileLoader,  # 导入源文件
    SourcelessFileLoader,  # 导入 pyc 文件
    ExtensionFileLoader  # 导入扩展文件
)

# 参数一：给模块起个名字
# 参数二：文件路径
os = SourceFileLoader(
    "我是 os 模块",
    r"C:\python38\lib\os.py"
).load_module()
print(os)
"""
<module '我是 os 模块' from 'C:\\python38\\lib\\os.py'>
"""
print(os.path.join("video", "overwatch", "hanzo.mp4"))
"""
video\overwatch\hanzo.mp4
"""

# 我们看到结果一切正常，但有一点需要注意
# 如果是导入包的话，那么要导入包里面的 __init__.py 文件
pd = SourceFileLoader(
    "我是 pandas 模块",
    r"C:\python38\lib\site-packages\pandas\__init__.py"
).load_module()
print(pd.DataFrame({"a": [1, 2, 3], "b": [4, 5, 6]}))
"""
   a  b
0  1  4
1  2  5
2  3  6
"""

# 如果只写到 pandas，那么会抛出 PermissionError，因为不能把目录当成文件来读取
# 至于 import 一个包，本质上也是加载包内部的 __init__.py 
# 但这里需要显式地加上 __init__.py
```

同理加载 pyc 和 pyd 也是类似的，但需要注意的是，加载普通文件和 pyc 文件时，我们可以随便起名字，也就是第一个参数任意。但对于 pyd 文件，第一个参数必须和 pyd 文件的名字保持一致。

## 通过 module 类创建模块

Python 一切皆对象，模块自然也不例外。既然是对象，那么必然就会有相应的类来实例化它。

~~~Python
import os
import hashlib
import numpy

# os.__class__ 等价于 type(os)
print(os.__class__)  # <class 'module'>
print(hashlib.__class__)  # <class 'module'>
print(numpy.__class__)  # <class 'module'>
~~~

在 Python 里面，我们一般会把单独的可导入文件称之为**模块**，把包含多个模块的目录称之为**包**。通过模块和包，我们可以对项目进行功能上的划分，分门别类地进行组织。但不管是模块、还是包，它们都是 module 这个类的实例对象，打印结果也能说明这一点。所以从解释器的角度来看的话，模块和包区分的并没有那么明显，直接把包看做是包内部的 \_\_init\_\_.py 即可。

既然模块的类型是 \<class 'module'\>，那么我们是不是也可以通过调用类型对象的方式创建呢？显然是可以的，但是 module 这个类解释器没有暴露给我们，直接用的话会提示**变量 module 未定义**。所以只能先随便导入一个模块，然后通过 type 函数或者 \_\_class\_\_ 属性获取。

~~~python
# 当然 types 模块内部已经帮我们做好了
# ModuleType = type(sys)
from types import ModuleType

print(ModuleType)  # <class 'module'>

# 类对象有了，下面就可以创建了
# module 类接收两个参数
# 参数一：模块的名字，必须传递
# 参数二：模块的 doc，不传默认为 None
satori = ModuleType("古明地觉", "模块的名字是一个女孩，她来自地灵殿")
print(satori)  # <module '古明地觉'>
print(satori.__doc__)  # 模块的名字是一个女孩，她来自地灵殿


# 但此时模块里面是没啥东西的，我们加一些属性吧
# 操作模块本质上是在操作它的属性字典
code = """
age = 16

def foo():
    return "^_^"
"""
# 执行 code，结果会体现在 satori 的属性字典中
exec(code, satori.__dict__)
print(satori.age)  # 16
print(satori.foo())  # ^_^
~~~

需要注意的是里面 exec 函数，它会把字符串当成代码来执行，所以这就要求字符串的来源必须是可靠的，我们能够确保不会出现恶意内容。而如果是用户传递的字符串，那么绝不能用 exec 来执行，当然 eval 也是同理。

然后是 exec 的第二个参数，表示执行时的名字空间，默认是全局名字空间。所以当不指定第二个参数时，exec(code) 相当于创建了两个全局变量：age 和 foo。

~~~Python
code = """
age = 16

def foo():
    return "^_^"
"""

exec(code)
print(age)  # 16
print(foo())  # ^_^
~~~

但是我们在执行的时候，将它换成了 satori.\_\_dict\_\_，所以结果相当于给模块添加了两个变量，或者说属性。

## 将一个类的实例变成一个模块

如果想将一个类的实例变成模块，那么这个类应该继承 ModuleType。

~~~python
import sys
from types import ModuleType


class A(ModuleType):

    def __init__(self, module_name):
        super().__init__(module_name)

    def __getattr__(self, item):
        return f"不存在的属性: {item}"

    def __setattr__(self, key, value):
        self.__dict__[key] = value

    def __str__(self):
        return f"<module '{self.__name__}' from '我来自于虚无'>"


a = A("我是 A")
print(a)  # <module '我是 A' from '我来自于虚无'>
print(a.__name__)  # 我是 A
print(a.xx)  # 不存在的属性: xx
a.xx = "xx"
print(a.xx)  # xx

# 加入到 sys.modules 中
sys.modules["嘿嘿"] = a
import 嘿嘿
print(嘿嘿.xx)  # xx
print(嘿嘿.yy)  # 不存在的属性: yy
~~~

是不是很好玩呢？

## 小结

以上就是加载模块的几种方式，主要用途如下：

- 导入一个在 sys.path 中的模块，并且模块名已知，那么直接使用 import 关键字即可；
- 导入一个在 sys.path 中的模块，但模块名是运行时的一个字符串，那么使用 importlib 模块的 import_module 函数；
- 导入一个不在 sys.path 中的模块，使用 importlib.machinery 的各种 Loader，只要把模块的路径传进去即可。当然啦，位于 sys.path 中的模块也可以使用该方法，但显然此时使用前两种更为方便；
- 直接创建一个模块，通过继承 module 类来实现，并且还可以加入到 sys.modules 中。Python 有一个第三方模块叫 sh，顾名思义是用来执行 Linux Shell 命令的，它内部就使用了继承 module 类来创建模块的这种方式。但是要知道 module 这个类解释器没有暴露给我们，我们需要通过 type(模块) 或者 模块.\_\_class\_\_ 的方式获取；