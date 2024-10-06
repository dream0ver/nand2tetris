// Runs an infinite loop that listens to the keyboard input. 
// When a key is pressed (any key), the program blackens the screen,
// i.e. writes "black" in every pixel. When no key is pressed, 
// the screen should be cleared.

(LOOP)
@SCREEN 
D=A
@screen_ptr 
M=D
@KBD 
D=M 
@WHITE 
D;JEQ
@BLACK
0;JMP

(BLACK) 
@color 
M=-1 
@PAINT
0;JMP

(WHITE)
@color 
M=0 
@PAINT
0;JMP

(PAINT)
@screen_ptr 
D=M 
@24575 
D=A-D 
@LOOP 
D;JLT
@color 
D=M 
@screen_ptr
A=M
M=D 
@screen_ptr 
M=M+1 
@PAINT 
0;JMP  