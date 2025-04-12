class VMWriter {
  constructor() {}
  writePush(segment, index) {}
  writePop(segment, index) {}
  writeArithmetic(command) {}
  writeLabel(label) {}
  writeGoto(label) {}
  writeIf(label) {}
  writeCall(name, nArgs) {}
  writeFunction(name, nLocals) {}
  writeReturn() {}
  close() {}
}
