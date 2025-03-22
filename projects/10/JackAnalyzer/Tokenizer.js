const fs = require("fs")
const path = require("path")

class Tokenizer {
  filepath = ""

  filename = ""

  fp = 0

  input = ""

  output = ""

  current = ""

  allowed_tokens = {
    SYMBOL: "SYMBOL",
    IDENTIFIER: "IDENTIFIER",
    KEYWORD: "KEYWORD",
    STRING_CONST: "STRING_CONST",
    INT_CONST: "INT_CONST",
  }

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
  }

  reset() {
    this.fp = 0
    fs.writeFileSync(this.output, "", "utf8")
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

  resetCurrentToken() {
    this.current = {
      type: "",
      token: "",
    }
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

  tokenType() {
    return this.current.type
  }

  getKeyword() {
    return this.current.type == this.allowed_keywords.KEYWORD
      ? this.current.token
      : null
  }

  getIdentifier() {
    return this.current.type == this.allowed_keywords.IDENTIFIER
      ? this.current.token
      : null
  }

  getSymbol() {
    return this.current.type == this.allowed_keywords.SYMBOL
      ? this.current.token
      : null
  }

  getStringVal() {
    return this.current.type == this.allowed_keywords.STRING_CONST
      ? this.current.token
      : null
  }

  getIntVal() {
    return this.current.type == this.allowed_keywords.INT_CONST
      ? this.current.token
      : null
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
      this.resetCurrentToken()

      if (this.isSymbol(this.input[this.fp])) {
        this.writeToXml("symbol", this.getXmlSymbol(this.input[this.fp]))
        this.current.token = this.input[this.fp]
        this.current.type = this.allowed_tokens.SYMBOL
        this.fp++
      } else if (this.isNumber(this.input[this.fp])) {
        while (this.isNumber(this.input[this.fp])) {
          this.current.token = this.current.token + this.input[this.fp]
          this.fp++
        }
        this.current.type = this.allowed_tokens.INT_CONST
        this.writeToXml("integerConstant", this.current.token)
      } else if (this.isString(this.input[this.fp])) {
        this.fp++
        while (!this.isString(this.input[this.fp])) {
          this.current.token = this.current.token + this.input[this.fp]
          this.fp++
        }
        this.current.type = this.allowed_tokens.STRING_CONST
        this.writeToXml("stringConstant", this.current.token)
        this.fp++
      } else if (this.isValidIdentifierChar(this.input[this.fp])) {
        while (this.isValidIdentifierChar(this.input[this.fp])) {
          this.current.token = this.current.token + this.input[this.fp]
          this.fp++
        }

        if (this.allowed_keywords.includes(this.current.token)) {
          this.current.type = this.allowed_tokens.KEYWORD
          this.writeToXml("keyword", this.current.token)
        } else {
          this.current.type = this.allowed_tokens.IDENTIFIER
          this.writeToXml("identifier", this.current.token)
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
