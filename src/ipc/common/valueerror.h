#ifndef VALUE_ERROR_H_
#define VALUE_ERROR_H_

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

#define ValueError_LEN_BUFF_ERROR  1024

/*
 * Raised when an operation or function receives an argument 
 * that has the right type but an inappropriate value, and the situation 
 * is not described by a more precise exception. (From Python 2.7)
 *
 * For example, if foo(int) expects a number greater then 5, foo(3) is valid
 * from the point of view of C but is invalid from the point of view of foo, so
 * this violation of the precondition can be exposed by throwing a ValueError.
 * */
class ValueError : public std::exception {
   private:
      char msg_error[ValueError_LEN_BUFF_ERROR];

   public:
      explicit ValueError(const char *format, ...) throw();
      virtual const char *what() const throw(); 
      virtual ~ValueError() throw() {}
};

#endif
