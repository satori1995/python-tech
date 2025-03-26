## 楔子

shutil 是一个 Python 内置模块，该模块对文件的复制、删除和压缩等操作都提供了非常方便的支持。

下面来详细介绍一下该模块的用法。

## chown：更改指定路径的所有者用户（组）

函数原型：`shutil.chown(path, user=None, group=None)`

- path：指定要操作的路径；
- user：指定所有者，可以是系统用户名或者 UID，如果用户不存在则报错 "没有此用户"；
- group：表示组

该方法只适用于 Unix 系统，下面演示一下。

~~~Python
>>> import shutil
>>> import pwd  # Unix
>>> import os
>>> 
>>> uid = os.stat("/home/lighthouse").st_uid
>>> pwd.getpwuid(uid)
pwd.struct_passwd(pw_name='lighthouse', 
                  pw_passwd='x', 
                  pw_uid=1000, 
                  pw_gid=1000, 
                  pw_gecos='', 
                  pw_dir='/home/lighthouse', 
                  pw_shell='/bin/bash')

# 将所有者改成 root
>>> shutil.chown("/home/lighthouse", user="root")
# 再次查看，发现所有者已经被修改了
>>> uid = os.stat("/home/lighthouse").st_uid
>>> pwd.getpwuid(uid)
pwd.struct_passwd(pw_name='root', 
                  pw_passwd='x', 
                  pw_uid=0, 
                  pw_gid=0, 
                  pw_gecos='root', 
                  pw_dir='/root', 
                  pw_shell='/bin/bash')
~~~

## copy：复制文件

copy 函数可以将一个文件复制为另一个文件。

函数原型：`shutil.copy(src, dst, *, follow_symlinks=True)`

- src：文件的路径，注意：必须是文件，如果是目录则报出权限错误；
- dst：文件或目录的路径，如果是一个已经存在的目录，那么会将 src 拷贝到该目录中；否则会创建相应的文件；
- follow_symlinks：表示是否遵循符号链接，默认为 True。如果为 True 则复制文件，为 False、并且 src 为软连接，则创建一个新的软连接；

该函数会返回目标路径，即新创建的文件的路径。

```python
import shutil

shutil.copy("1.txt", "test")
```

如果 test 存在并且是目录，那么将 1.txt 拷贝到 test 目录中；如果 test 不存在，那么创建一个名为 test 的文件，内容和 1.txt 一致；如果 test 存在并且不是目录，那么会把已存在的 test 文件覆盖掉，此时需要具备对 test 的写权限，否则会报出权限错误：PermissionError。

另外使用 copy 复制文件时，文件的元信息（创建时间、修改时间）不会被保留，相当于创建了新文件。如果要保留文件的元信息，需要使用 copy2 函数（和 copy 函数用法一致，区别就是前者不保留文件元信息、后者会保留）。

## copyfile：复制文件

参数和 copy、copy2 完全一致，只不过 copyflle 的 dst 如果已存在，那么必须是文件。

```python
# 如果 test 存在并且是目录，会报错
# PermissionError: [Errno 13] Permission denied: 'test'
shutil.copyfile("1.txt", "test")

# 如果 test 不存在
# 那么会创建一个名为 test 的文件，内容和 1.txt 一致
# 如果 test 存在并且不是目录，那么会把原来的文件覆盖掉
shutil.copyfile("1.txt", "test")
```

比较简单，可以自己试一下，所以 copy 要比 copyfile 更高级一些。copyfile 要求 dst 存在时必须是文件，而 copy 则允许 dst 是目录，会自动将文件拷贝到目录中。使用 copyfile 同样需要写权限，并且 src 和 dst 不能是同一个文件，否则会报错：SameFileError。

除了 copyfile 之外，还有一个更加低级的 copyfileobj。copyfileobj 也是拷贝，接收三个参数：fsrc、fdst、length，前两个参数和 copy 类似，只不过 fsrc 和 fdst 都必须是打开的文件对象，从名字上也能看出。至于第三个参数 length 表示缓冲区，默认是 16 * 1024 字节，如果为负数代表不走缓冲区，而是直接复制。

```python
import shutil
from io import StringIO

buf1 = StringIO()
buf2 = StringIO()

# buf1 里面写入一些内容
buf1.write("古明地觉")
# 调整指针，移到开头，否则读取不到内容
buf1.seek(0)
# 将 buf1 的内容拷贝到 buf2 中
shutil.copyfileobj(buf1, buf2)
# 查看 buf2 的内容
print(buf2.getvalue())  # 古明地觉
```

