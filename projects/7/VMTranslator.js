const fs = require("fs").promises
const path = require("path")

const SOURCE_FILES = []
const INPUT_DIR_PATH = process.argv[2]

let CURR_FILE_NAME = ""
let FN_CALL_STACK = []
let LABEL_ID = -1

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
    case "not":
    case "gt":
    case "lt":
    case "eq":
      return C_ARITHMETIC
  }
}

function cmd(cmds) {
  return cmds.join("\n")
}

function branch(tokenType, tokenName) {
  const label = FN_CALL_STACK.length
    ? `${FN_CALL_STACK.slice(-1)[0]}$${tokenName}`
    : `${tokenName}`
  switch (tokenType) {
    case "label":
      return cmd([`(${label})`])
    case "if-goto":
      return cmd(["@SP", "M=M-1", "A=M", "D=M", `@${label}`, `D;JNE`])
    case "goto":
      return cmd([`@${label}`, "0;JMP"])
  }
}

function pop(segment, index) {
  switch (segment) {
    case "local":
    case "argument":
    case "this":
    case "that":
      return cmd([
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
      return cmd([
        "@5",
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
      return cmd([
        "@SP",
        "M=M-1",
        "A=M",
        "D=M",
        `@${CURR_FILE_NAME}.${index}`,
        "M=D",
      ])
    case "pointer":
      return cmd([
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
      return cmd([`@${index}`, "D=A", "@SP", "M=M+1", "A=M-1", "M=D"])
    case "local":
    case "argument":
    case "this":
    case "that":
      return cmd([
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
      return cmd([
        "@5",
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
      return cmd([
        `@${CURR_FILE_NAME}.${index}`,
        "D=M",
        "@SP",
        "A=M",
        "M=D",
        "@SP",
        "M=M+1",
      ])
    case "pointer":
      return cmd([
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
      return cmd([
        "@SP",
        "M=M-1",
        "A=M",
        "D=M",
        "A=A-1",
        `M=M${OP_CODES[op]}D`,
      ])
    case "neg":
    case "not":
      return cmd([
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
      return cmd([
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

function subroutine(tokenType, tokenName, nArgs = 0) {
  switch (tokenType) {
    case "function": {
      FN_CALL_STACK.push(tokenName)
      const cmds = [`(${tokenName})`, `@${nArgs}`, "D=A", "@R13", "M=D"]
      cmds.splice(cmds.length, "@SP", "M=M+1", "A=M-1", "M=0")
      return cmd(cmds)
    }

    case "call": {
      const cmds = []
      return cmd(cmds)
    }

    case "return": {
      FN_CALL_STACK.pop()
      return cmd([
        // Backup result
        "@SP",
        "A=M-1",
        "D=M",
        "@R14",
        "M=D",

        // Set SP = LCL
        "@LCL",
        "D=M",
        "@SP",
        "M=D",

        // Set THAT to Callers THAT
        "M=M-1",
        "A=M",
        "D=M",
        "@4",
        "M=D",

        // Set THIS to Callers THIS
        "@SP",
        "M=M-1",
        "A=M",
        "D=M",
        "@3",
        "M=D",

        // Set ARG to Callers ARG
        "@SP",
        "M=M-1",
        "A=M",
        "D=M",
        "@2",
        "M=D",

        // Set LCL to Callers LCL
        "@SP",
        "M=M-1",
        "A=M",
        "D=M",
        "@1",
        "M=D",

        // Backup Return Address
        "@SP",
        "M=M-1",
        "A=M",
        "D=M",
        "@R15",
        "M=D",

        // Replace Top value on stack with return value
        `@R13`,
        "D=M",
        "@SP",
        "M=M-D",
        "@R14",
        "D=M",
        "@SP",
        "A=M",
        "M=D",

        // Jumping to return address
        "@SP",
        "M=M+1",
        "@R15",
        "A=M",
        "0;JMP",
      ])
    }
  }
}

function parseInstruction(line) {
  const tokens = line.split(" ")

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

    case C_FUNCTION:
    case C_CALL:
    case C_RETURN:
      return subroutine(...tokens)
  }
}

async function readFiles() {
  const files = await fs.readdir(process.argv[2])
  files.forEach((file) => {
    if (path.extname(file).slice(1) == "vm") SOURCE_FILES.push(file)
  })
}

async function main() {
  await readFiles()

  if (!SOURCE_FILES.length)
    throw new Error(
      "Translation Failed : Directory does not contain .vm files."
    )

  const outputfile = await fs.open(
    path.join(INPUT_DIR_PATH, `${path.parse(INPUT_DIR_PATH).base}.asm`),
    "w"
  )

  for (const curr_file of SOURCE_FILES) {
    CURR_FILE_NAME = path.parse(curr_file).name
    const inputfile = await fs.open(path.join(INPUT_DIR_PATH, curr_file))

    for await (let instruction of inputfile.readLines()) {
      instruction = instruction.trim()
      const line = parseInstruction(instruction)
      if (line) await outputfile.write(`// ${instruction}` + "\n" + line + "\n")
    }
  }
}

try {
  main()
} catch (err) {
  console.error(err.message)
}
