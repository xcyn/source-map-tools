const loader = require("path-loader");
const sourceMap = require("source-map");

function loadUri(path) {
  return loader.load(path).then(JSON.parse);
}

function getOriginalPositionFor(smc, line, column) {
  const mapPos = { line, column };
  const pos = smc.originalPositionFor(mapPos);
  if (!pos.source) {
    throw new Error("Mapping not found");
  }
  return pos;
}

function getSourceContentFor(smc, pos, options) {
  const src = smc.sourceContentFor(pos.source);
  return lineSlicer(src, pos.line, pos.column, options);
}

function resolve(path, line, column, options={
  marker: false,
}) {
  line = parseInt(line, 10);
  column = parseInt(column, 10);
  return loadUri(path)
    .then(function (map) {
      return new sourceMap.SourceMapConsumer(map);
    })
    .then(function (smc) {
      const pos = getOriginalPositionFor(smc, line, column);
      const name = pos.name;
      const context = getSourceContentFor(smc, pos, options);
      return { pos, name, context };
    }).catch(err => {
      throw new Error(err)
    });
}

function lineSlicer(text, line, column, opts) {
  const delimiter = opts.delimiter || "\n";
  const before = opts.before || opts.context || 0;
  const after = opts.after || opts.context || 0;
  const lines = text.split(delimiter);
  const begin = Math.max(0, line - before - 1);
  const end = Math.min(line + after - 1, lines.length - 1);
  const slice = lines.slice(begin, end + 1);
  if (opts.marker) slice.splice(line - begin, 0, "^".padStart(column + 1));
  return slice.join(delimiter);
}

async function execute() {
  const path = process.argv[2]
  const line = process.argv[3]
  const column = process.argv[4]
  if(!path || !line || !column) {
    console.log('请输入正确参数， 第一个参数为路径， 第二个参数为行，第三个参数为列')
    return
  } else {
    console.log(`第一个参数为路径:${path}， 第二个参数为行:${line}，第三个参数为列:${column}`)
    try {
      const res = await resolve(path, line, column)
      console.log('解析成功:', res)
    } catch (error) {
      console.log('解析失败', error)
    }
  } 
}

execute()