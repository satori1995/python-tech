## 楔子

本次我们来聊一聊 httpx，它是一个 HTTP 请求库。不过说到发送 HTTP 请求，我们首先想到的应该是 requests，但 requests 是一个同步库，目前只能同步发请求。而 httpx 不仅可以同步发请求，还可以异步发请求，并且支持 HTTP/1.1 和 HTTP/2。

另外 httpx 在设计上也模仿了 requests，两者的 API 是兼容的，如果你会 requests，那么 httpx 很容易上手。

> 安装方式：直接 pip install httpx 即可

下面就来看一下相关用法。

## 使用 httpx 发请求

使用 httpx 发送请求非常简单，首先请求有以下几种：

![](./1.png)

API 和 requests 是相似的，我们以 GET 请求为例，测试一下：

~~~python
import httpx

# 发送请求，会返回一个 httpx.Response 对象
response = httpx.get("http://www.baidu.com")
print(response)
print(response.__class__)
"""
<Response [200 OK]>
<class 'httpx.Response'>
"""
~~~

当然其它请求也是类似的，我们一会儿会说。不过虽然请求种类有很多，但不管发送的是哪一种请求，背后调用的都是 httpx.request。

~~~python
import httpx

response = httpx.get("http://www.baidu.com")
# 等价于如下：
response = httpx.request("GET", "http://www.baidu.com")

# 同理：
"""
httpx.post(url) 等价于 httpx.request("POST", url)
httpx.put(url) 等价于 httpx.request("PUT", url)
httpx.delete(url) 等价于 httpx.request("DELETE", url)
"""
~~~

因此我们调用 httpx.request 即可发送所有类型的请求，但为了方便使用，httpx 又专门针对不同的请求，封装了相应的函数。比如我们要发送 get 请求，那么直接调用 httpx.get 就好。

## 服务端响应（httpx.Response）

当服务端收到请求并处理完毕之后，会给客户端返回响应，而这里的客户端显然就是 httpx。httpx 收到响应之后，会将其包装成  Response 对象。

~~~python
import httpx

response = httpx.get("http://www.baidu.com")
print(response)
print(response.__class__)
"""
<Response [200 OK]>
<class 'httpx.Response'>
"""
~~~

那么这个 Response 对象内部都包含了哪些属性呢？我们来总结一下。

<font color="darkblue">**url：客户端请求的 URL**</font>

~~~python
print(response.url)
"""
http://www.baidu.com
"""
~~~

注意：通过 response.url 拿到的不是字符串，而是一个 httpx.URL 对象，我们可以很方便地获取 URL 的每一个组成部分。

~~~python
response = httpx.get("http://www.baidu.com")
url = response.url
print(
    url.scheme,
    url.host,
    url.port,
    url.username,
    url.password,
    url.netloc,
    url.path
)
~~~

<font color="darkblue">**status_code：状态码，比如请求成功返回 200**</font>

```python
print(response.status_code)
"""
200
"""
```

Response 对象还有一个 raise_for_status() 方法，如果状态码不在 200 ~ 299 之间，那么调用的时候会根据状态码的值，抛出相应的异常来提示开发者。

<font color="darkblue">**reason_phrase：状态码的文字描述**</font>

~~~python
# 一般跟在状态码后面，比如 200 OK，404 NOT FOUND
print(response.reason_phrase)
"""
OK
"""
~~~

<font color="darkblue">**headers：响应头，返回的是 httpx.Headers 对象。我们将它当成字典来用即可，但会忽略 key 的大小写**</font>

~~~python
print(response.headers["Content-Type"])
print(response.headers["CONTENT-TYPE"])
print(response.headers.get("content-TYPE"))
"""
text/html
text/html
text/html
"""
# 也可以调用 dict 转成字典，但转成字典之后，key 一律全部小写
print(dict(response.headers)["content-type"])
"""
text/html
"""
~~~

<font color="darkblue">**content：响应体，一个原始的字节流**</font>

~~~python
print("百度一下".encode("utf-8") in response.content)
"""
True
"""
~~~

<font color="darkblue">**text：对响应体进行解码所得到的字符串**</font>

~~~python
# 相当于对 response.content 进行 decode
print("百度一下" in response.text)
"""
True
"""
~~~

<font color="darkblue">**json：对响应体进行 JSON 解析所得到的字典**</font>

~~~python
# 相当于 json.loads(response.content)
# 因此服务端返回的响应体数据必须满足 JSON 格式，否则报错
try:
    print(response.json())
except Exception:
    print("返回的数据不符合 JSON 格式")
"""
返回的数据不符合 JSON 格式
"""
# httpx 在解析 JSON 的时候，使用的是内置的 json 库
# 但这个库的性能不好，因此推荐一个第三方库叫 orjson，是基于 Rust 编写的
# 个人觉得它是目前性能最好、使用最方便的 JSON 解析库
# 所以我个人习惯先获取 content，然后手动调用 orjson.loads 进行解析
~~~

<font color="darkblue">**cookies：服务端返回的 cookie，一个 httpx.Cookies 对象**</font>

