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

  isNumber(symbol) {
    return !isNaN(Number(symbol))
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

  getCurrentTokenType() {
    return this.tokenizer.current.type
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
    let validClassVarPrefix = ["static", "field"]
    let validSubroutinePrefix = ["constructor", "function", "method"]

    str = this.appendAdvance(str, "keyword")
    str = this.appendAdvance(str, "identifier")
    str = this.appendAdvance(str, "symbol")

    while (validClassVarPrefix.includes(this.getCurrentToken())) {
      str = this.appendAdvance(str, "classVarDec", this.compileClassVarDec())
    }

    while (validSubroutinePrefix.includes(this.getCurrentToken())) {
      str = this.appendAdvance(str, "subroutineDec", this.compileSubroutine())
    }

    str = this.appendAdvance(str, "symbol")

    return str
  }

  compileClassVarDec() {
    let str = "\n"

    str = this.appendAdvance(str, "keyword")
    str = this.appendAdvance(str, this.getTypeTag())
    str = this.appendAdvance(str, "identifier")

    while (this.getCurrentToken() != ";") {
      str = this.appendAdvance(str, "symbol")
      str = this.appendAdvance(str, "identifier")
    }

    str = this.appendAdvance(str, "symbol")

    return str
  }

  compileSubroutine() {
    let str = "\n"

    str = this.appendAdvance(str, "keyword")
    str = this.appendAdvance(str, this.getTypeTag())
    str = this.appendAdvance(str, "identifier")
    str = this.appendAdvance(str, "symbol")
    str = this.appendAdvance(str, "parameterList", this.compileParameterList())
    str = this.appendAdvance(str, "symbol")
    str = this.appendAdvance(
      str,
      "subroutineBody",
      this.compileSubroutineBody()
    )

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

    while (this.getCurrentToken() == "var") {
      str = this.appendAdvance(str, "varDec", this.compileVarDec())
    }

    str = this.appendAdvance(str, "statements", this.compileStatements())
    str = this.appendAdvance(str, "symbol")

    return str
  }

  compileVarDec() {
    let str = "\n"

    str = this.appendAdvance(str, "keyword")
    str = this.appendAdvance(str, this.getTypeTag())
    str = this.appendAdvance(str, "identifier")

    while (this.getCurrentToken() != ";") {
      str = this.appendAdvance(str, "symbol")
      str = this.appendAdvance(str, this.getTypeTag())
    }

    str = this.appendAdvance(str, "symbol")

    return str
  }

  compileStatements() {
    let str = "\n"

    while (this.getCurrentToken() != "}") {
      switch (this.getCurrentToken()) {
        case "let": {
          while (this.getCurrentToken() == "let") {
            str = this.appendAdvance(str, "letStatement", this.compileLet())
          }
          break
        }
        // case "if": {
        //   str = this.appendAdvance(str, "ifStatement", this.compileIf())
        //   break
        // }
        // case "while": {
        //   str = this.appendAdvance(str, "whileStatement", this.compileWhile())
        //   break
        // }
        // case "do": {
        //   str = this.appendAdvance(str, "doStatement", this.compileDo())
        //   break
        // }
        // case "return": {
        //   str = this.appendAdvance(str, "returnStatement", this.compileReturn())
        //   break
        // }
      }
    }

    return str
  }

  compileLet() {
    let str = "\n"

    str = this.appendAdvance(str, "keyword")

    if ((this.tokenizer.getLookAhead().token = "[")) {
      str = this.appendAdvance(str, "identifier")
      str = this.appendAdvance(str, "symbol")
      str = this.appendAdvance(str, "expression", this.compileExpression())
      str = this.appendAdvance(str, "symbol")
    } else {
      str = this.appendAdvance(str, "identifier")
    }

    str = this.appendAdvance(str, "symbol")
    str = this.appendAdvance(str, "expression", this.compileExpression())
    str = this.appendAdvance(str, "symbol")

    return str
  }

  compileIf() {}

  compileWhile() {}

  compileDo() {}

  compileReturn() {}

  compileExpression() {
    let str = "\n"

    const op = ["+", "-", "*", "/", "&", "|", "<", ">", "="]

    str = this.appendAdvance(str, "term", this.compileTerm())

    while (op.includes(this.getCurrentToken())) {
      str = this.appendAdvance(str, "symbol")
      str = this.appendAdvance(str, "term", this.compileTerm())
    }

    return str
  }

  compileSubroutineCall() {
    let str = "\n"
    let isMethod = this.tokenizer.getLookAhead().token == "."

    str = this.appendAdvance(str, "identifier")

    if (isMethod) {
      str = this.appendAdvance(str, "symbol")
      str = this.appendAdvance(str, "identifier")
    }

    str = this.appendAdvance(str, "symbol")
    str = this.appendAdvance(
      str,
      "expressionList",
      this.compileExpressionList()
    )
    str = this.appendAdvance(str, "symbol")

    return str
  }

  compileTerm() {
    let str = "\n"

    switch (this.getCurrentTokenType()) {
      case "integerConstant": {
        str = this.appendAdvance(str, "integerConstant")
        break
      }

      case "stringConstant": {
        str = this.appendAdvance(str, "stringConstant")
        break
      }

      case "keyword": {
        str = this.appendAdvance(str, "keywordConstant")
        break
      }

      case "identifier": {
        switch (this.tokenizer.getLookAhead().token) {
          case "[": {
            str = this.appendAdvance(str, "identifier")
            str = this.appendAdvance(str, "symbol")
            str = this.appendAdvance(
              str,
              "expression",
              this.compileExpression()
            )
            str = this.appendAdvance(str, "symbol")
            break
          }

          case "(":
          case ".": {
            str = this.appendAdvance(
              str,
              "subroutineCall",
              this.compileSubroutineCall()
            )
            break
          }

          default: {
            str = this.appendAdvance(str, "identifier")
          }
        }

        break
      }

      case "symbol": {
        if (this.getCurrentToken() == "(") {
          str = this.appendAdvance(str, "symbol")
          str = this.appendAdvance(str, "expression", this.compileExpression())
          str = this.appendAdvance(str, "symbol")
        }
        if (["-", "~"].includes(this.getCurrentToken())) {
          str = this.appendAdvance(str, "symbol")
          str = this.appendAdvance(str, "term", this.compileTerm())
        }
        break
      }
    }

    return str
  }

  compileExpressionList() {
    let str = "\n"

    str = this.appendAdvance(str, "expression", this.compileExpression())

    while (this.getCurrentToken() == ",") {
      str = this.appendAdvance(str, "symbol")
      str = this.appendAdvance(str, "expression", this.compileExpression())
    }

    return str
  }
}

if (require.main == module)
  new CompilationEngine(process.argv.slice(-1)[0]).compile()

module.exports = { CompilationEngine }
