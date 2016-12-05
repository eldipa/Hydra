#include <sys/ipc.h>
#include <sys/sem.h>
#include <sys/types.h>
#include <iostream>

// Modo de utilizacion:
// ./semTest pathToFile [d]
//

int main(int argc, char **argv) {

	key_t key;
	int semid;
//	union semun dummy;

	if (argc == 1) {
		std::cout << "Modo de utilizacion: semTest pathToFile [d]"<< std::endl;
		return 1;
	} else {
		key = ftok(argv[1], 'a');
		semid = semget(key, 10, 0666 | IPC_CREAT);

		if (argc == 3 && argv[2][0] == 'd') {
			semctl(semid, 0, IPC_RMID, 0);
		}
	}

	return 0;
}

