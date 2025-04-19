const Tokenizer = require("./Tokenizer").Tokenizer
const VMWriter = require("./VMWriter").VMWriter
const SymbolTable = require("./SymbolTable").SymbolTable
const { VALID_OPERATORS, OPERATOR_PRECEDENCE } = require("./Util")

class CompilationEngine {
  constructor(filepath) {
    this.className = ""
    this.tokenizer = new Tokenizer(filepath)
    this.vmwriter = new VMWriter(filepath)
    this.symboltable = new SymbolTable()
    this.labelId = -1
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

  infixToPostfix(exp) {
    const stack = []
    let postfix = []
    for (const c of exp) {
      if (c === "(") {
        stack.push(c)
      } else if (c === ")") {
        while (stack.length && stack[stack.length - 1] !== "(")
          postfix.push(stack.pop())
        stack.pop()
      } else if (VALID_OPERATORS.includes(c)) {
        while (
          stack.length &&
          VALID_OPERATORS.includes(stack[stack.length - 1]) &&
          OPERATOR_PRECEDENCE[stack[stack.length - 1]] >= OPERATOR_PRECEDENCE[c]
        ) {
          postfix.push(stack.pop())
        }
        stack.push(c)
      } else {
        postfix.push(c)
      }
    }
    while (stack.length) postfix.push(stack.pop())
    return postfix
  }

  writeExpressionVMCode(exp) {
    if (exp[0] == "functionCall") return
    exp = exp.flat(999999999)
    exp = this.infixToPostfix(exp)
    for (const c of exp) {
      if (VALID_OPERATORS.includes(c)) {
        let cmd
        switch (c) {
          case "+":
            cmd = "add"
            break
          case "-":
            cmd = "sub"
            break
          case "*":
            cmd = "call Math.multiply 2"
            break
          case "/":
            cmd = "call Math.divide 2"
            break
          case "=":
            cmd = "eq"
            break
          case ">":
            cmd = "gt"
            break
          case "<":
            cmd = "lt"
            break
          case "&":
            cmd = "and"
            break
          case "|":
            cmd = "or"
            break
        }
        this.vmwriter.writeArithmetic(cmd)
      } else {
        if (this.symboltable.findIdentifier(c) != null) {
          const { kind, index } = this.symboltable.findIdentifier(c)
          this.vmwriter.writePush(kind, index)
        } else {
          this.vmwriter.writePush("constant", c)
        }
      }
    }
  }

  compile() {
    this.compileClass()
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
    let type, name

    type = this.getCurrentToken() // keyword (method,constructor,function)
    this.advanceToken() // return type
    this.advanceToken() // subroutine identifier
    name = this.getCurrentToken()
    this.symboltable.startSubroutine(name)

    if (type == "method") {
      this.symboltable.define("this", this.className, "argument")
    }

    this.advanceToken() // symbol (
    this.compileParameterList()
    this.advanceToken() // )
    this.compileSubroutineBody()
  }

  compileParameterList() {
    let type, name

    if (this.tokenizer.getLookAhead().token == ")") this.advanceToken()

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

  compileReturn() {
    this.advanceToken() // return keyword

    this.getCurrentToken() == ";"
      ? this.vmwriter.writePush("constant", 0)
      : this.writeExpressionVMCode(this.compileExpression())

    this.vmwriter.writeReturn()
    this.advanceToken() // symbol ;
  }

  compileExpression() {
    let exp = []

    exp.push(this.compileTerm())

    while (VALID_OPERATORS.includes(this.getCurrentToken())) {
      exp.push(this.getCurrentToken())
      this.advanceToken()
      exp.push(this.compileTerm())
    }

    return exp
  }

  compileIf() {
    this.labelId++
    this.advanceToken() // keyword if
    this.advanceToken() // symbol (
    this.writeExpressionVMCode(this.compileExpression())
    this.advanceToken() // symbol )
    this.advanceToken() // symbol {
    this.vmwriter.writeIf(`IF_TRUE${this.labelId}`)
    this.vmwriter.writeGoto(`IF_FALSE${this.labelId}`)
    this.vmwriter.writeLabel(`IF_TRUE${this.labelId}`)
    this.compileStatements()
    this.advanceToken() // symbol }

    if (this.getCurrentToken() == "else") {
      this.vmwriter.writeGoto(`IF_END${this.labelId}`)
    }

    this.vmwriter.writeLabel(`IF_FALSE${this.labelId}`)

    if (this.getCurrentToken() == "else") {
      this.advanceToken() // keyword else
      this.advanceToken() // symbol {
      this.compileStatements()
      this.advanceToken() // symbol }
      this.vmwriter.writeLabel(`IF_END${this.labelId}`)
    }
  }

  compileWhile() {
    this.labelId++
    this.advanceToken() // keyword while
    this.advanceToken() // symbol (
    this.vmwriter.writeLabel(`WHILE_EXP${this.labelId}`)
    this.writeExpressionVMCode(this.compileExpression())
    this.vmwriter.writeIf(`WHILE_IF${this.labelId}`)
    this.vmwriter.writeGoto(`WHILE_END${this.labelId}`)
    this.advanceToken() // symbol )
    this.advanceToken() // symbol {
    this.vmwriter.writeLabel(`WHILE_IF${this.labelId}`)
    this.compileStatements()
    this.vmwriter.writeGoto(`WHILE_EXP${this.labelId}`)
    this.vmwriter.writeLabel(`WHILE_END${this.labelId}`)
    this.advanceToken() // symbol }
  }

  compileExpressionList() {
    let nArgs = 0

    if (this.getCurrentToken() != ")") {
      this.writeExpressionVMCode(this.compileExpression())
      nArgs++
    }

    while (this.getCurrentToken() == ",") {
      this.advanceToken() // symbol ,
      this.writeExpressionVMCode(this.compileExpression())
      nArgs++
    }

    return nArgs
  }

  compileStatements() {
    while (this.getCurrentToken() != "}") {
      switch (this.getCurrentToken()) {
        case "let":
          this.compileLet()
          break
        case "return":
          this.compileReturn()
          break
        case "if":
          this.compileIf()
          break
        case "while":
          this.compileWhile()
          break
        case "do":
          this.compileDo()
          break
      }
    }
  }

  compileDo() {
    this.advanceToken() // keyword do
    this.compileSubroutineCall()
    this.advanceToken() // symbol ;
  }

  compileLet() {
    let name
    this.advanceToken() // keyword let

    if (this.tokenizer.getLookAhead().token == "[") {
      name = this.getCurrentToken()
      this.advanceToken() // [

      this.advanceToken() // exp start

      this.writeExpressionVMCode(this.compileExpression())

      const { kind, index } = this.symboltable.findIdentifier(name)

      this.vmwriter.writePush(kind, index)
      this.vmwriter.writeArithmetic("add")

      this.advanceToken() // ]
      this.advanceToken() // symbol =

      this.writeExpressionVMCode(this.compileExpression())
      this.vmwriter.writePop("temp", 0)
      this.vmwriter.writePop("pointer", 1)
      this.vmwriter.writePush("temp", 0)
      this.vmwriter.writePop("that", 0)

      this.advanceToken() // symbol ;
    } else {
      name = this.getCurrentToken()
      this.advanceToken() // identifier
      this.advanceToken() // symbol =

      this.writeExpressionVMCode(this.compileExpression())
      const { kind, index } = this.symboltable.findIdentifier(name)
      this.vmwriter.writePop(kind, index)

      this.advanceToken() // symbol ;
    }
  }

  compileSubroutineCall() {
    let name = this.getCurrentToken()
    this.advanceToken() // identifier

    const isMethod = this.symboltable.findIdentifier(name) != null

    if (this.getCurrentToken() == ".") {
      name += this.getCurrentToken()
      this.advanceToken() // symbol .
      name += this.getCurrentToken()
      this.advanceToken() // identifier
    }

    this.advanceToken() // symbol (
    this.vmwriter.writeCall(name, this.compileExpressionList())
    this.advanceToken() // symbol )
  }

  compileTerm() {
    switch (this.getCurrentTokenType()) {
      case "integerConstant": {
        let term = this.getCurrentToken()
        this.advanceToken()
        return term
      }

      case "symbol": {
        let term = []
        if (this.getCurrentToken() == "(") {
          term.push(this.getCurrentToken())
          this.advanceToken()
          term.push(this.compileExpression())
          term.push(this.getCurrentToken())
          this.advanceToken()
          return term
        }
        /*   else if (["-", "~"].includes(this.getCurrentToken())) {
          term += this.getCurrentToken()
          this.advanceToken()
          term += this.compileTerm()
          return term
        } */
      }

      case "identifier": {
        switch (this.tokenizer.getLookAhead().token) {
          case "(":
          case ".":
            this.compileSubroutineCall()
            return "functionCall"

          /*  case "[": {
            str = this.appendAdvance(str, "identifier")
            str = this.appendAdvance(str, "symbol")
            str = this.appendAdvance(
              str,
              "expression",
              this.compileExpression()
            )
            str = this.appendAdvance(str, "symbol")
            break
          } */

          default:
            let term = ""
            term += this.getCurrentToken() // identifier
            this.advanceToken()
            return term
        }
      }

      /*  case "keyword": {
        str = this.appendAdvance(str, "keyword")
        break
      } */

      /*   case "stringConstant": {
        str = this.appendAdvance(str, "stringConstant")
        break
      } */
    }
  }
}

module.exports = { CompilationEngine }
