@256
D=A
@SP
M=D
@return_address_0
D=A
@R13
M=D
@SP
M=M+1
A=M-1
M=D
@Sys.init
D=A
@R14
M=D
@0
D=A
@R15
M=D
@$$call
0;JMP
(return_address_0)
($$gt)
@SP
AM=M-1
D=M
A=A-1
MD=M-D
@$$jump_if_gt_true
D;JGT
@SP
A=M-1
M=0
@$$resume_gt
0;JMP
($$jump_if_gt_true)
@SP
A=M-1
M=-1
($$resume_gt)
@R13
A=M
0;JMP
($$lt)
@SP
AM=M-1
D=M
A=A-1
MD=M-D
@$$jump_if_lt_true
D;JLT
@SP
A=M-1
M=0
@$$resume_lt
0;JMP
($$jump_if_lt_true)
@SP
A=M-1
M=-1
($$resume_lt)
@R13
A=M
0;JMP
($$eq)
@SP
AM=M-1
D=M
A=A-1
MD=M-D
@$$jump_if_eq_true
D;JEQ
@SP
A=M-1
M=0
@$$resume_eq
0;JMP
($$jump_if_eq_true)
@SP
A=M-1
M=-1
($$resume_eq)
@R13
A=M
0;JMP
($$return)
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
($$call)
@LCL
D=M
@SP
M=M+1
A=M-1
M=D
@ARG
D=M
@SP
M=M+1
A=M-1
M=D
@THIS
D=M
@SP
M=M+1
A=M-1
M=D
@THAT
D=M
@SP
M=M+1
A=M-1
M=D
@SP
D=M
@R15
D=D-M
@5
D=D-A
@ARG
M=D
@SP
D=M
@LCL
M=D
@R14
A=M
0;JMP
// function Main.fibonacci 0
(Main.fibonacci)
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
// push constant 2
@2
D=A
@SP
M=M+1
A=M-1
M=D
// lt
@resume_1
D=A
@R13
M=D
@$$lt
0;JMP
(resume_1)
// if-goto N_LT_2
@SP
AM=M-1
D=M
@Main.fibonacci$N_LT_2
D;JNE
// goto N_GE_2
@Main.fibonacci$N_GE_2
0;JMP
// label N_LT_2               // if n < 2 returns n
(Main.fibonacci$N_LT_2)
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
// return
@$$return
0;JMP
// label N_GE_2               // if n >= 2 returns fib(n - 2) + fib(n - 1)
(Main.fibonacci$N_GE_2)
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
// push constant 2
@2
D=A
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
// call Main.fibonacci 1  // computes fib(n - 2)
@return_address_2
D=A
@R13
M=D
@SP
M=M+1
A=M-1
M=D
@Main.fibonacci
D=A
@R14
M=D
@1
D=A
@R15
M=D
@$$call
0;JMP
(return_address_2)
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
// push constant 1
@1
D=A
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
// call Main.fibonacci 1  // computes fib(n - 1)
@return_address_3
D=A
@R13
M=D
@SP
M=M+1
A=M-1
M=D
@Main.fibonacci
D=A
@R14
M=D
@1
D=A
@R15
M=D
@$$call
0;JMP
(return_address_3)
// add                    // returns fib(n - 1) + fib(n - 2)
@SP
AM=M-1
D=M
A=A-1
M=M+D
// return
@$$return
0;JMP
// function Sys.init 0
(Sys.init)
// push constant 4
@4
D=A
@SP
M=M+1
A=M-1
M=D
// call Main.fibonacci 1
@return_address_4
D=A
@R13
M=D
@SP
M=M+1
A=M-1
M=D
@Main.fibonacci
D=A
@R14
M=D
@1
D=A
@R15
M=D
@$$call
0;JMP
(return_address_4)
// label END
(Sys.init$END)
// goto END  // loops infinitely
@Sys.init$END
0;JMP
