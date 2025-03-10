const fs = require("fs").promises
const path = require("path")

const SOURCE_FILES = []
const CLI_FLAGS = process.argv.slice(2, process.argv.length - 1)
const INPUT_DIR_PATH = process.argv.slice(-1)[0]

let CURR_FILE_NAME = ""
let CURR_FUNCTION_SCOPE = ""
let SERIAL_ID = -1

const C_PUSH = "C_PUSH"
const C_POP = "C_POP"
const C_LABEL = "C_LABEL"
const C_GOTO = "C_GOTO"
const C_IF = "C_IF"
const C_ARITHMETIC = "C_ARITHMETIC"
const C_FUNCTION = "C_FUNCTION"
const C_RETURN = "C_RETURN"
const C_CALL = "C_CALL"

const PUSH_D = ["@SP", "M=M+1", "A=M-1", "M=D"]
const POP_D = ["@SP", "AM=M-1", "D=M"]

const $INIT = ["@256", "D=A", "@SP", "M=D", subroutine("call", "Sys.init", 0)]
const $COMPARATOR = [
  // Greater Than Comparator
  "($$gt)",
  "@SP",
  "AM=M-1",
  "D=M",
  "A=A-1",
  "MD=M-D",
  "@jump_if_gt_true",
  "D;JGT",
  "@SP",
  "A=M-1",
  "M=0",
  `@$$resume_gt`,
  "0;JMP",
  "(jump_if_gt_true)",
  "@SP",
  "A=M-1",
  "M=-1",
  `($$resume_gt)`,
  "@returnaddress",
  "A=M",
  "0;JMP",

  // Less Than Comparator
  "($$lt)",
  "@SP",
  "AM=M-1",
  "D=M",
  "A=A-1",
  "MD=M-D",
  "@jump_if_lt_true",
  "D;JLT",
  "@SP",
  "A=M-1",
  "M=0",
  `@$$resume_lt`,
  "0;JMP",
  "(jump_if_lt_true)",
  "@SP",
  "A=M-1",
  "M=-1",
  `($$resume_lt)`,
  "@returnaddress",
  "A=M",
  "0;JMP",

  // Equal Comparator
  "($$eq)",
  "@SP",
  "AM=M-1",
  "D=M",
  "A=A-1",
  "MD=M-D",
  "@jump_if_eq_true",
  "D;JEQ",
  "@SP",
  "A=M-1",
  "M=0",
  `@$$resume_eq`,
  "0;JMP",
  "(jump_if_eq_true)",
  "@SP",
  "A=M-1",
  "M=-1",
  `($$resume_eq)`,
  "@returnaddress",
  "A=M",
  "0;JMP",
]
const $RETURN = [
  "($$return)",

  // FRAME = LCL
  "@LCL",
  "D=M",
  "@FRAME",
  "M=D",

  // RET = *(FRAME-5)
  "@FRAME",
  "D=M",
  "@5",
  "AD=D-A",
  "D=M",
  "@returnaddress",
  "M=D",

  // *ARG = pop()
  "@SP",
  "AM=M-1",
  "D=M",
  "@ARG",
  "A=M",
  "M=D",

  // SP = ARG + 1
  "D=A+1",
  "@SP",
  "M=D",

  // THAT = *(FRAME-1)
  "@FRAME",
  "D=M",
  "@1",
  "D=D-A",
  "A=D",
  "D=M",
  "@THAT",
  "M=D",

  // THIS = *(FRAME-2)
  "@FRAME",
  "D=M",
  "@2",
  "AD=D-A",
  "D=M",
  "@THIS",
  "M=D",

  // ARG = *(FRAME-3)
  "@FRAME",
  "D=M",
  "@3",
  "AD=D-A",
  "D=M",
  "@ARG",
  "M=D",

  // LCL = *(FRAME-4)
  "@FRAME",
  "D=M",
  "@4",
  "AD=D-A",
  "D=M",
  "@LCL",
  "M=D",

  // goto RET
  "@returnaddress",
  "A=M",
  "0;JMP",
]

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
  const label = CURR_FUNCTION_SCOPE.length
    ? `${CURR_FUNCTION_SCOPE}$${tokenName}`
    : `${tokenName}`
  switch (tokenType) {
    case "label":
      return cmd([`(${label})`])
    case "if-goto":
      return cmd([...POP_D, `@${label}`, `D;JNE`])
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
        "@address_pointer",
        "M=D",
        ...POP_D,
        "@address_pointer",
        "A=M",
        "M=D",
      ])
    case "temp":
      return cmd([...POP_D, `@${index + 5}`, "M=D"])
    case "static":
      return cmd([...POP_D, `@${CURR_FILE_NAME}.${index}`, "M=D"])
    case "pointer":
      return cmd([...POP_D, index == 0 ? "@THIS" : "@THAT", "M=D"])
  }
}

