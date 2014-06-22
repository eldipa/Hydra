.PHONY: multiple_files

all: Prueba testExe testVariables write_one_char_at_time multiplesPunteros multiple_files

defines= -D espera

Prueba: prueba.cpp
	g++ -g $(defines) -o Prueba prueba.cpp
	
testExe: testExe.cpp
	g++ -g -o testExe testExe.cpp

write_one_char_at_time: write_one_char_at_time.c
	gcc -std=c99 -g -o write_one_char_at_time write_one_char_at_time.c
	
testVariables: testVariables.cpp
	g++ -g -o testVariables testVariables.cpp 

multiplesPunteros: multiplesPunteros.cpp
	g++ -g -o multiplesPunteros multiplesPunteros.cpp
	
multiple_files:
	$(MAKE) --no-print-directory -C ./multiple_files

clean:
	rm Prueba testExe testVariables write_one_char_at_time multiplesPunteros
	$(MAKE) --no-print-directory -C ./multiple_files clean