虽然 copyfileobj 比较低级，但是它的速度也更快。当复制大文件时，采用 copyfileobj 会更有效率，复制小文件则使用 copyfile 会更方便一些。

## copymode：复制权限位

参数和 copy 函数也完全相同，只不过它是将一个文件的权限复制给另一个文件。比如 A 文件是只读，那么复制给 B 之后 B 也是只读，但是 A 的内容不会复制给 B，因为 copymode 只是复制权限。

除了 copymode 还有一个 copystat，参数也是一样的，只不过它除了复制权限之外还复制最后访问时间、最后修改时间等元信息，可以自己试一下这两个函数。

## copytree：递归复制整个目录树

copytree 方法可以递归复制整个目录，并返回目标目录的路径，函数原型如下：

```Python
def copytree(src, dst, symlinks=False, 
             ignore=None, copy_function=copy2,
             ignore_dangling_symlinks=False, 
             dirs_exist_ok=False):
    ...
```

参数含义如下：

- src：表示路径的字符串，必须是一个已存在的目录，不能是文件;
- dst：表示路径的字符串，必须是一个不存在的目录，否则报错：FileExistsError;
- symlinks：是否遵循符号链接，默认为 True。如果为 True，表示复制文件，如果为 False，那么当 src 为软连接时，则创建一个新的软连接;
- ignore：在复制的时候，用于过滤某些文件;
- copy_function：从默认值可以看出，表示拷贝函数，这里采用的是 copy2，会将文件的元信息也一块拷过去;
- ignore_dangling_symlinks：是否忽略 symlinks，如果值为 True 则忽略，值为 False，那么当文件不存在时则产生异常。对于不支持 os.symlink() 的平台，此参数无任何影响;

举个例子：

```Python
import shutil

# 将 dir1 拷贝为 dir2
shutil.copytree("dir1", "dir2")

# 将 dir1 拷贝为 dir3，同时忽略掉 .txt 结尾的文件
shutil.copytree("dir1", "dir3", ignore=shutil.ignore_patterns("*.txt"))
```

## disk_usage：获取磁盘的使用情况

该函数接收一个参数 path，会自动获取该路径所在磁盘的使用情况：总空间、已使用空间和空闲空间，以字节为单位。

```python
import shutil

disk = shutil.disk_usage("/")
print(disk)
"""
usage(total=494384795648, used=71737876480, free=422646919168)
"""
print(disk.total / 1024 / 1024 / 1024)
print(disk.used / 1024 / 1024 / 1024)
print(disk.free / 1024 / 1024 / 1024)
"""
460.4317207336426
66.81110382080078
393.6206169128418
"""
```

关于获取磁盘信息，之前还介绍过一个模块叫 psutil。

## get_archive_formats：获取支持的压缩格式

一会要介绍文件压缩，所以先来看看都支持哪些压缩格式。

```Python
import shutil
from pprint import pprint

pprint(shutil.get_archive_formats())
"""
[('bztar', "bzip2'ed tar-file"),
 ('gztar', "gzip'ed tar-file"),
 ('tar', 'uncompressed tar file'),
 ('xztar', "xz'ed tar-file"),
 ('zip', 'ZIP file')]
"""
```

既然有压缩，那么就有解压缩，get_unpack_formats 函数可以返回当前系统支持的解压缩格式列表：

```Python
import shutil
from pprint import pprint

pprint(shutil.get_unpack_formats())
"""
[('bztar', ['.tar.bz2', '.tbz2'], "bzip2'ed tar-file"),
 ('gztar', ['.tar.gz', '.tgz'], "gzip'ed tar-file"),
 ('tar', ['.tar'], 'uncompressed tar file'),
 ('xztar', ['.tar.xz', '.txz'], "xz'ed tar-file"),
 ('zip', ['.zip'], 'ZIP file')]
"""
```

## get_terminal_size：获取终端窗口的大小

get_terminal_size 函数可以获取终端窗口的大小。

```Python
import shutil

print(shutil.get_terminal_size())
"""
os.terminal_size(columns=80, lines=24)
"""
```

系统如果不支持查询，或者未连接到终端，那么默认返回 80, 24。

## make_archive：创建压缩文件

通过 make_archive 可以创建压缩文件，函数原型如下：

```Python
def make_archive(base_name, format, root_dir=None, 
                 base_dir=None, verbose=0, dry_run=0, 
                 owner=None, group=None, logger=None):
    ...
```

参数含义如下：

