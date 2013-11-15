#ifndef MUTEX_H_
#define MUTEX_H_

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


class SemaphoreSet;

class Mutex {
   private:
      SemaphoreSet &set;
      int semnum;

   public:
      Mutex(SemaphoreSet &set, int semaphore_num);

      /*
       * See the documentation of the class SemaphoreSet
       * */
      void lock();
      void unlock();
};

class AutoLock {
   private:
      Mutex &mutex;

      AutoLock(const AutoLock&);
      AutoLock& operator=(const AutoLock&);

   public:
      /*
       * RAII class that provides automatic lock-unlock.
       * When it is instantiated, the mutex is seized.
       * When the destructor is invoked, the mutex is released.
       * */ 
      explicit inline AutoLock(Mutex &mutex) : mutex(mutex) {
         mutex.lock();
      }

      inline ~AutoLock() {
         mutex.unlock();
      }
};

#endif
