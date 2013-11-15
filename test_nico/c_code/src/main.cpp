//============================================================================
// Name        : Cpp_Project.cpp
// Author      : 
// Version     :
// Copyright   : Your copyright notice
// Description : Hello World in C++, Ansi-style
//============================================================================

#include <iostream>
#include <stdlib.h>     /* srand, rand */
#include <time.h>       /* time */
#include <sys/types.h>
#include <sys/wait.h>
#include <string>
#include <signal.h>

using namespace std;

int main() {
	cout << "Hola mundo C++!!" << endl;
	/* initialize random seed: */
	srand(time(NULL));

	int iSecret = rand();

	cout << "Mi numero aleatorio es: " << iSecret << endl;

	cout << "Ingrese un  numero: " << endl;

	string numero = "";
	cin >> numero;

	cout << "Comienza testeo de fork" << endl;

	int pid = fork();
	if (pid == 0) {
		//hijo
		cout << "El numero aleatorio dividio por su numero es: "
				<< ((float) iSecret) / atoi(numero.c_str()) << endl;
		//Tiro un SIGSEG para ver si gdb lo atrapa
		kill(getpid(),11);
		cout << "Soy el hijo y me ejecute" << endl;
	} else {
		//padre
		cout << "El numero aleatorio multiplicado por su numero es: "
				<< iSecret * atoi(numero.c_str()) << endl;
		cout << "Soy el padre y me ejecute" << endl;
	}

	wait(NULL);

	return 0;
}

