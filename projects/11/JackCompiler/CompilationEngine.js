const Tokenizer = require("./Tokenizer").Tokenizer;
const VMWriter = require("./VMWriter").VMWriter;
const SymbolTable = require("./SymbolTable").SymbolTable;
const { VALID_OPERATORS, OPERATOR_PRECEDENCE } = require("./Util");

class CompilationEngine {
  constructor(filepath) {
    this.className = "";
    this.tokenizer = new Tokenizer(filepath);
    this.vmwriter = new VMWriter(filepath);
    this.symboltable = new SymbolTable();
    this.labelId = -1;
  }

  advanceToken() {
    this.tokenizer.advance();
  }

  getCurrentToken() {
    return this.tokenizer.current.token;
  }

  getCurrentTokenType() {
    return this.tokenizer.current.type;
  }

  infixToPostfix(exp) {
    const stack = [];
    let postfix = [];
    for (const c of exp) {
      if (c === "(") {
        stack.push(c);
      } else if (c === ")") {
        while (stack.length && stack[stack.length - 1] !== "(")
          postfix.push(stack.pop());
        stack.pop();
      } else if (VALID_OPERATORS.includes(c)) {
        while (
          stack.length &&
          VALID_OPERATORS.includes(stack[stack.length - 1]) &&
          OPERATOR_PRECEDENCE[stack[stack.length - 1]] >= OPERATOR_PRECEDENCE[c]
        ) {
          postfix.push(stack.pop());
        }
        stack.push(c);
      } else {
        postfix.push(c);
      }
    }
    while (stack.length) postfix.push(stack.pop());
    return postfix;
  }

  writeExpressionVMCode(exp) {
    exp = this.infixToPostfix(exp.flat(999999999));
    if (exp[0] == "functionCall") return;
    if (exp[0] == "stringConstant") {
      this.vmwriter.writePush("constant", exp[1].length);
      this.vmwriter.writeCall("String.new", 1);
      for (const char of exp[1]) {
        this.vmwriter.writePush("constant", char.charCodeAt(0));
        this.vmwriter.writeCall("String.appendChar", 2);
      }
      return;
    }
    let prevOperandCount = 0;
    for (const c of exp) {
      if (VALID_OPERATORS.includes(c)) {
        let cmd;
        switch (c) {
          case "+":
            cmd = "add";
            break;
          case "-":
            cmd = prevOperandCount == 2 ? "sub" : "neg";
            break;
          case "~":
            cmd = "not";
            break;
          case "*":
            cmd = "call Math.multiply 2";
            break;
          case "/":
            cmd = "call Math.divide 2";
            break;
          case "=":
            cmd = "eq";
            break;
          case ">":
            cmd = "gt";
            break;
          case "<":
            cmd = "lt";
            break;
          case "&":
            cmd = "and";
            break;
          case "|":
            cmd = "or";
            break;
        }
        this.vmwriter.writeArithmetic(cmd);
        prevOperandCount = 0;
      } else if (["false", "true", "this", "null"].includes(c)) {
        switch (c) {
          case "false":
          case "null":
            this.vmwriter.writePush("constant", 0);
            break;
          case "true":
            this.vmwriter.writePush("constant", 0);
            this.vmwriter.writeArithmetic("not");
            break;
        }
      } else {
        prevOperandCount++;
        if (this.symboltable.findIdentifier(c) != null) {
          const { kind, index } = this.symboltable.findIdentifier(c);
          this.vmwriter.writePush(kind, index);
        } else {
          this.vmwriter.writePush("constant", c);
        }
      }
    }
  }

  compile() {
    this.compileClass();
  }

  compileClass() {
    let validClassVarPrefix = ["static", "field"];
    let validSubroutinePrefix = ["constructor", "function", "method"];

    this.advanceToken(); // class
    this.advanceToken(); // identifier
    this.className = this.getCurrentToken();
    this.advanceToken(); // {
    this.advanceToken();

    while (validClassVarPrefix.includes(this.getCurrentToken()))
      this.compileClassVarDec();

    while (validSubroutinePrefix.includes(this.getCurrentToken()))
      this.compileSubroutine();

    this.advanceToken(); // }
  }

