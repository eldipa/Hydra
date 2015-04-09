#include <sys/types.h>
#include <sys/stat.h>
#include <fcntl.h>
#include <string.h>
#include <unistd.h>
#include <errno.h>
#include <stdio.h>


int main(int argc, char *argv[]) {
   const char *pattern = "abcde";
   const int pattern_len = strlen(pattern);

   unsigned int delay_usecs = 500000; // 0.5 seconds

   int count = pattern_len; //pattern 1 times ~ 0.5 * 5  = 2.5 seconds

   int fd = open("data", O_APPEND|O_RDWR|O_SYNC);
   if(fd == -1) {
      printf("%s\n", strerror(errno));
      return 1;
   }

   for(int i = 0; i < count; ++i) {
      write(fd, &pattern[i%pattern_len], 1); //one char at time, repeating the pattern
      fsync(fd);
      usleep(delay_usecs);
   }

   close(fd);
   return 0;
}
