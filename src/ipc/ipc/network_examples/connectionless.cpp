#include <unistd.h>
#include <iostream>
#include <cstdio>
#include <memory>
#include "socket.h"
#include <cstring>
#include <string>


int main(int, char *[]) try {
   char buf[1024];
   std::string host;
   std::string service;

   pid_t pid = fork();
   if(pid == -1) {
      perror("Fallo el fork.");
   }
   else if(pid == 0) { // Hijo y Nieto
      const char* subprocess = 0;
      pid_t pid2 = fork();
      if(pid2 == -1) {
         perror("Fallo el fork 2.");
      }
      else if(pid2 == 0) {
         subprocess = "Nieto";
         sleep(5);
      }
      else {
         subprocess = "Hijo";
      }

      std::cout << "[" << subprocess << "] Proceso " << subprocess << std::endl;
      sleep(5);
      Socket hijo(false);

      hijo.destination("127.0.0.1", "1234");
      
      std::cout << "[" << subprocess << "] Enviando mensaje." << std::endl;
      hijo.sendsome("Hola mundo", 11);
      hijo.receivesome(buf, 1024);

      std::cout << "[" << subprocess << "] Respuesta: " << buf << std::endl;
      
      hijo.from_who(host, service);
      std::cout << "[" << subprocess << "] Recibido desde Host: " << host << ", del Servicio: " << service << std::endl;
   }
   else {
      std::cout << "[Padre] Proceso padre" << std::endl;
      Socket padre(false);

      padre.source("1234");
      
      padre.receivesome(buf, 1024);
      std::cout << "[Padre] Mensaje recibido: " << buf << std::endl;
   
      padre.from_who(host, service);
      std::cout << "[Padre] Recibido desde Host: " << host << ", del Servicio: " << service << std::endl;

      std::cout << "[Padre] Enviando respuesta." << std::endl;
      padre.destination(host, service);
      padre.sendsome(buf, strlen(buf) + 1);
      padre.disassociate(); //removing the link, so we can receive messages from others

      std::cout << "[Padre] Esperando un segundo mensaje." << std::endl;
      padre.receivesome(buf, 1024);
      std::cout << "[Padre] Mensaje recibido: " << buf << std::endl;
   
      padre.from_who(host, service);
      std::cout << "[Padre] Recibido desde Host: " << host << ", del Servicio: " << service << std::endl;

      std::cout << "[Padre] Enviando respuesta." << std::endl;
      padre.destination(host, service);
      padre.sendsome(buf, strlen(buf) + 1);

   }

   return 0;
}
catch (const std::exception &e) {
   std::cout << e.what() << std::endl;
}
/*catch (...) {
   std::cout << "Excepcion en el main desconocida!" << std::endl;
}*/
