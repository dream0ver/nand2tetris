const fsPromises = require("fs").promises
const fs = require("fs")
const path = require("path")

class Tokenizer {
  filepath = ""
  filename = ""
  fp = 0

  tokens = {
    IDENTIFIER: "IDENTIFIER",
    STRING_CONST: "STRING_CONST",
    INT_CONST: "INT_CONST",
    KEYWORD: "KEYWORD",
    SYMBOL: "SYMBOL",
  }

  symbols = [
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

  keywords = [
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

  isValidIdentifierChar(char) {
    return /^[a-zA-Z0-9_]$/.test(char)
  }

  isSymbol(symbol) {
    return this.symbols.includes(symbol)
  }

  isString(symbol) {
    return /^"$/.test(symbol)
  }

  isNumber(symbol) {
    return !isNaN(Number(symbol))
  }

  writeToXml(tokenType, token) {
    if (tokenType == "xmlStart") {
      return this.outputfile.write("<tokens>" + "\n")
    } else if (tokenType == "xmlEnd") {
      return this.outputfile.write("</tokens>" + "\n")
    } else {
      return this.outputfile.write(
        `<${tokenType}>` + " " + `${token}` + " " + `</${tokenType}>` + "\n"
      )
    }
  }

  getXmlSymbol(symbol) {
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

  hasMoreTokens() {
    return this.fp < this.inputfile.length
  }

  isWhiteSpace(token) {
    return [" ", "\n", "\t", "\r"].includes(token)
  }

  async processFiles() {
    this.inputfile = fs.readFileSync(path.join(this.filepath), "utf8")
    this.outputfile = await fsPromises.open(
      path.join(path.dirname(this.filepath), `${this.filename}T_Compiled.xml`),
      "w"
    )

    await this.writeToXml("xmlStart")
    while (this.hasMoreTokens()) {
      if (this.isWhiteSpace(this.inputfile[this.fp])) {
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

        if (this.isSymbol(this.inputfile[this.fp])) {
          await this.writeToXml(
            "symbol",
            this.getXmlSymbol(this.inputfile[this.fp])
          )
          this.fp++
        } else if (this.isNumber(this.inputfile[this.fp])) {
          while (this.isNumber(this.inputfile[this.fp])) {
            curr_token = curr_token + this.inputfile[this.fp]
            this.fp++
          }
          await this.writeToXml("integerConstant", curr_token)
        } else if (this.isString(this.inputfile[this.fp])) {
          this.fp++
          while (!this.isString(this.inputfile[this.fp])) {
            curr_token = curr_token + this.inputfile[this.fp]
            this.fp++
          }
          await this.writeToXml("stringConstant", curr_token)
          this.fp++
        } else if (this.isValidIdentifierChar(this.inputfile[this.fp])) {
          while (this.isValidIdentifierChar(this.inputfile[this.fp])) {
            curr_token = curr_token + this.inputfile[this.fp]
            this.fp++
          }

          if (this.keywords.includes(curr_token)) {
            await this.writeToXml("keyword", curr_token)
          } else {
            await this.writeToXml("identifier", curr_token)
          }
        } else {
          this.fp++
        }
      }
    }
    await this.writeToXml("xmlEnd")
  }
}

module.exports = { Tokenizer }
