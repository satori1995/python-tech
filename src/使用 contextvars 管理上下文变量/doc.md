## 楔子

Python 在 3.7 的时候引入了一个模块：contextvars，从名字上很容易看出它指的是上下文变量（Context Variables），所以在介绍 contextvars 之前我们需要先了解一下什么是上下文（Context）。

Context 是一个包含了相关信息内容的对象，举个例子："比如一部 13 集的动漫，你直接点进第八集，看到女主角在男主角面前流泪了"。相信此时你是不知道为什么女主角会流泪的，因为你没有看前面几集的内容，缺失了相关的上下文信息。

所以 Context 并不是什么神奇的东西，它的作用就是携带一些指定的信息。

## web 框架中的 request

我们以 fastapi 和 sanic 为例，看看当一个请求过来的时候，它们是如何解析的。

~~~Python
# fastapi
from fastapi import FastAPI, Request
import uvicorn

app = FastAPI()


@app.get("/index")
async def index(request: Request):
    name = request.query_params.get("name")
    return {"name": name}


uvicorn.run("__main__:app", host="127.0.0.1", port=5555)

# -------------------------------------------------------

# sanic
from sanic import Sanic
from sanic.request import Request
from sanic import response

app = Sanic("sanic")


@app.get("/index")
async def index(request: Request):
    name = request.args.get("name")
    return response.json({"name": name})


app.run(host="127.0.0.1", port=6666) 
~~~

发请求测试一下，会看到请求都是成功的，并且对于 fastapi 和 sanic 而言，其 request 和 视图函数是绑定在一起的。也就是在请求到来的时候，会被封装成一个 Request 对象、然后传递到视图函数中。

但对于 flask 而言则不是这样子的，我们看一下 flask 是如何接收请求参数的。

```Python
from flask import Flask, request

app = Flask("flask")


@app.route("/index")
def index():
    name = request.args.get("name")
    return {"name": name}


app.run(host="127.0.0.1", port=7777)
```

我们看到对于 flask 而言则是通过 import request 的方式，如果不需要的话就不用 import，当然我这里并不是在比较哪种方式好，主要是为了引出我们今天的主题。首先对于 flask 而言，如果我再定义一个视图函数的话，那么获取请求参数依旧是相同的方式，但是这样问题就来了，不同的视图函数内部使用同一个 request，难道不会发生冲突吗？

显然根据我们使用 flask 的经验来说，答案是不会的，至于原因就是 ThreadLocal。

## ThreadLocal

ThreadLocal，从名字上看可以得出它肯定是和线程相关的。没错，它专门用来创建局部变量，并且创建的局部变量是和线程绑定的。

```python
import threading

# 创建一个 local 对象
local = threading.local()

def get():
    name = threading.current_thread().name
    # 获取绑定在 local 上的 value
    value = local.value
    print(f"线程: {name}, value: {value}")

def set_():
    name = threading.current_thread().name
    # 为不同的线程设置不同的值
    if name == "one":
        local.value = "ONE"
    elif name == "two":
        local.value = "TWO"
    # 执行 get 函数
    get()

t1 = threading.Thread(target=set_, name="one")
t2 = threading.Thread(target=set_, name="two")
t1.start()
t2.start()
"""
线程 one, value: ONE
线程 two, value: TWO
"""
```

可以看到两个线程之间是互不影响的，因为每个线程都有自己唯一的 id，在绑定值的时候会绑定在当前的线程中，获取也会从当前的线程中获取。可以把 ThreadLocal 想象成一个字典：

```python
{
    "one": {"value": "ONE"},
    "two": {"value": "TWO"}
}
```

更准确的说 key 应该是线程的 id，为了直观我们就用线程的 name 代替了，但总之在获取的时候只会获取绑定在该线程上的变量的值。

而 flask 内部也是这么设计的，只不过它没有直接用 threading.local，而是自己实现了一个 Local 类，除了支持线程之外还支持 greenlet 协程，那么它是怎么实现的呢？首先我们知道 flask 内部存在 "请求 context" 和 "应用 context"，它们都是通过栈来维护的（两个不同的栈）。

~~~python
# flask/globals.py
_request_ctx_stack = LocalStack()
_app_ctx_stack = LocalStack()
current_app = LocalProxy(_find_app)
request = LocalProxy(partial(_lookup_req_object, "request"))
session = LocalProxy(partial(_lookup_req_object, "session"))
~~~

