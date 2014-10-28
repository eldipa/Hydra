#include <sys/types.h>
#include <sys/stat.h>
#include <fcntl.h>
#include <errno.h>
#include <unistd.h>

#include <stdio.h>
#include <stdlib.h>

#define BUF_SIZE 512

/*
 * Usage:
 *    cat input1 [ input2 [ input3 [ ... ] ] ]
 *
 * Reads the files named in its command line and writes its content to stdout.
 * */

int main(int argc, char *argv[]) {
   int infd = -1;
   int outfd = fileno(stdout);

   char buf[BUF_SIZE];
   int read_bytes = -1;
   int written_bytes = -1;
   int to_be_written = -1;

   if (argc < 2) {
      exit(1);
   }

   for(int i = 1; i < argc; ++i) {
      infd = open(argv[i], O_RDONLY);

      if (infd == -1) {
         perror("Open input file ends in error");
         exit(1);
      }

      while (read_bytes != 0) {
         read_bytes = read(infd, buf, BUF_SIZE);

         if (read_bytes == -1) {
            perror("Failed read");
            close(infd);
            exit(1);
         }

         for (int to_be_write = read_bytes; to_be_write > 0; ) {
            written_bytes = write(outfd, buf+(read_bytes-to_be_write), to_be_write);

            if (written_bytes == -1 || written_bytes == 0) {
               perror("Failed write");
               close(infd);
               exit(1);
            }

            to_be_write -= written_bytes;
         }
      }

      if (close(infd) == -1)
         perror("Close Input file ends in error");
   
      read_bytes = written_bytes = to_be_written = -1;
   }
   
   return 0;
}
