const $ = require('cheerio')
const fs = require('fs')
const path = require('path')

let icons = {}
const SVGParser = require('./bin/index')
const _path = path.join(__dirname, './light/')

const size = 512

const sty2obj = stl => {
  stl = stl.replace(/ /g, '')
  let s = stl.split(';')
  let obj = {}
  s.map(atr => {
    let [k, v] = atr.split(':')
    if (k) {
      obj[k] = v
    }
  })
  return obj
}
const obj2sty = obj => {
  let sty = ''
  for (k in obj) {
    sty += `${k}:${obj[k]};`
  }
  return sty
}

//test
const getPath = (file) => {
  const parse = SVGParser.parse('./light/' + file, {
    plugins: [
      { convertUseToGroup: true, },
      { convertShapeToPath: true, },
      { removeGroups: true, },
      { convertTransfromforPath: true, },
      { viewBoxTransform: true, },
    ],
    size,
  })
  // const result = parse.toSimpleSvg()
  // console.log(paths)
  return parse.getPathAttributes();
}


const saveFile = async (path, body, json = true) => {
  return new Promise((resolve, reject) => {
    body = json ? JSON.stringify(body) : body
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

const reset = (o) => {
  let ss = ''
  if (o.fill) {
    ss += `fill:${o.fill};`
  }
  if (o.stroke) {
    ss += `stroke:${o.stroke};`
  }
  if (o['stroke-width']) {
    ss += `stroke-width:${parseInt(o['stroke-width'])}px;`
  }
  if (o['stroke-linecap']) {
    ss += `stroke-linecap:${o['stroke-linecap']};`
  }
  if (o['stroke-linejoin']) {
    ss += `stroke-linejoin:${o['stroke-linejoin']};`
  }
  if (o['stroke-miterlimit']) {
    ss += `stroke-miterlimit:${o['stroke-miterlimit']};`
  }
  if (o['fill-rule']) {
    ss += `fill-rule:${o['fill-rule']};`
  }

  if (!o.style) {
    o.style = ss || 'fill:currentcolor;'
  }

  if (o.style) {
    let obj = sty2obj(o.style)
    // console.log(obj)
    let { fill, stroke } = obj
    if ((fill || /#000/.test(fill)) && fill != 'none') {
      obj.fill = 'currentcolor'
    }
    if ((stroke || /#000/.test(fill)) && stroke != 'none') {
      obj.stroke = 'currentcolor'
    }
    // console.log(obj2sty(obj))
    let sty = obj2sty(obj)
    o.style = sty
  }

  return o;
}

const process = (file) => {

  console.log(file)
  const paths = getPath(file)
  let ds = []

  if (paths.length == 1) {
    let x = paths[0];
    x = reset(x);

    let { d, style } = x
    let o = {}
    o.d = d
    if (style) {
      o.s = style
    }

    // if (file.indexOf('outline') >= 0) {
    //   if (!style || style.indexOf('fill') < 0) {
    //     o.s += `fill:none;`;
    //   }
    // }
    // console.log(file)

    ds.push(o)
  } else if (paths.length > 1) {
    ds = paths.reduce((n, o) => {
      o = reset(o);
      if (o.style) {
        let i = n.map(a => a.s).indexOf(o.style)  // 已经存在类似的style
        if (i >= 0) {
          //合并path
          n[i].d += ' ' + o.d
        } else {
          n.push({ d: o.d, s: o.style })
        }
      } else {
        let x = n.findIndex(a => !a.s)  //已经存在没有style的 合并
        if (x >= 0) {
          n[x].d += ' ' + o.d
        } else {
          n.push({ d: o.d })
        }
      }
      return n;
    }, [])
  }

  return ds;
}

const start = () => {
  fs.readdir(_path, async function (err, files) {
    if (err) {
      console.log(err)
    } else {
      let root = '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">'

      for (let i = 0; i < files.length; i++) {
        // if (files[i].indexOf('sharp') < 0) { //排除sharp
        if (files[i].indexOf('sharp') < 0 && files[i] != '.DS_Store') { //排除sharp
          // console.log(files[i])
          let name = '-' + files[i].split('.')[0]
          name = name.replace(/-(\w)/g, ($0, $1) => $1.toUpperCase())
          let str = process(files[i])
          icons[name] = str

          let paths = '';
          let symbol = `<symbol id="${name}" viewBox="0 0 ${size} ${size}">`
          // let symbol = `<symbol id="${name}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">`
          str.forEach(x => {
            paths += `<path d="${x.d}" ${x.s ? 'style="' + x.s + '"' : ''}/>`
            // console.log(x)
          })

          root += symbol + paths + '</symbol>'

        }
      }
      root += '</svg>'

      // await saveFile(path.join(__dirname, './lib/dist.json'), icons)
      let str = JSON.stringify(icons)
      let ds = 'module.exports = ' + str + '';
      // ds += 'export default paths'

      await saveFile(path.join(__dirname, './lib/dist.js'), ds, false)

      await saveFile(path.join(__dirname, './lib/sprite.svg'), root, false)
    }
  })
}


start();
// return;

// let t = getPath('wallet.svg');
// console.log(t)
// let p = process('wallet.svg')
// console.log(p)