- base_name：表示生成的压缩文件的名称（不包含扩展名），也可以是完整路径。如果只写文件名则保存到当前目录，否则保存到指定路径；
- format：表示压缩包格式，如 zip、tar、bztar、gztar 等，会根据 format 生成扩展名并拼接到 base_name 后面；
- root_dir：表示要压缩的目录路径，默认是当前目录；
- base_dir：表示要压缩的目录路径，默认为当前目录；那么问题来了，它和 root_dir 之间有什么区别呢？假设我们要对 dir1 目录进行压缩，压缩后的文件名是 xx.zip。如果指定的是 root_dir="dir1"，那么 xx.zip 解压之后得到的目录的名字为 xx；如果指定的是 base_dir="dir1"，那么 xx.zip 解压之后得到的目录的名字仍是 dir1。当然不管目录名是 xx 还是 dir1，里面存储的内容不变，这两个参数我们指定一个即可；
- verbose：已弃用；
- dry_run：表示是否创建存档，如果 dry_run 为 True，则不会创建存档，但会将执行的操作记录到 logger；
- owner：可选参数，用于指定用户，默认为当前用户；
- group：可选参数，用于指定组，默认为当前组；
- logger：用于记录日志，通常为 logging.Logger 对象；

make_archive 函数依赖于 zipfile 和 tarfile 模块。

```Python
import shutil

shutil.make_archive("xx", "zip", root_dir="dir1")
```

之后会在当前目录中出现一个 xx.zip，目录 "dir1" 里面的所有内容都会被压缩到里面。

有压缩，那么自然有解压缩：

~~~Python
shutil.unpack_archive(filename, extract_dir=None, format=None)
"""
filename: 解压缩文件的路径
extract_dir: 解压到哪个目录，未指定则解压到当前目录
format: 压缩文件的格式，如：zip、bztar、gztar 等等
        如果没有提供，那么根据压缩文件的扩展名进行推断
"""
~~~

该方法同样依赖于 zipfile 和 tarfile 两个模块。

## move：移动文件和目录

move 函数用于将文件或目录移动到目标目录，如果移动到了不同的文件系统中，那么移动将会变成复制。这里我们考虑同一个文件系统即可，想拷贝的话，建议使用 copy 函数。下面看一下 move 函数的用法：

~~~Python
import shutil

"""
src: 源文件或目录
dst: 路径不存在相当于重命名，存在则进行移动
copy_function：默认是 copy2
"""
# dir22 不存在，所以相当于将 dir2 重命名为 dir22
shutil.move("dir2", "dir22")

# dir3 存在，所以会将 dir22 移动到 dir3 中
shutil.move("dir22", "dir3")
~~~

当 dst 不存在时，无论 src 是文件还是目录，都相当于重命名。如果 dst 存在并且是目录，那么 src 无论是文件还是目录，都会被移动到 dst 里面去。如果 dst 存在并且是文件，那么 src 必须也是一个文件，此时相当于覆盖，可以理解为先删除 dst、再将 src 重命名为 dst。

## rmtree：删除整个目录树

rmtree 函数用于删除整个目录树，参数如下：

- path：表示路径的字符串，必须是一个目录，不能是文件；
- ignore_errors：默认为 False，表示是否忽略删除中出现的错误。如果为 True 表示忽略、为 False 表示不忽略；
- onerror：一个错误处理函数，出现异常时自动调用，并且会往里面传递三个参数：os.lstat、path（路径）、excinfo（返回的异常信息）。如果 onerror 被省略，那么当发生错误时会给出提示；

~~~Python
import os
import shutil

print(os.access("dir3", os.F_OK))  # True
shutil.rmtree("dir3")
print(os.access("dir3", os.F_OK))  # False
~~~

## which：获取可执行文件的路径

我们在终端中输入 python 的时候会自动进入交互式解释器，这是因为在环境变量中配置了 python 解释器的路径，而通过 which 函数可以获取相应的路径。该函数接收的参数如下：

- cmd：相关命令；
- mode：用于指定需要传递的权限掩码，默认为 os.F_OK | os.X_OK，表示测试路径是否存在、并且是否可执行；
- path：默认为 None，表示查找 cmd 命令的路径。如果不指定则在环境变量中查找，指定了则在指定的路径参数中查找。但是注意：不管该参数有没有指定，当前目录始终会被添加到搜索路径中；

为了方便，这里直接在 Linux 上测试：

```Python
import shutil

print(shutil.which("python"))  # /usr/bin/python
print(shutil.which("gcc"))  # /usr/bin/gcc
print(shutil.which("xxxxx"))  # None
```

还是很强大的，如果找不到命令的话，返回 None。

## 小结

以上就是 shutil 的一些用法，在工作中不妨多使用一下。尤其是涉及文件拷贝的时候，真的非常方便。