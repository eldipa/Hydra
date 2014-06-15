
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
	Clase* punteroClase = new Clase();
	Estructura estructura;
	Estructura* punteroStruct = &estructura;

	funcion();
}
