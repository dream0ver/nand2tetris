// Program: Sum1ToN 
// Computes R1 = 1 + 2 + 3 + ... + R0
// Usage: put a value >= 1 in R0 (R0 represents N)


@R0
D=M
@n
M=D

(LOOP)
@n
D=M
@R1
M=D+M
@n
M=M-1
D=M
@LOOP
D;JGT

(END)
@END
0;JMP