const fsPromises = require("fs").promises
const fs = require("fs")
const path = require("path")

const TOKENS = {
  IDENTIFIER: "IDENTIFIER",
  STRING_CONST: "STRING_CONST",
  INT_CONST: "INT_CONST",
  KEYWORD: "KEYWORD",
  SYMBOL: "SYMBOL",
}

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
  fp = 0

  constructor(filepath) {
    this.filepath = filepath
    this.filename = path.parse(filepath).name
    this.init()
    this.inputfile
    this.outputfile
  }

  async init() {
    await this.processFiles()
  }

  async processFiles() {
    this.inputfile = fs.readFileSync(path.join(this.filepath), "utf8")
    this.outputfile = await fsPromises.open(
      path.join(path.dirname(this.filepath), `${this.filename}T_Compiled.xml`),
      "w"
    )

    await writeToXml("xmlStart", undefined, this.outputfile)
    while (this.hasMoreTokens()) {
      if (
        this.inputfile[this.fp] == " " ||
        this.inputfile[this.fp] == "\n" ||
        this.inputfile[this.fp] == "\t" ||
        this.inputfile[this.fp] == "\r"
      ) {
        this.fp++
      } else if (
        this.inputfile[this.fp] == "/" &&
        this.inputfile[this.fp + 1] == "/"
      ) {
        this.fp = this.fp + 2
        while (this.inputfile[this.fp] != "\n") {
          this.fp++
        }
      } else if (
        this.inputfile[this.fp] == "/" &&
        this.inputfile[this.fp + 1] == "*"
      ) {
        this.fp = this.fp + 2
        while (
          !(
            this.inputfile[this.fp] == "*" && this.inputfile[this.fp + 1] == "/"
          )
        ) {
          this.fp++
        }
        this.fp = this.fp + 2
      } else {
        let curr_token = ""

        switch (this.tokenType()) {
        }

        if (isSymbol(this.inputfile[this.fp])) {
          await writeToXml(
            "symbol",
            getXmlSymbol(this.inputfile[this.fp]),
            this.outputfile
          )
          this.fp++
        } else if (isNumber(this.inputfile[this.fp])) {
          while (isNumber(this.inputfile[this.fp])) {
            curr_token = curr_token + this.inputfile[this.fp]
            this.fp++
          }
          await writeToXml("integerConstant", curr_token, this.outputfile)
        } else if (isString(this.inputfile[this.fp])) {
          this.fp++
          while (!isString(this.inputfile[this.fp])) {
            curr_token = curr_token + this.inputfile[this.fp]
            this.fp++
          }
          await writeToXml("stringConstant", curr_token, this.outputfile)
          this.fp++
        } else if (isValidIdentifierChar(this.inputfile[this.fp])) {
          while (isValidIdentifierChar(this.inputfile[this.fp])) {
            curr_token = curr_token + this.inputfile[this.fp]
            this.fp++
          }

          if (KEYWORDS.includes(curr_token)) {
            await writeToXml("keyword", curr_token, this.outputfile)
          } else {
            await writeToXml("identifier", curr_token, this.outputfile)
          }
        } else {
          this.fp++
        }
      }
    }
    await writeToXml("xmlEnd", undefined, this.outputfile)
  }

  hasMoreTokens() {
    return this.fp < this.inputfile.length
  }

  tokenType() {}

  advance() {}

  keyWord() {}

  symbol() {}

  identifier() {}

  intVal() {}

  stringVal() {}
}

module.exports = { Tokenizer }
