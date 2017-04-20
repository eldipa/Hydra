all: filosofos

filosofos: ./filosofos/filosofos.cpp ./filosofos/mesa.cpp ./filosofos/mano.cpp ./filosofos/defines.h
	g++ -g -o ./filosofos/filosofos ./filosofos/filosofos.cpp
	g++ -g -o ./filosofos/mesa ./filosofos/mesa.cpp
	g++ -g -o ./filosofos/mano ./filosofos/mano.cpp

clean:
	rm ./filosofos/filosofos ./filosofos/mesa ./filosofos/mano