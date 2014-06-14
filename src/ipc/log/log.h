
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

#ifndef LOG_H_
#define LOG_H_

namespace Log {
   //system is unusable
   void emerg(const char *format, ...);

   //action must be taken immediately
   void alert(const char *format, ...);

   //critical conditions
   void crit(const char *format, ...);

   //error conditions
   void err(const char *format, ...);

   //warning conditions
   void warning(const char *format, ...);

   //normal, but significant, condition
   void notice(const char *format, ...);

   //informational message
   void info(const char *format, ...);

   //debug-level message
   void debug(const char *format, ...);

   namespace Level {
      extern const int debug;
      extern const int info;
      extern const int notice;
      extern const int warning;
      extern const int err;
      extern const int crit;
      extern const int alert;
      extern const int emerg;
   } 

   /*
    * With this, you can set a mask to control what levels of log should be
    * logged and which should be ignored.
    *
    * The new_mask and the result returned are a bitwise mask of Log::Level items.
    * If new_mask is 0, the mask is not modified and the actual mark is returned.
    * If new_mask is not 0, the mask is assigned and the old mask
    * is returned.
    *
    * Note that this implies that you can't disable all the logs.
    *
    * The function up_to is a small enhancement. It is equivalent to build a mask
    * with all the levels from 'lvl' to 'Level::Emerg' turned on, and the rest of
    * the flags in off.
    *
    * As in 'mask', up_to returns the old mask.
    * */
   int mask(int new_mask = 0);
   int up_to(int lvl);
}

#endif
