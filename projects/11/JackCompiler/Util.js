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

module.exports = {
  VALID_OPERATORS,
  VALID_SYMBOLS,
  VALID_KEYWORDS,
  VALID_TOKENS,
  OPERATOR_PRECEDENCE,
};
