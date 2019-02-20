const sizeOf = require('image-size');
const path = require('path');
const syncRequest = require('sync-request');

function renderImageResolution(content, title) {
  let imgTagRegExp_dataOriginal = /(<img src="(.*)" data-original="([^"]*)"[^<]*>)/g
  let imgTagRegExp_src = /(<(img) src="([^"]*)"[^<]*>)/g
  return content.replace(hexo.config.photoswipe.imgSrcIn === 'dataOriginal' ? imgTagRegExp_dataOriginal : imgTagRegExp_src, function (match, p1, p2, p3, offset, string) {
    title = title.replace(/[,_:'";?!@><.]/gi, '-').replace(/ /g, '')
    var img = p3.replace(/\/.*\/([^"]*)/g, path.join(title, '$1'))
    img = path.join(hexo.config.photoswipe.imageFileBaseDir, img)
    var imageSize
    if (p3.indexOf('http') === 0) {
      // 以http开头的data-origianl属性
      var response = syncRequest("GET", p3)
      imageSize = sizeOf(response.getBody())
    } else {
      // 本地图片，可以求取大小
      imageSize = sizeOf(img)
    }
    return '<div class="' + hexo.config.photoswipe.className + '" data-type="' + hexo.config.photoswipe.dataType + '" data-size="' + imageSize.width + 'x' + imageSize.height + '">' + p1 + '</div>'
  })
}

module.exports = renderImageResolution