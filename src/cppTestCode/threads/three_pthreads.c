#include <pthread.h>
#include <stdio.h>

void *roll(void *cookie) {
   (*(int*)cookie) = 0x00000000;
   pthread_exit(cookie);
}

int main(int argc, char *argv[]) {
   pthread_t threads[2];
   int cookie;

   pthread_create(&threads[0], 0, roll, &cookie);
   pthread_create(&threads[1], 0, roll, &cookie);
   
   pthread_join(threads[0], 0);
   pthread_join(threads[1], 0);

   if (cookie == 0x41414141) 
      return 0; //printf("PASS\n");
   else
      return 1; //printf("FAIL\n");
   
   return 1;
}
