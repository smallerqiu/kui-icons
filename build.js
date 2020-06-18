const $ = require('cheerio')
const fs = require('fs')
const path = require('path')

let icons = {}
const SVGParser = require('convertpath')

const readFile = (path) => {
  return new Promise((resolve, reject) => {
    fs.readFile(path, 'utf8', (err, data) => {
      if (err) reject(err);
      resolve(data)
    })
  })
}
const saveFile = async (path, body) => {
  return new Promise((resolve, reject) => {
    body = JSON.stringify(body)
    fs.writeFile(path, body, async err => {
      if (err) {
        await logs('保存文件:' + path + ' 失败')
        reject(err)
        // console.log('保存文件:' + path + ' 失败', err)
      } else {
        resolve(true)
        // console.log('写入文件:' + name + ' 成功')
      }
    })
  })
}

const getpath = (node = []) => {
  let path = []
  for (let i = 0; i < node.length; i++) {
    path.push(node.eq(i).attr('d'))
  }
  return path.join(' ')
}
function ellipse2path(cx, cy, rx, ry) {
  //非数值单位计算，如当宽度像100%则移除 
  if (isNaN(cx - cy + rx - ry)) return; var path = 'M' + (cx - rx) + ' ' + cy + 'a' + rx + ' ' + ry + ' 0 1 0 ' + 2 * rx + ' 0' + 'a' + rx + ' ' + ry + ' 0 1 0 ' + (-2 * rx) + ' 0' + 'z'; return path;
}

const cir2path = (cx, cy, r) => {
  return `M ${cx}, ${cy} m -${r}, 0 a ${r},${r} 0 1,0 ${r * 2},0 a ${r},${r} 0 1,0 -${r * 2},0`
  //or M cx - r, cy a r,r 0 1,0 (r * 2),0 a r,r 0 1,0 -(r * 2),0
}

const getell = (node = []) => {
  let path = [], n;
  for (let i = 0; i < node.length; i++) {
    n = node.eq(i)
    let x = n.attr('cx')
    let y = n.attr('cy')
    let rx = n.attr('rx')
    let ry = n.attr('ry')
    let p = ellipse2path(x, y, rx, ry)
    path.push(p)
  }
  return path.length ? path : null
}

const getcir = (node = []) => {
  let path = [], n;
  for (let i = 0; i < node.length; i++) {
    n = node.eq(i)
    let x = n.attr('cx')
    let y = n.attr('cy')
    let r = n.attr('r')
    let p = cir2path(x, y, r)
    path.push(p)
  }
  return path.length ? path : null
}

let _path = path.join(__dirname, './svg/')

fs.readdir(_path, async function (err, files) {
  if (err) {
    console.log(err)
  } else {
    for (let i = 0; i < files.length; i++) {
      let html = await readFile(_path + files[i])
      let $svg = $(html)

      let path = $svg.find('path')
      let d = getpath(path)

      let circle = $svg.find('circle')
      let c = getcir(circle)
      if (c) {
        d += ' ' + c.join(' ')
      }

      let ellipse = $svg.find('ellipse')
      let e = getell(ellipse)
      if (e) {
        console.log(e)
        d += ' ' + e.join(' ')
      }

      let name = files[i].split('.')[0]
      icons[name] = d

      /**
       *  let parse = SVGParser.parse('../svg/' + files[i], {
        plugins: [
          { convertUseToGroup: true, },
          { convertShapeToPath: true, },
          { removeGroups: true, },
          { convertTransfromforPath: true, },
          { viewBoxTransform: true, },
        ],
        size:512
      })
      let d = parse.toSimpleSvg()
      d = d.match(/[^(d=")]+(?="\/>)/g)[0]
      let name = files[i].split('.')[0]
      icons[name] = d
       */
    }
    saveFile(path.join(__dirname, './lib/dist.json'), icons)
  }
})