function push(segment, index) {
  switch (segment) {
    case "constant":
      return cmd([`@${index}`, "D=A", ...PUSH_D])
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
        ...PUSH_D,
      ])
    case "temp":
      return cmd([`@${index + 5}`, "D=M", ...PUSH_D])
    case "static":
      return cmd([`@${CURR_FILE_NAME}.${index}`, "D=M", ...PUSH_D])
    case "pointer":
      return cmd([index != 0 ? "@4" : "@3", "D=M", ...PUSH_D])
  }
}

function compute(chunks) {
  const [op] = chunks
  switch (op) {
    case "add":
    case "sub":
    case "and":
    case "or":
      return cmd([...POP_D, "A=A-1", `M=M${OP_CODES[op]}D`])
    case "neg":
    case "not":
      return cmd(["@SP", "A=M-1", `M=${OP_CODES[op]}M`])
    case "eq":
    case "gt":
    case "lt": {
      ++SERIAL_ID
      if (CLI_FLAGS.includes("--init")) {
        return cmd([
          `@resume_${SERIAL_ID}`,
          "D=A",
          `@returnaddress`,
          "M=D",
          `@$$${op}`,
          "0;JMP",
          `(resume_${SERIAL_ID})`,
        ])
      } else {
        return cmd([
          ...POP_D,
          "A=A-1",
          "MD=M-D",
          `@jump_true_${SERIAL_ID}`,
          `D;${JUMP_CODES[op]}`,
          "@SP",
          "A=M-1",
          "M=0",
          `@continue_${SERIAL_ID}`,
          "0;JMP",
          `(jump_true_${SERIAL_ID})`,
          "@SP",
          "A=M-1",
          "M=-1",
          `(continue_${SERIAL_ID})`,
        ])
      }
    }
  }
}

function subroutine(tokenType, tokenName, localVarCount = 0) {
  switch (tokenType) {
    case "function": {
      CURR_FUNCTION_SCOPE = tokenName
      const cmds = [`(${tokenName})`]
      for (let i = localVarCount; i > 0; i--)
        cmds.splice(cmds.length, 4, "@SP", "M=M+1", "A=M-1", "M=0")
      return cmd(cmds)
    }

    case "call": {
      ++SERIAL_ID

      return cmd([
        // push return-address
        `@return_address_${SERIAL_ID}`,
        "D=A",
        ...PUSH_D,

        // push LCL
        "@LCL",
        "D=M",
        ...PUSH_D,

        // push ARG
        "@ARG",
        "D=M",
        ...PUSH_D,

        // push THIS
        "@THIS",
        "D=M",
        ...PUSH_D,

        // push THAT
        "@THAT",
        "D=M",
        ...PUSH_D,

        // ARG = SP-n-5
        "@SP",
        "D=M",
        `@${localVarCount}`,
        "D=D-A",
        "@5",
        "D=D-A",
        "@ARG",
        "M=D",

        // LCL = SP
        "@SP",
        "D=M",
        "@LCL",
        "M=D",

        // goto f
        `@${tokenName}`,
        "0;JMP",

        // (return-address)
        `(return_address_${SERIAL_ID})`,
      ])
    }

    case "return":
      return CLI_FLAGS.includes("--init")
        ? cmd(["@$$return", "0;JMP"])
        : cmd($RETURN.slice(1))
  }
}

function parseInstruction(line) {
  const tokens = line.split(/[\t\s]/)

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
  const files = await fs.readdir(INPUT_DIR_PATH)
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

  if (CLI_FLAGS.includes("--init"))
    await outputfile.write(cmd([...$INIT, ...$COMPARATOR, ...$RETURN]) + "\n")

  for (const curr_file of SOURCE_FILES) {
    CURR_FILE_NAME = path.parse(curr_file).name
    const inputfile = await fs.open(path.join(INPUT_DIR_PATH, curr_file))

    for await (let instruction of inputfile.readLines()) {
      instruction = instruction.trim()
      const line = parseInstruction(instruction)
      if (line)
        await outputfile.write(
          (CLI_FLAGS.includes("--comments") ? `// ${instruction}` + "\n" : "") +
            line +
            "\n"
        )
    }
  }
}

try {
  main()
} catch (err) {
  console.error(err.message)
}
