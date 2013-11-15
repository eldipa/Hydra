
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
#include <cstdarg> 

#include "valueerror.h"
#include "traceback.h"
#include <cstring>

ValueError::ValueError(const char *format, ...) throw() {
   va_list args;
   va_start (args, format);

   // NOTE: vsprintf doesn't check the bounds.
   vsprintf(msg_error, format, args);
   
   int count = strlen(msg_error);
   if(count < ValueError_LEN_BUFF_ERROR) {
      msg_error[ValueError_LEN_BUFF_ERROR-1] = 0; //guard
      count = strlen(msg_error);
      msg_error[count] = '\n';
      traceback(msg_error+count+1, ValueError_LEN_BUFF_ERROR-count-1);
   }

   msg_error[ValueError_LEN_BUFF_ERROR-1] = 0; //guard
   va_end(args);
}

const char *ValueError::what() const throw() {
   return msg_error;
}

