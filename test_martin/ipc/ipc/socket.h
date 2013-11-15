#ifndef SOCKET_H_
#define SOCKET_H_

/*************************************************************************
 *                                                                       *
 *                        This work is licensed under a                  *
 *   CC BY-SA        Creative Commons Attribution-ShareAlike             *
 *                           3.0 Unported License.                       *
 *                                                                       * 
 *  Author: Di Paola Martin Pablo, 2012                                  *
 *                                                                       *
 *************************************************************************/

/*******************************************************************************
 *                                                                             *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS        *
 *  "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT          *
 *  LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A    *
 *  PARTICULAR PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL THE COPYRIGHT OWNER  *
 *  OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,   *
 *  EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,        *
 *  PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR         *
 *  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF     *
 *  LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING       *
 *  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS         *
 *  SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.               *
 *                                                                             *
 *******************************************************************************/
#include <netdb.h>
#include <memory>
#include <string>


class Socket {
   private:
      int fd;
      bool isstream;
      bool isassociated;

      struct sockaddr_storage peer_addr;
      socklen_t peer_addr_len;

   public:
      /*
       * Create an end point for communication between process, even if they are in separated nodes.
       * Two kinds of sockets can be created:
       *    - connection-based, stream oriented (if the parameter isstream is True)
       *    - connectionless, datagram oriented (if isstream is False)
       * 
       * The first kind is implemented with the TCP protocol meanwhile the second with the UDP protocol.
       * See man udp(7) and man tcp(7)
       *
       * For the first case, the socket can acts as an active or passive end point.
       * The first, will try to connect to a passive socket and stablish a channel of communication.
       * To acomplish that, the active socket will call the method 'destination' to start the process.
       *
       * In the other side, a socket play a passive role when call the method 'listen' and waits to someone
       * wants to connect to him.
       * When this happen, the passive socket can create a new socket that will be the other side of the channel.
       *
       *  Active                                        Passive
       *  act = Socket(True)                            pas = Socket(True)
       *  act.source(...) //optional                    pas.source("PasService") //almost a must
       *                            
       *                                                other_side = pas.listen()
       *                                                                  ^--------- wait until someone is connected
       *
       *  act.destionation("Passive", "PasService")
       *            ------------------------(unblock)-> other_side = pas.listen() // the connection is stablished
       *                                                                          // the first socket "pas" can still be 
       *                                                                          // used to accept new connections
       *  
       *  act.sendsome(...)         -------------->     other_side.receivesome(...) // act and other_side are indistingibles
       *  act.receivesome(...)      <--------------     other_side.sendsome(...)    // note how each know to where send the messages
       *
       *  act.~Socket() // finish                       other_side.~Socket() // finish
       *
       *  When you use the second version of sockets, connectionless, datagram oriented,
       *  there are not active or passive sockets.
       *
       *  One side                                      Other side
       *  one = socket(False)
       *  one.source(...) //optional
       *
       *  one.destination("Other side", "OtherService")
       *
       *  one.sendsome(...)         -------------->     other_side.receivesome(...)
       *                                                other_side.from_who(Host, Service) // save the origins of the previous message
       *                                                
       *                                                other_side.destination(Host, Service) // set that address so you can response
       *  one.receivesome(...)      <--------------     other_side.sendsome(...) 
       *
       *  one.sendsome(...)         -------------->     other_side.receivesome(...) // you don't need set again the destination if 
       *  one.receivesome(...)      <--------------     other_side.sendsome(...) // you don't change the interlocutor.
       *
       *  one.destionation("Third", "ThirdService") // because this is connectionless, you can talk with others hosts
       *     ...
       *  one.disassociate()  // if you can receive message from unknow sources, you need to call this.
       *  
       *
       * */
      explicit Socket(bool isstream); 

