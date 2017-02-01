.PHONY: multiple_files simplified_unix_tools threads

all: Prueba testExe testVariables write_one_char_at_time multiplesPunteros multiple_files simplified_unix_tools outputTest stdinTest threads semTest msgTest forkTest

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
	
outputTest: outputTest.cpp
	g++ -g -o outputTest outputTest.cpp
	
stdinTest: stdinTest.cpp
	g++ -g -o stdinTest stdinTest.cpp
	
semTest: semTest.cpp
	g++ -g -o semTest semTest.cpp
	
msgTest: msgTest.cpp
	g++ -g -o msgTest msgTest.cpp
	
forkTest: forkTest.cpp
	g++ -g -o forkTest forkTest.cpp

simplified_unix_tools:
	$(MAKE) --no-print-directory -C ./simplified_unix_tools

threads:
	$(MAKE) --no-print-directory -C ./threads

clean:
	rm Prueba testExe testVariables write_one_char_at_time multiplesPunteros outputTest stdinTest semTest msgTest forkTest
	$(MAKE) --no-print-directory -C ./multiple_files clean
	$(MAKE) --no-print-directory -C ./simplified_unix_tools clean
	$(MAKE) --no-print-directory -C ./threads clean
