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

  getTypeTag() {
    const primitives = ["int", "char", "boolean", "void"]
    return primitives.includes(this.getCurrentToken())
      ? "keyword"
      : "identifier"
  }

  appendAdvance(str, tagName, customValue = null) {
    str += this.getXML(tagName, customValue ?? this.getCurrentToken())
    if (customValue == null) this.advanceToken()
    return str
  }

  compileClass() {
    let str = "\n"

    str = this.appendAdvance(str, "keyword")
    str = this.appendAdvance(str, "identifier")
    str = this.appendAdvance(str, "symbol")
    str = this.appendAdvance(str, "classVarDec", this.compileClassVarDec())
    str = this.appendAdvance(str, "subroutineDec", this.compileSubroutine())
    str = this.appendAdvance(str, "symbol")

    return str
  }

  compileClassVarDec() {
    let str = "\n"
    let validPrefix = ["static", "field"]

    while (validPrefix.includes(this.getCurrentToken())) {
      str = this.appendAdvance(str, "keyword")
      str = this.appendAdvance(str, this.getTypeTag())
      str = this.appendAdvance(str, "identifier")

      while (this.getCurrentToken() != ";") {
        str = this.appendAdvance(str, "symbol")
        str = this.appendAdvance(str, "identifier")
      }

      str = this.appendAdvance(str, "symbol")
    }

    return str
  }

  compileSubroutine() {
    let str = "\n"
    let validPrefix = ["constructor", "function", "method"]

    while (validPrefix.includes(this.getCurrentToken())) {
      str = this.appendAdvance(str, "keyword")
      str = this.appendAdvance(str, this.getTypeTag())
      str = this.appendAdvance(str, "identifier")
      str = this.appendAdvance(str, "symbol")
      str = this.appendAdvance(
        str,
        "parameterList",
        this.compileParameterList()
      )
      str = this.appendAdvance(str, "symbol")
      str = this.appendAdvance(
        str,
        "subroutineBody",
        this.compileSubroutineBody()
      )
    }

    return str
  }

  compileParameterList() {
    let str = "\n"

    while (this.getCurrentToken() != ")") {
      if (str != "\n") str = this.appendAdvance(str, "symbol")
      str = this.appendAdvance(str, this.getTypeTag())
      str = this.appendAdvance(str, "identifier")
    }

    return str
  }

  compileSubroutineBody() {
    let str = "\n"

    str = this.appendAdvance(str, "symbol")
    str = this.appendAdvance(str, "varDec", this.compileVarDec())
    str = this.appendAdvance(str, "statements", this.compileStatements())
    str = this.appendAdvance(str, "symbol")

    return str
  }

  compileVarDec() {
    let str = "\n"
    let validPrefix = ["var"]

    while (validPrefix.includes(this.getCurrentToken())) {
      str = this.appendAdvance(str, "keyword")
      str = this.appendAdvance(str, this.getTypeTag())
      str = this.appendAdvance(str, "identifier")

      while (this.getCurrentToken() != ";") {
        str = this.appendAdvance(str, "symbol")
        str = this.appendAdvance(str, this.getTypeTag())
      }

      str = this.appendAdvance(str, "symbol")
    }

    return str
  }

  compileStatements() {
    let str = "\n"

    return str
  }

  compileLet() {}

  compileIf() {}

  compileWhile() {}

  compileDo() {}

  compileReturn() {}

  compileExpression() {}

  compileTerm() {}

  compileExpressionList() {}
}

if (require.main == module)
  new CompilationEngine(process.argv.slice(-1)[0]).compile()

module.exports = { CompilationEngine }
