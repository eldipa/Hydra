#include <pthread.h>
#include <stdio.h>

void *roll(void *cookie) {
   (*(int*)cookie) = 0x00000000;
   pthread_exit(cookie);
}

int main(int argc, char *argv[]) {
   pthread_t thread;
   int cookie;

   pthread_create(&thread, 0, roll, &cookie);
   pthread_join(thread, 0);

   if (cookie == 0x41414141) 
      return 0; //printf("PASS\n");
   else
      return 1; //printf("FAIL\n");
   
   return 1;
}
