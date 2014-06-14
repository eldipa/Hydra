#include <unistd.h>
#include <iostream>
#include <cstdio>
#include <memory>
#include "socket.h"
#include <cstring>


int main(int, char *[]) try {
   char buf[1024];

   pid_t pid = fork();
   if(pid == -1) {
      perror("Fallo el fork.");
   }
   else if(pid == 0) {
      std::cout << "[Hijo] Proceso hijo" << std::endl;
      sleep(5);
      Socket act(true);

      act.destination("127.0.0.1", "1234");
      
      std::cout << "[Hijo] Enviando mensaje." << std::endl;
      act.sendsome("Hola mundo", 11);
      act.receivesome(buf, 1024);

      std::cout << "[Hijo] Respuesta: " << buf << std::endl;
   }
   else {
      std::cout << "[Padre] Proceso padre" << std::endl;
      Socket pas(true);
      
      pas.source("1234");
      std::auto_ptr<Socket> other_side = pas.listen(10);
      
      other_side->receivesome(buf, 1024);
      std::cout << "[Padre] Mensaje recibido: " << buf << std::endl;
      std::cout << "[Padre] Enviando respuesta." << std::endl;

      other_side->sendsome(buf, strlen(buf) + 1);
   }

   return 0;
}
catch (const std::exception &e) {
   std::cout << e.what() << std::endl;
}
catch (...) {
   std::cout << "Excepcion en el main desconocida!" << std::endl;
}
