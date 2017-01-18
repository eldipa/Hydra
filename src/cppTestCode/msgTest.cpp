#include <sys/msg.h>
#include <sys/types.h>
#include <iostream>

int main(int argc, char **argv) {

	key_t key;
	int msqid;

	struct msg_buf {
	  long mtype;
	  char mtext[30];
	} msg;

	if (argc == 1) {
		std::cout << "Modo de utilizacion: msgTest pathToFile [d/m]" << std::endl;
		return 1;
	} else {
		key = ftok(argv[1], 'b');
		msqid = msgget(key, 0666 | IPC_CREAT);

		if (argc == 3 && argv[2][0] == 'm') {
			msg.mtype = 1;
			msgsnd(msqid, &msg, sizeof(msg)- sizeof(long), 0);
		}

		if (argc == 3 && argv[2][0] == 'd') {
			msgctl(msqid, IPC_RMID, 0);
		}
	}

	return 0;

}
