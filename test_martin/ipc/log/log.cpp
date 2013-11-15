
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


#include "log.h"
#include <cstdarg>
#include <cstring>
#include <cstdio>
#include <syslog.h>

#define LogMessage_LOG_THIS(logtag, logpriority) \
      va_list args;                                      \
      va_start (args, format);                           \
      char msg_error[1024];                              \
                                                         \
      const char *tag = logtag;                          \
      const int offset = strlen(tag);                    \
      memcpy(msg_error, tag, offset);                    \
      strncpy(msg_error + offset, format, 1024-offset);  \
      msg_error[1023] = 0;                               \
                                                         \
      vsyslog(logpriority, msg_error, args);             \
      va_end(args)


namespace Log {
   void emerg(const char *format, ...) {
      LogMessage_LOG_THIS("[Emerg] ", LOG_EMERG);
   }

   void alert(const char *format, ...) {
      LogMessage_LOG_THIS("[Alert] ", LOG_ALERT);
   }

   void crit(const char *format, ...) {
      LogMessage_LOG_THIS("[Crit] ", LOG_CRIT);
   }

   void err(const char *format, ...) {
      LogMessage_LOG_THIS("[Err] ", LOG_ERR);
   }

   void warning(const char *format, ...) {
      LogMessage_LOG_THIS("[Warning] ", LOG_WARNING);
   }

   void notice(const char *format, ...) {
      LogMessage_LOG_THIS("[Notice] ", LOG_NOTICE);
   }

   void info(const char *format, ...) {
      LogMessage_LOG_THIS("[Info] ", LOG_INFO);
   }

   void debug(const char *format, ...) {
      LogMessage_LOG_THIS("[Debug] ", LOG_DEBUG);
   }

   int mask(int new_mask) {
      return setlogmask(new_mask);
   }

   int up_to(int lvl) {
      const int lvls[] = {Level::debug, Level::info, Level::notice, Level::warning, 
                          Level::err, Level::crit, Level::alert, Level::emerg};

      int i = 0;
      for(; i < 8; ++i)
         if(lvl == lvls[i])
            break;
      
      int new_mask = 0;     
      for(; i < 8; ++i)
         new_mask |= lvls[i];
      
      return mask(new_mask);
   }

   namespace Level {
      const int debug   = LOG_MASK(LOG_DEBUG);
      const int info    = LOG_MASK(LOG_INFO);
      const int notice  = LOG_MASK(LOG_NOTICE);
      const int warning = LOG_MASK(LOG_WARNING);
      const int err     = LOG_MASK(LOG_ERR);
      const int crit    = LOG_MASK(LOG_CRIT);
      const int alert   = LOG_MASK(LOG_ALERT);
      const int emerg   = LOG_MASK(LOG_EMERG);
   }
}
