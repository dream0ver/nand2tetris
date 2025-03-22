const fsPromises = require("fs").promises
const path = require("path")
const Tokenizer = require("./Tokenizer").Tokenizer

SOURCE_FILES = []
const DIR_PATH = process.argv.slice(-1)[0]

async function openFiles() {
  const files = await fsPromises.readdir(DIR_PATH)
  files.forEach((file) => {
    if (path.extname(file).slice(1) == "jack")
      SOURCE_FILES.push(path.join(DIR_PATH, file))
  })
}

async function main() {
  await openFiles()
  for (const file of SOURCE_FILES) {
    new Tokenizer(file).tokenize()
  }
}

main()
