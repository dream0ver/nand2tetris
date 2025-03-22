const fsPromises = require("fs").promises
const fs = require("fs")
const path = require("path")

const KEYWORDS = [
  "class",
  "method",
  "function",
  "constructor",
  "int",
  "boolean",
  "char",
  "void",
  "var",
  "static",
  "field",
  "let",
  "do",
  "if",
  "else",
  "while",
  "return",
  "true",
  "false",
  "null",
  "this",
]

const SYMBOLS = [
  "{",
  "}",
  "(",
  ")",
  "[",
  "]",
  ".",
  ",",
  ";",
  "+",
  "-",
  "*",
  "/",
  "&",
  "|",
  "<",
  ">",
  "=",
  "~",
]

const getXmlSymbol = (symbol) => {
  switch (symbol) {
    case "<":
      return "&lt;"
    case ">":
      return "&gt;"
    case "&":
      return "&amp;"
    case '"':
      return "&quot;"
    default:
      return symbol
  }
}

const isValidIdentifierChar = (char) => /^[a-zA-Z0-9_]$/.test(char)
const isSymbol = (symbol) => SYMBOLS.includes(symbol)
const isString = (symbol) => /^"$/.test(symbol)
const isNumber = (symbol) => !isNaN(Number(symbol))

const writeToXml = (tokenType, token, out) => {
  if (tokenType == "xmlStart") {
    return out.write("<tokens>" + "\n")
  } else if (tokenType == "xmlEnd") {
    return out.write("</tokens>" + "\n")
  } else {
    return out.write(
      `<${tokenType}>` + " " + `${token}` + " " + `</${tokenType}>` + "\n"
    )
  }
}

class Tokenizer {
  filepath = ""
  filename = ""

  constructor(filepath) {
    this.filepath = filepath
    this.filename = path.parse(filepath).name
    this.init()
  }

  async init() {
    await this.processFiles()
  }

  async processFiles() {
    const inputfile = fs.readFileSync(path.join(this.filepath), "utf8")
    const outputfile = await fsPromises.open(
      path.join(path.dirname(this.filepath), `${this.filename}T_Compiled.xml`),
      "w"
    )
    let fp = 0
    await writeToXml("xmlStart", undefined, outputfile)
    while (fp < inputfile.length) {
      if (
        inputfile[fp] == " " ||
        inputfile[fp] == "\n" ||
        inputfile[fp] == "\t" ||
        inputfile[fp] == "\r"
      ) {
        fp++
      } else if (inputfile[fp] == "/" && inputfile[fp + 1] == "/") {
        fp = fp + 2
        while (inputfile[fp] != "\n") {
          fp++
        }
      } else if (inputfile[fp] == "/" && inputfile[fp + 1] == "*") {
        fp = fp + 2
        while (!(inputfile[fp] == "*" && inputfile[fp + 1] == "/")) {
          fp++
        }
        fp = fp + 2
      } else {
        let curr_token = ""

        if (isSymbol(inputfile[fp])) {
          await writeToXml("symbol", getXmlSymbol(inputfile[fp]), outputfile)
          fp++
        } else if (isNumber(inputfile[fp])) {
          while (isNumber(inputfile[fp])) {
            curr_token = curr_token + inputfile[fp]
            fp++
          }
          await writeToXml("integerConstant", curr_token, outputfile)
        } else if (isString(inputfile[fp])) {
          fp++
          while (!isString(inputfile[fp])) {
            curr_token = curr_token + inputfile[fp]
            fp++
          }
          await writeToXml("stringConstant", curr_token, outputfile)
          fp++
        } else if (isValidIdentifierChar(inputfile[fp])) {
          while (isValidIdentifierChar(inputfile[fp])) {
            curr_token = curr_token + inputfile[fp]
            fp++
          }

          if (KEYWORDS.includes(curr_token)) {
            await writeToXml("keyword", curr_token, outputfile)
          } else {
            await writeToXml("identifier", curr_token, outputfile)
          }
        } else {
          fp++
        }
      }
    }
    await writeToXml("xmlEnd", undefined, outputfile)
  }

  hasMoreTokens() {}
  advance() {}
  tokenType() {}
  keyWord() {}
  symbol() {}
  identifier() {}
  intVal() {}
  stringVal() {}
}

module.exports = { Tokenizer }
