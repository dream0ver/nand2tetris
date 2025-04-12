const fs = require("fs")
const path = require("path")
const CompilationEngine = require("./CompilationEngine").CompilationEngine

SOURCE_FILES = []
const DIR_PATH = process.argv.slice(-1)[0]

function openFiles() {
  const files = fs.readdirSync(DIR_PATH)
  files.forEach((file) => {
    if (path.extname(file).slice(1) == "jack")
      SOURCE_FILES.push(path.join(DIR_PATH, file))
  })
}

function main() {
  openFiles()
  for (const file of SOURCE_FILES) new CompilationEngine(file).compile()
}

main()
