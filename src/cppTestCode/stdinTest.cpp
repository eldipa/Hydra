#include <iostream>
#include <string>

using namespace std;

int main(int argc, char **argv) {
	string aux;
	for (int i = 0; i < 5; ++i) {
		cout << "Ingrese un texto:" << endl;
		cin >> aux;
		cout << "Usted ingreso: " << aux << endl;
	}
}