~~~python
# 可以调用 dict，将其转成字典，也可以直接当成字典来操作
# 注意，对于 Cookie 而言，大小写是敏感的
print(response.cookies["PSTM"])
print(response.cookies.get("pstm"))
"""
1676011925
None
"""
~~~

<font color="darkblue">**encoding：返回网站的编码，没有的话则使用 utf-8**</font>

~~~python
# response.text 就等价于
# response.content.decode(response.encoding)
print(response.encoding)
"""
utf-8
"""
~~~

基于以上这些字段，我们可以获取服务端响应的全部信息。既然服务端的响应可以拿到，那客户端请求该如何获取呢？

## 客户端请求（httpx.Request）

调用 httpx.get 的时候，内部会构建一个请求，然后直接发给服务端，而请求我们也可以通过 response 来获取。

~~~python
import httpx

response = httpx.get("http://www.baidu.com")
# 客户端请求是一个 httpx.Request 对象
# 我们可以通过 response.request 获取
request = response.request
print(request)
print(request.__class__)
"""
<Request('GET', 'http://www.baidu.com')>
<class 'httpx.Request'>
"""

# 客户端请求的 URL，和 response.url 是一样的
print(request.url)
"""
http://www.baidu.com
"""

# 请求方式
print(request.method)
"""
GET
"""

# 客户端发送请求时的请求头，一个 httpx.Headers 对象
# 而 response.header 是服务端返回响应时的响应头
print(request.headers["User-Agent"])
"""
python-httpx/0.23.3
"""

# 请求体，这里是 GET 请求，所以请求体为空
print(request.content)
"""
b''
"""
~~~

所以 HTTP 的核心就是：客户端发送请求，服务端返回响应。请求包含请求头、请求体，响应包含响应头、响应体。

怎么发请求我们已经知道了，然后再来看看发请求时的一些更具体的细节。

## 向服务端传递数据

在发送请求时，客户端还可以携带指定的数据给服务端。对于 GET 请求而言，数据是以查询参数的方式，拼接在 URL 的尾部。

~~~python
import httpx

response = httpx.get("http://www.baidu.com/s?wd=python")
print(response.url)

# 但上面的做法有些麻烦，我们可以让 httpx 帮我们拼接
response = httpx.get("http://www.baidu.com/s", params={"wd": "python"})
print(response.url)
"""
http://www.baidu.com/s?wd=python
http://www.baidu.com/s?wd=python
"""

# 当然也可以传递多个参数
response = httpx.get("http://httpbin.org/get", params={"k1": "v1", "k2": ["v2", "v3"]})
print(response.url)  
"""
http://httpbin.org/get?k1=v1&k2=v2&k2=v3
"""
~~~

如果是 post 请求，则可以将数据放在请求体中，通过 data 或者 json 参数传递。至于参数选择哪一个，则看服务端要求是使用表单数据提交、还是使用 JSON 数据提交。

~~~python
import httpx

# 传递表单数据，通过 data 参数
response = httpx.post(
    "https://httpbin.org/post",
    data={"name": "satori", "age": 16}
)
# 查看请求体
print(response.request.content)
"""
b'name=satori&age=16'
"""

# 传递 JSON 数据，通过 json 参数
response = httpx.post(
    "https://httpbin.org/post",
    json={"name": "satori", "age": 16}
)
print(response.request.content)
"""
b'{"name": "satori", "age": 16}'
"""
~~~

现在你一定明白表单数据和 JSON 数据之间的差异了，当然不管什么数据，无论是请求体还是响应体，都是一坨字节流。所谓的文本、字典，都是拿到字节流之后再进行解析所得到的，如果无法解析则返回错误。

比如上面的 POST 请求，如果通过 data 参数传递，那么服务端拿到的字节流就是下面这样：

```python
b'name=satori&age=16'
```

显然服务端应该通过表单的方式去解析，如果使用 JSON 库则解析失败。

如果客户端是通过 json 参数传递，那么服务端拿到的字节流就是下面这样：

```python
b'{"name": "satori", "age": 16}'
```

此时服务端可以放心地使用 json.loads。

对于客户端来说也是如此，比如这里的 httpx。如果明确服务端会返回 JSON，那么可以直接调用 response.json() 拿到字典；但如果返回的不是 JSON，那么就不能这么做，比如服务端返回的是图片、视频，我们只能以二进制的方式保存下来。

再补充一点，查询参数对于所有请求都是适用的，比如 POST 请求，我们也可以通过 params 指定查询参数。

```python
import httpx

response = httpx.post(
    "https://httpbin.org/post",
    params={"ping": "pong"},
    json={"name": "satori", "age": 16}
)
print(response.url)
print(response.request.content)
"""
https://httpbin.org/post?ping=pong
b'{"name": "satori", "age": 16}'
"""
```

结果没有问题。

## 自定制请求头

很多网站，都设置了反爬虫机制。最常用的就是判断请求头里的 User-Agent 字段，如果不是浏览器的，会直接将你屏蔽掉。

~~~python
import httpx, requests

response = httpx.get("http://www.baidu.com",)
print(response.request.headers["User-Agent"])
"""
python-httpx/0.23.3
"""

