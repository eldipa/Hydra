/*
 * testVariables.cpp
 *
 *  Created on: 02/06/2014
 *      Author: nicolas
 */

class Clase {
public:
	int atributoEntero;

	float atributoFloat;

};

typedef struct {
	int enteroStruct;
	float floatStruct;
} Estructura;

void funcion() {
	int enteroLocalDeFuncion = 3;
}

int main(int argc, char **argv) {

	int entero = 0;

	int* punteroEntero = &entero;

	char cString[] = "Hola";

	Clase clase;

	Estructura estructura;

	funcion();
}

