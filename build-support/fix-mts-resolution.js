const fs = require('fs')
const path = require('path')

const EXCLUDE_DIRS = ['node_modules', 'build', 'dist']
const STOP_WORDS = ['import', 'export', 'const', 'class', 'function']
const TS_EXTENSIONS = ['.mts', '.ts']
const JS_EXTENSIONS = ['.mjs', '.cjs', 'js']

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach((f) => {
    const dirPath = path.join(dir, f)
    const isDirectory = fs.statSync(dirPath).isDirectory()
    if (isDirectory) {
      if (!EXCLUDE_DIRS.includes(f)) {
        walkDir(dirPath, callback)
      }
    } else if (path.extname(dirPath) === '.mts') {
      callback(dirPath)
    }
  })
}

function processImportLines(filePath, importLines) {
  let fullImport = importLines.join('\n')
  const match = fullImport.match(/from\s+['"](?![@])(.+?)['"]/)

  if (match) {
    let relativePath = match[1]
    if (!relativePath.startsWith('.')) return importLines

    let absolutePath = path.join(path.dirname(filePath), relativePath)

    if (fs.existsSync(absolutePath) && fs.statSync(absolutePath).isDirectory()) {
      if (fs.existsSync(path.join(absolutePath, 'index.mts'))) {
        fullImport = fullImport.replace(relativePath, `${relativePath}/index.mjs`)
        return fullImport.split('\n')
      }
      return importLines
    }

    if (fs.existsSync(absolutePath)) {
      return importLines
    }
    absolutePath = absolutePath.replace(/\.[^.]+$/, '')

    for (const ext of TS_EXTENSIONS) {
      if (fs.existsSync(absolutePath + ext)) {
        const dir = path.dirname(relativePath)
        const base = path.basename(relativePath, path.extname(relativePath))
        const newExt = ext === '.mts' ? '.mjs' : ext === '.ts' ? '.js' : ext
        fullImport = fullImport.replace(relativePath, `${dir}/${base}${newExt}`)
        return fullImport.split('\n')
      }
    }
    for (const ext of JS_EXTENSIONS) {
      if (fs.existsSync(absolutePath + ext)) {
        const dir = path.dirname(relativePath)
        const base = path.basename(relativePath, path.extname(relativePath))
        fullImport = fullImport.replace(relativePath, `${dir}/${base}${ext}`)
        return fullImport.split('\n')
      }
    }
  }

  return importLines
}

function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8')

  const lines = content.split('\n')
  let processedLines = []
  let buffer = []

  for (let line of lines) {
    const trimmed = line.trim()
    const isInQuotes = line.match(/['"`]import/) || line.match(/['"`]export/)

    if ((trimmed.startsWith('import ') || trimmed.startsWith('export ')) && !isInQuotes) {
      if (line.includes(" from '")) {
        const processedBuffer = processImportLines(filePath, [line])
        processedLines = processedLines.concat(processedBuffer)
        buffer = []
        continue
      }

      if (buffer.length > 0) {
        processedLines = processedLines.concat(buffer)
        buffer = []
      }
      buffer.push(line)
      continue
    }

    if (buffer.length > 0 && STOP_WORDS.some((word) => trimmed.startsWith(word))) {
      processedLines = processedLines.concat(buffer)
      buffer = []
    }

    if (buffer.length > 0) {
      buffer.push(line)
      if (line.includes('from')) {
        const processedBuffer = processImportLines(filePath, buffer)
        processedLines = processedLines.concat(processedBuffer)
        buffer = []
      }
      continue
    }

    processedLines.push(line)
  }

  if (buffer.length > 0) {
    processedLines = processedLines.concat(buffer)
  }

  fs.writeFileSync(filePath, processedLines.join('\n'), 'utf-8')
}

walkDir(process.cwd(), processFile)