response = requests.get("http://www.baidu.com",)
print(response.request.headers["User-Agent"])
"""
python-requests/2.28.0
"""
~~~

无论是 httpx 还是 requests，都会设置一个默认的 User-Agent。但很明显，很容易被服务端检测出来，因此我们需要自定制请求头。

```python
import httpx

response = httpx.get("http://www.baidu.com",
                     headers={"User-Agent": "Chrome user agent"})
print(response.request.headers["User-Agent"])
"""
Chrome user agent
"""
```

此时 User-Agent 就被我们替换掉了，这里是我随便指定的，在真正发请求的时候，从浏览器里面拷贝一下即可。另外不仅是 User-Agent，请求头里的其它字段也是可以设置的。

> headers 参数不仅可以接收字典，还可以接收一个 httpx.Headers 对象

## 自定制 cookie

这个在模拟登录的时候非常有用，一般在输入用户名和密码登录成功之后，服务端会返回一个 cookie，这个 cookie 里面存储了 Session ID。后续浏览器发请求的时候，会带上这个 cookie，服务端检测到之后就知道该用户已经登录了。

那么 httpx 在发请求的时候，如何带上 cookie 呢？

```python
from pprint import pprint
import httpx

cookies = httpx.Cookies({"Session ID1": "0000001"})
# 也可以单独设置
cookies["Session ID2"] = "0000001"
cookies.set("Session ID3", "0000003", domain="", path="/")

response = httpx.get("http://httpbin.org/cookies",
                     # 这里也可以直接传一个字典
                     cookies=cookies)
pprint(response.json())
"""
{'cookies': {'Session ID1': '0000001',
             'Session ID2': '0000001',
             'Session ID3': '0000003'}}
"""
```

至于服务端返回的 cookie，可以通过 response.cookies 获取。比如模拟登录成功之后，将服务端返回的 cookie 保存下来，然后下一次发请求的时候带上它。

## 重定向与请求历史

重定向分为暂时性重定向和永久性重定向。

- 暂时性重定向：状态码为 302，比如我们要发表评论，但是没有登录，那么此时就会被重定向到登录页面；
- 永久性重定向：状态码为 301，比如我们访问一个已经废弃的域名，会被永久性重定向到新的域名。

那我们怎么判断在访问的时候有没有重定向呢？如果被重定向了，那么如何获取重定向之前的页面呢？

```python
import httpx, requests

# 如果是 requests，那么会自动重定向
# 会被重定向到 https://www.taobao.com
response = requests.get("http://www.taobao.com")
# 而 response 也是重定向之后返回的响应
print(response.status_code)
"""
200
"""
# 但通过 response.history 可以获取重定向之前的响应
# 因为可能会被重定向多次，因此返回的是列表
print(response.history)
"""
[<Response [301]>]
"""
print(response.history[0].text)
"""
<!DOCTYPE HTML PUBLIC "-//IETF//DTD HTML 2.0//EN">
<html>
<head><title>301 Moved Permanently</title></head>
<body>
<h1>301 Moved Permanently</h1>
<p>The requested resource has been assigned a new permanent URI.</p>
<hr/>Powered by Tengine</body>
</html>
"""

# 但 httpx 不会自动重定向
response = httpx.get("http://www.taobao.com")
print(response.status_code)
print(response.history)
"""
301
[]
"""
# 如果希望重定向，那么需要指定一个参数
response = httpx.get("http://www.taobao.com", follow_redirects=True)
print(response.status_code)
print(response.history)
"""
200
[<Response [301 Moved Permanently]>]
"""
```

个人觉得 httpx 的这个设计不是很好，首先它和 requests 一样，都有一个参数用来控制是否重定向。

- requests 里面的参数叫 allow_redirects，默认为 True，表示允许重定向。如果不希望重定向，那么将其设置为 False；
- httpx 里面的参数叫 follow_redirects，默认为 False，表示不进行重定向。如果希望重定向，那么将其设置为 True；

但个人觉得，应该自动重定向会好一些。

## 上传文件

如果服务端需要接收一个文件，那么我们应该怎么上传呢？比如我们有一个 1.txt，里面写着一句 Hello World，那这个 1.txt 要如何上传呢？

```python
from pprint import pprint
import httpx

response = httpx.post("http://httpbin.org/post",
                      files={"file": open("1.txt", "rb")})

pprint(response.json())
"""
{'args': {},
 'data': '',
 'files': {'file': 'Hello World'},
 'form': {},
 'headers': {...},
 'json': None,
 'origin': '120.244.40.157',
 'url': 'http://httpbin.org/post'}
"""
```

http://httpbin.org/post 是一个专门用来测试 HTTP 请求的网站，根据返回结果我们知道文件上传成功了。

当然，在上传文件的时候，也可以显示地指定文件名和文件类型。

```python
from pprint import pprint
import httpx

response = httpx.post(
    "http://httpbin.org/post",
    files={"file": ("1.html", open("1.html", "rb"), "text/html")}
)

pprint(response.json())
"""
{'args': {},
 'data': '',
 'files': {'file': '<h1>我是 HTML 文件</h1>'},
 'form': {},
 'headers': {...},
 'json': None,
 'origin': '120.244.40.157',
 'url': 'http://httpbin.org/post'}
"""
```

