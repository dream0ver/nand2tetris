const fs = require("fs")
const path = require("path")

class Tokenizer {
  filepath = ""

  filename = ""

  fp = 0

  input = ""

  output = ""

  current_token = ""

  allowed_symbols = [
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

  allowed_keywords = [
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
    this.processFiles()
    this.tokenize()
  }

  processFiles() {
    this.input = fs.readFileSync(path.join(this.filepath), "utf8")

    this.output = path.join(
      path.dirname(this.filepath),
      `${this.filename}T_Compiled.xml`
    )

    fs.writeFileSync(this.output, "", "utf8")
  }

  isValidIdentifierChar(char) {
    return /^[a-zA-Z0-9_]$/.test(char)
  }

  isSymbol(symbol) {
    return this.allowed_symbols.includes(symbol)
  }

  isString(symbol) {
    return /^"$/.test(symbol)
  }

  isNumber(symbol) {
    return !isNaN(Number(symbol))
  }

  writeToXml(tokenType, token) {
    switch (tokenType) {
      case "xmlStart":
        return fs.appendFileSync(this.output, "<tokens>" + "\n", "utf-8")
      case "xmlEnd":
        return fs.appendFileSync(this.output, "</tokens>" + "\n", "utf-8")
      default:
        return fs.appendFileSync(
          this.output,
          `<${tokenType}>` + " " + `${token}` + " " + `</${tokenType}>` + "\n",
          "utf-8"
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
    return this.fp < this.input.length
  }

  isWhiteSpace(token) {
    return [" ", "\n", "\t", "\r"].includes(token)
  }

  advance() {
    if (this.isWhiteSpace(this.input[this.fp])) {
      this.fp++
    } else if (this.input[this.fp] == "/" && this.input[this.fp + 1] == "/") {
      this.fp = this.fp + 2
      while (this.input[this.fp] != "\n") {
        this.fp++
      }
    } else if (this.input[this.fp] == "/" && this.input[this.fp + 1] == "*") {
      this.fp = this.fp + 2
      while (!(this.input[this.fp] == "*" && this.input[this.fp + 1] == "/")) {
        this.fp++
      }
      this.fp = this.fp + 2
    } else {
      this.current_token = ""

      if (this.isSymbol(this.input[this.fp])) {
        this.writeToXml("symbol", this.getXmlSymbol(this.input[this.fp]))
        this.current_token = this.input[this.fp]
        this.fp++
      } else if (this.isNumber(this.input[this.fp])) {
        while (this.isNumber(this.input[this.fp])) {
          this.current_token = this.current_token + this.input[this.fp]
          this.fp++
        }
        this.writeToXml("integerConstant", this.current_token)
      } else if (this.isString(this.input[this.fp])) {
        this.fp++
        while (!this.isString(this.input[this.fp])) {
          this.current_token = this.current_token + this.input[this.fp]
          this.fp++
        }
        this.writeToXml("stringConstant", this.current_token)
        this.fp++
      } else if (this.isValidIdentifierChar(this.input[this.fp])) {
        while (this.isValidIdentifierChar(this.input[this.fp])) {
          this.current_token = this.current_token + this.input[this.fp]
          this.fp++
        }

        if (this.allowed_keywords.includes(this.current_token)) {
          this.writeToXml("keyword", this.current_token)
        } else {
          this.writeToXml("identifier", this.current_token)
        }
      } else {
        this.fp++
      }
    }
  }
  tokenize() {
    this.writeToXml("xmlStart")
    while (this.hasMoreTokens()) this.advance()
    this.writeToXml("xmlEnd")
  }
}

module.exports = { Tokenizer }
