const Tokenizer = require("./Tokenizer").Tokenizer
const VMWriter = require("./VMWriter").VMWriter
const SymbolTable = require("./SymbolTable").SymbolTable

class CompilationEngine {
  constructor(filepath) {
    this.className = ""
    this.tokenizer = new Tokenizer(filepath)
    this.vmwriter = new VMWriter(filepath)
    this.symboltable = new SymbolTable()
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

  debug() {
    console.log("class name ", this.className)
    console.log("class table ", this.symboltable.class_table)
    console.log("subroutine table ", this.symboltable.subroutine_table)
  }

  compile() {
    this.compileClass()
    this.debug()
  }

  compileClass() {
    let validClassVarPrefix = ["static", "field"]
    let validSubroutinePrefix = ["constructor", "function", "method"]

    this.advanceToken() // class
    this.advanceToken() // identifier
    this.className = this.getCurrentToken()
    this.advanceToken() // opening bracket
    this.advanceToken()

    while (validClassVarPrefix.includes(this.getCurrentToken()))
      this.compileClassVarDec()

    while (validSubroutinePrefix.includes(this.getCurrentToken()))
      this.compileSubroutine()

    this.advanceToken() // closing bracket
  }

  compileClassVarDec() {
    let kind, type, name
    kind = this.getCurrentToken()

    this.advanceToken() // type
    type = this.getCurrentToken()

    this.advanceToken() // identifier
    name = this.getCurrentToken()

    this.symboltable.define(name, type, kind)

    this.advanceToken() // symbol (, or ;)

    while (this.getCurrentToken() != ";") {
      this.advanceToken() // identifier
      name = this.getCurrentToken()
      this.symboltable.define(name, type, kind)
      this.advanceToken() // symbol (, or ;)
    }

    this.advanceToken() // symbol (, or ;)
  }

  compileSubroutine() {
    let type, returnType, name

    type = this.getCurrentToken()

    this.advanceToken() // return type

    returnType = this.getCurrentToken()

    this.advanceToken() // subroutine identifier

    name = this.getCurrentToken()

    this.symboltable.startSubroutine(name)

    if (type == "method")
      this.symboltable.define("this", this.className, "argument")

    this.advanceToken() // symbol (

    this.compileParameterList()

    this.advanceToken() // )

    this.compileSubroutineBody()
  }

  compileParameterList() {
    let type, name

    while (this.getCurrentToken() != ")") {
      this.advanceToken() // type

      type = this.getCurrentToken()

      this.advanceToken() // argument identifier

      name = this.getCurrentToken()

      this.symboltable.define(name, type, "argument")

      this.advanceToken() // symbol , or )
    }
  }

  compileSubroutineBody() {
    this.advanceToken() // symbol {

    while (this.getCurrentToken() == "var") this.compileVarDec()

    this.vmwriter.writeFunction(
      `${this.className}.${this.symboltable.getSubroutineName()}`,
      this.symboltable.varCount("local")
    )

    this.compileStatements()

    this.advanceToken() // symbol }
  }

  compileVarDec() {
    let type, name

    this.advanceToken()
    type = this.getCurrentToken()
    this.advanceToken()
    name = this.getCurrentToken()
    this.symboltable.define(name, type, "local")
    this.advanceToken()

    while (this.getCurrentToken() != ";") {
      this.advanceToken() // identifier
      name = this.getCurrentToken()
      this.symboltable.define(name, type, "local")
      this.advanceToken() // symbol (, or ;)
    }

    this.advanceToken() // symbol ;
  }

  compileStatements() {
    while (this.getCurrentToken() != "}") {
      switch (this.getCurrentToken()) {
        case "let": {
          str = this.appendAdvance(str, "letStatement", this.compileLet())
          break
        }
        case "if": {
          str = this.appendAdvance(str, "ifStatement", this.compileIf())
          break
        }
        case "while": {
          str = this.appendAdvance(str, "whileStatement", this.compileWhile())
          break
        }
        case "do": {
          str = this.appendAdvance(str, "doStatement", this.compileDo())
          break
        }
        case "return": {
          str = this.appendAdvance(str, "returnStatement", this.compileReturn())
          break
        }
      }
    }
  }

  compileLet() {
    let str = "\n"

    str = this.appendAdvance(str, "keyword")

    if (this.tokenizer.getLookAhead().token == "[") {
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

  compileIf() {
    let str = "\n"

    str = this.appendAdvance(str, "keyword")
    str = this.appendAdvance(str, "symbol")
    str = this.appendAdvance(str, "expression", this.compileExpression())
    str = this.appendAdvance(str, "symbol")
    str = this.appendAdvance(str, "symbol")
    str = this.appendAdvance(str, "statements", this.compileStatements())
    str = this.appendAdvance(str, "symbol")

    if (this.getCurrentToken() == "else") {
      str = this.appendAdvance(str, "keyword")
      str = this.appendAdvance(str, "symbol")
      str = this.appendAdvance(str, "statements", this.compileStatements())
      str = this.appendAdvance(str, "symbol")
    }

    return str
  }

  compileWhile() {
    let str = "\n"

    str = this.appendAdvance(str, "keyword")
    str = this.appendAdvance(str, "symbol")
    str = this.appendAdvance(str, "expression", this.compileExpression())
    str = this.appendAdvance(str, "symbol")
    str = this.appendAdvance(str, "symbol")
    str = this.appendAdvance(str, "statements", this.compileStatements())
    str = this.appendAdvance(str, "symbol")

    return str
  }

  compileDo() {
    let str = "\n"

    str = this.appendAdvance(str, "keyword")
    str = str + this.compileSubroutineCall()
    str = this.appendAdvance(str, "symbol")

    return str
  }

  compileReturn() {
    let str = "\n"

    str = this.appendAdvance(str, "keyword")

    if (this.getCurrentToken() != ";") {
      str = this.appendAdvance(str, "expression", this.compileExpression())
    }

    str = this.appendAdvance(str, "symbol")

    return str
  }

  compileExpression() {
    let str = "\n"

    const op = ["+", "-", "*", "/", "&", "|", "<", ">", "="]

    str = this.appendAdvance(str, "term", this.compileTerm())

    while (op.includes(this.getCurrentToken())) {
      str = this.appendAdvance(str, "symbol", this.getCurrentToken(), true)
      str = this.appendAdvance(str, "term", this.compileTerm())
    }

    return str
  }

  compileSubroutineCall() {
    let str = ""
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
        str = this.appendAdvance(str, "keyword")
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
            str = str + this.compileSubroutineCall()
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
        } else if (["-", "~"].includes(this.getCurrentToken())) {
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

    if (this.getCurrentToken() != ")") {
      str = this.appendAdvance(str, "expression", this.compileExpression())
    }

    while (this.getCurrentToken() == ",") {
      str = this.appendAdvance(str, "symbol")
      str = this.appendAdvance(str, "expression", this.compileExpression())
    }

    return str
  }
}

module.exports = { CompilationEngine }
