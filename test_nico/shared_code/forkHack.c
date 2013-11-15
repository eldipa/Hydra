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

#define PATH "/tmp/forkHack"

//typedef struct MensajeFork {
//	long mtype;
//	int pid;
//} MensajeFork;

int fork() {

	//Defino el puntero al fork original
	static void* (*my_fork)() = NULL;

	//Obtengo el fork original
	my_fork = dlsym(RTLD_NEXT, "fork");

	//Ejecuto el fork original
	int pid = (int) my_fork();

	if (pid == 0) {
		//hack de hijo

		//TODO REVISAR VALORES DE ERROR
//		key_t clave = ftok(PATH, 'a');
//		int fd = msgget(clave, 0666 | IPC_CREAT);
//		MensajeFork msg;
//		msg.mtype = 0;
//		msg.pid = getpid();
//		//Envio pid para gdb y espero el ack
//		msgsnd(fd, (struct msgbuf *) &msg, sizeof(MensajeFork), 0);
//		msgrcv(fd, (struct msgbuf *) &msg, sizeof(MensajeFork), getpid(), 0);
//		close (fd);

		printf("Hack Success!!\n");
	} else {
		//hack de padre
		printf("Aca hackeo al padre\n");
	}

	return pid;
}
