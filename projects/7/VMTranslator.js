const FILE_SYSTEM = require("fs").promises
const PATH = require("path")

const INPUT_FILE_META = PATH.parse(process.argv[2])

const C_PUSH = "C_PUSH"
const C_POP = "C_POP"
const C_LABEL = "C_LABEL"
const C_GOTO = "C_GOTO"
const C_IF = "C_IF"
const C_ARITHMETIC = "C_ARITHMETIC"
const C_FUNCTION = "C_FUNCTION"
const C_RETURN = "C_RETURN"
const C_CALL = "C_CALL"

const OP_CODES = {
  add: "+",
  sub: "-",
  neg: "-",
  and: "&",
  or: "|",
  not: "!",
}
const JUMP_CODES = {
  eq: "JEQ",
  gt: "JGT",
  lt: "JLT",
}
const SEGMENT_CODES = {
  local: "LCL",
  argument: "ARG",
  this: "THIS",
  that: "THAT",
}
let LABEL_ID = -1

function writeInit() {
  return cmdarr(["@256", "D=A", "@SP", "M=D", "@Sys.init", "0;JMP"])
}

function commandtype(tokens) {
  switch (tokens[0]) {
    case "push":
      return C_PUSH

    case "pop":
      return C_POP

    case "label":
      return C_LABEL

    case "if-goto":
      return C_IF

    case "goto":
      return C_GOTO

    case "return":
      return C_RETURN

    case "call":
      return C_CALL

    case "function":
      return C_FUNCTION

    case "add":
    case "sub":
    case "neg":
    case "and":
    case "or":
    case "or":
    case "gt":
    case "lt":
    case "eq":
      return C_ARITHMETIC
  }
}

function cmdarr(cmds) {
  return cmds.join("\n")
}

function branch(tokenType, tokenName) {
  switch (tokenType) {
    case "label":
      return cmdarr([`(${tokenName})`])
    case "if-goto":
      return cmdarr(["@SP", "M=M-1", "A=M", "D=M", `@${tokenName}`, `D;JNE`])
    case "goto":
      return cmdarr([`@${tokenName}`, "0;JMP"])
  }
}

function pop(segment, index) {
  switch (segment) {
    case "local":
    case "argument":
    case "this":
    case "that":
      return cmdarr([
        `@${index}`,
        "D=A",
        `@${SEGMENT_CODES[segment]}`,
        "D=D+M",
        "@addr",
        "M=D",
        "@SP",
        "M=M-1",
        "A=M",
        "D=M",
        "@addr",
        "A=M",
        "M=D",
      ])
    case "temp":
      return cmdarr([
        "@13",
        "D=A",
        `@${index}`,
        "D=D+A",
        "@addr",
        "M=D",
        "@SP",
        "M=M-1",
        "A=M",
        "D=M",
        "@addr",
        "A=M",
        "M=D",
      ])
    case "static":
      return cmdarr([
        "@SP",
        "M=M-1",
        "A=M",
        "D=M",
        `@${INPUT_FILE_META.name}.${index}`,
        "M=D",
      ])
    case "pointer":
      return cmdarr([
        "@SP",
        "M=M-1",
        "A=M",
        "D=M",
        index != 0 ? "@4" : "@3",
        "M=D",
      ])
  }
}

function push(segment, index) {
  switch (segment) {
    case "constant":
      return cmdarr([`@${index}`, "D=A", "@SP", "A=M", "M=D", "@SP", "M=M+1"])
    case "local":
    case "argument":
    case "this":
    case "that":
      return cmdarr([
        `@${index}`,
        "D=A",
        `@${SEGMENT_CODES[segment]}`,
        "A=M+D",
        "D=M",
        "@SP",
        "A=M",
        "M=D",
        "@SP",
        "M=M+1",
      ])
    case "temp":
      return cmdarr([
        "@13",
        "D=A",
        `@${index}`,
        "D=D+A",
        "A=D",
        "D=M",
        "@SP",
        "A=M",
        "M=D",
        "@SP",
        "M=M+1",
      ])
    case "static":
      return cmdarr([
        `@${INPUT_FILE_META.name}.${index}`,
        "D=M",
        "@SP",
        "A=M",
        "M=D",
        "@SP",
        "M=M+1",
      ])
    case "pointer":
      return cmdarr([
        index != 0 ? "@4" : "@3",
        "D=M",
        "@SP",
        "A=M",
        "M=D",
        "@SP",
        "M=M+1",
      ])
  }
}

function compute(chunks) {
  const [op] = chunks
  switch (op) {
    case "add":
    case "sub":
    case "and":
    case "or":
      return cmdarr([
        "@SP",
        "M=M-1",
        "A=M",
        "D=M",
        "A=A-1",
        `M=M${OP_CODES[op]}D`,
      ])
    case "neg":
    case "not":
      return cmdarr([
        "@SP",
        "M=M-1",
        "A=M",
        `M=${OP_CODES[op]}M`,
        "@SP",
        "M=M+1",
      ])
    case "eq":
    case "gt":
    case "lt": {
      ++LABEL_ID
      return cmdarr([
        "@SP",
        "M=M-1",
        "A=M",
        "D=M",
        "A=A-1",
        "M=M-D",
        "D=M",
        `@jump_true_${LABEL_ID}`,
        `D;${JUMP_CODES[op]}`,
        "@SP",
        "A=M",
        "A=A-1",
        "M=0",
        `@continue_${LABEL_ID}`,
        "0;JMP",
        `(jump_true_${LABEL_ID})`,
        "@SP",
        "A=M",
        "A=A-1",
        "M=-1",
        `(continue_${LABEL_ID})`,
      ])
    }
  }
}

function parse(line) {
  const tokens = line.trim().split(" ")

  switch (commandtype(tokens)) {
    case C_PUSH:
      return push(...tokens.slice(1))

    case C_POP:
      return pop(...tokens.slice(1))

    case C_ARITHMETIC:
      return compute(tokens)

    case C_GOTO:
    case C_IF:
    case C_LABEL:
      return branch(...tokens)

    default:
      return null
  }
}

async function main() {
  if (!INPUT_FILE_META.name) throw new Error("Input file required.")

  const inputfile = await FILE_SYSTEM.open(
    PATH.join(INPUT_FILE_META.dir, INPUT_FILE_META.base)
  )

  const outputfile = await FILE_SYSTEM.open(
    PATH.join(INPUT_FILE_META.dir, `${INPUT_FILE_META.name}.asm`),
    "w"
  )

  for await (let inst of inputfile.readLines()) {
    const line = parse(inst)
    if (line) await outputfile.write(`// ${inst}` + "\n" + line + "\n")
  }
}

try {
  main()
} catch (err) {
  console.error(err.message)
}
