const fs = require("fs").promises
const path = require("path")

const opcodes = {
  add: "+",
  sub: "-",
  and: "&",
  or: "|",
  neg: "-",
  not: "!",
  eq: "=",
  gt: ">",
  lt: "<",
}

function is_comment(str) {
  return str.startsWith("//")
}

function is_empty_line(str) {
  return !str
}

function formatCmds(cmds) {
  return cmds.join("\n")
}

function handlePush(chunks) {
  const [segment, index] = chunks

  switch (segment) {
    case "constant": {
      return formatCmds([
        `@${index}`,
        "D=A",
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
      return formatCmds([
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
      return formatCmds([
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
    }
  }
}

function parse(inst) {
  inst = inst.trim()
  const chunks = inst.split(" ")

  if (is_empty_line(inst) || is_comment(inst)) return null

  if (chunks[0] == "push") return handlePush(chunks.slice(1))

  return handleOperation(chunks)
}

async function main() {
  const arg = process.argv[2]

  if (!arg) throw new Error("Input file required.")

  const { dir, base, name } = path.parse(arg)

  const inputfile = await fs.open(path.join(dir, base))

  const outputfile = await fs.open(path.join(dir, `${name}.asm`), "w")

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
