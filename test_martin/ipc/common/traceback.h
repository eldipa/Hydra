#ifndef TRACEBACK_H_
#define TRACEBACK_H_

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

#ifndef NDEBUG

#ifndef Traceback_STACK_LIMIT
#define Traceback_STACK_LIMIT 10
#endif

/*
 * Obtains the stack of calls, also called 'traceback'.
 * This implementations is dependent of:
 *    - the compiler                   (gcc)
 *    - the flags of the compiler      (see below)
 *    - the operative system           (linux)
 *    - probably, dependent of other unknow sources.
 *
 * To make use of this functionality:
 *    - compile the sources without any optimization (in gcc/linux, flag -O0)
 *    - compile the sources and include 'all' the symbols to the
 *      dynamic symbols (not only the used symbols) (in gcc/linux, flag -rdynamic)
 *    - include 'all' the symbols during the linkage stage 
 *      (in gcc/linux, flag -rdynamic when gcc is linking)
 *    - add the library 'ld' to the linkage stage (in gcc/linux, flag -ldl)
 *
 * The destination buffer 'dest' must have (at least) 'limit' bytes reserved, 
 * where the traceback will be copied.
 *
 * */
void traceback(char *dest, int limit);

#else

void traceback(char *dest, int limit); 

#endif
#endif
