// function SimpleFunction.test 2
(SimpleFunction.test)
@2
D=A
@SP
M=M+D
@nArgs
M=D
// push local 0
@0
D=A
@LCL
A=M+D
D=M
@SP
A=M
M=D
@SP
M=M+1
// push local 1
@1
D=A
@LCL
A=M+D
D=M
@SP
A=M
M=D
@SP
M=M+1
// add
@SP
M=M-1
A=M
D=M
A=A-1
M=M+D
// not
@SP
M=M-1
A=M
M=!M
@SP
M=M+1
// push argument 0
@0
D=A
@ARG
A=M+D
D=M
@SP
A=M
M=D
@SP
M=M+1
// add
@SP
M=M-1
A=M
D=M
A=A-1
M=M+D
// push argument 1
@1
D=A
@ARG
A=M+D
D=M
@SP
A=M
M=D
@SP
M=M+1
// sub
@SP
M=M-1
A=M
D=M
A=A-1
M=M-D
// return
@SP
A=M-1
D=M
@result
M=D
@LCL
D=M
@SP
M=D
M=M-1
A=M
D=M
@4
M=D
@SP
M=M-1
A=M
D=M
@3
M=D
@SP
M=M-1
A=M
D=M
@2
M=D
@SP
M=M-1
A=M
D=M
@1
M=D
@SP
M=M-1
A=M
D=M
@returnaddr
M=D
@nArgs
D=M
@SP
M=M-D
@result
D=M
@SP
A=M
M=D
@SP
M=M+1
@returnaddr
A=M
0;JMP
