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

	int iSecret = rand();

	cout << "Mi numero aleatorio entre es: " << iSecret <<endl;

	return 0;
}

