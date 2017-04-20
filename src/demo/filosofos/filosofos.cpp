#include <sys/ipc.h>
#include <sys/sem.h>
#include <sys/msg.h>
#include <sys/types.h>
#include <stdlib.h>
#include <unistd.h>
#include <sys/wait.h>
#include <stdio.h>
#include <errno.h>
#include <string>
#include <sstream>
#include "defines.h"

int main(int argc, char **argv) {

	//arg 1 es id
	int id = atoi(argv[1]);

	//crear cola
	int msqid;
	key_t key;

	key = ftok(ruta, letraCola);
	if (key == -1)
		perror("Error en ftok cola");

	msqid = msgget(key, 0666);
	if (msqid == -1)
		perror("Error en msgget");

	msg_buf msg;
	int result;

	//esperar turno via cola
	result = msgrcv(msqid, &msg, sizeof(msg) - sizeof(long), id, 0);
	if (result == -1)
		perror("Error en msgsnd");

	//crear manos, arg 0:izq, 1:der
	for (int i = 0; i < 2; ++i) {
		pid_t pid = fork();
		if (pid == -1)
			perror("Error en fork");

		if (pid == 0) {
			//hijo
			std::ostringstream idMano;
			idMano << i + id;
			if (execl(rutaEjecutableManos, "Mano" ,idMano.str().c_str(), (char*) NULL) == -1) {
				perror("Error en exec");
				return -1;
			}
		}
	}

	//esperar/limpiar manos
	int status = 0;
	for (int i = 0; i < 2; ++i) {
		wait(&status);
	}

	//Comer
	sleep(2);

	//avisar que se termino de comer
	msg.mtype = 1;
	result = msgsnd(msqid, &msg, sizeof(msg) - sizeof(long), 0);
	if (result == -1)
		perror("Error en msgsnd");

	return 0;

}
