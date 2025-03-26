关于日期处理，Python 提供了很多的库，比如标准库 datetime、第三方库 dateutil、arrow 等等。这里介绍一个我个人最喜欢的库 pendulum，用起来可以说非常的方便，任何对日期的操作它都能满足。

在使用之前需要先安装，直接 pip install pendulum 即可。

下面来看一下用法，首先是 datetime, date, time 的创建。

~~~python
import pendulum

dt = pendulum.datetime(
    2022, 3, 28, 20, 10, 30)
print(dt.__class__)
print(dt)
"""
<class 'pendulum.datetime.DateTime'>
2022-03-28T20:10:30+00:00
"""
# 创建的对象是 DateTime 类型，并且带有时区，默认是 UTC
# 我们可以换一个时区
dt = pendulum.datetime(2022, 3, 28, 20, 10, 30, tz="Asia/Shanghai")
print(dt)
"""
2022-03-28T20:10:30+08:00
"""

# 如果不想要时区，那么指定 tz=None
dt = pendulum.datetime(2022, 3, 28, 20, 10, 30, tz=None)
print(dt)
"""
2022-03-28T20:10:30
"""

# 然后是 date 的创建
d = pendulum.date(2022, 3, 28)
print(d.__class__)
print(d)
"""
<class 'pendulum.date.Date'>
2022-03-28
"""

# time 的创建
t = pendulum.time(20, 10, 30)
print(t.__class__)
print(t)
"""
<class 'pendulum.time.Time'>
20:10:30
"""
~~~

创建 datetime 时，时区默认是 UTC。如果不想要时区，或者希望时区是本地时区，那么 pendulum 还专门提供了两个方法。

~~~Python
import pendulum

# 创建 datetime 时设置为本地时区
# 还是调用了 pendulum.datetime 函数
# 但是 tz 被设置成了 pendulum.local_timezone()
dt = pendulum.local(2022, 3, 28, 20, 10, 30)
print(dt)
"""
2022-03-28T20:10:30+08:00
"""
print(pendulum.local_timezone())
"""
Timezone('Asia/Shanghai')
"""

# 创建 datetime 时不设置时区
# 内部也是调用了 pendulum.datetime 函数
# 但是 tz 为 None
dt = pendulum.naive(2022, 3, 28, 20, 10, 30)
print(dt)
"""
2022-03-28T20:10:30
"""
~~~

然后 pendulum 还提供了几个方法，比如创建当前的 datetime，date 等等。

~~~Python
import pendulum

# 创建当前的 datetime，默认是本地时区，但时区可以指定
dt = pendulum.now()
print(dt)
"""
2022-05-29T20:40:49.632182+08:00
"""

# 创建当前的 date，但返回的仍是 datetime
# 只不过时分秒均为 0，同样可以指定时区
dt = pendulum.today()
print(dt)
"""
2022-05-29T00:00:00+08:00
"""

# 获取明天对应的 date，返回的是 datetime，时分秒为 0
# 时区可以指定，默认是本地时区
dt = pendulum.tomorrow()
print(dt)
"""
2022-05-30T00:00:00+08:00
"""

# 获取昨天对应的 date
dt = pendulum.yesterday()
print(dt)
"""
2022-05-28T00:00:00+08:00
"""
~~~

我们还可以根据时间戳或者字符串来创建：

```Python
import pendulum

# 根据时间戳创建
dt1 = pendulum.from_timestamp(1653828466)
dt2 = pendulum.from_timestamp(1653828466, tz=pendulum.local_timezone())
print(dt1)
print(dt2)
"""
2022-05-29T12:47:46+00:00
2022-05-29T20:47:46+08:00
"""

# 根据字符串创建
dt1 = pendulum.parse("2020-05-03 12:11:33")
dt2 = pendulum.parse("2020-05-03 12:11:33", tz=pendulum.local_timezone())
print(dt1)
print(dt2)
"""
2020-05-03T12:11:33+00:00
2020-05-03T12:11:33+08:00
"""
```

datetime、date、time 的创建我们说完了，然后再来看看它们支持的操作，这也是最核心的部分。

~~~Python
import pendulum

dt = pendulum.local(2022, 3, 28, 20, 10, 30)

# 获取 date 部分和 time 部分
print(dt.date())
print(dt.time())
"""
2022-03-28
20:10:30
"""

# 替换掉 dt 的某部分，返回新的 datetime
# 年月日时分秒、以及时区都可以替换
print(dt.replace(year=9999))
"""
9999-03-28T20:10:30+08:00
"""

