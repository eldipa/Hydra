#include <iostream>
#include <unistd.h>

using namespace std;


int main(int argc, char **argv) {

	for (int i = 0; i < 15; ++i) {

		sleep(1);

		cout << "Linea numero " << i << endl;

	}

}
