const readFile = (path) => {
  return new Promise((resolve, reject) => {
    fs.readFile(path, 'utf8', (err, data) => {
      if (err) reject(err);
      resolve(data)
    })
  })
}


const getPaths = (node = [], type) => {
  let path = [], n;
  for (let i = 0; i < node.length; i++) {
    n = node.eq(i);
    switch (type) {
      case 'path':
        path.push(n.attr('d'))
        break;
      case 'line':
        {
          let x1 = n.attr('x1'),
            y1 = n.attr('y1'),
            x2 = n.attr('x2'),
            y2 = n.attr('y2');
          if (!isNaN(x1 - y1 + (x2 - y2))) {
            let d = 'M' + x1 + ' ' + y1 + 'L' + x2 + ' ' + y2;
            path.push(d)
          }
        }
        break;
      case 'rect':
        {
          let x = Number(n.attr('x')),
            y = Number(n.attr('y')),
            width = Number(n.attr('width')),
            height = Number(n.attr('height')),
            rx = Number(n.attr('rx')) || Number(n.attr('ry')) || 0,
            ry = Number(n.attr('ry')) || Number(n.attr('rx')) || 0;

          //非数值单位计算，如当宽度像100%则移除
          // if (!isNaN(x - y + width - height + rx - ry)) {
          rx = rx > width / 2 ? width / 2 : rx
          ry = ry > height / 2 ? height / 2 : ry
          let d = '';
          //如果其中一个设置为 0 则圆角不生效
          if (0 == rx || 0 == ry) {
            // var path =
            // 'M' + x + ' ' + y +
            // 'H' + (x + width) + 不推荐用绝对路径，相对路径节省代码量
            // 'V' + (y + height) +
            // 'H' + x +
            // 'z';
            d = 'M' + x + ' ' + y + 'h' + width + 'v' + height + 'h' + -width + 'z';
          } else {
            d =
              'M' + x + ' ' + (y + ry) + 'a' + rx + ' ' + ry + ' 0 0 1 ' + rx + ' ' + -ry +
              'h' + (width - rx - rx) +
              'a' + rx + ' ' + ry + ' 0 0 1 ' + rx + ' ' + ry +
              'v' + (height - ry - ry) +
              'a' + rx + ' ' + ry + ' 0 0 1 ' + -rx + ' ' + ry +
              'h' + (rx + rx - width) +
              'a' + rx + ' ' + ry + ' 0 0 1 ' + -rx + ' ' + -ry +
              'z';
          }
          path.push(d);
          // }
        }
        break;
      case 'circle':
        {
          let cx = n.attr('cx'),
            cy = n.attr('cy'),
            r = n.attr('r');
          let d = 'M' + (cx - r) + ' ' + cy +
            'a' + r + ' ' + r + ' 0 1 0 ' + 2 * r + ' 0' +
            'a' + r + ' ' + r + ' 0 1 0 ' + -2 * r + ' 0' +
            'z'
          path.push(d)
        }
        break;
      case 'ellipse':
        {
          let cx = n.attr('cx') * 1,
            cy = n.attr('cy') * 1,
            rx = n.attr('rx') * 1,
            ry = n.attr('ry') * 1;
          if (!isNaN(cx - cy + rx - ry)) {
            let d =
              'M' + (cx - rx) + ' ' + cy +
              'a' + rx + ' ' + ry + ' 0 1 0 ' + 2 * rx + ' 0' +
              'a' + rx + ' ' + ry + ' 0 1 0 ' + -2 * rx + ' 0' +
              'z';
            path.push(d);
          }
        }
        break;
      case 'polygon':
      case 'polyline':
        {
          let regNumber = /[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?/g;
          let points = (n.attr('points').match(regNumber) || []).map(Number);

          if (points.length > 4) {
            let d = 'M' + points.slice(0, 2).join(' ') +
              'L' + points.slice(2).join(' ') +
              (type === 'polygon' ? 'z' : '');
            path.push(d);
          }
        }
        break;
    }
  }
  return path.length ? path.join(' ') : '';
}

let _path = path.join(__dirname, './v5.5.0/')

const getpath = (file) => {
  let d = '';
  // type 1. //bug =>不能处理 transform ，多路径和fill 等
  let html = await readFile(_path + file)
  let $svg = $(html)
  ['path', 'line', 'rect', 'circle', 'ellipse', 'polyline', 'polygon'].forEach(type => {
    let node = $svg.find(type)
    if (node.length) {
      d += ' ' + getPaths(node, type)
    }
  })

  return d;

}