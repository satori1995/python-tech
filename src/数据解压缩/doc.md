## 楔子

当数据量大的时候，自然而然想到的就是对数据进行压缩，下面来看看 Python 如何压缩数据。这里主要介绍三个模块，分别是 zlib、bz2、gzip，它们都是内置的，直接导入即可，不需要额外安装。

那么下面就开始吧。

## zlib 模块

看一下 zlib 模块的用法。

~~~python
import zlib

original_data = b"komeiji satori is a cute girl"
print(len(original_data))
"""
29
"""

# 对数据进行压缩
compressed_data = zlib.compress(original_data)
print(len(compressed_data))
"""
37
"""
# 我们看到当数据量很小的时候，压缩之后反而会增大


# 对数据进行解压
print(
    zlib.decompress(compressed_data) == original_data
)
"""
True
"""
~~~

在压缩的时候还可以指定压缩级别：

```python
import zlib

original_data = b"komeiji satori is a cute girl" * 1024

# 压缩级别 0 ~ 9，值越大，压缩级别越高，默认压缩级别为 6
for i in range(0, 10):
    compressed_data = zlib.compress(original_data, i)
    print(f"压缩前数据长度: {len(original_data)}, "
          f"压缩后数据长度: {len(compressed_data)}")
"""
压缩前数据长度: 29696, 压缩后数据长度: 29707
压缩前数据长度: 29696, 压缩后数据长度: 245
压缩前数据长度: 29696, 压缩后数据长度: 245
压缩前数据长度: 29696, 压缩后数据长度: 245
压缩前数据长度: 29696, 压缩后数据长度: 122
压缩前数据长度: 29696, 压缩后数据长度: 122
压缩前数据长度: 29696, 压缩后数据长度: 122
压缩前数据长度: 29696, 压缩后数据长度: 122
压缩前数据长度: 29696, 压缩后数据长度: 122
压缩前数据长度: 29696, 压缩后数据长度: 122
"""
```

压缩级别越高，速度越慢，但压缩之后的数据体积也越小。如果你要压缩的数据过大，那么还可以采用增量压缩。

```python
from io import BytesIO
import zlib

# 用 buffer 模拟大文件
original_data = b"komeiji satori is a cute girl" * 1024
buffer = BytesIO()
buffer.write(original_data)
buffer.seek(0)

# 创建压缩器，压缩等级为 5
compressor = zlib.compressobj(5)
# 每次读取 1024 字节，进行压缩
while (data := buffer.read(1024)) != b"":
    compressor.compress(data)
# 循环结束之后，压缩结束，调用 flush 方法拿到压缩数据
compressed_data = compressor.flush()

# 这里我们进行解压，然后对比一下，看看和原始数据是否相等
# 注意：zlib 压缩之后是有一个头部信息的，否则会认为数据不是 zlib 压缩格式
# 但是增量压缩会将头部信息给去掉，所以解压的时候还要手动加上
# 这个头部信息是 b"x\x9c"，转成十六进制就是 "789c"
decompressed_data = zlib.decompress(b"x\x9c" + compressed_data)
print(original_data == decompressed_data) 
"""
True
"""
```

压缩数据还可以和原始数据混在一起，举个例子：

```python
import zlib

original_data = b"komeiji satori is a cute girl" * 1024
compressed_data = zlib.compress(original_data)
combined_data = compressed_data + original_data
# 创建一个解压缩器
decompressor = zlib.decompressobj()
# 对 combined_data 进行解压，只会得到对 compressed_data 解压之后的数据
# 由于 zlib 会在压缩数据前面加上一个头部信息，所以 combined_data 要求必须是压缩数据在前
decompressed_data = decompressor.decompress(combined_data)
# 和原始数据是相等的
print(decompressed_data == original_data)
"""
True
"""
# 还可以拿到未解压的数据，显然也是原始数据
print(decompressor.unused_data == original_data)
"""
True
"""
```

当然，zlib 还支持验证数据完整性。

