
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


#include "traceback.h"

#ifndef NDEBUG

#include <execinfo.h>
#include <cstring>
#include <dlfcn.h>
#include <cxxabi.h>
#include <cstdlib>

#include <vector>

static char* demangle(void *frame) {
   Dl_info info;
   char *demangled = 0;
   if (dladdr(frame, &info) && info.dli_sname) {
      int status = -1;
      demangled = abi::__cxa_demangle(info.dli_sname, NULL, 0, &status);
   }
   return demangled;
}

static void copy_trace(char *trace, void **stack_frames, int stack_size, int limit) {
   int string_size = 0;
   int expand = 0;
   char *name = 0;
   std::vector<char *> names;
   for(int i = 1; i < stack_size; ++i) { 
      name = demangle(stack_frames[i]);
      expand = (name ? strlen(name + 1) : 4);
      if((string_size + expand) > limit) {
         if(name) {
            free(name);
         }
         break;
      }
      string_size += expand;
      try {
         names.push_back((name ? name : 0));
      } catch(...) {
         if(name) {
            free(name);
         }
         break;
      }
   }

   int len = (int) names.size();
 
   string_size = 0;  
   for(int i = len-1; i >= 0; --i) {
      name = names[i];
      expand = (name ? strlen(name + 1) : 4);
      if(name) {
         strcpy(trace + string_size, name);
      }
      else {
         strcpy(trace + string_size, "???");
      }
      
      string_size += expand;
      trace[string_size-1] = '\n';
      free(name);
   }
   trace[string_size-1] = '\0';
}

void traceback(char *dest, int limit) {
   if(limit > 0) {
      void* stack_frames[Traceback_STACK_LIMIT];
      int stack_size = backtrace(stack_frames, Traceback_STACK_LIMIT);

      copy_trace(dest, stack_frames, stack_size, limit);
   }
}

#else

void traceback(char *dest, int limit) {
   if(limit >= 1) {
      dest[0] = '\0';
   }
}

#endif
