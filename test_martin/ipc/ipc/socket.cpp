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

#include "socket.h"

#include <sys/socket.h>
#include <sys/types.h>
#include <arpa/inet.h>
#include <netdb.h>
#include <unistd.h>
#include "oserror.h"
#include "valueerror.h"
#include "notimplementederror.h"
#include "log.h"
#include <memory>
#include <errno.h>
#include <cstring>
#include <string>
#include "interrupted.h"

Socket::Socket(bool isstream)
	: isstream(isstream), isassociated(false)
{
	fd = socket(AF_INET, isstream ? SOCK_STREAM : SOCK_DGRAM, 0);
	if (fd == -1)
		throw OSError("The socket cannot be created.");
}

void Socket::destination(const std::string &host, const std::string &service) {
	disassociate();
	struct addrinfo *result = resolve(host.c_str(), service.c_str());
	try {
		if (::connect(fd, result->ai_addr, result->ai_addrlen) == -1)
			throw OSError("The connection to the host '%s' and the service '%s' has failed.", host.c_str(),
				service.c_str());

		freeaddrinfo(result);

	} catch (...) {
		freeaddrinfo(result);
		throw;
	}

	isassociated = true;
}

void Socket::source(const std::string &service) {
	struct addrinfo *result = resolve(0, service.c_str());
	try {
		if (::bind(fd, result->ai_addr, result->ai_addrlen) == -1)
			throw OSError("The socket was not bound to the local address and the service '%s'.", service.c_str());

		freeaddrinfo(result);

	} catch (...) {
		freeaddrinfo(result);
		throw;
	}
}

std::auto_ptr<Socket> Socket::listen(int backlog) {
	return std::auto_ptr<Socket>(new Socket(this->listen_fd(backlog)));
}

int Socket::listen_fd(int backlog) {
	if (not isstream)
		throw NotImplementedError(
			"A socket connectionless (datagram oriented) cannot be blocked to wait for a connection.");

	if (::listen(fd, backlog) == -1)
		throw OSError("The socket cannot stablish a queue of size %i for the comming connections.", backlog);

	clean_from_who();
	int other_side = ::accept(fd, (struct sockaddr *)&peer_addr, &peer_addr_len);
	if (other_side == -1)
		throw OSError("The socket was trying to accept new connections but this has failed.");

	return other_side;
}

ssize_t Socket::sendsome(const void *buf, size_t data_len) {
	ssize_t count = ::send(fd, buf, data_len, MSG_NOSIGNAL);
	if (count == -1) {
		if (errno == EINTR) {
			throw InterruptedSyscall("The syscall send was interrupted by a syscall");
		}
		throw OSError("The message length %i cannot be sent.", data_len);
	}
	return count;
}

ssize_t Socket::receivesome(void *buf, size_t buf_len) {
	clean_from_who();
	ssize_t count = ::recvfrom(fd, buf, buf_len, 0, (struct sockaddr *)&peer_addr, &peer_addr_len);
	if (count == -1) {
		if (errno == EINTR) {
			throw InterruptedSyscall("The syscall recvfrom was interrupted by a syscall");
		}
		throw OSError("The message cannot be received (of length least or equal to %i).", buf_len);
	}

	return count;
}

void Socket::from_who(std::string &host, std::string &service) {
	char host_buf [NI_MAXHOST];
	char service_buf [NI_MAXSERV];

	//int status = getnameinfo((struct sockaddr *) &peer_addr, peer_addr_len,
	//         host_buf, NI_MAXHOST, service_buf, NI_MAXSERV, NI_NAMEREQD | (isstream? 0 : NI_DGRAM));

	if (inet_ntop(AF_INET, (const void *)&peer_addr, host_buf, NI_MAXHOST) == NULL) {
		//The error code is not in the errno (it has garbage)
		throw OSError("The name of the host and the service cannot be obtained: ");
	}

	host.assign(host_buf);
	service.assign(service_buf);
}

void Socket::disassociate() {
	if (isassociated) {
		if (isstream) {
			if (shutdown(fd, SHUT_RDWR) == -1)
				throw OSError("The socket cannot be disassociated (shutdown).");
		} else {
			struct sockaddr reset;
			memset(&reset, 0, sizeof(reset));
			reset.sa_family = AF_UNSPEC;
			if (::connect(fd, &reset, sizeof(reset)) == -1)
				throw OSError("The socket cannot be disassociated (connect to unspecified address).");
		}

		isassociated = false;
	}
}

Socket::~Socket() {
	if (isassociated and isstream) {
		//if (shutdown(fd, SHUT_RDWR) == -1)
		//	Log::crit("An exception happend during the course of a destructor:\n%s",
		//		OSError("The socket cannot be disassociated (shutdown).").what());
	}

	if (close(fd) == -1)
		Log::crit("An exception happend during the course of a destructor:\n%s",
			OSError("The socket cannot be closed.").what());
}

Socket::Socket(int other_side)
	: fd(other_side), isstream(true), isassociated(true)
{
	getpeername(other_side, (struct sockaddr *)&peer_addr, &peer_addr_len);
}

struct addrinfo* Socket::resolve(const char* host, const char* service) {
	struct addrinfo hints;
	struct addrinfo *result = 0;
	int status = 0;

	memset(&hints, 0, sizeof(struct addrinfo));
	hints.ai_family = AF_INET;
	hints.ai_socktype = isstream ? SOCK_STREAM : SOCK_DGRAM;
	hints.ai_flags = host ? 0 : AI_PASSIVE;
	hints.ai_protocol = 0;

	status = getaddrinfo(host, service, &hints, &result);
	if (status != 0) {
		if (status != EAI_SYSTEM)
			errno = 0; //The error code is not in the errno (it has garbage)
		throw OSError("The address cannot be obtained for the host '%s' and the service '%s': %s", host, service,
			gai_strerror(status));
	}

	if (not result) {
		errno = 0;
		throw OSError(
			"The address cannot be obtained for the host '%s' and the service '%s', however no error was explicity generated.",
			host, service);
	}

	return result;
}

void Socket::clean_from_who() {
	memset(&peer_addr, 0, sizeof(struct sockaddr_storage));
	memset(&peer_addr_len, 0, sizeof(socklen_t));

	peer_addr_len = sizeof(peer_addr);
}