每个请求都会绑定在当前的 Context 中，等到请求结束之后再销毁，这个过程由框架完成，开发者只需要直接使用 request 即可。所以请求的具体细节流程可以点进源码中查看，这里我们重点关注一个对象：werkzeug.local.Local，也就是上面说的 Local 类，它是变量的设置和获取的关键。直接看部分源码：

```python
# werkzeug/local.py

class Local(object):
    __slots__ = ("__storage__", "__ident_func__")

    def __init__(self):
        # 内部有两个成员：__storage__ 是一个字典，值就存在这里面
        # __ident_func__ 只需要知道它是用来获取线程 id 的即可
        object.__setattr__(self, "__storage__", {})
        object.__setattr__(self, "__ident_func__", get_ident)

    def __call__(self, proxy):
        """Create a proxy for a name."""
        return LocalProxy(self, proxy)

    def __release_local__(self):
        self.__storage__.pop(self.__ident_func__(), None)

    def __getattr__(self, name):
        try:
            # 根据线程 id 得到 value（一个字典）
            # 然后再根据 name 获取对应的值
            # 所以只会获取绑定在当前线程上的值
            return self.__storage__[self.__ident_func__()][name]
        except KeyError:
            raise AttributeError(name)

    def __setattr__(self, name, value):
        ident = self.__ident_func__()
        storage = self.__storage__
        try:
            # 将线程 id 作为 key，然后将值设置在对应的字典中
            # 所以只会将值设置在当前的线程中
            storage[ident][name] = value
        except KeyError:
            storage[ident] = {name: value}

    def __delattr__(self, name):
        # 删除逻辑也很简单
        try:
            del self.__storage__[self.__ident_func__()][name]
        except KeyError:
            raise AttributeError(name)
```

所以我们看到 flask 内部的逻辑其实很简单，通过 ThreadLocal 实现了线程之间的隔离。每个请求都会绑定在各自的 Context 中，获取值的时候也会从各自的 Context 中获取，因为它就是用来保存相关信息的（重要的是同时也实现了隔离）。

相应此刻你已经理解了上下文，但是问题来了，不管是 threading.local 也好、还是类似于 flask 自己实现的 Local 也罢，它们都是针对线程的。如果是使用 async def 定义的协程该怎么办呢？如何实现每个协程的上下文隔离呢？所以终于引出了我们的主角：contextvars。

## contextvars

该模块提供了一组接口，可用于在协程中管理、设置、访问局部 Context 的状态。

~~~python
import asyncio
import contextvars

c = contextvars.ContextVar("只是一个标识, 用于调试")

async def get():
    # 获取值
    return c.get() + "~~~"

async def set_(val):
    # 设置值
    c.set(val)
    print(await get())

async def main():
    coro1 = set_("协程1")
    coro2 = set_("协程2")
    await asyncio.gather(coro1, coro2)


asyncio.run(main())
"""
协程1~~~
协程2~~~
"""
~~~

ContextVar 提供了两个方法，分别是 get 和 set，用于获取值和设置值。我们看到效果和 ThreadingLocal 类似，数据在协程之间是隔离的，不会受到彼此的影响。

但我们再仔细观察一下，我们是在 set_ 函数中设置的值，然后在 get 函数中获取值。可 await get() 相当于是开启了一个新的协程，那么意味着设置值和获取值不是在同一个协程当中。但即便如此，我们依旧可以获取到希望的结果。因为 Python 的协程是无栈协程，通过 await 可以实现级联调用。

我们不妨再套一层：

~~~python
import asyncio
import contextvars

c = contextvars.ContextVar("只是一个标识, 用于调试")

async def get1():
    return await get2()

async def get2():
    return c.get() + "~~~"

async def set_(val):
    # 设置值
    c.set(val)
    print(await get1())
    print(await get2())

async def main():
    coro1 = set_("协程1")
    coro2 = set_("协程2")
    await asyncio.gather(coro1, coro2)


asyncio.run(main())
"""
协程1~~~
协程1~~~
协程2~~~
协程2~~~
"""
~~~

我们看到不管是 await get1() 还是 await get2()，得到的都是 set_ 中设置的结果，说明它是可以嵌套的。

并且在这个过程当中，可以重新设置值。

~~~python
import asyncio
import contextvars

c = contextvars.ContextVar("只是一个标识, 用于调试")

async def get1():
    c.set("重新设置")
    return await get2()

async def get2():
    return c.get() + "~~~"

