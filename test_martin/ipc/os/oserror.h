#ifndef OS_ERROR_H_
#define OS_ERROR_H_

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


#include <typeinfo>

#define OSError_LEN_BUFF_ERROR  1024

/*
 * This exception is raised when a function returns a system-related error 
 * (not for illegal argument types or other incidental errors). 
 * The error_number method returns a numeric error code from errno (the global variable of C), 
 * The 'what' message is the concatenation of the message of the user (passed in the
 * constructor) and the corresponding string, as would be printed by the C function perror(). 
 * (From Python 2.7)
 *
 * See the man errno(3).
 *
 * */
class OSError : public std::exception {
   private:
      char msg_error[OSError_LEN_BUFF_ERROR];
      int _errno;

   public:
      explicit OSError(const char *format, ...) throw();
      int error_number() const throw();
      virtual const char *what() const throw(); 
      virtual ~OSError() throw() {}
};

#endif
