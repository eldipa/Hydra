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

int fork() {

	//Defino el puntero al fork original
	static void* (*my_fork)() = NULL;

	//Obtengo el fork original
	my_fork = dlsym(RTLD_NEXT, "fork");

	//Ejecuto el fork original
	int pid =(int) my_fork();

	if (pid==0){
		//hack de hijo
		printf("Aca hackeo al hijo\n");
	}else{
		//hack de padre
		printf("Aca hackeo al padre\n");
	}

	return pid;
}
