const $ = require('cheerio')
const fs = require('fs')
const path = require('path')

let icons = {}
const SVGParser = require('../bin/index')
// const SVGParser = require('convertpath')
const _path = path.join(__dirname, './test/icon/')


//test
const getPath = (file) => {
  const parse = SVGParser.parse((path.join(__dirname, './test/icon/' + file)), {
    plugins: [
      { convertUseToGroup: true, },
      { convertShapeToPath: true, },
      { removeGroups: true, },
      { removeGradient: true },
      { convertTransfromforPath: true, },
      { viewBoxTransform: true, },
    ],
    size: 512,
  })
  // const result = parse.toSimpleSvg()
  // console.log(paths)
  // return parse.toSimpleSvg();
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
    // ss += `stroke-width:${parseInt(o['stroke-width'])}px;`
    ss += `stroke-width:${(o['stroke-width'])}px;`
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


  if (!o.style && ss) {
    o.style = ss
  }

  if (o.style) {
    o.style = o.style.replace(/#6642FF/g, 'currentcolor')//.replace(/#000/g, 'currentcolor')

    if (o.style.indexOf('fill:none') < 0) {
      // o.style = o.style.replace(/stroke:currentcolor;|stroke:currentcolor/, '')
      o.style = 'fill:currentcolor;' + o.style
    }
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
    console.log(file)

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
        // if (files[i].indexOf('sharp') <svg 0) { //排除sharp
        if (files[i].indexOf('sharp') < 0 && files[i] != '.DS_Store') { //排除sharp
          // console.log(files[i])
          let name = files[i].split('.')[0]

          let str = process(files[i])
          let svg = '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">'
          let paths = '';
          let symbol = '<symbol id="' + name + '" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">'
          str.forEach(x => {
            paths += '<path d="' + x.d + '" style="' + x.s + '"/>'
            // console.log(x)
          })
          svg += paths + '</svg>'

          root += symbol + paths + '</symbol>'

          saveFile(path.join(__dirname, './test/ok/' + files[i]), svg, false)
        }
      }
      root += '</svg>'
      saveFile(path.join(__dirname, './test/ok/web.svg'), root, false)
    }
  })
}


start();
return;

// let t = getPath('token.svg');
// console.log(t)
let p = process('menu.svg')
console.log(p)