  compileClassVarDec() {
    let kind, type, name;
    kind = this.getCurrentToken();
    this.advanceToken(); // type
    type = this.getCurrentToken();
    this.advanceToken(); // identifier
    name = this.getCurrentToken();
    this.symboltable.define(name, type, kind);
    this.advanceToken(); // , or ;

    while (this.getCurrentToken() != ";") {
      this.advanceToken(); // identifier
      name = this.getCurrentToken();
      this.symboltable.define(name, type, kind);
      this.advanceToken(); // symbol (, or ;)
    }

    this.advanceToken(); // symbol (, or ;)
  }

  compileSubroutine() {
    let type, name;

    type = this.getCurrentToken(); // method or constructor or function
    this.advanceToken(); // return type
    this.advanceToken(); // identifier
    name = this.getCurrentToken();
    this.symboltable.startSubroutine(name);

    if (type == "method") {
      this.symboltable.define("this", this.className, "argument");
    }

    this.advanceToken(); // (
    this.compileParameterList();
    this.advanceToken(); // )
    this.compileSubroutineBody();
  }

  compileParameterList() {
    let type, name;

    if (this.tokenizer.getLookAhead().token == ")") this.advanceToken();

    while (this.getCurrentToken() != ")") {
      this.advanceToken(); // type
      type = this.getCurrentToken();
      this.advanceToken(); // identifier
      name = this.getCurrentToken();
      this.symboltable.define(name, type, "argument");
      this.advanceToken(); // , or )
    }
  }

  compileSubroutineBody() {
    this.advanceToken(); // {

    while (this.getCurrentToken() == "var") this.compileVarDec();

    this.vmwriter.writeFunction(
      `${this.className}.${this.symboltable.getSubroutineName()}`,
      this.symboltable.varCount("local")
    );

    this.compileStatements();

    this.advanceToken(); // }
  }

  compileVarDec() {
    let type, name;

    this.advanceToken();
    type = this.getCurrentToken();
    this.advanceToken();
    name = this.getCurrentToken();
    this.symboltable.define(name, type, "local");
    this.advanceToken();

    while (this.getCurrentToken() != ";") {
      this.advanceToken(); // identifier
      name = this.getCurrentToken();
      this.symboltable.define(name, type, "local");
      this.advanceToken(); // , or ;
    }

    this.advanceToken(); // ;
  }

  compileReturn() {
    this.advanceToken(); // return

    this.getCurrentToken() == ";"
      ? this.vmwriter.writePush("constant", 0)
      : this.writeExpressionVMCode(this.compileExpression());

    this.vmwriter.writeReturn();
    this.advanceToken(); // ;
  }

  compileExpression() {
    let exp = [];

    exp.push(this.compileTerm());

    while (VALID_OPERATORS.includes(this.getCurrentToken())) {
      exp.push(this.getCurrentToken());
      this.advanceToken();
      exp.push(this.compileTerm());
    }

    return exp;
  }

  compileIf() {
    this.labelId++;
    this.advanceToken(); // if
    this.advanceToken(); // (
    this.writeExpressionVMCode(this.compileExpression());
    this.advanceToken(); // )
    this.advanceToken(); // {
    this.vmwriter.writeIf(`IF_TRUE${this.labelId}`);
    this.vmwriter.writeGoto(`IF_FALSE${this.labelId}`);
    this.vmwriter.writeLabel(`IF_TRUE${this.labelId}`);
    this.compileStatements();
    this.advanceToken(); // }

    if (this.getCurrentToken() == "else") {
      this.vmwriter.writeGoto(`IF_END${this.labelId}`);
    }

    this.vmwriter.writeLabel(`IF_FALSE${this.labelId}`);

    if (this.getCurrentToken() == "else") {
      this.advanceToken(); // else
      this.advanceToken(); // {
      this.compileStatements();
      this.advanceToken(); // }
      this.vmwriter.writeLabel(`IF_END${this.labelId}`);
    }
  }

