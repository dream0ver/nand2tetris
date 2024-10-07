// This file is part of www.nand2tetris.org
// and the book "The Elements of Computing Systems"
// by Nisan and Schocken, MIT Press.
// File name: projects/4/Mult.asm

// Multiplies R0 and R1 and stores the result in R2.
// (R0, R1, R2 refer to RAM[0], RAM[1], and RAM[2], respectively.)
// The algorithm is based on repetitive addition.


@R0 
D=M
@R0_NEGATIVE 
D;JLT 
@i 
M=D
@LOOP 
0;JMP

(R0_NEGATIVE)
D=!D
D=D+1 
@i 
M=D

(LOOP)
@i 
D=M 
@FIX_SIGN 
D;JEQ

@R1 
D=M 
@R2 
M=M+D
@i 
M=M-1
@LOOP 
0;JMP

(FIX_SIGN)
@R0 
D=M 
@SHOULD_COMPLEMENT_RESULT 
D;JLT  

(END)
@END
0;JMP

(SHOULD_COMPLEMENT_RESULT) 
@R2 
M=!M 
M=M+1
@END
0;JMP
