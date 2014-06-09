all: Prueba testExe testVariables write_one_char_at_time

defines= -D espera

Prueba: prueba.cpp
	g++ -g $(defines) -o Prueba prueba.cpp
	
testExe: testExe.cpp
	g++ -g -o testExe testExe.cpp

write_one_char_at_time: write_one_char_at_time.c
	gcc -std=c99 -g -o write_one_char_at_time write_one_char_at_time.c
	
testVariables: testVariables.cpp
	g++ -g -o testVariables testVariables.cpp 
	
clean:
	rm Prueba testExe testVariables
