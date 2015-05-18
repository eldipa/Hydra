#include <stdio.h>

int main(int argc, char *argv[]) {
   int cookie;
   if (cookie == 0x41414141) 
      printf("PASS\n");
   else
      printf("FAIL\n");

   return 0;
}
