#include <iostream>
#include <string>
#include <stdlib.h>     /* srand, rand */
#include <time.h>       /* time */

using namespace std;

int main(int argc, char* argv[]) {

	cout << "Hola mundo" << endl;

#ifdef espera
	string i = "";
	cin >> i;
#endif

	/* initialize random seed: */
	srand (time(NULL));int
	iSecret = rand() % 100;
	cout << "El numero aleatorio es: " << iSecret << endl;

	char a[] = "HOLA";

	for (int i = 0; i < 15; ++i) {
		int pid = fork();
		if (pid == 0) {
			if (iSecret % i == 0)
				a[2] = 'c'; //Esto da SIGSEG
			cout << "Fin Hijo " << i << endl;
			return(0);
		}

	}

	cout << "Fin Padre" << endl;

	return 0;
}
