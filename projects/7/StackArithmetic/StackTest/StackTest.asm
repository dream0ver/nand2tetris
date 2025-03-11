// push constant 17
@17
D=A
@SP
M=M+1
A=M-1
M=D
// push constant 17
@17
D=A
@SP
M=M+1
A=M-1
M=D
// eq
@SP
AM=M-1
D=M
A=A-1
MD=M-D
@jump_true_1
D;JEQ
@SP
A=M-1
M=0
@continue_1
0;JMP
(jump_true_1)
@SP
A=M-1
M=-1
(continue_1)
// push constant 17
@17
D=A
@SP
M=M+1
A=M-1
M=D
// push constant 16
@16
D=A
@SP
M=M+1
A=M-1
M=D
// eq
@SP
AM=M-1
D=M
A=A-1
MD=M-D
@jump_true_2
D;JEQ
@SP
A=M-1
M=0
@continue_2
0;JMP
(jump_true_2)
@SP
A=M-1
M=-1
(continue_2)
// push constant 16
@16
D=A
@SP
M=M+1
A=M-1
M=D
// push constant 17
@17
D=A
@SP
M=M+1
A=M-1
M=D
// eq
@SP
AM=M-1
D=M
A=A-1
MD=M-D
@jump_true_3
D;JEQ
@SP
A=M-1
M=0
@continue_3
0;JMP
(jump_true_3)
@SP
A=M-1
M=-1
(continue_3)
// push constant 892
@892
D=A
@SP
M=M+1
A=M-1
M=D
// push constant 891
@891
D=A
@SP
M=M+1
A=M-1
M=D
// lt
@SP
AM=M-1
D=M
A=A-1
MD=M-D
@jump_true_4
D;JLT
@SP
A=M-1
M=0
@continue_4
0;JMP
(jump_true_4)
@SP
A=M-1
M=-1
(continue_4)
// push constant 891
@891
D=A
@SP
M=M+1
A=M-1
M=D
// push constant 892
@892
D=A
@SP
M=M+1
A=M-1
M=D
// lt
@SP
AM=M-1
D=M
A=A-1
MD=M-D
@jump_true_5
D;JLT
@SP
A=M-1
M=0
@continue_5
0;JMP
(jump_true_5)
@SP
A=M-1
M=-1
(continue_5)
// push constant 891
@891
D=A
@SP
M=M+1
A=M-1
M=D
// push constant 891
@891
D=A
@SP
M=M+1
A=M-1
M=D
// lt
@SP
AM=M-1
D=M
A=A-1
MD=M-D
@jump_true_6
D;JLT
@SP
A=M-1
M=0
@continue_6
0;JMP
(jump_true_6)
@SP
A=M-1
M=-1
(continue_6)
// push constant 32767
@32767
D=A
@SP
M=M+1
A=M-1
M=D
// push constant 32766
@32766
D=A
@SP
M=M+1
A=M-1
M=D
// gt
@SP
AM=M-1
D=M
A=A-1
MD=M-D
@jump_true_7
D;JGT
@SP
A=M-1
M=0
@continue_7
0;JMP
(jump_true_7)
@SP
A=M-1
M=-1
(continue_7)
// push constant 32766
@32766
D=A
@SP
M=M+1
A=M-1
M=D
// push constant 32767
@32767
D=A
@SP
M=M+1
A=M-1
M=D
// gt
@SP
AM=M-1
D=M
A=A-1
MD=M-D
@jump_true_8
D;JGT
@SP
A=M-1
M=0
@continue_8
0;JMP
(jump_true_8)
@SP
A=M-1
M=-1
(continue_8)
// push constant 32766
@32766
D=A
@SP
M=M+1
A=M-1
M=D
// push constant 32766
@32766
D=A
@SP
M=M+1
A=M-1
M=D
// gt
@SP
AM=M-1
D=M
A=A-1
MD=M-D
@jump_true_9
D;JGT
@SP
A=M-1
M=0
@continue_9
0;JMP
(jump_true_9)
@SP
A=M-1
M=-1
(continue_9)
// push constant 57
@57
D=A
@SP
M=M+1
A=M-1
M=D
// push constant 31
@31
D=A
@SP
M=M+1
A=M-1
M=D
// push constant 53
@53
D=A
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
// push constant 112
@112
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
// neg
@SP
A=M-1
M=-M
// and
@SP
AM=M-1
D=M
A=A-1
M=M&D
// push constant 82
@82
D=A
@SP
M=M+1
A=M-1
M=D
// or
@SP
AM=M-1
D=M
A=A-1
M=M|D
// not
@SP
A=M-1
M=!M
