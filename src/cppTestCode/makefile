all: Prueba testExe testVariables

defines= -D espera

Prueba: prueba.cpp
	g++ -g $(defines) -o Prueba prueba.cpp
	
testExe: testExe.cpp
	g++ -g -o testExe testExe.cpp
	
testVariables: testVariables.cpp
	g++ -g -o testVariables testVariables.cpp 
	
clean:
	rm Prueba testExe testVariables
