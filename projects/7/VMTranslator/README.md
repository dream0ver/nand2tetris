# VM Translator

## Overview

This VM Translator accepts two optional command-line arguments to enhance the output file:

- `--comments`: This argument adds comments in the output file for each translated VM command.
- `--init`: This argument includes the bootstrap code in the output file.
- `--debug`: This argument prints the vm program stats after the translation.

## Usage

To use the VM Translator, you can include the optional command-line arguments as follows:

```bash
node VMTranslator.js [options] <input_file/input_file(s)_directory>
```