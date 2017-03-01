#include <sys/types.h>
#include <unistd.h>
#include <sys/wait.h>
#include <stdio.h>

int main(int argc, char **argv) {
	int cant = 50;
	for (int i = 0; i < cant; ++i) {
		pid_t pid = fork();

		if (pid == 0) {
			// child process
			usleep(1000000);
			if (pid % 2 == 0) {
				pid = fork();
				if (pid == 0) {
					usleep(1000000);
					int a = 0;
					printf("Proceso %i finalizado\n", getpid());
				} else if (pid > 0) {
					usleep(2000000);
					int b = 0;
					int status = 0;
					wait(&status);
					printf("Proceso %i finalizado\n", getpid());
				}
				return 0;
			}

		} else if (pid > 0) {
			// parent process
			usleep(800000);

		}

	}

	int status = 0;
	for (int i = 0; i < cant; ++i) {
		wait(&status);
	}

	printf("Programa finalizado");

	return 0;
}
