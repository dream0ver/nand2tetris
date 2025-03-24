const fs = require("fs")
const path = require("path")
const Tokenizer = require("./Tokenizer").Tokenizer

class CompilationEngine {
  filepath = ""
  filename = ""
  output = ""
  tokenizer = null

  constructor(filepath) {
    this.filepath = filepath
    this.filename = path.parse(filepath).name
    this.tokenizer = new Tokenizer(this.filepath)
    this.prepareOutputFile()
  }

  prepareOutputFile() {
    this.output = path.join(
      path.dirname(this.filepath),
      `${this.filename}_Compiled.xml`
    )
    fs.writeFileSync(this.output, "", "utf8")
  }

  getXML(tagName, tagValue) {
    return `<${tagName}>` + `${tagValue}` + `</${tagName}>` + "\n"
  }

  writeXML(tagName, tagValue) {
    return fs.appendFileSync(
      this.output,
      this.getXML(tagName, tagValue),
      "utf-8"
    )
  }

  advanceToken() {
    this.tokenizer.advance()
  }

  getCurrentToken() {
    return this.tokenizer.current.token
  }

  compile() {
    this.advanceToken()
    this.writeXML("class", this.compileClass())
  }

  compileClass() {
    let str = "\n"

    str = str + this.getXML("keyword", this.getCurrentToken())
    this.advanceToken()

    str = str + this.getXML("identifier", this.getCurrentToken())
    this.advanceToken()

    str = str + this.getXML("symbol", this.getCurrentToken())
    this.advanceToken()

    str = str + this.getXML("classVarDec", this.compileClassVarDec())

    str = str + this.getXML("subroutineDec", this.compileSubroutine())

    str = str + this.getXML("symbol", this.getCurrentToken())
    this.advanceToken()

    return str
  }

  compileClassVarDec() {
    let str = "\n"
    let validPrefix = ["static", "field"]
    while (validPrefix.includes(this.getCurrentToken())) {
      str = str + this.getXML("keyword", this.getCurrentToken())
      this.advanceToken()

      str = str + this.getXML("keyword", this.getCurrentToken())
      this.advanceToken()

      str = str + this.getXML("identifier", this.getCurrentToken())
      this.advanceToken()

      while (this.getCurrentToken() != ";") {
        str = str + this.getXML("symbol", this.getCurrentToken())
        this.advanceToken()

        str = str + this.getXML("identifier", this.getCurrentToken())
        this.advanceToken()
      }

      str = str + this.getXML("symbol", this.getCurrentToken())
      this.advanceToken()
    }

    return str
  }

  compileSubroutine() {
    let str = "\n"
    let validPrefix = ["constructor", "function", "method"]
    if (validPrefix.includes(this.getCurrentToken())) {
    }

    return str
  }

  compileParameterList() {}

  compileVarDec() {}

  compileStatements() {}

  compileDo() {}

  compileLet() {}

  compileWhile() {}

  compileReturn() {}

  compileIf() {}

  compileExpression() {}

  compileTerm() {}

  compileExpressionList() {}
}

module.exports = { CompilationEngine }