我们也可以同时上传多个文件，并且上传文件的同时，还可以传递表单数据。

```python
from pprint import pprint
import httpx

response = httpx.post(
    "http://httpbin.org/post",
    files={"file1": open("1.html", "rb"),
           "file2": open("1.txt", "rb")},
    data={"ping": "pong"},
)

pprint(response.json())
"""
{'args': {},
 'data': '',
 'files': {'file1': '<h1>我是 HTML 文件</h1>', 
           'file2': 'Hello World'},
 'form': {'ping': 'pong'},
 'headers': {...},
 'json': None,
 'origin': '120.244.40.157',
 'url': 'http://httpbin.org/post'}
"""
```

然后上传文件还有一种方式，就是我们可以将文件以二进制的方式读出来，然后将字节流传过去。

```python
import httpx

with open("1.txt", "rb") as f:
    content = f.read()

response = httpx.post(
    "http://httpbin.org/post",
    content=content
)
```

前面我们说传递表单数据使用参数 data，传递 JSON 数据使用参数 json，如果是普通的字节流，那么应该使用参数 content。

当然这种方式的话，服务端只能拿到文件的字节流，但是类型并不知道。因此可以在 headers 参数里面，通过 Content-Type 告诉服务端字节流对应文件的类型。

## 流式响应

到目前为止，我们都是调用 httpx 的请求函数发送 HTTP 请求（比如 GET、POST），服务端返回响应，然后通过 response.content 获取响应体。但如果响应体非常大，该怎么办？显然这会带来两个问题：

- 1）程序在调用 httpx.get 或 httpx.post 的时候，会一直处于阻塞状态，直到服务端将数据一次性全部返回。而响应体如果比较大，那么阻塞的时间就会比较长。
- 2）如果服务端返回的数据过大，可能会导致内存不够用。

所以需要有一种机制，能够不让数据一次性全部返回，而是分批返回。在 httpx 里面是支持的。

~~~python
import httpx

# httpx.stream 和 httpx.request 的参数是一样的
# 可以传递 headers、cookies、data、json 等等
with httpx.stream("GET", "http://www.baidu.com") as r:
    # 分块返回，每块 100KB
    for chunk in r.iter_bytes(chunk_size=1024 * 100):
        print(len(chunk))
"""
102400
102400
102400
62890
"""
~~~

通过分块读取，可以避免因响应体过大，而导致内存溢出。

## 超时控制

httpx 有很多优秀的特性，其中一个就是超时控制。httpx 为所有的网络操作都提供了一个合理的超时时间，如果连接没有正确地建立，那么 httpx 会及时地引发错误，而不会让开发者陷入长时间的等待。

```python
import httpx

# 默认的超时时间是 5 秒，我们可以将其设置的更严格一些
response = httpx.get("https://www.google.com", timeout=1)

# 如果传递一个 None，那么表示不设置超时时间
```

非常简单，但 httpx 还支持更细粒度地控制超时时间。因为如果发生超时，无非以下几种情况：

- 连接超时：如果没有在规定时间内，和请求的主机建立套接字连接，我们就说连接超时了，会引发 ConnectTimeout 异常；
- 读超时：如果没有在规定时间内，接收到服务端返回的数据块（响应体的一个块），我们就说读超时了，会引发 ReadTimeout 异常。
- 写超时：如果没有在规定时间内，将数据块（请求体的一个块）发送给服务端，我们就说写超时了，会引发 WriteTimeout 异常。

而不同种类的超时，可以设置不同的超时时间，如果只写一个整数或浮点数，那么表示所有的超时时间都是相同的。

```python
import httpx

# 连接超时时间设置为 10 秒，其它超时时间设置为 3 秒
timeout1 = httpx.Timeout(3, connect=10)

# 连接超时时间设置为 10 秒，读超时时间设置为 5 秒
# 其它超时时间设置为 3 秒
timeout2 = httpx.Timeout(3, connect=10, read=5)

# 连接超时时间设置为 10 秒，读超时时间设置为 5 秒
# 写超时时间设置为 6 秒，其它超时时间设置为 3 秒
timeout3 = httpx.Timeout(3, connect=10, read=5, write=6)

# 如果 connect、read、write 都不传，比如 Timeout(1)
# 那么 timeout=Timeout(1) 和 timeout=1 是等价的

response = httpx.get(
    "https://www.google.com",
    timeout=timeout1  # timeout2、timeout3
)
```

读超时时间适用于 get、head 等请求，写超时时间适用于 post、put 等请求，连接超时时间适用于所有请求（因为不管什么请求都需要建立连接）。

## 身份验证

有的时候发起 HTTP 请求的时候，会让你输入用户名和密码，也就是所谓的 Basic 认证。我们用 FastAPI 编写一个服务，举例说明：

![](./2.png)

在浏览器中输入 URL 之后，会让我们提供用户名和密码，用户名密码正确才会执行请求，否则直接返回认证失败。那么面对这种情况，我们如何在发起请求的同时指定用户名和密码呢？

