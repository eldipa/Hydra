#include <stdio.h>
#include "sort.h"
#include "print.h"

#define NUM_ELEMS 9

int main(int argc, char *argv[]) {
   // Expected results:
   // 1 1 2 3 5 5 7 8 9
   int values[NUM_ELEMS] = {1, 5, 7, 2, 3, 8, 1, 9, 5};

   print_array(values, NUM_ELEMS);
   sort_by_selection(values, NUM_ELEMS);
   print_array(values, NUM_ELEMS);

   return 0;
}
