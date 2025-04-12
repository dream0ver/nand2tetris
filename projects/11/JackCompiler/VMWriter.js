const fs = require("fs")
const path = require("path")

class VMWriter {
  filepath = ""
  filename = ""
  output = ""

  constructor(filepath) {
    this.filepath = filepath
    this.filename = path.parse(filepath).name
    this.prepareOutputFile()
  }

  prepareOutputFile() {
    this.output = path.join(path.dirname(this.filepath), `${this.filename}.vm`)
    fs.writeFileSync(this.output, "", "utf8")
  }

  write(cmd, arg1 = "", arg2 = "") {
    fs.appendFileSync(this.output, `${cmd} ${arg1} ${arg2}\n`, "utf-8")
  }

  writePush(segment, index) {
    this.write("push", segment, index)
  }

  writePop(segment, index) {
    this.write("pop", segment, index)
  }

  writeArithmetic(command) {
    this.write(command)
  }

  writeLabel(label) {
    this.write("label", label)
  }

  writeGoto(label) {
    this.write("goto", label)
  }

  writeIf(label) {
    this.write("if-goto", label)
  }

  writeCall(name, nArgs) {
    this.write("call", name, nArgs)
  }

  writeFunction(name, nLocals) {
    this.write("function", name, nLocals)
  }

  writeReturn() {
    this.write("return")
  }
}

module.exports = { VMWriter }
