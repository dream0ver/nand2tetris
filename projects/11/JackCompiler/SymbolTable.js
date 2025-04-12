class SymbolTable {
  constructor() {
    this.class_table = {}
    this.subroutine_table = {}
  }

  startSubroutine() {
    subroutine_table = {}
  }

  getTableByKind(kind) {
    return ["STATIC", "FIELD"].includes(kind)
      ? this.class_table
      : this.subroutine_table
  }

  getIndex(kind) {
    const table = this.getTableByKind(kind)
    return Object.keys(table).filter((key) => table[key].kind == kind).length
  }

  define(name, type, kind) {
    const table = this.getTableByKind(kind)
    table[name] = {
      type,
      kind,
      index: this.getIndex(kind),
    }
  }

  findIdentifier(name) {
    if (this.subroutine_table.hasOwnProperty(name)) {
      return this.subroutine_table[name]
    } else if (this.class_table.hasOwnProperty(name)) {
      return this.class_table[name]
    } else {
      return null
    }
  }
  varCount(kind) {
    return this.getIndex(kind)
  }

  kindOf(name) {
    return this.findIdentifier(name)?.kind
  }

  typeOf(name) {
    return this.findIdentifier(name)?.type
  }

  indexOf(name) {
    return this.findIdentifier(name)?.index
  }
}
