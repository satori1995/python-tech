Object.assign(window.search, {"doc_urls":["如何优雅地遍历可迭代对象？/doc.html"],"index":{"documentStore":{"docInfo":{"0":{"body":606,"breadcrumbs":0,"title":0}},"docs":{"0":{"body":"本篇文章来介绍如何优雅地遍历可迭代对象，举个例子： data = [\"古明地觉\", \"芙兰朵露\", \"雾雨魔理沙\"] for item in data: print(item)\n\"\"\"\n古明地觉\n芙兰朵露\n雾雨魔理沙\n\"\"\" 遍历一个可迭代对象，可以使用 for 循环，每次会从可迭代对象中迭代出一个元素。当迭代完毕时，抛出 StopIteration，然后 for 循环捕获，终止循环。 当然，可迭代对象对内部的元素没有要求，可以指向任意的对象。 data = [(\"古明地觉\", \"女\", \"地灵殿\"), (\"琪露诺\", \"女\", \"雾之湖\"), (\"芙兰朵露\", \"女\", \"红魔馆\")] for item in data: print(item)\n\"\"\"\n('古明地觉', '女', '地灵殿')\n('琪露诺', '女', '雾之湖')\n('芙兰朵露', '女', '红魔馆')\n\"\"\" 此时迭代出来的元素就是一个个的元组，如果想获取元组里面的元素，那么可以通过索引的方式获取，比如 item[0]。但是基于索引的话，代码可读性不高，于是你可能会这么做。 data = [(\"古明地觉\", \"女\", \"地灵殿\"), (\"琪露诺\", \"女\", \"雾之湖\"), (\"芙兰朵露\", \"女\", \"红魔馆\")] for item in data: name, gender, address = item print(name, gender, address)\n\"\"\"\n古明地觉 女 地灵殿\n琪露诺 女 雾之湖\n芙兰朵露 女 红魔馆\n\"\"\" 通过这种方式，代码的可读性变得更高了一些。但实际上，这段代码有点冗余，我们可以简化一下： data = [(\"古明地觉\", \"女\", \"地灵殿\"), (\"琪露诺\", \"女\", \"雾之湖\"), (\"芙兰朵露\", \"女\", \"红魔馆\")] # name, gender, address 周围的小括号可以省略\nfor (name, gender, address) in data: print(name, gender, address)\n\"\"\"\n古明地觉 女 地灵殿\n琪露诺 女 雾之湖\n芙兰朵露 女 红魔馆\n\"\"\" for 后面可以跟一个循环变量，也可以跟多个循环变量组成的元组。如果 for 后面跟的是一个普通的变量，那么可迭代对象里面的元素迭代出来之后会直接赋值给该变量。 如果 for 后面跟的是多个变量组成的元组，那么可迭代对象里迭代出来的元素必须仍是一个可迭代对象，并且迭代出来的每一个可迭代对象里面的元素个数，都必须和 for 后面的元组里的变量个数相同。最后进行解包，按照顺序将值分别赋给 for 后面的变量，这里就是 name, gender, address。 那么问题来了，这两种迭代方式有什么不同呢？ # 第一种迭代方式\nfor item in data: name, gender, address = item print(name, gender, address) # 第二种迭代方式\nfor name, gender, address in data: print(name, gender, address) 我们看一下字节码就清楚了，字节码面前没有秘密： # 第一种迭代方式对应的字节码 # 加载变量 data 0 LOAD_NAME 0 (data) # 获取可迭代对象对应的迭代器 2 GET_ITER # 将元素迭代出来 4 FOR_ITER 13 (to 32) # 赋值给变量 item 6 STORE_NAME 1 (item) # 加载变量 item，item 一定也指向一个可迭代对象 8 LOAD_NAME 1 (item) # 解包\n10 UNPACK_SEQUENCE 3 # 按照顺序将里面的值赋给变量 name, gender, address\n12 STORE_NAME 2 (name)\n14 STORE_NAME 3 (gender)\n16 STORE_NAME 4 (address) # 第二种迭代方式对应的字节码 0 LOAD_NAME 0 (data) 2 GET_ITER 4 FOR_ITER 11 (to 28) 6 UNPACK_SEQUENCE 3 # 前面三条字节码没有区别 # 但是这里将元素迭代出来之后，直接就解包了 8 STORE_NAME 1 (name)\n10 STORE_NAME 2 (gender)\n12 STORE_NAME 3 (address) 所以这两种方式没有本质上的区别，只是第一种方式在将元素迭代出来之后需要单独用一个变量保存，然后加载变量，最后进行解包；而第二种方式在将元素迭代出来之后，直接就解包了。因此虽然效果是一样的，但是第二种方式要稍微快一点点，因为它少执行了两条指令。 另外，还有一种特殊情况： data = [[1], [2], [3], [4]]\n# for 后面是一个变量\nfor item in data: print(item)\n\"\"\"\n[1]\n[2]\n[3]\n[4]\n\"\"\" # for 后面是包含一个变量的元组\nfor item, in data: print(item)\n\"\"\"\n1\n2\n3\n4\n\"\"\" 由于 data 里面的元素也是列表，所以 for 后面仍然可以跟一个元组，迭代的时候会自动解包。只是当元组里面只有一个元素的时候，需要在第一个元素的后面加上一个逗号，什么意思呢？举个例子： data = [[1], [2], [3], [4]]\n# 这里虽然给 item 加上了括号，但它仍然不是一个元组\nfor (item) in data: print(item)\n\"\"\"\n[1]\n[2]\n[3]\n[4]\n\"\"\" # 如果元组里面只有一个元素\n# 那么第一个元素后面必须要有一个逗号\n# 否则解释器会认为这个括号只是起到一个限定优先级的作用\nfor (item,) in data: print(item)\n\"\"\"\n1\n2\n3\n4\n\"\"\" # 再举个栗子\na, b, c = 3, 2, 4\n# 此时 a + b 周围的括号只是起到了一个限定作用\n# 用于提高 a + b 的优先级\nprint((a + b) * c) # 20 # 但如果是这样的话，就不同了\n# 此时和 c 相乘的不再是整数，而是一个元组\nprint((a + b,) * c) # (5, 5, 5, 5) 当然啦，变量赋值也是同样的道理，因为每一次 for 循环本质上也是一次变量赋值。 numbers = (99, 96, 100) a, b, c = numbers\nprint(a, b, c) # 99 96 100 # 也可以显式地使用括号括起来\n(a, b, c) = (99, 96, 100)\nprint(a, b, c) # 99 96 100 # 如果变量名字比较长，那么还可以换行写\n( a, b, c\n) = numbers\nprint(a, b, c) # 99 96 100 # 当可迭代对象只包含一个元素时，也是同理\nnumbers = (88,)\n(a,) = numbers\nprint(a) # 88\n# 赋值的时候，元组周围的小括号可以不要 a, = numbers\nprint(a) # 88 最后还有一个神奇的地方，在赋值的时候，多个变量不仅可以组成一个元组，还可以组成一个列表，举个例子： numbers = (99, 96, 100) [a, b, c] = numbers\nprint(a, b, c) # 99 96 100 # 如果是列表的话，当只有一个元素的时候，就不需要逗号了\nnumbers = [88]\n[a] = numbers\nprint(a) # 88 # for 循环的时候也是同理\ndata = [(\"古明地觉\", \"女\", \"地灵殿\"), (\"琪露诺\", \"女\", \"雾之湖\"), (\"芙兰朵露\", \"女\", \"红魔馆\")]\nfor [name, gender, place] in data: print(name, gender, place)\n\"\"\"\n古明地觉 女 地灵殿\n琪露诺 女 雾之湖\n芙兰朵露 女 红魔馆\n\"\"\" 当然啦，无论多个变量组成的是元组还是列表，字节码都没有区别。只是我们更习惯写成元组，并且将元组周围的小括号省略掉。 另外可迭代对象也是可以嵌套的，举个例子： data = [(\"古明地觉\", (\"女\", \"地灵殿\")), (\"琪露诺\", (\"女\", \"雾之湖\")), (\"芙兰朵露\", (\"女\", \"红魔馆\"))] # 每个可迭代对象内部只有两个元素，所以在迭代的时候\n# for 后面的元组或列表里面也只能有两个变量\nfor name, gender_address in data: print(name, gender_address)\n\"\"\"\n古明地觉 ('女', '地灵殿')\n琪露诺 ('女', '雾之湖')\n芙兰朵露 ('女', '红魔馆')\n\"\"\" # 于是聪明的你可能想到了\nfor name, (gender, address) in data: print(name, gender, address)\n\"\"\"\n古明地觉 女 地灵殿\n琪露诺 女 雾之湖\n芙兰朵露 女 红魔馆\n\"\"\" # 使用列表也是可以的\nfor [name, (gender, address)] in data: print(name, gender, address)\n\"\"\"\n古明地觉 女 地灵殿\n琪露诺 女 雾之湖\n芙兰朵露 女 红魔馆\n\"\"\" # 以下几种方式也是可以的\n\"\"\"\nfor [name, [gender, address]] in data: print(name, gender, address) for (name, [gender, address]) in data: print(name, gender, address) for (name, (gender, address)) in data: print(name, gender, address)\n\"\"\" 并且嵌套的可迭代对象的数量也是任意的，举个例子： data = [(\"古明地觉\", (\"女\",), (\"地灵殿\",)), (\"琪露诺\", (\"女\",), (\"雾之湖\",)), (\"芙兰朵露\", (\"女\",), (\"红魔馆\",))] for name, gender, address in data: print(name, gender, address)\n\"\"\"\n古明地觉 ('女',) ('地灵殿',)\n琪露诺 ('女',) ('雾之湖',)\n芙兰朵露 ('女',) ('红魔馆',)\n\"\"\" for name, [gender], [address] in data: print(name, gender, address)\n\"\"\"\n古明地觉 女 地灵殿\n琪露诺 女 雾之湖\n芙兰朵露 女 红魔馆\n\"\"\" for name, (gender,), (address,) in data: print(name, gender, address)\n\"\"\"\n古明地觉 女 地灵殿\n琪露诺 女 雾之湖\n芙兰朵露 女 红魔馆\n\"\"\" # 变量赋值也是同理\nnumbers = [[[3]]]\na = numbers\nprint(a) # [[[3]]] a, = numbers\nprint(a) # [[3]] ((a,),) = numbers\nprint(a) # [3] (((a,),),) = numbers\nprint(a) # 3\n[[[a]]] = numbers\nprint(a) # 3 # 再来一个恶心人的，当然啦，这个做法没啥意义\n# 只是想表明可迭代对象之间的嵌套是非常自由的\nnumbers = [[[3], [[[[4]], 5], 6]], 7]\n(((a,), ((((b,),), c), d)), e) = numbers\nprint(a, b, c, d, e) # 3 4 5 6 7 最后再来介绍一个高级特性，不过介绍之前先来看看上面的迭代方式有什么缺陷： data = [ (1, 2, 3, 4), (5, 6), (7, 8, 9)\n] 如果是这种情况的话，那么 for 循环在遍历的时候，要使用几个变量去遍历呢？两个、三个、还是四个呢？我们先用三个变量看看： data = [ (1, 2, 3, 4), (5, 6), (7, 8, 9)\n]\nfor a, b, c in data: print(a, b, c)\n\"\"\"\nTraceback (most recent call last): File \"...\", line 6, in <module> for a, b, c in data:\nValueError: too many values to unpack (expected 3)\n\"\"\" 很明显它报错了，所以这种方式有一个缺陷，就是它除了要求可迭代对象里面的元素也是可迭代对象之外，还要满足它们内部的值的个数都相等，并且个数已知。 但是问题来了，如果我在遍历的时候，只想拿到里面的第一个值和最后一个值，该怎么办呢？ data = [ (1, 2, 3, 4), (5, 6), (7, 8, 9)\n]\nfor item in data: print(item[0], item[-1])\n\"\"\"\n1 4\n5 6\n7 9\n\"\"\" 首先上面这种方式肯定是可以的，但还有没有另外的方式呢？显然是有的。 data = [ (1, 2, 3, 4), (5, 6), (7, 8, 9)\n]\nfor first, *middle, last in data: print(first, middle, last)\n\"\"\"\n1 [2, 3] 4\n5 [] 6\n7 [8] 9\n\"\"\" 在迭代的时候，第一个值会赋给 first，这没有问题。然后是 middle，它的前面加上了一个 *，那么 middle 就会变成一个列表，这个类似正则的贪婪匹配，会不断地匹配值。而 *middle 后面还有一个 last，因此 *middle 就会匹配到倒数第二个值为止，最后一个值留给 last。 我们再举几个例子： data = [ (1, 2, 3, 4, 5), (6, 7, 8, 9, 10), (11, 12, 13, 14, 15)\n] # 第 1 个值给 a、剩余的 4 个值给 b\nfor a, *b in data: print(a, b)\n\"\"\"\n1 [2, 3, 4, 5]\n6 [7, 8, 9, 10]\n11 [12, 13, 14, 15]\n\"\"\" # 第 1 个值给 a、第 2 个值给 b，剩余的 3 个值给 c\nfor a, b, *c in data: print(a, b, c)\n\"\"\"\n1 2 [3, 4, 5]\n6 7 [8, 9, 10]\n11 12 [13, 14, 15]\n\"\"\" # 第 1 个值给 a、第 2 个值给 b\n# 倒数第 1 个值给 d，剩余的值给 c\nfor a, b, *c, d in data: print(a, b, c, d)\n\"\"\"\n1 2 [3, 4] 5\n6 7 [8, 9] 10\n11 12 [13, 14] 15\n\"\"\" # 倒数第 1 个值给 b，前面的值给 a\nfor *a, b in data: print(a, b)\n\"\"\"\n[1, 2, 3, 4] 5\n[6, 7, 8, 9] 10\n[11, 12, 13, 14] 15\n\"\"\" # 每次迭代的元素内部只有 5 个值，所以 b 是一个空列表\nfor a, *b, c, d, e, f in data: print(a, b, c, d, e, f)\n\"\"\"\n1 [] 2 3 4 5\n6 [] 7 8 9 10\n11 [] 12 13 14 15\n\"\"\" # 所有的值都给 a，但是需要注意：\n# 如果出现了 *，那么 for 后面的变量必须组成一个元组或列表\n# 所以如果是 for *a in data: 会报出语法错误\n# 必须是 for *a, in data: 或者 for [*a] in data:\nfor *a, in data: print(a)\n\"\"\"\n[1, 2, 3, 4, 5]\n[6, 7, 8, 9, 10]\n[11, 12, 13, 14, 15]\n\"\"\" 另外还有一个约定或者说规范，如果在遍历的时候，有一部分的值我们不需要，那么可以使用下划线代替。比如我们只需要第一个值和倒数第二个值，那么遍历的时候就可以像下面这么做： for a, *_, b, _ in data: pass 当然啦，* 不仅可以在 for 循环的时候用，普通的变量赋值也是可以使用的，一样的道理。 在赋值的时候， * 最多只能出现一次，否则会报出语法错误。 以上就是可迭代对象的遍历，是不是很有趣呢？","breadcrumbs":"如何优雅地遍历可迭代对象？","id":"0","title":"如何优雅地遍历可迭代对象？"}},"length":1,"save":true},"fields":["title","body","breadcrumbs"],"index":{"body":{"root":{"0":{"df":1,"docs":{"0":{"tf":2.0}}},"1":{"0":{"0":{"df":1,"docs":{"0":{"tf":2.6457513110645907}}},"df":1,"docs":{"0":{"tf":3.0}}},"1":{"df":1,"docs":{"0":{"tf":2.8284271247461903}}},"2":{"df":1,"docs":{"0":{"tf":3.0}}},"3":{"df":1,"docs":{"0":{"tf":2.8284271247461903}}},"4":{"df":1,"docs":{"0":{"tf":2.8284271247461903}}},"5":{"df":1,"docs":{"0":{"tf":2.6457513110645907}}},"6":{"df":1,"docs":{"0":{"tf":1.0}}},"df":1,"docs":{"0":{"tf":5.291502622129181}}},"2":{"0":{"df":1,"docs":{"0":{"tf":1.0}}},"8":{"df":1,"docs":{"0":{"tf":1.0}}},"df":1,"docs":{"0":{"tf":5.0}}},"3":{"2":{"df":1,"docs":{"0":{"tf":1.0}}},"df":1,"docs":{"0":{"tf":5.744562646538029}}},"4":{"df":1,"docs":{"0":{"tf":5.0990195135927845}}},"5":{"df":1,"docs":{"0":{"tf":4.47213595499958}}},"6":{"df":1,"docs":{"0":{"tf":4.242640687119285}}},"7":{"df":1,"docs":{"0":{"tf":3.872983346207417}}},"8":{"8":{"df":1,"docs":{"0":{"tf":2.23606797749979}}},"df":1,"docs":{"0":{"tf":3.7416573867739413}}},"9":{"6":{"df":1,"docs":{"0":{"tf":2.6457513110645907}}},"9":{"df":1,"docs":{"0":{"tf":2.6457513110645907}}},"df":1,"docs":{"0":{"tf":3.605551275463989}}},"_":{"df":1,"docs":{"0":{"tf":1.4142135623730951}}},"a":{"d":{"d":{"df":0,"docs":{},"r":{"df":0,"docs":{},"e":{"df":0,"docs":{},"s":{"df":0,"docs":{},"s":{"df":1,"docs":{"0":{"tf":5.385164807134504}}}}}}},"df":0,"docs":{}},"df":0,"docs":{}},"b":{"df":1,"docs":{"0":{"tf":5.830951894845301}}},"c":{"a":{"df":0,"docs":{},"l":{"df":0,"docs":{},"l":{"df":1,"docs":{"0":{"tf":1.0}}}}},"df":1,"docs":{"0":{"tf":5.0}}},"d":{"a":{"df":0,"docs":{},"t":{"a":{"df":1,"docs":{"0":{"tf":7.211102550927978}}},"df":0,"docs":{}}},"df":1,"docs":{"0":{"tf":2.6457513110645907}}},"df":0,"docs":{},"e":{"df":1,"docs":{"0":{"tf":2.0}},"x":{"df":0,"docs":{},"p":{"df":0,"docs":{},"e":{"c":{"df":0,"docs":{},"t":{"df":1,"docs":{"0":{"tf":1.0}}}},"df":0,"docs":{}}}}},"f":{"df":1,"docs":{"0":{"tf":1.4142135623730951}},"i":{"df":0,"docs":{},"l":{"df":0,"docs":{},"e":{"df":1,"docs":{"0":{"tf":1.0}}}},"r":{"df":0,"docs":{},"s":{"df":0,"docs":{},"t":{"df":1,"docs":{"0":{"tf":1.4142135623730951}}}}}},"o":{"df":0,"docs":{},"r":{"_":{"df":0,"docs":{},"i":{"df":0,"docs":{},"t":{"df":1,"docs":{"0":{"tf":1.4142135623730951}}}}},"df":0,"docs":{}}}},"g":{"df":0,"docs":{},"e":{"df":0,"docs":{},"n":{"d":{"df":0,"docs":{},"e":{"df":0,"docs":{},"r":{"_":{"a":{"d":{"d":{"df":0,"docs":{},"r":{"df":0,"docs":{},"e":{"df":0,"docs":{},"s":{"df":0,"docs":{},"s":{"df":1,"docs":{"0":{"tf":1.4142135623730951}}}}}}},"df":0,"docs":{}},"df":0,"docs":{}},"df":0,"docs":{}},"df":1,"docs":{"0":{"tf":5.5677643628300215}}}}},"df":0,"docs":{}},"t":{"_":{"df":0,"docs":{},"i":{"df":0,"docs":{},"t":{"df":1,"docs":{"0":{"tf":1.4142135623730951}}}}},"df":0,"docs":{}}}},"i":{"df":0,"docs":{},"t":{"df":0,"docs":{},"e":{"df":0,"docs":{},"m":{"[":{"0":{"df":1,"docs":{"0":{"tf":1.0}}},"df":0,"docs":{}},"df":1,"docs":{"0":{"tf":4.0}},"，":{"df":0,"docs":{},"i":{"df":0,"docs":{},"t":{"df":0,"docs":{},"e":{"df":0,"docs":{},"m":{"df":1,"docs":{"0":{"tf":1.0}}}}}}}}}}},"l":{"a":{"df":0,"docs":{},"s":{"df":0,"docs":{},"t":{"df":1,"docs":{"0":{"tf":2.23606797749979}}}}},"df":0,"docs":{},"i":{"df":0,"docs":{},"n":{"df":0,"docs":{},"e":{"df":1,"docs":{"0":{"tf":1.0}}}}},"o":{"a":{"d":{"_":{"df":0,"docs":{},"n":{"a":{"df":0,"docs":{},"m":{"df":1,"docs":{"0":{"tf":1.7320508075688772}}}},"df":0,"docs":{}}},"df":0,"docs":{}},"df":0,"docs":{}},"df":0,"docs":{}}},"m":{"a":{"df":0,"docs":{},"n":{"df":0,"docs":{},"i":{"df":1,"docs":{"0":{"tf":1.0}}}}},"df":0,"docs":{},"i":{"d":{"d":{"df":0,"docs":{},"l":{"df":1,"docs":{"0":{"tf":2.449489742783178}}}},"df":0,"docs":{}},"df":0,"docs":{}},"o":{"d":{"df":0,"docs":{},"u":{"df":0,"docs":{},"l":{"df":1,"docs":{"0":{"tf":1.0}}}}},"df":0,"docs":{}}},"n":{"a":{"df":0,"docs":{},"m":{"df":0,"docs":{},"e":{"df":1,"docs":{"0":{"tf":4.358898943540674}}}}},"df":0,"docs":{},"u":{"df":0,"docs":{},"m":{"b":{"df":0,"docs":{},"e":{"df":0,"docs":{},"r":{"df":1,"docs":{"0":{"tf":4.242640687119285}}}}},"df":0,"docs":{}}}},"p":{"a":{"df":0,"docs":{},"s":{"df":0,"docs":{},"s":{"df":1,"docs":{"0":{"tf":1.0}}}}},"df":0,"docs":{},"l":{"a":{"c":{"df":0,"docs":{},"e":{"df":1,"docs":{"0":{"tf":1.4142135623730951}}}},"df":0,"docs":{}},"df":0,"docs":{}},"r":{"df":0,"docs":{},"i":{"df":0,"docs":{},"n":{"df":0,"docs":{},"t":{"(":{"(":{"a":{"df":1,"docs":{"0":{"tf":1.4142135623730951}}},"df":0,"docs":{}},"a":{"df":1,"docs":{"0":{"tf":4.47213595499958}}},"df":0,"docs":{},"f":{"df":0,"docs":{},"i":{"df":0,"docs":{},"r":{"df":0,"docs":{},"s":{"df":0,"docs":{},"t":{"df":1,"docs":{"0":{"tf":1.0}}}}}}},"i":{"df":0,"docs":{},"t":{"df":0,"docs":{},"e":{"df":0,"docs":{},"m":{"[":{"0":{"df":1,"docs":{"0":{"tf":1.0}}},"df":0,"docs":{}},"df":1,"docs":{"0":{"tf":2.449489742783178}}}}}},"n":{"a":{"df":0,"docs":{},"m":{"df":1,"docs":{"0":{"tf":3.7416573867739413}}}},"df":0,"docs":{}}},"df":0,"docs":{}}}}}},"r":{"df":0,"docs":{},"e":{"c":{"df":0,"docs":{},"e":{"df":0,"docs":{},"n":{"df":0,"docs":{},"t":{"df":1,"docs":{"0":{"tf":1.0}}}}}},"df":0,"docs":{}}},"s":{"df":0,"docs":{},"t":{"df":0,"docs":{},"o":{"df":0,"docs":{},"p":{"df":0,"docs":{},"i":{"df":0,"docs":{},"t":{"df":0,"docs":{},"e":{"df":0,"docs":{},"r":{"df":1,"docs":{"0":{"tf":1.0}}}}}}},"r":{"df":0,"docs":{},"e":{"_":{"df":0,"docs":{},"n":{"a":{"df":0,"docs":{},"m":{"df":1,"docs":{"0":{"tf":2.6457513110645907}}}},"df":0,"docs":{}}},"df":0,"docs":{}}}}}},"t":{"df":0,"docs":{},"r":{"a":{"c":{"df":0,"docs":{},"e":{"b":{"a":{"c":{"df":0,"docs":{},"k":{"df":1,"docs":{"0":{"tf":1.0}}}},"df":0,"docs":{}},"df":0,"docs":{}},"df":0,"docs":{}}},"df":0,"docs":{}},"df":0,"docs":{}}},"u":{"df":0,"docs":{},"n":{"df":0,"docs":{},"p":{"a":{"c":{"df":0,"docs":{},"k":{"_":{"df":0,"docs":{},"s":{"df":0,"docs":{},"e":{"df":0,"docs":{},"q":{"df":0,"docs":{},"u":{"df":1,"docs":{"0":{"tf":1.4142135623730951}}}}}}},"df":1,"docs":{"0":{"tf":1.0}}}},"df":0,"docs":{}},"df":0,"docs":{}}}},"v":{"a":{"df":0,"docs":{},"l":{"df":0,"docs":{},"u":{"df":1,"docs":{"0":{"tf":1.0}},"e":{"df":0,"docs":{},"e":{"df":0,"docs":{},"r":{"df":0,"docs":{},"r":{"df":0,"docs":{},"o":{"df":0,"docs":{},"r":{"df":1,"docs":{"0":{"tf":1.0}}}}}}}}}}},"df":0,"docs":{}}}},"breadcrumbs":{"root":{"0":{"df":1,"docs":{"0":{"tf":2.0}}},"1":{"0":{"0":{"df":1,"docs":{"0":{"tf":2.6457513110645907}}},"df":1,"docs":{"0":{"tf":3.0}}},"1":{"df":1,"docs":{"0":{"tf":2.8284271247461903}}},"2":{"df":1,"docs":{"0":{"tf":3.0}}},"3":{"df":1,"docs":{"0":{"tf":2.8284271247461903}}},"4":{"df":1,"docs":{"0":{"tf":2.8284271247461903}}},"5":{"df":1,"docs":{"0":{"tf":2.6457513110645907}}},"6":{"df":1,"docs":{"0":{"tf":1.0}}},"df":1,"docs":{"0":{"tf":5.291502622129181}}},"2":{"0":{"df":1,"docs":{"0":{"tf":1.0}}},"8":{"df":1,"docs":{"0":{"tf":1.0}}},"df":1,"docs":{"0":{"tf":5.0}}},"3":{"2":{"df":1,"docs":{"0":{"tf":1.0}}},"df":1,"docs":{"0":{"tf":5.744562646538029}}},"4":{"df":1,"docs":{"0":{"tf":5.0990195135927845}}},"5":{"df":1,"docs":{"0":{"tf":4.47213595499958}}},"6":{"df":1,"docs":{"0":{"tf":4.242640687119285}}},"7":{"df":1,"docs":{"0":{"tf":3.872983346207417}}},"8":{"8":{"df":1,"docs":{"0":{"tf":2.23606797749979}}},"df":1,"docs":{"0":{"tf":3.7416573867739413}}},"9":{"6":{"df":1,"docs":{"0":{"tf":2.6457513110645907}}},"9":{"df":1,"docs":{"0":{"tf":2.6457513110645907}}},"df":1,"docs":{"0":{"tf":3.605551275463989}}},"_":{"df":1,"docs":{"0":{"tf":1.4142135623730951}}},"a":{"d":{"d":{"df":0,"docs":{},"r":{"df":0,"docs":{},"e":{"df":0,"docs":{},"s":{"df":0,"docs":{},"s":{"df":1,"docs":{"0":{"tf":5.385164807134504}}}}}}},"df":0,"docs":{}},"df":0,"docs":{}},"b":{"df":1,"docs":{"0":{"tf":5.830951894845301}}},"c":{"a":{"df":0,"docs":{},"l":{"df":0,"docs":{},"l":{"df":1,"docs":{"0":{"tf":1.0}}}}},"df":1,"docs":{"0":{"tf":5.0}}},"d":{"a":{"df":0,"docs":{},"t":{"a":{"df":1,"docs":{"0":{"tf":7.211102550927978}}},"df":0,"docs":{}}},"df":1,"docs":{"0":{"tf":2.6457513110645907}}},"df":0,"docs":{},"e":{"df":1,"docs":{"0":{"tf":2.0}},"x":{"df":0,"docs":{},"p":{"df":0,"docs":{},"e":{"c":{"df":0,"docs":{},"t":{"df":1,"docs":{"0":{"tf":1.0}}}},"df":0,"docs":{}}}}},"f":{"df":1,"docs":{"0":{"tf":1.4142135623730951}},"i":{"df":0,"docs":{},"l":{"df":0,"docs":{},"e":{"df":1,"docs":{"0":{"tf":1.0}}}},"r":{"df":0,"docs":{},"s":{"df":0,"docs":{},"t":{"df":1,"docs":{"0":{"tf":1.4142135623730951}}}}}},"o":{"df":0,"docs":{},"r":{"_":{"df":0,"docs":{},"i":{"df":0,"docs":{},"t":{"df":1,"docs":{"0":{"tf":1.4142135623730951}}}}},"df":0,"docs":{}}}},"g":{"df":0,"docs":{},"e":{"df":0,"docs":{},"n":{"d":{"df":0,"docs":{},"e":{"df":0,"docs":{},"r":{"_":{"a":{"d":{"d":{"df":0,"docs":{},"r":{"df":0,"docs":{},"e":{"df":0,"docs":{},"s":{"df":0,"docs":{},"s":{"df":1,"docs":{"0":{"tf":1.4142135623730951}}}}}}},"df":0,"docs":{}},"df":0,"docs":{}},"df":0,"docs":{}},"df":1,"docs":{"0":{"tf":5.5677643628300215}}}}},"df":0,"docs":{}},"t":{"_":{"df":0,"docs":{},"i":{"df":0,"docs":{},"t":{"df":1,"docs":{"0":{"tf":1.4142135623730951}}}}},"df":0,"docs":{}}}},"i":{"df":0,"docs":{},"t":{"df":0,"docs":{},"e":{"df":0,"docs":{},"m":{"[":{"0":{"df":1,"docs":{"0":{"tf":1.0}}},"df":0,"docs":{}},"df":1,"docs":{"0":{"tf":4.0}},"，":{"df":0,"docs":{},"i":{"df":0,"docs":{},"t":{"df":0,"docs":{},"e":{"df":0,"docs":{},"m":{"df":1,"docs":{"0":{"tf":1.0}}}}}}}}}}},"l":{"a":{"df":0,"docs":{},"s":{"df":0,"docs":{},"t":{"df":1,"docs":{"0":{"tf":2.23606797749979}}}}},"df":0,"docs":{},"i":{"df":0,"docs":{},"n":{"df":0,"docs":{},"e":{"df":1,"docs":{"0":{"tf":1.0}}}}},"o":{"a":{"d":{"_":{"df":0,"docs":{},"n":{"a":{"df":0,"docs":{},"m":{"df":1,"docs":{"0":{"tf":1.7320508075688772}}}},"df":0,"docs":{}}},"df":0,"docs":{}},"df":0,"docs":{}},"df":0,"docs":{}}},"m":{"a":{"df":0,"docs":{},"n":{"df":0,"docs":{},"i":{"df":1,"docs":{"0":{"tf":1.0}}}}},"df":0,"docs":{},"i":{"d":{"d":{"df":0,"docs":{},"l":{"df":1,"docs":{"0":{"tf":2.449489742783178}}}},"df":0,"docs":{}},"df":0,"docs":{}},"o":{"d":{"df":0,"docs":{},"u":{"df":0,"docs":{},"l":{"df":1,"docs":{"0":{"tf":1.0}}}}},"df":0,"docs":{}}},"n":{"a":{"df":0,"docs":{},"m":{"df":0,"docs":{},"e":{"df":1,"docs":{"0":{"tf":4.358898943540674}}}}},"df":0,"docs":{},"u":{"df":0,"docs":{},"m":{"b":{"df":0,"docs":{},"e":{"df":0,"docs":{},"r":{"df":1,"docs":{"0":{"tf":4.242640687119285}}}}},"df":0,"docs":{}}}},"p":{"a":{"df":0,"docs":{},"s":{"df":0,"docs":{},"s":{"df":1,"docs":{"0":{"tf":1.0}}}}},"df":0,"docs":{},"l":{"a":{"c":{"df":0,"docs":{},"e":{"df":1,"docs":{"0":{"tf":1.4142135623730951}}}},"df":0,"docs":{}},"df":0,"docs":{}},"r":{"df":0,"docs":{},"i":{"df":0,"docs":{},"n":{"df":0,"docs":{},"t":{"(":{"(":{"a":{"df":1,"docs":{"0":{"tf":1.4142135623730951}}},"df":0,"docs":{}},"a":{"df":1,"docs":{"0":{"tf":4.47213595499958}}},"df":0,"docs":{},"f":{"df":0,"docs":{},"i":{"df":0,"docs":{},"r":{"df":0,"docs":{},"s":{"df":0,"docs":{},"t":{"df":1,"docs":{"0":{"tf":1.0}}}}}}},"i":{"df":0,"docs":{},"t":{"df":0,"docs":{},"e":{"df":0,"docs":{},"m":{"[":{"0":{"df":1,"docs":{"0":{"tf":1.0}}},"df":0,"docs":{}},"df":1,"docs":{"0":{"tf":2.449489742783178}}}}}},"n":{"a":{"df":0,"docs":{},"m":{"df":1,"docs":{"0":{"tf":3.7416573867739413}}}},"df":0,"docs":{}}},"df":0,"docs":{}}}}}},"r":{"df":0,"docs":{},"e":{"c":{"df":0,"docs":{},"e":{"df":0,"docs":{},"n":{"df":0,"docs":{},"t":{"df":1,"docs":{"0":{"tf":1.0}}}}}},"df":0,"docs":{}}},"s":{"df":0,"docs":{},"t":{"df":0,"docs":{},"o":{"df":0,"docs":{},"p":{"df":0,"docs":{},"i":{"df":0,"docs":{},"t":{"df":0,"docs":{},"e":{"df":0,"docs":{},"r":{"df":1,"docs":{"0":{"tf":1.0}}}}}}},"r":{"df":0,"docs":{},"e":{"_":{"df":0,"docs":{},"n":{"a":{"df":0,"docs":{},"m":{"df":1,"docs":{"0":{"tf":2.6457513110645907}}}},"df":0,"docs":{}}},"df":0,"docs":{}}}}}},"t":{"df":0,"docs":{},"r":{"a":{"c":{"df":0,"docs":{},"e":{"b":{"a":{"c":{"df":0,"docs":{},"k":{"df":1,"docs":{"0":{"tf":1.0}}}},"df":0,"docs":{}},"df":0,"docs":{}},"df":0,"docs":{}}},"df":0,"docs":{}},"df":0,"docs":{}}},"u":{"df":0,"docs":{},"n":{"df":0,"docs":{},"p":{"a":{"c":{"df":0,"docs":{},"k":{"_":{"df":0,"docs":{},"s":{"df":0,"docs":{},"e":{"df":0,"docs":{},"q":{"df":0,"docs":{},"u":{"df":1,"docs":{"0":{"tf":1.4142135623730951}}}}}}},"df":1,"docs":{"0":{"tf":1.0}}}},"df":0,"docs":{}},"df":0,"docs":{}}}},"v":{"a":{"df":0,"docs":{},"l":{"df":0,"docs":{},"u":{"df":1,"docs":{"0":{"tf":1.0}},"e":{"df":0,"docs":{},"e":{"df":0,"docs":{},"r":{"df":0,"docs":{},"r":{"df":0,"docs":{},"o":{"df":0,"docs":{},"r":{"df":1,"docs":{"0":{"tf":1.0}}}}}}}}}}},"df":0,"docs":{}}}},"title":{"root":{"df":0,"docs":{}}}},"lang":"English","pipeline":["trimmer","stopWordFilter","stemmer"],"ref":"id","version":"0.9.5"},"results_options":{"limit_results":30,"teaser_word_count":30},"search_options":{"bool":"OR","expand":true,"fields":{"body":{"boost":1},"breadcrumbs":{"boost":1},"title":{"boost":2}}}});