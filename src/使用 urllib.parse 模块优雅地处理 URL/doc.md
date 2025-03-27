我们在工作中，特别是在做爬虫的时候，经常需要处理 URL。而 Python 的标准库里面有一个模块叫 urllib.parse，可以很方便地处理 URL，下面来看看它都支持哪些功能。

**1）对 URL 进行解析，获取每一个组成部分。**

~~~python
from urllib.parse import urlparse

url = "https://www.baidu.com/s/koishi/?id=ae4634ed#index"
parse_result = urlparse(url)
# 获取 URL 使用的协议
print("协议:", parse_result.scheme)
# 获取 URL 中的域名或 IP
print("域名:", parse_result.netloc)
# 获取 URL 中的路径
print("路径:", parse_result.path)
# 获取 URL 中的查询参数
print("查询参数:", parse_result.query)
# 获取 URL 中的锚点
print("锚点:", parse_result.fragment)
"""
协议: https
域名: www.baidu.com
路径: /s/koishi/
查询参数: id=ae4634ed
锚点: index
"""
~~~

此时我们就将 URL 的每一个部分都解析出来了，如果里面还包含用户名和密码，也是可以解析出来的。

```python
from urllib.parse import urlparse

url = "https://satori:123456@www.example.com"
parse_result = urlparse(url)
print("用户名:", parse_result.username)
print("密码:", parse_result.password)
"""
用户名: satori
密码: 123456
"""
```

如果没有用户名和密码的话，那么解析的结果就是 None。

**2）对 URL 进行拼接**

很多网站的前端标签中出现的 URL 并不完整，只包含了路径相关的部分，举个例子：

![](./1.png)

我们看到 URL 并不完整，我们需要将主站的 URL 和它拼接在一起，才能拿到完整的 URL。

```python
from urllib.parse import urljoin

# 第一个参数是主站的 URL，第二个参数是路径
url = urljoin(
    "https://www.example.com",
    "/image/1.png"
)
print(url)
"""
https://www.example.com/image/1.png
"""

url = urljoin(
    # 结尾多一个 /
    "https://www.example.com/",
    "/image/1.png"
)
# 该函数依旧能处理的很好
print(url)
"""
https://www.example.com/image/1.png
"""

url = urljoin(
    "https://www.example.com",
    # 开头少一个 /
    "image/1.png"
)
# 该函数也能处理的很好
print(url)
"""
https://www.example.com/image/1.png
"""

# 如果第二个参数本身就是完整的 URL
# 那么不做处理
url = urljoin(
    "https://www.example.com",
    "https://www.example.com/image/1.png"
)
print(url)
"""
https://www.example.com/image/1.png
"""
```

通过 urljoin 函数，我们能轻松地拼接 URL。

**3）查询参数拼接**

```python
from urllib.parse import urlencode
print(
    urlencode([("a", 1), ("b", 2), ("a", 3)])
)  # a=1&b=2&a=3

# 也可以传递一个字典
print(
    urlencode({"name": "觉", "age": 17})
)  # name=%E8%A7%89&age=17
```

注意：汉字和特殊字符会进行编码。

**4）URL 的编码与解码**

```python
from urllib.parse import quote, unquote
url = "http://www.example.com/name=觉 恋"
print(url)
# 对汉字和特殊字符进行编码
quote_url = quote(url)
print(quote_url)
"""
http://www.example.com/name=觉 恋
http%3A//www.example.com/name%3D%E8%A7%89%20%E6%81%8B
"""

# 对编码之后的 URL 进行解码
print(unquote(quote_url))
"""
http://www.example.com/name=觉 恋
"""
```

除了 quote 之外还有 quote_plus，那么这两者有啥区别呢？

```python
from urllib.parse import quote_plus, quote
url = "http://www.example.com?a=1 2"
print(quote(url))
print(quote_plus(url))
"""
http%3A//www.example.com%3Fa%3D1%202
http%3A%2F%2Fwww.example.com%3Fa%3D1+2
"""
# 我们看到 quote 不会对 / 进行编码，而 quote_plus 会
# 并且 quote_plus 还会将空格替换成 +

# 既然有 quote_plus，那么就有 unquote_plus
# 对编码之后的 URL 进行解码
from urllib.parse import unquote_plus, unquote
# 不管是 quote 还是 quote_plus
# unquote_plus 都可以进行解码
print(unquote_plus(quote(url)))
print(unquote_plus(quote_plus(url)))
"""
http://www.example.com?a=1 2
http://www.example.com?a=1 2
"""

# 但如果使用 quote_plus 编码，unquote 解码
# 那么当 URL 里面出现空格的时候，就会出问题
print(unquote(quote(url)))
print(unquote(quote_plus(url)))
"""
http://www.example.com?a=1 2
http://www.example.com?a=1+2
"""
```

所以编码的时候 quote 和 quote_plus 均可使用，但解码的时候建议统一使用 unquote_plus。

**5）查询参数解析**

这个功能用的比较少，因为解析查询参数一般都是在做 web 的时候出现，而 web 框架都内置了查询参数解析功能。

~~~python
from urllib.parse import parse_qs
query = "name=satori&age=17"
# parse_qs 接收的不是完整的 URL
# 而是只包含查询参数相关的部分
print(parse_qs(query))
"""
{'name': ['satori'], 'age': ['17']}
"""

# 如果是完整的 URL，那么需要使用 urlparse 获取查询参数
url = "http://www.baidu.com?id=ae4432f"
from urllib.parse import urlparse
print(parse_qs(urlparse(url).query))
"""
{'id': ['ae4432f']}
"""

query = "name=&age=17"
# 如果参数没有值，那么默认会忽略掉
# 但是可以通过指定 keep_blank_values=True 来改变这一点
print(parse_qs(query))
print(parse_qs(query, keep_blank_values=True))
"""
{'age': ['17']}
{'name': [''], 'age': ['17']}
"""

# 相同参数也可以指定多次
query = "name=&name=&name=古明地觉"
print(parse_qs(query, keep_blank_values=True))
"""
{'name': ['', '', '古明地觉']}
"""
~~~

除了 parse_qs 之外，还有一个 parse_qsl，只不过返回的是列表。

```python
from urllib.parse import parse_qs, parse_qsl

query = "name=satori&age=17&name=koishi"
print(parse_qs(query))
print(parse_qsl(query))
"""
{'name': ['satori', 'koishi'], 'age': ['17']}
[('name', 'satori'), ('age', '17'), ('name', 'koishi')]
"""
```

以上就是 urllib.parse 模块的基本用法，可以看到，在处理 URL 的时候还是很方便的。







