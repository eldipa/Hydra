#include <stdio.h>

/*
 * Usage:
 *    echo [msg]
 *
 * Prints to stdout the message 'msg' followed by a new line.
 * If there isn't a 'msg', only a new line is printed.
 * */ 
int main(int argc, char *argv[]) {
   if (argc == 1) {
      printf("\n");
   }
   else if (argc == 2) {
      printf("%s\n", argv[1]);
   }
   else {
      return 1;
   }

   return 0;
}
