const sizeOf = require('image-size');
const path = require('path');
const syncRequest = require('sync-request');
const fs = require('hexo-fs');
const imageCachePath = './img-cache/'

function renderImageResolution(content, title, config) {
  const imageMap = new Map();
  // 一行一行读取image-size.db内容，不存在就创建之
  fs.writeFileSync(path.join(imageCachePath, 'image-size.db'), '', {"flag": 'a+'})
  const lines = fs.readFileSync(path.join(imageCachePath, 'image-size.db')).split('\n').filter(Boolean);
  lines.forEach(function (line) {
    imageMap.set(line.split(' ')[0], line.split(' ')[1])
  })

  let imgTagRegExp_dataOriginal = /(<img src="(.*)" data-original="([^"]*)"[^<]*>)/g
  let imgTagRegExp_src = /(<(img) src="([^"]*)"[^<]*>)/g
  return content.replace(config.photoswipe.imgSrcIn === 'dataOriginal' ? imgTagRegExp_dataOriginal : imgTagRegExp_src, function (match, p1, p2, p3, offset, string) {
    title = title.replace(/[,_:'";?!@><.]/gi, '-').replace(/ /g, '')
    let img = p3.replace(/\/.*\/([^"]*)/g, path.join(title, '$1'));
    img = path.join(config.photoswipe.imageFileBaseDir, img)
    let imageSize = {};
    let response;
    if (p3.indexOf('http') === 0) {
      // 以http开头的data-original属性
      let absImageUrl = /http[s]?:\/\/[^?]*/.exec(p3);
      let slashArr = absImageUrl[0].split("/")
      let filename = slashArr[slashArr.length - 1]
      if (!fs.existsSync(imageCachePath)) {
        // 如果缓存文件夹不存在就创建一个
        fs.mkdir(imageCachePath)
      }


      if (imageMap.get(title + ',' + filename)) {
        const res = imageMap.get(title + ',' + filename).split('x');
        imageSize.width = res[0]
        imageSize.height = res[1]
        console.log('reading image from db:', filename)
      } else {

        if (fs.existsSync(path.join(imageCachePath, filename))) {
          console.log('calculating cached image:', filename)
          // 如果这个文件已经缓存了那就
          // 判断一下这个文件的大小
          let localCacheSize = fs.statSync(path.join(imageCachePath, filename)).size
          let response = syncRequest("HEAD", p3);
          let responseLength = response.headers['content-length']
          // 是否与服务端的文件大小相等
          if (responseLength === localCacheSize) {
            // 如果相等就说明缓存是正确的
            // 直接计算图片宽高
            imageSize = sizeOf(path.join(imageCachePath, filename))
          } else {
            // 缓存长度不同，说明上次缓存的内容有误
            response = syncRequest("GET", p3)
            fs.writeFile(path.join(imageCachePath, filename), response.getBody())
            // override if exits
            imageSize = sizeOf(response.getBody())
          }
        } else {
          console.log('calculating uncached image:', filename)
          response = syncRequest("GET", p3)
          fs.writeFile(path.join(imageCachePath, filename), response.getBody())
          imageSize = sizeOf(response.getBody())
        }
        fs.writeFileSync(path.join(imageCachePath + 'image-size.db'), title + "," + filename + " " + imageSize.width + "x" + imageSize.height + require('os').EOL, {'flag': 'a'})
      }
    } else {
      // 本地图片，可以求取大小
      imageSize = sizeOf(img)
    }
    return '<div class="' + config.photoswipe.className + '" data-type="' + config.photoswipe.dataType + '" data-size="' + imageSize.width + 'x' + imageSize.height + '">' + p1 + '</div>'
  })
}

module.exports = renderImageResolution