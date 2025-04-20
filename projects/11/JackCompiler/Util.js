const VALID_OPERATORS = ["=", "|", "&", "<", ">", "+", "-", "*", "/", "~"];

const OPERATOR_PRECEDENCE = {
  "=": 1,
  "|": 2,
  "&": 3,
  "<": 4,
  ">": 4,
  "+": 5,
  "-": 5,
  "*": 6,
  "/": 6,
  "~": 7,
};

const VALID_SYMBOLS = [
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
];

const VALID_KEYWORDS = [
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
];

const VALID_TOKENS = {
  SYMBOL: "symbol",
  IDENTIFIER: "identifier",
  KEYWORD: "keyword",
  STRING_CONST: "stringConstant",
  INT_CONST: "integerConstant",
};

function INFIX_TO_POSTFIX(exp) {
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

module.exports = {
  VALID_OPERATORS,
  VALID_SYMBOLS,
  VALID_KEYWORDS,
  VALID_TOKENS,
  OPERATOR_PRECEDENCE,
  INFIX_TO_POSTFIX,
};
