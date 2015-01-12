#include <iostream>
#include <string>

using namespace std;

int main(int argc, char **argv) {
	string line;
	cout << "Ingrese un texto:" << endl;
	while (std::getline(std::cin, line))
	{
		cout << "Usted ingreso: " << line << endl;

		cout << "Ingrese un texto:" << endl;
	}
}
