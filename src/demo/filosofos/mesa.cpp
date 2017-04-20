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

	//checkear errores
	if (argc > 1) {
		return -1;
	}

	key_t key;

	//crear cola
	int msqid;

	key = ftok(ruta, letraCola);
	if (key == -1)
		perror("Error en ftok cola");

	msqid = msgget(key, 0666 | IPC_CREAT);
	if (msqid == -1)
		perror("Error en msgget");

	msg_buf msg;

	//crear semaforo cubiertos
	int semid;

	key = ftok(ruta, letraSemaforo);
	if (key == -1)
		perror("Error en ftok semaforo");

	semid = semget(key, cantidadFilosofos - 1, 0666 | IPC_CREAT);
	if (semid == -1)
		perror("Error en semget");

	//inicializo semaforos
	union semun {
		int val; /* value for SETVAL */
		struct semid_ds *buf;
		ushort *array; /* array for GETALL & SETALL */
		struct seminfo *__buf;
		void *__pad;
	};

	semun tmp;
	ushort g[9] = { 1, 1, 1, 1, 1, 1, 1, 1, 1 };
	tmp.array = g;
	semctl(semid, cantidadFilosofos - 1, SETALL, tmp);

	//crear filosofos, arg es id
	for (int i = 0; i < cantidadFilosofos; ++i) {
		pid_t pid = fork();
		if (pid == -1)
			perror("Error en fork");

		if (pid == 0) {
			//hijo
			std::ostringstream id;
			id << i + 2;
			if (execl(rutaEjecutableFilosofos, "Filosofo", id.str().c_str(),
					(char*) NULL) == -1) {
				perror("Error en exec");
				return -1;
			}
		}
	}

	//ciclo
	int result;
	for (int i = 0; i < cantidadFilosofos; ++i) {

		//enviar turnos
		msg.mtype = i + 2;
		result = msgsnd(msqid, &msg, sizeof(msg) - sizeof(long), 0);
		if (result == -1)
			perror("Error en msgsnd");

		//esperar que terminen
		result = msgrcv(msqid, &msg, sizeof(msg) - sizeof(long), 1, 0); // mtype 1 reservado para la mesa
		if (result == -1)
			perror("Error en msgsnd");

	}

	//eliminar filosofos
	int status = 0;
	for (int i = 0; i < cantidadFilosofos; ++i) {
		wait(&status);
	}

	//eliminar semaforo
	if (semctl(semid, 0, IPC_RMID, 0) == -1) {
		perror("Error en semctl");
	}

	//eliminar cola
	if (msgctl(msqid, IPC_RMID, 0) == -1) {
		perror("Error en msgctl");
	}

	return 0;
}
