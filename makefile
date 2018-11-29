chip8: src/*.c src/*.h
	gcc src/*.c -lm -lncurses -o bin/chip8
