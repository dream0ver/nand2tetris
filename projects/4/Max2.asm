//R2 = max(R0,R1)
//if (R0>R1) then R2=R0
//else            R2=R1
// Usage: put a values in R0 and R1

@R0
D=M 
@R1
D=D-M 
@R0_BIG
D;JGT

@R1
D=M 
@R2
M=D
@END
0;JMP

(R0_BIG)
@R0
D=M 
@R2
M=D

(END)
@END
0;JMP