```python
import httpx

response = httpx.get("http://localhost:5555/index")
# 如果没有认证的话，FastAPI 会默认返回一个 JSON
print(response.status_code)
"""
401
"""
print(response.json())
"""
{'detail': 'Not authenticated'}
"""

# 如何输入用户名和密码呢，通过 auth 参数指定即可
response = httpx.get("http://localhost:5555/index", auth=("satori", "123456"))
# 这里的 FastAPI 服务会将输入的用户名和密码返回
print(response.json())
"""
{'username': 'satori', 'password': '123456'}
"""

# 或者下面这种做法也行
response = httpx.get("http://satori:123456@localhost:5555/index")
print(response.json())
"""
{'username': 'satori', 'password': '123456'}
"""
```

以上就是 Basic 认证，但除了 Basic 认证之外还有 Digest 认证，要更安全一些。如果是 Digest 认证的话，我们实例化一个 httpx.DigestAuth 对象（输入用户名和密码），然后传给 auth 参数即可。

## 异常处理

当请求出现错误时，httpx 会引发相应的异常。在 httpx 里面有两个关键的异常：

**1）RequestError**

这是一个超类，发送 HTTP 请求后产生的任何异常都可以用它来捕获。

```python
import httpx

try:
    httpx.get("https://www.google.com",
              timeout=1)
except httpx.RequestError as e:
    # 内部有一个 request 属性，值为 httpx.Request 对象
    # 通过该属性可以拿到请求相关的信息
    print(f"访问 {e.request.url} 失败")
"""
访问 https://www.google.com 失败
"""
```

**2）HTTPStatusError**

Response 对象有一个 raise_for_status 方法，如果状态码不是 200 ~ 299，那么调用的时候会抛异常，而 HTTPStatusError 专门用来捕获该异常。

```python
import httpx

response = httpx.get("http://localhost:5555/index")
print(response.status_code)
"""
401
"""

try:
    # 状态码不在 200 ~ 299，调用会抛异常
    response.raise_for_status()
except httpx.HTTPStatusError as e:
    print(e)
    """
    Client error '401 Unauthorized' for url 'http://localhost:5555/index'
    For more information check: https://httpstatuses.com/401
    """
    # 然后内部还有两个属性，分别是 response 和 request
    print(e.response is response)
    print(e.request is response.request)
    """
    True
    True
    """
```

比较简单，并且也不是很常用。

## Client 对象

我们知道 httpx 内部的 get、post 等函数，背后都调用了 request 函数，那么 request 函数的逻辑是怎么样的呢？我们看一下源代码。

![](./3.png)

发送请求的逻辑都在类 Client 里面，我们可以实例化一个 Client 对象，然后调用它的 get、post、put 等方法，当然这些方法背后都调用了 client.request。如果是通过 httpx 调用的话，比如 httpx.get，那么内部会先帮我们实例化一个 Client 对象，然后调用对象的 request 方法。

> httpx.Client 和 requests.Session 的作用是类似的。

所以当我们要多次向某个网址发请求（比如 get 请求）时，那么先实例化一个 Client 对象，然后再调用它的 get 方法会更好一些。因为底层的 TCP 连接会复用，从而带来性能提升。如果使用 httpx.get，那么每次访问都要新创建一个 TCP 连接。

```python
import httpx

# 内部会创建一个 Client 对象，然后调用它的 request 方法
# 调用结束之后，再将对象销毁，因此底层的 TCP 连接无法复用
httpx.get("http://www.baidu.com")
httpx.get("http://www.baidu.com")
httpx.get("http://www.baidu.com")

# 实例化一个 Client 对象，它内部使用了 HTTP 连接池
client = httpx.Client()
# 向同一主机发出多个请求时，客户端将重用底层的 TCP 连接
# 而不是为每个请求重新创建一个
client.get("http://www.baidu.com")
client.get("http://www.baidu.com")
client.get("http://www.baidu.com")
```

使用 Client 对象除了能带来性能上的提升，还有一个重要的地方就是，它可以将请求参数保存起来，并让它们跨请求传递。举个例子：

```python
import httpx

response = httpx.get("http://www.baidu.com", headers={"ping": "pong"})
print("ping" in response.request.headers)
"""
True
"""
# httpx 内部每次都会创建一个新的 Client 对象
# 因此在上一个请求当中设置的请求头，与后续请求无关
response = httpx.get("http://www.baidu.com")
print("ping" in response.request.headers)
"""
False
"""

# 先实例化一个 Client 对象，在里面设置请求头
# 那么每一次请求的时候，都会带上，因为用的是同一个对象
client = httpx.Client(headers={"ping": "pong"})
response = client.get("http://www.baidu.com")
print("ping" in response.request.headers)
"""
True
"""
response = client.get("http://www.baidu.com")
print("ping" in response.request.headers)
"""
True
"""
```

除了请求头，像 cookie、超时时间、auth、代理等等都是支持的，一旦设置了，那么后续的每次请求都会带上。

并且除了在实例化的时候设置之外，也可以实例化之后单独设置，举个例子：

