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

	if (argc == 1) {
		std::cout << "Modo de utilizacion: semTest pathToFile [d/s/w]"
				<< std::endl;
		return 1;
	} else {
		key = ftok(argv[1], 'a');
		semid = semget(key, 10, 0666 | IPC_CREAT);
		struct sembuf sb = { 0, -1, 0 };

		if (argc == 3 && argv[2][0] == 'd') {
			semctl(semid, 0, IPC_RMID, 0);
		}

		if (argc == 3 && argv[2][0] == 's') {
			sb.sem_op = 1;
			sb.sem_num = 1;
			semop(semid, &sb, 1);
		}

		if (argc == 3 && argv[2][0] == 'w') {
			sb.sem_op = -1;
			sb.sem_num = 1;
			semop(semid, &sb, 1);
		}
	}

	return 0;
}

