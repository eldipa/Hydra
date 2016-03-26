#include <pthread.h>
#include "range.h"
#include "sort.h"
#include "print.h"

#define NUM_ELEMS 10


int main(int argc, char *argv[]) {
   int values[NUM_ELEMS] = {1, 5, 7, 2, 3, 8, 1, 9, 5, 1};
   int destination[NUM_ELEMS];

   pthread_t threads[2];
   Range first_half = {values, values+(NUM_ELEMS/2)};
   Range second_half = {values+(NUM_ELEMS/2), values+NUM_ELEMS};

   print_array(values, NUM_ELEMS);
   pthread_create(&threads[0], 0, sort, &first_half);
   pthread_create(&threads[1], 0, sort, &second_half);
   
   pthread_join(threads[0], 0);
   pthread_join(threads[1], 0);

   print_array(values, NUM_ELEMS);
   merge(&first_half, &second_half, &destination[0]);

   print_array(destination, NUM_ELEMS);
   
   return 0;
}
