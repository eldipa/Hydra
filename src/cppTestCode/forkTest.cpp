#include <unistd.h>

int main(int argc, char **argv) {

	for (int i = 0; i < 1; ++i) {
		pid_t pid = fork();

		if (pid == 0) {
			// child process
			int a = pid;

		} else if (pid > 0) {
			// parent process
			int b = pid;

		}
	}

	return 0;
}
