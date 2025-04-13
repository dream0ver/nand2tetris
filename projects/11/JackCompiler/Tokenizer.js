const fs = require("fs")
const path = require("path")
const { VALID_SYMBOLS, VALID_KEYWORDS, VALID_TOKENS } = require("./Util")

class Tokenizer {
  filepath = ""
  filename = ""
  fp = 0
  input = ""
  output = ""
  current = ""
  lookaheadtoken = ""
  writelock = true

  constructor(filepath) {
    this.filepath = filepath
    this.filename = path.parse(filepath).name
    this.readFile()
    this.resetCurrentToken()
  }

  readFile() {
    this.input = fs.readFileSync(path.join(this.filepath), "utf8")
  }

  prepareOutputFile() {
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
    return VALID_SYMBOLS.includes(symbol)
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
    if (this.writelock) return
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
    return this.current.type == VALID_TOKENS.KEYWORD ? this.current.token : null
  }

  getIdentifier() {
    return this.current.type == VALID_TOKENS.IDENTIFIER
      ? this.current.token
      : null
  }

  getSymbol() {
    return this.current.type == VALID_TOKENS.SYMBOL ? this.current.token : null
  }

  getStringVal() {
    return this.current.type == VALID_TOKENS.STRING_CONST
      ? this.current.token
      : null
  }

  getIntVal() {
    return this.current.type == VALID_TOKENS.INT_CONST
      ? this.current.token
      : null
  }

  getLookAhead() {
    let fp_bak, current_bak

    fp_bak = this.fp
    current_bak = JSON.parse(JSON.stringify(this.current))

    this.advance()

    this.lookaheadtoken = JSON.parse(JSON.stringify(this.current))
    this.fp = fp_bak
    this.current = JSON.parse(JSON.stringify(current_bak))

    return this.lookaheadtoken
  }

  trim() {
    while (true) {
      while (this.isWhiteSpace(this.input[this.fp])) this.fp++

      if (this.input[this.fp] == "/" && this.input[this.fp + 1] == "/") {
        this.fp += 2
        while (this.input[this.fp] != "\n" && this.fp < this.input.length)
          this.fp++
      } else if (this.input[this.fp] == "/" && this.input[this.fp + 1] == "*") {
        this.fp += 2
        while (this.fp < this.input.length - 1) {
          if (this.input[this.fp] == "*" && this.input[this.fp + 1] == "/") {
            this.fp += 2
            break
          }
          this.fp++
        }
      } else {
        break
      }
    }
  }

  advance() {
    this.trim()
    this.resetCurrentToken()

    if (this.isSymbol(this.input[this.fp])) {
      this.writeToXml("symbol", this.getXmlSymbol(this.input[this.fp]))
      this.current.token = this.input[this.fp]
      this.current.type = VALID_TOKENS.SYMBOL
      this.fp++
    } else if (this.isNumber(this.input[this.fp])) {
      while (this.isNumber(this.input[this.fp])) {
        this.current.token = this.current.token + this.input[this.fp]
        this.fp++
      }
      this.current.type = VALID_TOKENS.INT_CONST
      this.writeToXml("integerConstant", this.current.token)
    } else if (this.isString(this.input[this.fp])) {
      this.fp++
      while (!this.isString(this.input[this.fp])) {
        this.current.token = this.current.token + this.input[this.fp]
        this.fp++
      }
      this.current.type = VALID_TOKENS.STRING_CONST
      this.writeToXml("stringConstant", this.current.token)
      this.fp++
    } else if (this.isValidIdentifierChar(this.input[this.fp])) {
      while (this.isValidIdentifierChar(this.input[this.fp])) {
        this.current.token = this.current.token + this.input[this.fp]
        this.fp++
      }

      if (VALID_KEYWORDS.includes(this.current.token)) {
        this.current.type = VALID_TOKENS.KEYWORD
        this.writeToXml("keyword", this.current.token)
      } else {
        this.current.type = VALID_TOKENS.IDENTIFIER
        this.writeToXml("identifier", this.current.token)
      }
    }
  }
  tokenize() {
    this.prepareOutputFile()
    this.writelock = false
    this.writeToXml("xmlStart")
    while (this.hasMoreTokens()) this.advance()
    this.writeToXml("xmlEnd")
  }
}

if (require.main == module) new Tokenizer(process.argv.slice(-1)[0]).tokenize()

module.exports = { Tokenizer }