```python
import zlib

original_data = b"komeiji satori is a cute girl" * 1024
# 计算 Adler-32 校验和
print(zlib.adler32(original_data))
"""
4170046071
"""
# 计算 CRC-32 校验和
print(zlib.crc32(original_data))
"""
2627291461
"""
```

以上就是 zlib 模块的用法。

## bz2 模块

bz2 模块和 zlib 的用法非常类似：

```python
import bz2

original_data = b"komeiji satori is a cute girl" * 1024
# 也可以指定压缩等级，范围 1 ~ 9，注意：zlib 是 0 ~ 9
compressed_data = bz2.compress(original_data, 5)
print(len(original_data))
"""
29696
"""
print(len(compressed_data))
"""
103
"""
print(bz2.decompress(compressed_data) == original_data)
"""
True
"""
```

也可以增量压缩：

```python
from io import BytesIO
import bz2

original_data = b"komeiji satori is a cute girl" * 1024
buffer = BytesIO()
buffer.write(original_data)
buffer.seek(0)

# 创建压缩器，压缩等级为 5
compressor = bz2.BZ2Compressor(5)
while (data := buffer.read(1024)) != b"":
    compressor.compress(data)
compressed_data = compressor.flush()
# 这里不需要额外补充头部信息
decompressed_data = bz2.decompress(compressed_data)
print(original_data == decompressed_data)
"""
True
"""
```

也可以同时包含压缩数据和未压缩数据：

```python
import bz2

original_data = b"komeiji satori is a cute girl" * 1024
compressed_data = bz2.compress(original_data)
combined_data = compressed_data + original_data
# 创建一个解压缩器
decompressor = bz2.BZ2Decompressor()
decompressed_data = decompressor.decompress(combined_data)
# 和原始数据是相等的
print(decompressed_data == original_data)  # True
# 还可以拿到未解压的数据，显然也是原始数据
print(decompressor.unused_data == original_data)  # True
# 同样要求压缩数据在前
```

相比 zlib，bz2 还可以读写文件：

```python
import os
import bz2

original_data = b"komeiji satori is a cute girl" * 1024
# 写入文件
with bz2.open("1.bz2", "wb", compresslevel=9) as f:
    f.write(original_data)
# 读取文件，判断两者是否相等
with bz2.open("1.bz2", "rb", compresslevel=9) as f:
    print(f.read() == original_data)  # True

os.unlink("1.bz2")
```

当然我们使用内置函数 open 打开文件，然后手动写入压缩数据或者读取数据再手动解压，也是可以的。

## gzip 模块

首先 gzip 只有全量压缩，没有增量压缩。

```python
import gzip

original_data = b"komeiji satori is a cute girl" * 1024
# 也可以指定压缩等级，范围 0 ~ 9
compressed_data = gzip.compress(original_data, 5)
print(len(original_data)) 
"""
29696
"""
print(len(compressed_data)) 
"""
134
"""
print(gzip.decompress(compressed_data) == original_data)  
"""
True
"""
```

还可以调用 gzip.open 函数：

```python
import os
import gzip

original_data = b"komeiji satori is a cute girl" * 1024
# 写入文件
with gzip.open("1.gz", "wb", compresslevel=9) as f:
    f.write(original_data)
# 读取文件，判断两者是否相等
with gzip.open("1.gz", "rb", compresslevel=9) as f:
    print(f.read() == original_data)  #
    """
    True
    """

os.unlink("1.gz")
```

## 小结

以上就是 Python 压缩数据所使用的三个模块，之间是比较相似的。另外再补充一点，一般将数据压缩之后，会转成 16 进制进行传输，举个例子：

```python
import binascii
import gzip

original_data = b"komeiji satori"
compressed_data = gzip.compress(original_data, 5)
# 转成 16 进制
hex_data = binascii.hexlify(compressed_data)
print(
    binascii.unhexlify(hex_data) == compressed_data
)  # True
```

还是比较简单的。