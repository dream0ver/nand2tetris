const Tokenizer = require("./Tokenizer").Tokenizer;
const VMWriter = require("./VMWriter").VMWriter;
const SymbolTable = require("./SymbolTable").SymbolTable;

const VALID_OPERATORS = ["=", "|", "&", "<", ">", "+", "-", "*", "/", "~"];

class CompilationEngine {
  constructor(filepath) {
    this.className = "";
    this.tokenizer = new Tokenizer(filepath);
    this.vmwriter = new VMWriter(filepath);
    this.symboltable = new SymbolTable();
    this.whileLabelId = -1;
    this.ifLabelId = -1;
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
    this.symboltable.startSubroutine(name, type);
    this.whileLabelId = -1;
    this.ifLabelId = -1;

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

    if (this.symboltable.getSubroutineType() == "constructor") {
      this.vmwriter.writePush("constant", this.symboltable.varCount("field"));
      this.vmwriter.writeCall("Memory.alloc", 1);
      this.vmwriter.writePop("pointer", 0);
    }

    if (this.symboltable.getSubroutineType() == "method") {
      this.vmwriter.writePush("argument", 0);
      this.vmwriter.writePop("pointer", 0);
    }

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
      : this.compileExpression();

    this.vmwriter.writeReturn();
    this.advanceToken(); // ;
  }

  compileIf() {
    const id = ++this.ifLabelId;
    this.advanceToken(); // if
    this.advanceToken(); // (
    this.compileExpression();
    this.advanceToken(); // )
    this.advanceToken(); // {
    this.vmwriter.writeIf(`IF_TRUE${id}`);
    this.vmwriter.writeGoto(`IF_FALSE${id}`);
    this.vmwriter.writeLabel(`IF_TRUE${id}`);
    this.compileStatements();
    this.advanceToken(); // }

    if (this.getCurrentToken() == "else") {
      this.vmwriter.writeGoto(`IF_END${id}`);
    }

    this.vmwriter.writeLabel(`IF_FALSE${id}`);

    if (this.getCurrentToken() == "else") {
      this.advanceToken(); // else
      this.advanceToken(); // {
      this.compileStatements();
      this.advanceToken(); // }
      this.vmwriter.writeLabel(`IF_END${id}`);
    }
  }

  compileWhile() {
    const id = ++this.whileLabelId;
    this.advanceToken(); // while
    this.advanceToken(); // (
    this.vmwriter.writeLabel(`WHILE_EXP${id}`);
    this.compileExpression();
    this.vmwriter.writeArithmetic("not");
    this.vmwriter.writeIf(`WHILE_END${id}`);
    this.advanceToken(); // )
    this.advanceToken(); // {
    this.compileStatements();
    this.vmwriter.writeGoto(`WHILE_EXP${id}`);
    this.vmwriter.writeLabel(`WHILE_END${id}`);
    this.advanceToken(); // }
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
    this.vmwriter.writePop("temp", 0);
  }

  compileLet() {
    let name;
    this.advanceToken(); // let

    if (this.tokenizer.getLookAhead().token == "[") {
      name = this.getCurrentToken();
      this.advanceToken(); // [

      this.advanceToken(); // first token in expression

      this.compileExpression();

      const { kind, index } = this.symboltable.findIdentifier(name);

      this.vmwriter.writePush(kind, index);
      this.vmwriter.writeArithmetic("add");

      this.advanceToken(); // ]
      this.advanceToken(); // =

      this.compileExpression();
      this.vmwriter.writePop("temp", 0);
      this.vmwriter.writePop("pointer", 1);
      this.vmwriter.writePush("temp", 0);
      this.vmwriter.writePop("that", 0);

      this.advanceToken(); // ;
    } else {
      name = this.getCurrentToken();
      this.advanceToken(); // identifier
      this.advanceToken(); // =

      this.compileExpression();

      const { kind, index } = this.symboltable.findIdentifier(name);
      this.vmwriter.writePop(kind, index);

      this.advanceToken(); // ;
    }
  }