```python
import httpx

client = httpx.Client()
client.headers["ping"] = "pong"
response = client.get("http://www.baidu.com")
print("ping" in response.request.headers)
"""
True
"""
```

总的来说，和 requests 模块是一致的。

还有一点，如果我们在请求的方法中又传了相应的参数，那么请求方法中的参数，会覆盖 client 当中的参数。

~~~python
import httpx

client = httpx.Client(headers={"ping": "pong"})
response = client.get("http://www.baidu.com",
                      headers={"X-MAN": "TX", "ping": "pong pong pong"})
# 调用 get 方法时，也设置了 headers，那么以具体的方法为准
# 并且在请求方法中设置的参数，不会影响下一个请求
print(response.request.headers["ping"])
print(response.request.headers["X-MAN"])
"""
pong pong pong
TX
"""

# 重新调用，两个请求互不影响
response = client.get("http://www.baidu.com")
print(response.request.headers["ping"])
print("X-MAN" in response.request.headers)
"""
pong
False
"""
~~~

非常简单，比如我们要多次访问一个比较私密的接口，而接口要求我们在访问时，必须在请求头中带上指定的 Token，而 Token 需要访问另一个接口才能获取。那么便可以实例化一个 Client 对象，获取完 Token 之后通过 client.headers 设置进去，这样后续在请求的时候就会自动带上。

> Client 对象和 requests 的 Session 对象一样，不用了应该调用 close 方法进行关闭。或者使用 with 语句，会自动关闭。

## 指定代理

如果要使用代理，那么需要通过 proxies 参数指定。

```python
import httpx

proxies = {
  "http": "http://10.10.1.10:3128",
  "https": "http://10.10.1.10:1080",
}

httpx.get("...",  proxies=proxies)
# 或者手动实例化 Client 对象，后续每次请求都会带上
with httpx.Client(proxies=proxies) as client:
    client.get("...")
    client.get("...")
```

若你的代理需要使用HTTP Basic Auth，可以使用 http://user:pass@host:port 语法：

```python
proxies = {
    "http": "http://user:pass@10.10.1.10:3128",
}
```

还可以为某个特定的连接方式或者主机设置代理，使用 scheme://host:port 作为 key，它会针对指定的主机和连接方式进行匹配。

```python
proxies = {
    'http://10.20.1.128': 'http://10.10.1.10:5323'
}
```

以上是 HTTP 代理，除了它之外 httpx 还支持 SOCKS 代理。如果要使用的话，需要安装第三方库，pip install "httpx[socks]"。

~~~python
import httpx

httpx.Client(
    proxies='socks5://user:pass@host:port'
)
~~~

## SSL 证书

HTTP 在传输数据的时候是不安全的，所以引入了 HTTPS。在发送 HTTPS 请求时，httpx 会对服务端主机的 SSL 证书进行验证（默认行为），如果验证失败，或者不信任服务端的 SSL 证书，那么 httpx 会抛出异常。

对于大部分网站来说，它们的 SSL 证书都是由受信任的 CA 机构颁发，所以能够直接正常访问，验证通过。但有些网站比较特殊，它会单独提供证书，你需要先把证书下载下来，然后发请求的时候带过去。

```python
import httpx

response = httpx.get("https://xxx.org",
                     verify="证书.pem")

with httpx.Client(verify="证书.pem") as client:
    client.get("https://xxx.org")
```

或者你还可以使用标准库 ssl，传递一个 SSLContext 对象。

```python
import ssl
import httpx

ctx = ssl.create_default_context()
ctx.load_verify_locations("证书.pem")
# 或者直接 ctx = httpx.create_ssl_context("证书.pem")
response = httpx.get("https://xxx.org", verify=ctx)
```

SSL 证书是为了保证客户端和服务端之间的数据传输安全，如果你不需要考虑安全性的话，那么也可以指定 verify 为 False，表示禁用 SSL 验证。

既然服务端有证书，那么客户端也可以有。

```python
import httpx

cert1 = "客户端证书.pem"
cert2 = ("客户端证书.pem", "秘钥文件.key")
cert3 = ("客户端证书.pem", "秘钥文件.key", "密码")
httpx.get(
    "https://example.org",
    cert=cert1  # cert2、cert3
)
```

不是太常用，了解一下就好。

## 手动构造 Request 对象

调用 httpx 里面的函数发送请求时，httpx 内部会帮我们构造 Resquest 对象；服务端返回响应之后，httpx 会帮我们构造 Response 对象。

但为了最大限度地控制发送的内容，HTTPX 还支持我们手动构建 Request 对象。

```python
import httpx

request = httpx.Request("GET", "http://www.baidu.com")
# 通过 client.send 方法将请求发送给服务端
with httpx.Client(headers={"ping": "pong"}) as client:
    response = client.send(request)
    print("ping" in response.request.headers)  # False

# 但上面这种方式，Client() 里面的参数无法作用在请求上
# 因此还可以通过 Client 对象来构造请求
with httpx.Client(headers={"ping": "pong"}) as client:
    request = client.build_request("GET", "http://www.baidu.com")
    response = client.send(request)
    print("ping" in response.request.headers)  # True
```

