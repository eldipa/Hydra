#include <sys/msg.h>
#include <sys/types.h>
#include <iostream>

int main(int argc, char **argv) {

	key_t key;
	int msqid;

	if (argc == 1) {
		std::cout << "Modo de utilizacion: msgTest pathToFile [d]" << std::endl;
		return 1;
	} else {
		key = ftok(argv[1], 'b');
		msqid = msgget(key, 0666 | IPC_CREAT);

		if (argc == 3 && argv[2][0] == 'd') {
			msgctl(msqid, IPC_RMID, 0);
		}
	}

	return 0;

}
