const fs = require("fs")
const path = require("path")
const Tokenizer = require("./Tokenizer").Tokenizer

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
  for (const file of SOURCE_FILES) {
    const tokenizer = new Tokenizer(file)
    while (tokenizer.hasMoreTokens()) {
      tokenizer.advance()
      console.log(tokenizer.current.token)
    }
  }
}

main()