# 转成时间戳
print(dt.timestamp())
"""
1648469430.0
"""

# 返回年、月、日、时、分、秒、时区
print(dt.year, dt.month, dt.day)
print(dt.hour, dt.minute, dt.second)
print(dt.tz)
"""
2022 3 28
20 10 30
Timezone('Asia/Shanghai')
"""
~~~

然后是生成字符串，pendulum.DateTime 对象可以转成各种格式的日期字符串。

~~~Python
import pendulum

dt = pendulum.local(2022, 3, 28, 20, 10, 30)

# 下面四个最为常用
print("datetime:", dt.to_datetime_string())
print("date:", dt.to_date_string())
print("time:", dt.to_time_string())
print("iso8601:", dt.to_iso8601_string())
"""
datetime: 2022-03-28 20:10:30
date: 2022-03-28
time: 20:10:30
iso8601: 2022-03-28T20:10:30+08:00
"""
# 当然还支持很多其它格式，不过用的不多，随便挑几个吧
print("atom:", dt.to_atom_string())
print("rss:", dt.to_rss_string())
print("w3c:", dt.to_w3c_string())
print("cookie:", dt.to_cookie_string())
print("rfc822:", dt.to_rfc822_string())
"""
atom: 2022-03-28T20:10:30+08:00
rss: Mon, 28 Mar 2022 20:10:30 +0800
w3c: 2022-03-28T20:10:30+08:00
rfc822: Mon, 28 Mar 22 20:10:30 +0800
"""
~~~

我们有时也需要判断当前日期是星期几、在当前这一年是第几天等等，pendulum 也已经帮我们封装好了。

~~~Python
import pendulum

dt = pendulum.local(2022, 3, 28, 20, 10, 30)

# 返回星期几
# 注意：星期一到星期天分别对应 1 到 7
print(dt.isoweekday())  # 1

# 返回一年当中的第几天
# 范围是 1 到 366
print(dt.day_of_year)  # 87

# 返回一个月当中的第几天
print(dt.days_in_month)  # 31

# 返回一个月当中的第几周
print(dt.week_of_month)  # 5

# 返回一年当中的第几周
print(dt.week_of_year)  # 13

# 是否是闰年
print(dt.is_leap_year())  # False
~~~

最后就是日期的运算，这是 pendulum 最为强大的地方，至于为什么强大，我们演示一下就知道了。

~~~Python
import pendulum

dt = pendulum.local(2022, 3, 30, 20, 10, 30)

# 返回下一个月的今天
print(dt.add(months=1))
"""
2022-04-30T20:10:30+08:00
"""

# 返回上一个月的今天
# 但是上一个月是 2 月，并且是平年，所以最多 28 天
print(dt.add(months=-1))
"""
2022-02-28T20:10:30+08:00
"""
# 我们看到处理的非常完美
# 该方法的原型如下，年月日时分秒都是支持的，当然还有星期也支持
"""
def add(
    self,
    years=0,
    months=0,
    weeks=0,
    days=0,
    hours=0,
    minutes=0,
    seconds=0,
    microseconds=0,
):
"""
~~~

像 Python 的内置模块 datetime 在将日期相加的时候，最多支持到天，我们无法计算下一周、下一个月、下一年的日期。而 pendulum 则可以很方便地处理，这也是我最喜欢的一点。当然啦，add 里面的值为正，相当于日期往后退；值为负，相当于日期往前推。

然后是两个日期还可以做减法：

```Python
import pendulum

dt1 = pendulum.local(2021, 1, 20, 11, 22, 33)

dt2 = pendulum.local(2022, 3, 30, 20, 10, 30)

period = dt2 - dt1
# 返回的是 Period 对象，相当于 datetime 模块里面的 timedelta
print(period.__class__)
"""
<class 'pendulum.period.Period'>
"""

# 但是功能方面，Period 要强大很多
# 两者差了多少年
print(period.in_years())  # 1
# 两者差了多少个月
print(period.in_months())  # 14
# 两者差了多少个星期
print(period.in_weeks())  # 62
# 两者差了多少天
print(period.in_days())  # 434
# 两者差了多少个小时
print(period.in_hours())  # 10424
# 两者差了多少分钟
print(period.in_minutes())  # 625487
# 两者差了多少秒
print(period.in_seconds())  # 37529277
```

功能非常强大，Python 的 datetime 模块里面的 timedelta 最多只能计算两个日期差了多少天，而这里年月日时分秒均可。

以上就是本文的内容，当然 pendulum 的功能其实不止我们上面说的那些，有兴趣的话可以参考官网，但常用的差不多就这些东西。