async def set_(val):
    # 设置值
    c.set(val)
    print("------------")
    print(await get2())
    print(await get1())
    print(await get2())
    print("------------")

async def main():
    coro1 = set_("协程1")
    coro2 = set_("协程2")
    await asyncio.gather(coro1, coro2)


asyncio.run(main())
"""
------------
协程1~~~
重新设置~~~
重新设置~~~
------------
------------
协程2~~~
重新设置~~~
重新设置~~~
------------
"""
~~~

先 await get2() 得到的就是 set_ 函数中设置的值，这是符合预期的。但是我们在 get1 中将值重新设置了，那么之后不管是 await get1() 还是直接 await get2()，得到的都是新设置的值。

这也说明了，一个协程内部 await 另一个协程，另一个协程内部 await 另另一个协程，不管套娃（await）多少次，它们获取的值都是一样的。并且在任意一个协程内部都可以重新设置值，然后获取会得到最后一次设置的值。再举个栗子：

~~~python
import asyncio
import contextvars

c = contextvars.ContextVar("只是一个标识, 用于调试")

async def get1():
    return await get2()

async def get2():
    val = c.get() + "~~~"
    c.set("重新设置啦")
    return val

async def set_(val):
    # 设置值
    c.set(val)
    print(await get1())
    print(c.get())

async def main():
    coro = set_("古明地觉")
    await coro

asyncio.run(main())
"""
古明地觉~~~
重新设置啦
"""
~~~

await get1() 的时候会执行 await get2()，然后在里面拿到 c.set 设置的值，打印 "古明地觉~~~"。但是在 get2 里面，又将值重新设置了，所以第二个 print 打印的就是新设置的值。

如果在 get 之前没有先 set，那么会抛出一个 LookupError，所以 ContextVar 支持默认值。

~~~python
import asyncio
import contextvars

c = contextvars.ContextVar("只是一个标识, 用于调试", default="哼哼")

async def set_(val):
    print(c.get())
    c.set(val)
    print(c.get())

async def main():
    coro = set_("古明地觉")
    await coro

asyncio.run(main())
"""
哼哼
古明地觉
"""
~~~

除了在 ContextVar 中指定默认值之外，也可以在 get 中指定。

~~~python
import asyncio
import contextvars

c = contextvars.ContextVar("只是一个标识, 用于调试", default="哼哼")

async def set_(val):
    print(c.get("古明地恋"))
    c.set(val)
    print(c.get())

async def main():
    coro = set_("古明地觉")
    await coro

asyncio.run(main())
"""
古明地恋
古明地觉
"""
~~~

所以结论如下，如果在 c.set 之前使用 c.get：

- 当 ContextVar 和 get 中都没有指定默认值，会抛出 LookupError；
- 只要有一方设置了，那么会得到默认值；
- 如果都设置了，那么以 get 为准；

如果 c.get 之前执行了 c.set，那么无论 ContextVar 和 get 有没有指定默认值，获取到的都是 c.set 设置的值。

所以总的来说还是比较好理解的，并且 ContextVar 除了可以作用在协程上面，它也可以用在线程上面。没错，它可以替代 threading.local，我们来试一下：

~~~python
import threading
import contextvars

c = contextvars.ContextVar("context_var")

def get():
    name = threading.current_thread().name
    value = c.get()
    print(f"线程 {name}, value: {value}")

def set_():
    name = threading.current_thread().name
    if name == "one":
        c.set("ONE")
    elif name == "two":
        c.set("TWO")
    get()

t1 = threading.Thread(target=set_, name="one")
t2 = threading.Thread(target=set_, name="two")
t1.start()
t2.start()
"""
线程 one, value: ONE
线程 two, value: TWO
"""
~~~

和 threading.local 的表现是一样的，但是更建议使用 ContextVars。不过前者可以绑定任意多个值，而后者只能绑定一个值（可以通过传递字典的方式解决这一点）。

### c.Token

当我们调用 c.set 的时候，其实会返回一个 Token 对象：

~~~python
import contextvars

c = contextvars.ContextVar("context_var")
token = c.set("val")
print(token)
"""
<Token var=<ContextVar name='context_var' at 0x00..> at 0x00...>
"""
~~~

Token 对象有一个 var 属性，它是只读的，会返回指向此 token 的 ContextVar 对象。

~~~python
import contextvars

c = contextvars.ContextVar("context_var")
token = c.set("val")

print(token.var is c)  # True
print(token.var.get())  # val

print(
    token.var.set("val2").var.set("val3").var is c
)  # True
print(c.get())  # val3
~~~

