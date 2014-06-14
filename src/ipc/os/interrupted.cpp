
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


#include <cstdio>
#include <errno.h>
#include <cstdarg> 

#include "interrupted.h"
#include "traceback.h"
#include <cstring>


InterruptedSyscall::InterruptedSyscall(const char *format, ...) throw() {
   _errno = errno;
   memset(msg_error, 0, InterruptedSyscall_LEN_BUFF_ERROR);

   va_list args;
   va_start (args, format);

   // NOTE: vsprintf doesn't check the bounds.
   vsprintf(msg_error, format, args);
   
   // msg_error + strlen(msg_error) allways overrides the '\0'
   // character from the previous inicialization of msg_error
   // In other words, this works as a concatenation of the message
   // of the user and the message of the system.
   sprintf(msg_error+strlen(msg_error), " [code %i]: ", _errno);

   // NOTE: strerror is NOT THREAD SAFE.
   const char *_m = _errno != 0? strerror(_errno) : 0;
   int count = strlen(msg_error);
   if(count < InterruptedSyscall_LEN_BUFF_ERROR) {
      if(_m) {
         strncpy(msg_error+count, _m, InterruptedSyscall_LEN_BUFF_ERROR-count);
      } else {
         strncpy(msg_error+count, "Unknow.", InterruptedSyscall_LEN_BUFF_ERROR-count);
      }
   
      msg_error[InterruptedSyscall_LEN_BUFF_ERROR-1] = 0; //guard
      count = strlen(msg_error);
      msg_error[count] = '\n';
      traceback(msg_error+count+1, InterruptedSyscall_LEN_BUFF_ERROR-count-1);
   }
   msg_error[InterruptedSyscall_LEN_BUFF_ERROR-1] = 0; //guard
   va_end(args);
}

int InterruptedSyscall::error_number() const throw() {
   return _errno;
}

const char *InterruptedSyscall::what() const throw() {
   return msg_error;
}

