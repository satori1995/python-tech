本次我们来聊一聊 Python 的一个内置模块：unicodedata，它是专门用来处理 unicode 字符串的，下面来看看它的用法。

**<font color="blue">unicodedata.normalize</font>**

负责对 unicode 字符串进行规范化处理，因为有些字符看似长度为 1，但其实不是，举个例子：

```python
s1 = "é"
s2 = "é"
s3 = "e\u0301"
print(len(s1))  # 1
print(len(s2))  # 2
print(len(s3))  # 2
print(s1 == s2)  # False
print(s2 == s3)  # True
print(s1, s2, s3)  # é é é
```

相信打印结果会让你感到诧异，s2 的长度看似为 1，但其实是 2，这是因为 Python3 的字符串存储的其实是码位序列。而某些字符可以有多种表示方式，比如 é：

- 预组合字符：代码中的 s1，这是一个单一的 unicode 码点，表示带有重音符号的小写字母 e；
- 分解序列：代码中的 s3，将小写字母 e 和重音符号（\u0301）分开，使用两个 unicode 码点表示，而 s2 虽然看起来和 s1 一样，但它的表示方式和 s3 是相同的；

```python
# 两个码点
s = "é"
print(s[0] == "e")  # True
print(s[1] == "\u0301")  # True
```

这种情况直接处理的话会比较头疼，所以 normalize 的作用就是规范化，让多个码点表示的字符使用一个码点表示。规范化前后的字符串长得一样，但是长度变短了。

```python
import unicodedata

s1 = "lové"
s2 = "lové"
s3 = "love\u0301"
print(s1 == s2 == s3)  # False
print(len(s1), len(s2), len(s3))  # 4 5 5

# 对字符串进行规范化，第一个参数是规范化方式，第二个参数是字符串
# "NFC"：将多个码点表示的字符替换为等效的单个码点形式
normalize_s2 = unicodedata.normalize("NFC", s2)
normalize_s3 = unicodedata.normalize("NFC", s3)
print(
    s1 == normalize_s2 == normalize_s3
)  # True

print(s2, normalize_s2)  # lové lové
print(len(s2), len(normalize_s2))  # 5 4
```

规范化方式除了 NFC 之外还有 NFD，它和 NFC 是相反的，表示让一个码点表示的字符使用多个码点表示。

```python
import unicodedata

s1 = "lové"
s2 = "lové"
s3 = "love\u0301"

print(len(s1), len(s2), len(s3))  # 4 5 5

# s1 中的 é 使用一个码点表示，这里让它变成等效的两个码点
normalize_s1 = unicodedata.normalize("NFD", s1)
print(len(normalize_s1))  # 5

print(s1 == s3)  # False
print(normalize_s1 == s3)  # True
```

因此这就是 unicode 的规范化处理，因为有的 unicode 字符可以有多种表示方式，可以是一个码点，也可以是两个码点，但它们长得都一样。NFC 是让两个码点表示的字符使用一个码点表示，NFD 是让一个码点表示的字符使用两个码点表示。

但需要注意：如果字符只有一种表示方式，那么规范化前后的结果是一样的。

```python
import unicodedata

# 这六个字符都只有一种表示方式
s = "satori"
nfc_s = unicodedata.normalize("NFC", s)
nfd_s = unicodedata.normalize("NFD", s)
print(s == nfc_s == nfd_s)  # True

# 这个 emoji 同样只有一种表示方式，并且占用两个码点
s = "😀"
nfc_s = unicodedata.normalize("NFC", s)
nfd_s = unicodedata.normalize("NFD", s)
print(s == nfc_s == nfd_s)  # True
```

所以 NFC 相当于组合，NFD 相当于分解。

然后除了 NFC 和 NFD 之外，还有 NFKC 和 NFKD，它们有什么区别呢？用大白话解释就是：

- NFC 和 NFD 标准化前后的字符，虽然占用的码点不同，但起码长得一样，两者在外观上是等价的。这种替换方式也被称为标准替换。
- 而 NFKC 和 NFKD 则是兼容替换，它们更关注文字语义的表达。

```python
import unicodedata

print(unicodedata.normalize("NFKD", "㍿"))  # 株式会社
print(unicodedata.normalize("NFKD", "㊥"))  # 中
print(
    unicodedata.normalize("NFKD", "①②③④⑤")
)  # 12345

# 上述几个字符串如果使用 NFC、NFD 标准化，那么结果还是原来的样子
# 而 '㍿' 和 '株式会社' 显然不是一个东西，它们长的都不一样
# 所以这两者不可能是同一个字符的不同表达形式
# 但从人类的思维来说，这两者就是一个东西，在语义上是等价的

# 所以 NFKD 是兼容替换，说白了就是按照语义替换
# 比如全角转半角，组合字符分解成多个独立字符
comma1 = "，"
comma2 = ","
print(
    unicodedata.normalize("NFD", comma1) == comma2
)  # False
print(
    unicodedata.normalize("NFKD", comma1) == comma2
)  # True

# comma1 是中文的逗号，comma2 是英文的逗号
# 采用 NFD 标准化的结果和之前一样，因为全角和半角压根不是一个东西
# 但对于人类而言，一眼就知道它们都是逗号
# 所以 NFKD 标准化之后，会将中文逗号转成英文逗号
```

所以这几种规范化方式区别如下：