这种方式用的不多，我们直接调用 client 下面的 get、post 等方法发请求即可。

## 钩子函数

httpx 还允许我们向 Client 实例注册一些钩子函数，当指定事件发生时会调用，而事件有两种：

- request：请求完全准备好之后，发给服务端之前调用；
- response：从服务端获取响应之后，返回之前调用；

通过钩子函数，我们可以跟踪请求的整个过程，并进行记录。

~~~python
import httpx

def before_request1(request):
    print(f"1）向 {request.url} 发送了请求")

def before_request2(request):
    print(f"2）向 {request.url} 发送了请求")

def after_response1(response):
    print(f"1）服务端返回了响应，状态码 {response.status_code}")

def after_response2(response):
    print(f"2）服务端返回了响应，状态码 {response.status_code}")

client = httpx.Client(
    event_hooks={"request": [before_request1, before_request2],
                 "response": [after_response1, after_response2]}
)
client.get("http://www.baidu.com")
"""
1）向 http://www.baidu.com 发送了请求
2）向 http://www.baidu.com 发送了请求
1）服务端返回了响应，状态码 200
2）服务端返回了响应，状态码 200
"""
~~~

总的来说，钩子函数很有用，但对于我们简单地发送 HTTP 请求而言，用的不多。

## 开启 HTTP/2

先来说一说为什么会有 HTTP/2，存在即合理，既然 HTTP/2 会出现，那么说明 HTTP/1.1 一定存在一些缺点。那么缺点都有哪些呢？

<font color="blue">**队头阻塞**</font>

HTTP/1.1 是基于「请求-响应」模式，如果一个请求阻塞，那么在后面排队的所有请求也会一同阻塞，会导致客户端一直请求不到数据，就类似堵车。

<font color="blue">**延迟高**</font>

HTTP/1.1 处理响应的顺序和请求顺序是一致的，只有第一个响应处理完毕之后才能处理第二个响应。就类似于打卡，第一个人因为某些原因怎么也打不上卡，但他如果打不上，后面的人也没法打。

总的来说，对于 HTTP/1.1 而言，没有轻重缓急的优先级，只有先后入队的顺序。

<font color="blue">**HTTP 头部过大**</font>

无论是请求报文还是响应报文，都由 Header + Body 组成，因为 HTTP/1.1 是无状态的，所以就要求 Header 携带很多的头字段，有时多达几百字节甚至上千字节。但 Body 却经常只有几十字节、甚至几字节（比如 GET 请求、204/301/304 响应），等于说变成了一个不折不扣的大头儿子。更要命的是，成千上万的请求响应报文里有很多字段值都是重复的，非常浪费，长尾效应导致大量带宽消耗在了这些冗余度极高的数据上。

以上就是 HTTP/1.1 面临的一些问题，尽管也通过一些额外的手段来曲线救国，但仍然不能很好的解决问题。所以业界就开始改革了，发明了 HTTP/2 协议，这个协议很好地解决了 HTTP/1.1 所面临的问题。

首先 HTTP/2 它是安全的，和 HTTPS 一样，也是基于 SSL/TLS 之上。但将 HTTP 分解成了语义和语法两个部分，语义层不做改动，与 HTTP/1 完全一致。比如请求方法、URI、状态码、头字段等概念都保留不变，这样就消除了再学习的成本，基于 HTTP 的上层应用也不需要做任何修改，可以无缝转换到 HTTP/2，如果代理服务器不支持 HTTP/2，那么会自动降级到 HTTP/1.1（HTTPS）。

特别要说的是，与 HTTPS 不同，HTTP/2 没有在 URI 里引入新的协议名，仍然用 http 表示明文协议，用 https 表示加密协议。这是一个非常了不起的决定，可以让浏览器或者服务器去自动升级或降级协议，免去了选择的麻烦，让用户在上网的时候都意识不到协议的切换，实现平滑过渡。

在语义保持稳定之后，HTTP/2 在语法层做了天翻地覆的改造，完全变更了 HTTP 报文的传输格式。

<font color="blue">**头部压缩**</font>

HTTP/1.1 对 Body 进行了压缩，并且还提供了 Content-Encoding 指定压缩方式，但 Header 却没有进行优化。

于是 HTTP/2 把头部压缩作为性能改进的一个重点，优化的方式自然还是压缩。但 HTTP/2 并没有使用传统的压缩算法，而是开发了专门的 HPACK 算法，在客户端和服务器两端建立字典，用索引号表示重复的字符串，还釆用哈夫曼编码来压缩整数和字符串，可以达到 50%~90% 的高压缩率。

<font color="blue">**二进制格式**</font>

HTTP/1.1 的报文是明文格式，但这样容易出现多义性，比如大小写、空白字符、回车换行、多字少字等等，程序在处理时必须用复杂的状态机，效率低，还麻烦。

于是 HTTP/2 将报文换成了二进制格式，这样虽然对人不友好，但却大大方便了计算机的解析。具体做法是把原来的 Header+Body 的消息打散为数个小片的二进制帧（Frame），其中 HEADERS 帧存放头数据、DATA 帧存放实体数据。