  compileSubroutineCall() {
    let name = this.getCurrentToken();
    let nArgs = 0;
    this.advanceToken(); // identifier

    const isMethod = this.symboltable.findIdentifier(name) != null;

    if (isMethod) {
      const { kind, index, type } = this.symboltable.findIdentifier(name);
      name = type;
      this.vmwriter.writePush(kind, index);
      nArgs++;
    }

    if (this.getCurrentToken() == ".") {
      name += this.getCurrentToken();
      this.advanceToken(); // .
      name += this.getCurrentToken();
      this.advanceToken(); // identifier
    } else {
      name = `${this.className}.${name}`;
      this.vmwriter.writePush("pointer", 0);
      nArgs++;
    }

    this.advanceToken(); // (
    this.vmwriter.writeCall(name, nArgs + this.compileExpressionList());
    this.advanceToken(); // )
  }

  compileExpression() {
    this.compileTerm();

    while (VALID_OPERATORS.includes(this.getCurrentToken())) {
      let cmd;
      switch (this.getCurrentToken()) {
        case "+":
          cmd = "add";
          break;
        case "-":
          cmd = "sub";
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
      this.advanceToken();
      this.compileTerm();
      this.vmwriter.writeArithmetic(cmd);
    }
  }

  compileExpressionList() {
    let nArgs = 0;

    if (this.getCurrentToken() != ")") {
      this.compileExpression();
      nArgs++;
    }

    while (this.getCurrentToken() == ",") {
      this.advanceToken(); // ,
      this.compileExpression();
      nArgs++;
    }

    return nArgs;
  }

  compileTerm() {
    switch (this.getCurrentTokenType()) {
      case "integerConstant": {
        this.vmwriter.writePush("constant", this.getCurrentToken());
        this.advanceToken();
        break;
      }

      case "stringConstant": {
        let str = this.getCurrentToken();
        this.vmwriter.writePush("constant", str.length);
        this.vmwriter.writeCall("String.new", 1);
        for (const char of str) {
          this.vmwriter.writePush("constant", char.charCodeAt(0));
          this.vmwriter.writeCall("String.appendChar", 2);
        }
        this.advanceToken();
        break;
      }

      case "keyword": {
        switch (this.getCurrentToken()) {
          case "false":
          case "null":
            this.vmwriter.writePush("constant", 0);
            break;
          case "true":
            this.vmwriter.writePush("constant", 0);
            this.vmwriter.writeArithmetic("not");
            break;
          case "this":
            this.vmwriter.writePush("pointer", 0);
            break;
        }
        this.advanceToken();
        break;
      }

      case "symbol": {
        if (this.getCurrentToken() == "(") {
          this.advanceToken();
          this.compileExpression();
          this.advanceToken();
          break;
        }
        if (["-", "~"].includes(this.getCurrentToken())) {
          let op = this.getCurrentToken();
          this.advanceToken();
          this.compileTerm();
          switch (op) {
            case "-":
              this.vmwriter.writeArithmetic("neg");
              break;
            case "~":
              this.vmwriter.writeArithmetic("not");
              break;
          }
        }
        break;
      }

      case "identifier": {
        switch (this.tokenizer.getLookAhead().token) {
          case ".":
          case "(":
            this.compileSubroutineCall();
            break;

          case "[": {
            let name = this.getCurrentToken();
            this.advanceToken(); // [
            this.advanceToken(); // first token in expression

            this.compileExpression();

            const { kind, index } = this.symboltable.findIdentifier(name);
            this.vmwriter.writePush(kind, index);
            this.vmwriter.writeArithmetic("add");

            this.vmwriter.writePop("pointer", 1);
            this.vmwriter.writePush("that", 0);

            this.advanceToken(); // ]
            break;
          }

          default:
            const { kind, index } = this.symboltable.findIdentifier(
              this.getCurrentToken()
            ); // identifier
            this.vmwriter.writePush(kind, index);
            this.advanceToken();
        }
      }
    }
  }
}

module.exports = { CompilationEngine };
