const fs = require("fs").promises
const path = require("path")

const INPUT_FILE_META = path.parse(process.argv[2])

const opcodes = {
  add: "+",
  sub: "-",
  and: "&",
  or: "|",
  neg: "-",
  not: "!",
}

const jumpcodes = {
  eq: "JEQ",
  gt: "JGT",
  lt: "JLT",
}

const segments = {
  local: "LCL",
  argument: "ARG",
  this: "THIS",
  that: "THAT",
}

let label_id = -1

function is_comment(str) {
  return str.startsWith("//")
}

function is_empty_line(str) {
  return !str
}

function cmdarr(cmds) {
  return cmds.join("\n")
}

function pop(segment, index) {
  switch (segment) {
    case "local":
    case "argument":
    case "this":
    case "that": {
      return cmdarr([
        `@${index}`,
        "D=A",
        `@${segments[segment]}`,
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
    }
    case "temp": {
      return cmdarr([
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
    }
    case "static": {
      return cmdarr([
        "@SP",
        "M=M-1",
        "A=M",
        "D=M",
        `@${INPUT_FILE_META.name}.${index}`,
        "M=D",
      ])
    }
    case "pointer": {
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
}

function push(segment, index) {
  switch (segment) {
    case "constant": {
      return cmdarr([`@${index}`, "D=A", "@SP", "A=M", "M=D", "@SP", "M=M+1"])
    }
    case "local":
    case "argument":
    case "this":
    case "that": {
      return cmdarr([
        `@${index}`,
        "D=A",
        `@${segments[segment]}`,
        "A=M+D",
        "D=M",
        "@SP",
        "A=M",
        "M=D",
        "@SP",
        "M=M+1",
      ])
    }
    case "temp": {
      return cmdarr([
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
    }
    case "static": {
      return cmdarr([
        `@${INPUT_FILE_META.name}.${index}`,
        "D=M",
        "@SP",
        "A=M",
        "M=D",
        "@SP",
        "M=M+1",
      ])
    }
    case "pointer": {
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
}

function handleOperation(chunks) {
  const [op] = chunks
  switch (op) {
    case "add":
    case "sub":
    case "and":
    case "or": {
      return cmdarr([
        "@SP",
        "M=M-1",
        "A=M",
        "D=M",
        "A=A-1",
        `M=M${opcodes[op]}D`,
      ])
    }
    case "neg":
    case "not": {
      return cmdarr([
        "@SP",
        "M=M-1",
        "A=M",
        `M=${opcodes[op]}M`,
        "@SP",
        "M=M+1",
      ])
    }
    case "eq":
    case "gt":
    case "lt": {
      ++label_id
      return cmdarr([
        "@SP",
        "M=M-1",
        "A=M",
        "D=M",
        "A=A-1",
        "M=M-D",
        "D=M",
        `@jump_true_${label_id}`,
        `D;${jumpcodes[op]}`,
        "@SP",
        "A=M",
        "A=A-1",
        "M=0",
        `@continue_${label_id}`,
        "0;JMP",
        `(jump_true_${label_id})`,
        "@SP",
        "A=M",
        "A=A-1",
        "M=-1",
        `(continue_${label_id})`,
      ])
    }
  }
}

function parse(inst) {
  inst = inst.trim()
  const chunks = inst.split(" ")

  if (is_empty_line(inst) || is_comment(inst)) return null

  if (chunks[0] == "push") return push(...chunks.slice(1))

  if (chunks[0] == "pop") return pop(...chunks.slice(1))

  return handleOperation(chunks)
}

async function main() {
  if (!INPUT_FILE_META.name) throw new Error("Input file required.")

  const inputfile = await fs.open(
    path.join(INPUT_FILE_META.dir, INPUT_FILE_META.base)
  )

  const outputfile = await fs.open(
    path.join(INPUT_FILE_META.dir, `${INPUT_FILE_META.name}.asm`),
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
