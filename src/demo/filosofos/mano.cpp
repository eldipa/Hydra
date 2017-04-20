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

	//arg 1 es 0:izq, 1:der
	int id = atoi(argv[1]);

	//crear semaforo
	int semid;
	key_t key;
	struct sembuf sb = { 0, -1, 0 };

	key = ftok(ruta, letraSemaforo);
	if (key == -1)
		perror("Error en ftok semaforo");

	semid = semget(key, cantidadFilosofos - 1, 0666);
	if (semid == -1)
		perror("Error en semget");

	//tomar semaforo (wait)
	sb.sem_op = -1;
	sb.sem_num = id % (cantidadFilosofos -1);
	if (semop(semid, &sb, 1) == -1) {
		perror("Error en el wait");
	}

	//tiempo en tomar cubierto
	sleep(2);

	//dejar semaforo (signal)
	sb.sem_op = 1;
	sb.sem_num = id % (cantidadFilosofos -1);
	if (semop(semid, &sb, 1) == -1) {
		perror("Error en el signal");
	}

	return 0;

}
