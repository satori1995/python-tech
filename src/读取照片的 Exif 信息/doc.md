现如今的智能手机在拍摄照片时，都含有 Exif（可交换图像文件格式，Exchangeable image file format）信息，通过该信息可以获取拍照时的位置、时间，以及手机品牌等信息。那么下面就看看如何使用 Python 去获取这些信息吧。

Python 想要读取 Exif 信息需要安装一个第三方库，直接 pip install exifread 即可。

```python
import exifread

with open("1.jpg", 'rb') as f:
    # 直接可以拿到里面的信息，内容非常多
    # 但如果无法读取，那么返回值 exif 就是 None
    exif = exifread.process_file(f)

# 这里我们选一些常用的，里面的 value 需要转成字符串
# 不转成字符串的话看起来会比较费劲
print("图片宽度:", str(exif["Image ImageWidth"]))
print("图片高度:", str(exif["Image ImageLength"]))
print("手机品牌:", str(exif["Image Make"]))
print("手机型号:", str(exif["Image Model"]))
print("拍摄时间:", str(exif["Image DateTime"]))
print("经度:", str(exif["GPS GPSLongitude"]))
print("东经还是西经:", str(exif["GPS GPSLongitudeRef"]))
print("纬度:", str(exif["GPS GPSLatitude"]))
print("南纬还是北纬:", str(exif["GPS GPSLatitudeRef"]))
"""
图片宽度: 3968
图片高度: 2976
手机品牌: HUAWEI
手机型号: EML-AL00
拍摄时间: 2021:07:08 19:52:23
经度: [116, 28, 5973999/100000]
东经还是西经: E
纬度: [39, 59, 1255371/200000]
南纬还是北纬: N
"""
```

还是比较简单的，但是里面的经度和纬度比较怪，我们还需要再对其转化一下。

```python
lng = str(exif["GPS GPSLongitude"])  # 经度
lat = str(exif["GPS GPSLatitude"])  # 纬度
print(lng)  # [116, 28, 5973999/100000]
print(lat)  # [39, 59, 1255371/200000]

# 转成列表
lng = lng[1: -1].replace("/", ",").split(",")
lat = lat[1: -1].replace("/", ",").split(",")
print(lat)  # ['39', ' 59', ' 1255371', '200000']
print(lng)  # ['116', ' 28', ' 5973999', '100000']

# 然后得到具体的经纬度
lng = float(lng[0]) + float(lng[1]) / 60 + float(lng[2]) / float(lng[3]) / 3600
lat = float(lat[0]) + float(lat[1]) / 60 + float(lat[2]) / float(lat[3]) / 3600
print(lng)  # 116.48326110833334
print(lat)  # 39.98507690416667
```

这里得到的经纬度永远是正数，如果是西经，那么得到的经度要乘上 -1；同理如果是南纬，那么纬度要乘上 -1。

另外需要注意，并非所有的照片都能够进行解析，必须是携带 Exif 信息的原始图片。如果中间进行了压缩、或者 P 图，那么就无法识别了。

当然像一些社交平台也会专门针对 Exif 进行处理，比如微信，你发在朋友圈的图片会自动压缩，所以是不会暴露位置信息的。