/*
 * forkHack.c
 *
 *  Created on: 05/11/2013
 *      Author: nicolas
 */

//typedef int (*orig_fork_f_type)();
#define _GNU_SOURCE
#include <dlfcn.h>
#include <stdio.h>
#include <unistd.h>
#include <sys/msg.h>
#include <sys/types.h>
#include <errno.h>
#include <string.h>

#define _QUEUE_PATH_ "/tmp/forkHack"
#define _QUEUE_CHAR_ 'a'

typedef struct MensajeFork {
	long mtype;
	int pid;
} MensajeFork;

int fork() {

	//Defino el puntero al fork original
	static void* (*my_fork)() = NULL;

	//Obtengo el fork original
	my_fork = dlsym(RTLD_NEXT, "fork");

	//Ejecuto el fork original
	int pid = (int) my_fork();

	//Variable auxiliar para chequeo de errores
	int ok = 0;

	if (pid == 0) {
		//hack de hijo
		key_t clave = ftok(_QUEUE_PATH_, _QUEUE_CHAR_);
		if (clave == -1) {
			printf("Error de ftok: %s\n", strerror(errno));
			fflush(stdout);
		}
		int cola = msgget(clave, 0666 | IPC_CREAT);
		if (cola == -1) {
			printf("Error de msgget: %s\n", strerror(errno));
			fflush(stdout);
		}

		MensajeFork msg;
		msg.mtype = 1;
		msg.pid = getpid();

		//Envio pid para gdb y espero el ack
		ok = msgsnd(cola, (void *) &msg, sizeof(MensajeFork), 0);
		if (ok == -1) {
			printf("Error de msgsnd: %s\n", strerror(errno));
			fflush(stdout);
		}

		ok = msgrcv(cola, (void *) &msg, sizeof(MensajeFork),
				getpid(), 0);
		if (ok == -1) {
			printf("Error de msgrcv: %s\n", strerror(errno));
			fflush(stdout);
		}
//		close(cola);?? va ??

	} else {
		//hack de padre

	}

	return pid;
}