      /*
       * This set the destination of the messages to be sent and filter the messages
       * recieved, so you can receive message only from that destination.
       *
       * If the socket is connectionless, the messages from others sources are allowed
       * but they are queue until you set its source address as the new destination.
       * Then, you can call receivesome() to get these messages.
       *
       * When you use socket connection-oriented, this shouldn't be a problem.
       * Tipically you set the destination once (to stablish the connection) and
       * then you will talk to the other side.
       *
       * If in some point you can talk to other, you can call disassociate().
       * For the socket connectionless, this will permit to recieve message from
       * anyone.
       * For the other sockets, this will shutdown the connection.
       *
       * See man connect(2) and man shutdown(2). In particular see the behavour of
       * these syscall when using connectionless, man udp(7).
       *
       * In any case, host and service are the names of the destination and the name
       * of the service listen in the other side.
       * Using low level terminology, host and service are the IP and Port respectively.
       * However you can use more high level names.
       * See man getaddrinfo(3), the file /etc/hosts, man hosts(5), the file /etc/services
       * and man services(5)
       *
       * To use an automatic resolver (like DNS), see man resolv.conf(5)
       *
       * */
      void destination(const std::string &host, const std::string &service);
      void disassociate();

      /*
       * This can be used to know the name of the host and service of:
       *    - when this socket execute listen() and a new connection was arrived, the names of that peer
       *    - when you receive a message using receivesome()
       *
       * See the documentation of destination() to kwno more of host and service.
       * */
      void from_who(std::string &host, std::string &service);
      
      /*
       * This will set the service that this socket is attached. 
       * If you don't set this, the socket will use a random unused service.
       *
       * See man bind(2).
       * See the documentation of destination() to kwno more of host and service.
       * */
      void source(const std::string &service);

      /* 
       * In order to wait for incomming connections (the socket must be a 
       * connection oriented), you need to call this method.
       * With this, the socket will turn in a passive socket, listen for at most
       * 'backlog' connections. See man listen(2).
       *
       * When a new connection arrive, a handshake is perfomed and the connection
       * is stablished. See man accept(2).
       * When this happen, a new socket is returned to be used in the communication.
       * 
       * If there are not connections waiting, this function will blocks the caller.
       *
       * Note: this must be called only for connection oriented sockets and only
       * after they set which service are providing (see source()).
       *
       * The low level version 'listen_fd' will return the low level file descriptor
       * of the socket. This will represent a valid, open and connected socket and
       * should be used with caution, because can you can end with broken connections
       * or no-closed sockets!
       *
       * You should wrap this low level file descriptor with the Socket(int) constructor
       * as soon as possible.
       * */
      std::auto_ptr<Socket> listen(int backlog);
      int listen_fd(int backlog);

      /* 
       * This constructor will accept a valid, open and connected file descriptor
       * and will construct a Socket connection-oriented. 
       * This is a very low function, use with caution.
       *
       * See the method Socket::listen_fd
       *
       * */
      explicit Socket(int other_side);

      /*
       * This method will send and receive data from others.
       * 
       * In the first case, you will send "at most" data_len bytes from buf.
       * In the other case, you will receive "at most" buf_len bytes in buf.
       *
       * In both cases, the real count of bytes sent or recieved will be returned.
       *
       * If the socket is connection oriented, a 0 is returned if the connection was
       * closed.
       * In the other kind of socket, this means that you sent or received a datagram
       * of 0 bytes.
       *
       * Both methods will block the caller if no data can be sent or received.
       *
       * See man send(2), and man recv(2).
       *
       * Note: you can send and receive from your destination (see destination()).
       * The only exception is if the socket is connectionless and the socket is
       * disassociated (see disassociate()).
       * In that special case, the socket can receive from anyone and you can
       * consult who was the sender with from_who().
       *
       * */
      ssize_t sendsome(const void *buf, size_t data_len);
      ssize_t receivesome(void *buf, size_t buf_len);

      ~Socket();

   private:
      struct addrinfo* resolve(const char* host, const char* service);

      void clean_from_who();
};


#endif