- NFC：某些字符可以有多种表达方式，将多个码点表示的字符转成使用一个码点表示，字符在替换前后的外观是一样的；
- NFD：和 NFC 相反，将一个码点表示的字符转成使用多个码点表示，字符在替换前后的外观也是一样的；
- NFKD：按照语义对字符进行兼容分解（全角转半角，组合字符分解），前后外观会发生变化，但现实语义不变。比如 ㊥ 和 中，㊋ 和 火；
- NFKC：NFKD 是兼容分解，直接就完事了，而 NFKC 还会进行组合；

大部分情况下，我们只需要使用 NFC 规范化即可，而 NFKD 在处理带圆圈的数字的时候也会使用。

**<font color="blue">unicodedata.category</font>**

该函数可以返回一个字符的类别，而类别有以下几种：

```python
'Lu'：'大写字母（Letter, uppercase）'
'Ll'：'小写字母（Letter, lowercase）'
'Lt'：'标题大小写字母（Letter, titlecase）'
'Lm'：'修饰字母（Letter, modifier）'
'Lo'：'其他字母（Letter, other）'
'Mn'：'非间断标记（Mark, nonspacing）'
'Mc'：'间断标记（Mark, spacing combining）'
'Me'：'封闭标记（Mark, enclosing）'
'Nd'：'十进制数字（Number, decimal digit）'
'Nl'：'字母数字（Number, letter）'
'No'：'其他数字（Number, other）'
'Pc'：'连接符号（Punctuation, connector）'
'Pd'：'破折号符号（Punctuation, dash）'
'Ps'：'开放的标点符号（Punctuation, open）'
'Pe'：'关闭的标点符号（Punctuation, close）'
'Pi'：'初引号（Punctuation, initial quote）'
'Pf'：'末引号（Punctuation, final quote）'
'Po'：'其他标点符号（Punctuation, other）'
'Sm'：'数学符号（Symbol, math）'
'Sc'：'货币符号（Symbol, currency）'
'Sk'：'修饰符号（Symbol, modifier）'
'So'：'其他符号（Symbol, other）'
'Zs'：'空格符号（Separator, space）'
'Zl'：'分行符（Separator, line）'
'Zp'：'分段符（Separator, paragraph）'
'Cc'：'控制字符（Other, control）'
'Cf'：'格式字符（Other, format）'
'Cs'：'代理字符（Other, surrogate）'
'Co'：'私用字符（Other, private use）'
'Cn'：'未分配字符（Other, not assigned）'
```

举个例子：

```python
import unicodedata

print(unicodedata.category('A'))  # Lu
print(unicodedata.category('a'))  # Ll
print(unicodedata.category('1'))  # Nd
print(unicodedata.category('$'))  # Sc
print(unicodedata.category(' '))  # Zs
```

'A' 是大写字母，所以它的类别是 'Lu'。'a' 是小写字母，所以它的类别是 'Ll'。'1' 是十进制数字，所以它的类别是 'Nd'。'$' 是货币符号，所以它的类别是 'Sc'。' ' 是空格符号，所以它的类别是 'Zs'。

**<font color="blue">unicodedata.lookup</font>**

有些 unicode 字符是有名字的，可以根据它的名字查找相应的字符。

```python
import unicodedata

print(
    unicodedata.lookup("LATIN SMALL LETTER A"),
    unicodedata.lookup("COPYRIGHT SIGN"),
    unicodedata.lookup("PEACH"),
)  # a © 🍑
```

如果给定的名字不是一个有效的 Unicode 字符名，那么会抛出 KeyError。

**<font color="blue">unicodedata.name</font>**

和 lookup 功能相反，负责返回字符的名称。

```python
import unicodedata

print(unicodedata.name("z"))  # LATIN SMALL LETTER Z
print(unicodedata.name("@"))  # COMMERCIAL AT
print(unicodedata.name("🍑"))  # PEACH
```

比较简单，如果字符没有名称，则抛出 ValueError，或者也可以指定一个默认值。

**<font color="blue">unicodedata.numeric</font>**

将 unicode 字符转成等效的数值，如果无法转换则返回默认值（没有则抛出 ValueError）。

```python
import unicodedata

print(unicodedata.numeric("零"))  # 0.0
print(unicodedata.numeric("〇"))  # 0.0
print(unicodedata.numeric("一"))  # 1.0
print(unicodedata.numeric("贰"))  # 2.0
print(unicodedata.numeric("叁"))  # 3.0
print(unicodedata.numeric("四"))  # 4.0
print(unicodedata.numeric("伍"))  # 5.0
print(unicodedata.numeric("⑥"))  # 6.0
print(unicodedata.numeric("漆"))  # 7.0
print(unicodedata.numeric("捌"))  # 8.0
print(unicodedata.numeric("玖"))  # 9.0
print(unicodedata.numeric("拾"))  # 10.0


text = "加 v́ 壹捌⑤壹零贰❤️捌⑥捌〇②，看 Python❤️"

def chr_to_num(char):
    try:
        return str(unicodedata.numeric(char))[0]
    except ValueError:
        return char

print(
    "".join(map(chr_to_num, text))
)  # 加 v́ 185102❤️86802，看 Python❤️
```

以上就是 unicodedata 模块的一些用法，当然还有几个函数没有说，个人觉得用不上。这里面最有用的应该就是 normalize 函数了，更多内容可以参考官网。