  compileWhile() {
    this.labelId++;
    this.advanceToken(); // while
    this.advanceToken(); // (
    this.vmwriter.writeLabel(`WHILE_EXP${this.labelId}`);
    this.writeExpressionVMCode(this.compileExpression());
    this.vmwriter.writeIf(`WHILE_IF${this.labelId}`);
    this.vmwriter.writeGoto(`WHILE_END${this.labelId}`);
    this.advanceToken(); // )
    this.advanceToken(); // {
    this.vmwriter.writeLabel(`WHILE_IF${this.labelId}`);
    this.compileStatements();
    this.vmwriter.writeGoto(`WHILE_EXP${this.labelId}`);
    this.vmwriter.writeLabel(`WHILE_END${this.labelId}`);
    this.advanceToken(); // }
  }

  compileExpressionList() {
    let nArgs = 0;

    if (this.getCurrentToken() != ")") {
      this.writeExpressionVMCode(this.compileExpression());
      nArgs++;
    }

    while (this.getCurrentToken() == ",") {
      this.advanceToken(); // ,
      this.writeExpressionVMCode(this.compileExpression());
      nArgs++;
    }

    return nArgs;
  }

  compileStatements() {
    while (this.getCurrentToken() != "}") {
      switch (this.getCurrentToken()) {
        case "let":
          this.compileLet();
          break;
        case "return":
          this.compileReturn();
          break;
        case "if":
          this.compileIf();
          break;
        case "while":
          this.compileWhile();
          break;
        case "do":
          this.compileDo();
          break;
      }
    }
  }

  compileDo() {
    this.advanceToken(); // do
    this.compileSubroutineCall();
    this.advanceToken(); // ;
  }

  compileLet() {
    let name;
    this.advanceToken(); // let

    if (this.tokenizer.getLookAhead().token == "[") {
      name = this.getCurrentToken();
      this.advanceToken(); // [

      this.advanceToken(); // first token in expression

      this.writeExpressionVMCode(this.compileExpression());

      const { kind, index } = this.symboltable.findIdentifier(name);

      this.vmwriter.writePush(kind, index);
      this.vmwriter.writeArithmetic("add");

      this.advanceToken(); // ]
      this.advanceToken(); // =

      this.writeExpressionVMCode(this.compileExpression());
      this.vmwriter.writePop("temp", 0);
      this.vmwriter.writePop("pointer", 1);
      this.vmwriter.writePush("temp", 0);
      this.vmwriter.writePop("that", 0);

      this.advanceToken(); // ;
    } else {
      name = this.getCurrentToken();
      this.advanceToken(); // identifier
      this.advanceToken(); // =

      this.writeExpressionVMCode(this.compileExpression());
      const { kind, index } = this.symboltable.findIdentifier(name);
      this.vmwriter.writePop(kind, index);

      this.advanceToken(); // ;
    }
  }

  compileSubroutineCall() {
    let name = this.getCurrentToken();
    this.advanceToken(); // identifier

    const isMethod = this.symboltable.findIdentifier(name) != null;

    if (this.getCurrentToken() == ".") {
      name += this.getCurrentToken();
      this.advanceToken(); // .
      name += this.getCurrentToken();
      this.advanceToken(); // identifier
    }

    this.advanceToken(); // (
    this.vmwriter.writeCall(name, this.compileExpressionList());
    this.advanceToken(); // )
  }

  compileTerm() {
    switch (this.getCurrentTokenType()) {
      case "integerConstant": {
        let term = this.getCurrentToken();
        this.advanceToken();
        return term;
      }

      case "symbol": {
        let term = [];
        if (this.getCurrentToken() == "(") {
          term.push(this.getCurrentToken());
          this.advanceToken();
          term.push(this.compileExpression());
          term.push(this.getCurrentToken());
          this.advanceToken();
          return term;
        } else if (["-", "~"].includes(this.getCurrentToken())) {
          let term = [];
          term.push(this.getCurrentToken());
          this.advanceToken();
          term.push(this.compileTerm());
          return term;
        }
      }

      case "identifier": {
        switch (this.tokenizer.getLookAhead().token) {
          case "(":
          case ".":
            this.compileSubroutineCall();
            return "functionCall";

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
            let term = "";
            term += this.getCurrentToken(); // identifier
            this.advanceToken();
            return term;
        }
      }

      case "keyword": {
        let term = this.getCurrentToken();
        this.advanceToken();
        return term;
      }

      case "stringConstant": {
        let term = ["stringConstant", this.getCurrentToken()];
        this.advanceToken();
        return term;
      }
    }
  }
}

module.exports = { CompilationEngine };