![](./4.png)

这种做法有点像是 Chunked 分块编码的方式，也是化整为零的思路，但 HTTP/2 数据分帧后 Header+Body 的报文结构就完全消失了，协议看到的只是一个个的碎片。

<font color="blue">**虚拟的流**</font>

在连接的层面上看，多个消息就是一堆乱序收发的帧，比如可以先接收消息 1 的帧、再接收消息 2 的帧，然后再接收消息 1 的帧。这个过程不要求顺序（比如先将消息 1 的帧全部接收完毕之后才能接收消息 2 的帧），否则和 HTTP/1.1 就没有区别了。

那么问题来了，这些消息碎片（二进制帧）到达目的地之后应该怎么组装起来呢？HTTP/2 为此定义了一个流（Stream）的概念，它是虚拟的，可以想象成二进制帧的双向传输序列。隶属同一个消息的所有帧都有一个相同的流 ID，不同消息的流 ID 则不同。后续在对帧进行组装的时候，根据这个 ID 来将属于同一个消息的帧组装在一起，得到类似 HTTP/1.1 中的报文，也就是传输时无序，接收时组装。

所以，在 HTTP/2 中的多个请求与响应之间没有了顺序关系，不需要排队等待，也就不会再出现队头阻塞问题，降低了延迟，大幅度提高了连接的利用率。

> 说白了在 HTTP/2 中就是将二进制的报文数据切分成多个帧进行传输，而不同消息的帧可以混在一起发送（传输时无序），而在接收时再根据流 ID 将属于同一个消息的帧组装在一起（接收时组装）。

因为流是虚拟的，实际上并不存在，所以 HTTP/2 就可以在一个 TCP 连接上同时发送多个碎片化的消息，这就是常说的多路复用（ Multiplexing），多个往返通信都复用一个连接来处理。

但需要注意的是，我们说传输时无序指的是多个消息之间的帧可以无序，但同一个消息的帧则必须是有序的，比如每条消息必须先传输其 HEADER 帧、再传输 DATA 帧，否则消息就乱掉了。然后组装的时候，直接按照顺序进行组装即可。

![](./5.png)

另外为了更好地利用连接，加大吞吐量，HTTP/2 还添加了一些控制帧来管理虚拟的流，实现了优先级和流量控制，这些特性也和 TCP 协议非常相似。

HTTP/2 还在一定程度上改变了传统的请求响应工作模式，服务器不再是完全被动地响应请求，也可以新建流主动向客户端发送消息。比如，在浏览器刚请求 HTML 的时候就提前把可能会用到的 JS、CSS 文件发给客户端，减少等待的延迟，这被称为服务器推送（Server Push）。

好了，说回重点，虽然 HTTP/1.1 存在一些问题，但它非常成熟，所以 httpx 默认没有开启 HTTP/2。如果想开启的话，那么只需要在实例化 Client 的时候加上一个参数即可。

> 但是要安装 HTTP/2 的依赖项，直接 pip install "httpx[http2]" 即可

```python
import httpx

# 通过指定 http2=True，即可开启 HTTP/2
client = httpx.Client(http2=True)
response = client.get("http://www.baidu.com")
```

注：httpx.get、http.post 里面没有 http2 这个参数，如果想开启 HTTP/2，那么必须手动实例化 Client 对象，然后指定相关参数。

## 发送异步请求

前面介绍的所有内容都是基于同步模式，但 httpx 还可以发送异步请求，否则就没有必要学它了，直接用 requests 就行了。

那么如何发送异步请求呢？

```python
import asyncio
import httpx

async def send():
    async with httpx.AsyncClient() as client:
        response = await client.get("http://www.baidu.com")
        print(response.status_code)
        print(response.url)

asyncio.run(send())
"""
200
http://www.baidu.com
"""
```

过程非常简单，使用 AsyncClient 实例化一个客户端，然后调用里面的方法发送请求即可。用法和同步的 Client 对象是一样的，只有几个方法名不一样，我们举例说明：

```python
import asyncio
import httpx

async def send():
    client = httpx.AsyncClient()
    # 分块读取
    async with client.stream(
        'GET', 'http://www.baidu.com'
    ) as response:
        # 如果是 Client，那么方法名为 iter_bytes
        # 而 AsyncClient 的方法名则是 aiter_bytes
        # 然后遍历要用 async for，因为返回的是异步生成器
        async for chunk in response.aiter_bytes():
            pass

    # 关闭的时候要使用 aclose()，而不是 close
    await client.aclose()
```

对啦，还有钩子函数，如果使用的是异步客户端，钩子函数应该使用 async def 定义。也就是说，我们要传协程函数，而不是普通的函数。

## 小结

关于 httpx 的内容就说到这里，总的来说它的功能还是很强大的，在设计上和 requests 保持了高度的一致性。熟悉 requests 的话，那么学习 httpx 基本上没有任何压力。

但 httpx 在 requests 的基础上提供了很多新功能，比如严格的超时控制，精确的类型注解，HTTP/2 和协程的支持等等。以后在发送 HTTP 请求的时候，不妨使用 httpx 吧。