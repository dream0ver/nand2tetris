class SymbolTable {
  constructor() {
    this.class_table = {};
    this.subroutine_table = {};
    this.subroutine_name = "";
    this.subroutine_type = "";
  }

  startSubroutine(name, type) {
    this.subroutine_name = name;
    this.subroutine_type = type;
    this.subroutine_table = {};
  }

  getSubroutineType() {
    return this.subroutine_type;
  }

  getSubroutineName() {
    return this.subroutine_name;
  }

  getTableByKind(kind) {
    return ["static", "field"].includes(kind)
      ? this.class_table
      : this.subroutine_table;
  }

  getIndex(kind) {
    const table = this.getTableByKind(kind);
    return Object.keys(table).filter(key => table[key].kind == kind).length;
  }

  define(name, type, kind) {
    const table = this.getTableByKind(kind);
    table[name] = {
      type,
      kind,
      index: this.getIndex(kind),
    };
  }

  findIdentifier(name) {
    if (this.subroutine_table.hasOwnProperty(name)) {
      return this.subroutine_table[name];
    } else if (this.class_table.hasOwnProperty(name)) {
      return this.class_table[name];
    } else {
      return null;
    }
  }
  varCount(kind) {
    return this.getIndex(kind);
  }

  kindOf(name) {
    return this.findIdentifier(name)?.kind;
  }

  typeOf(name) {
    return this.findIdentifier(name)?.type;
  }

  indexOf(name) {
    return this.findIdentifier(name)?.index;
  }
}

module.exports = { SymbolTable };
