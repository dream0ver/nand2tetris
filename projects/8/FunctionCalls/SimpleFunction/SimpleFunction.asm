// function SimpleFunction.test 2
(SimpleFunction.test)
@SP
M=M+1
A=M-1
M=0
@SP
M=M+1
A=M-1
M=0
// push local 0
@0
D=A
@LCL
A=M+D
D=M
@SP
M=M+1
A=M-1
M=D
// push local 1
@1
D=A
@LCL
A=M+D
D=M
@SP
M=M+1
A=M-1
M=D
// add
@SP
AM=M-1
D=M
A=A-1
M=M+D
// not
@SP
A=M-1
M=!M
// push argument 0
@0
D=A
@ARG
A=M+D
D=M
@SP
M=M+1
A=M-1
M=D
// add
@SP
AM=M-1
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
M=M+1
A=M-1
M=D
// sub
@SP
AM=M-1
D=M
A=A-1
M=M-D
// return
@LCL
D=M
@FRAME
M=D
@FRAME
D=M
@5
AD=D-A
D=M
@R13
M=D
@SP
AM=M-1
D=M
@ARG
A=M
M=D
D=A+1
@SP
M=D
@FRAME
D=M
@1
D=D-A
A=D
D=M
@THAT
M=D
@FRAME
D=M
@2
AD=D-A
D=M
@THIS
M=D
@FRAME
D=M
@3
AD=D-A
D=M
@ARG
M=D
@FRAME
D=M
@4
AD=D-A
D=M
@LCL
M=D
@R13
A=M
0;JMP
