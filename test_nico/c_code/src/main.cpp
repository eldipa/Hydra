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

using namespace std;

int main() {
	cout << "Hola mundo C++!!" << endl;
	/* initialize random seed: */
	srand(time(NULL));
	/* generate secret number between 1 and 10: */
	int iSecret = rand() % 10 + 1;

	cout << "Mi numero aleatorio entre 1 y 10 es: " << iSecret <<endl;

	return 0;
}