Token 对象还有一个 old_value 属性，它会返回上一次 set 设置的值，如果是第一次 set，那么会返回一个 \<Token.MISSING\>。

~~~python
import contextvars

c = contextvars.ContextVar("context_var")
token = c.set("val")

# 该 token 是第一次 c.set 所返回的
# 在此之前没有 set，所以 old_value 是 <Token.MISSING>
print(token.old_value)  # <Token.MISSING>

token = c.set("val2")
print(c.get())  # val2
# 返回上一次 set 的值
print(token.old_value)  # val
~~~

那么这个 Token 对象有什么作用呢？从目前来看貌似没太大用处啊，其实它最大的用处就是和 reset 搭配使用，可以对状态进行重置。

~~~python
import contextvars

c = contextvars.ContextVar("context_var")
token = c.set("val")
# 显然是可以获取的
print(c.get())  # val

# 将其重置为 token 之前的状态
# 但这个 token 是第一次 set 返回的
# 那么之前就相当于没有 set 了
c.reset(token)
try:
    c.get()  # 此时就会报错
except LookupError:
    print("报错啦")  # 报错啦

# 但是我们可以指定默认值
print(c.get("默认值"))  # 默认值
~~~

### contextvars.Context

它负责保存 ContextVars 对象和设置的值之间的映射，但是我们不会直接通过 contextvars.Context 来创建，而是通过 contentvars.copy_context 函数来创建。

~~~Python
import contextvars

c1 = contextvars.ContextVar("context_var1")
c1.set("val1")
c2 = contextvars.ContextVar("context_var2")
c2.set("val2")

# 此时得到的是所有 ContextVar 对象和设置的值之间的映射
# 它实现了 collections.abc.Mapping 接口
# 因此我们可以像操作字典一样操作它
context = contextvars.copy_context()
# key 就是对应的 ContextVar 对象，value 就是设置的值
print(context[c1])  # val1
print(context[c2])  # val2
for ctx, value in context.items():
    print(ctx.get(), ctx.name, value)
    """
    val1 context_var1 val1
    val2 context_var2 val2
    """

print(len(context))  # 2
~~~

除此之外，context 还有一个 run 方法：

~~~python
import contextvars

c1 = contextvars.ContextVar("context_var1")
c1.set("val1")
c2 = contextvars.ContextVar("context_var2")
c2.set("val2")

context = contextvars.copy_context()

def change(val1, val2):
    c1.set(val1)
    c2.set(val2)
    print(c1.get(), context[c1])
    print(c2.get(), context[c2])

# 在 change 函数内部，重新设置值
# 然后里面打印的也是新设置的值
context.run(change, "VAL1", "VAL2")
"""
VAL1 VAL1
VAL2 VAL2
"""

print(c1.get(), context[c1])
print(c2.get(), context[c2])
"""
val1 VAL1
val2 VAL2
"""
~~~

我们看到 run 方法接收一个 callable，如果在里面修改了 ContextVar 实例设置的值，那么对于 ContextVar 而言只会在函数内部生效，一旦出了函数，那么还是原来的值。但是对于 Context 而言，它是会受到影响的，即便出了函数，也是新设置的值，因为它直接把内部的字典给修改了。

## 小结

以上就是 contextvars 模块的用法，在多个协程之间传递数据是非常方便的，并且也是并发安全的。如果你用过 Go 的话，你应该会发现和 Go 在 1.7 版本引入的 context 模块比较相似，当然 Go 的 context 模块功能要更强大一些，除了可以传递数据之外，对多个 goroutine 的级联管理也提供了非常清蒸的解决方案。

然后需要强调一点，Python 的 context 是协程隔离的，我们只需要创建一个全局的 context 即可。比如协程 A 不断嵌套调用，最终调用了协程 F，但协程 F 需要使用协程 A 中的某个数据，那么这时候就可以在协程 A 中通过 context 设置数据，在协程 F 中通过 context 获取数据。

整个过程只需要一个 context 即可，并且也不需要手动传递 context（不然的话，还不如直接传个字典）。然后 context 是并发安全的，我们只需要一个全局的 context，需要用的时候直接导入即可。

当然啦，对于 contextvars 而言，它传递的数据应该是多个协程之间需要共享的数据，像 cookie, session, token 之类的，比如上游接收了一个 token，然后不断地向下透传。但是不要把本应该作为函数参数的数据，也通过 contextvars 来传递，这样就有点本末倒置了。