const fs = require("fs").promises
const path = require("path")

const MAX_ROM = 32767

const MAX_RAM = 24576

const A_INSTRUCTION = "A_INSTRUCTION"

const C_INSTRUCTION = "C_INSTRUCTION"

const L_INSTRUCTION = "L_INSTRUCTION"

const PREDEFINED_SYMBOLS = {
  R0: 0,
  R1: 1,
  R2: 2,
  R3: 3,
  R4: 4,
  R5: 5,
  R6: 6,
  R7: 7,
  R8: 8,
  R9: 9,
  R10: 10,
  R11: 11,
  R12: 12,
  R13: 13,
  R14: 14,
  R15: 15,
  SCREEN: 16384,
  KBD: 24576,
  SP: 0,
  LCL: 1,
  ARG: 2,
  THIS: 3,
  THAT: 4,
}

const SYMBOL_TABLE = new Map(Object.entries(PREDEFINED_SYMBOLS))

let line_count = 0

let free_ram_location = 16

function get_jump_bits(exp) {
  if (exp == "JGT") return "001"
  if (exp == "JEQ") return "010"
  if (exp == "JGE") return "011"
  if (exp == "JLT") return "100"
  if (exp == "JNE") return "101"
  if (exp == "JLE") return "110"
  if (exp == "JMP") return "111"
  return "000"
}

function get_destination_bits(exp) {
  if (exp === "M") return "001"
  if (exp === "D") return "010"
  if (exp === "A") return "100"
  if (/^(?=.*A)(?=.*D)[AD]{2}$/.test(exp)) return "110"
  if (/^(?=.*A)(?=.*M)[AM]{2}$/.test(exp)) return "101"
  if (/^(?=.*D)(?=.*M)[DM]{2}$/.test(exp)) return "011"
  if (/^(?=.*A)(?=.*D)(?=.*M)[ADM]{3}$/.test(exp)) return "111"
  return "000"
}

function get_computation_bits(exp) {
  if (exp == "0") return "0101010"
  if (exp == "1") return "0111111"
  if (exp == "-1") return "0111010"
  if (exp == "D") return "0001100"
  if (exp == "A") return "0110000"
  if (exp == "M") return "1110000"
  if (exp == "!D") return "0001101"
  if (exp == "!A") return "0110001"
  if (exp == "!M") return "1110001"
  if (exp == "-D") return "0001111"
  if (exp == "-A") return "0110011"
  if (exp == "-M") return "1110011"
  if (exp == "D-1") return "0001110"
  if (exp == "A-1") return "0110010"
  if (exp == "M-1") return "1110010"
  if (exp == "D-A") return "0010011"
  if (exp == "D-M") return "1010011"
  if (exp == "A-D") return "0000111"
  if (exp == "M-D") return "1000111"
  if (exp == "D+1" || exp == "1+D") return "0011111"
  if (exp == "A+1" || exp == "1+A") return "0110111"
  if (exp == "M+1" || exp == "1+M") return "1110111"
  if (exp == "D+A" || exp == "A+D") return "0000010"
  if (exp == "D+M" || exp == "M+D") return "1000010"
  if (exp == "D&A" || exp == "A&D") return "0000000"
  if (exp == "D&M" || exp == "M&D") return "1000000"
  if (exp == "D|A" || exp == "A|D") return "0010101"
  if (exp == "D|M" || exp == "M|D") return "1010101"
}

function is_comment(str) {
  return str.startsWith("//")
}

function is_empty_line(str) {
  return !str
}

function decimal_to_binary(n) {
  let binary = ""

  while (n > 0) {
    binary = (n % 2) + binary
    n = Math.floor(n / 2)
  }

  return binary.padStart(15, 0).slice(-15)
}

function throw_error(code) {
  let msg
  switch (code) {
    case "RAM_RANGE": {
      msg = "Out of Memory: Memory allocation failed."
      break
    }
    case "ROM_RANGE": {
      msg =
        "Out of Range: Program cannot contain more than 32,767 instructions."
      break
    }
  }
  throw new Error(msg)
}

function p_address_instruction(symbol) {
  if (/^[0-9]+$/.test(symbol)) return `0${decimal_to_binary(symbol)}`

  if (SYMBOL_TABLE.has(symbol) == false) {
    if (free_ram_location > MAX_RAM) throw_error("RAM_RANGE")
    SYMBOL_TABLE.set(symbol, free_ram_location++)
  }

  return `0${decimal_to_binary(SYMBOL_TABLE.get(symbol))}`
}

function p_computation_instruction(str) {
  str = str.replace(/\s/g, "")

  if (str.includes(";") && !str.includes("=")) str = "=" + str

  if (!str.includes(";") && str.includes("=")) str = str + ";"

  const chunks = str.split(/[=;]/)

  return (
    "111" +
    get_computation_bits(chunks[1]) +
    get_destination_bits(chunks[0]) +
    get_jump_bits(chunks[2])
  )
}

function debug_log() {
  console.log({
    symbols: SYMBOL_TABLE.entries(),
    line_count,
    free_ram_location,
  })
}

function instruction_type(instruction) {
  if (/^[@].+$/.test(instruction)) return A_INSTRUCTION
  if (/^\(.+\)$/.test(instruction)) return L_INSTRUCTION
  return C_INSTRUCTION
}

function parse_line(line) {
  if (
    is_empty_line(line) ||
    is_comment(line) ||
    instruction_type(line) == L_INSTRUCTION
  )
    return null

  if (instruction_type(line) == A_INSTRUCTION)
    return p_address_instruction(line.substring(1))

  if (instruction_type(line) == C_INSTRUCTION)
    return p_computation_instruction(line)
}

async function get_inputfile_handle() {
  const { dir, base } = path.parse(process.argv[2])
  return fs.open(path.join(dir, base))
}

async function get_outputfile_handle() {
  const { dir, name } = path.parse(process.argv[2])
  return fs.open(path.join(dir, `${name}.hack`), "w")
}

async function pass1() {
  const inputfile = await get_inputfile_handle()

  for await (let instruction of inputfile.readLines()) {
    instruction = instruction.trim()

    if (is_empty_line(instruction) || is_comment(instruction)) continue

    ++line_count

    if (line_count > MAX_ROM) throw_error("ROM_RANGE")

    if (instruction_type(instruction) == L_INSTRUCTION) {
      const symbol = instruction.substring(1, instruction.length - 1)
      if (!SYMBOL_TABLE.has(symbol)) SYMBOL_TABLE.set(symbol, --line_count)
    }
  }
}

async function pass2() {
  const input = await get_inputfile_handle()
  const output = await get_outputfile_handle()

  for await (let line of input.readLines()) {
    line = parse_line(line.trim())
    if (line) await output.write(line + "\n")
  }
}

async function main() {
  try {
    await pass1()
    await pass2()
    debug_log()
    console.log("Translation Successfull.")
  } catch (err) {
    console.error(err.message, "\nTranslation Unsuccessfull.")
  } finally {
    process.exit(1)
  }
}

main()
