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



using namespace std;

int main() {
	cout << "Hola mundo C++!!" << endl;
	/* initialize random seed: */
	srand(time(NULL));

	int iSecret = rand();

	cout << "Mi numero aleatorio es: " << iSecret << endl;

	cout << "Comienza testeo de fork" << endl;

	int pid = fork();
	if (pid == 0) {
		//hijo
		cout << "Soy el hijo y me ejecute" << endl;
	} else {
		//padre
		cout << "Soy el padre y me ejecute" << endl;
	}

	wait(NULL);

	return 0;
}

