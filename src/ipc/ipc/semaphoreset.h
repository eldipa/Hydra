#ifndef SEMAPHORE_SET_H_
#define SEMAPHORE_SET_H_

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


#include "key.h"
#include <string>
#include <vector>

class SemaphoreSet {
    private:
        int fd;
        const bool owner;
        Key key;
        std::string path;
        int permissions;
        int semaphores;

        /* 
         * Destroy the semaphore set, awakening all the process waiting in any of the
         * semahores in this set with an error.
         * 
         * See man semctl(2)
         * */
        void destroy();
         
        SemaphoreSet(const SemaphoreSet&);
        SemaphoreSet& operator=(const SemaphoreSet&);

    public:
        /*
         * The first constructor obtain a semaphore set that must exist and be initialized.
         * In this case, the instance is not the owner and the destructor will
         * not release any resource.
         *
         * The parameter 'semaphores' is the number of semaphores that the set
         * must have.
         *
         * The second constructor create a new semaphore set and then is initialized.
         * If the set already exist, an exception is raised.
         * In this case, the instance is owner of the resource and will delete it when
         * the instance is destroyed.
         *
         * The values for the inicialization are obtained from the vector 'vals'.
         * This construction and the inicialization IS NOT ATOMIC. So, it is 
         * responsability of the caller to guarantee that:
         *     - If it is using the first constructor, the set is already initialized
         *     - If it is using the second, no other process will try to access to
         *       the set until the constructor return.
         *
         * In both constructors, the set is obtained (or created) with 'permissions'
         * with the key id generate from 'absolute_path'.
         *
         * See man semget(2)
         * */
        SemaphoreSet(const char *absolute_path, char proj_id, int semaphores, int permissions = 0664);
   
        SemaphoreSet(const std::vector<unsigned short> &vals,
                const char *absolute_path, char proj_id, int permissions = 0664);

         
        /*
         * Decrement (for wait_on) or increment (for signalize) the value 
         * of the semaphore number 'semnum'
         * If the value is zero, the call to 'wait_on' will block the process
         * until other process increment the value of the semaphore.
         *
         * Both actions will be automatically undone when the process terminates.
         * (see flag SEM_UNDO in man semop(2))
         * */
        void wait_on(int semnum);
        void signalize(int semnum);

        ~SemaphoreSet() throw();

    private:
        union semun {
           int              val;    /* Value for SETVAL */
           struct semid_ds *buf;    /* Buffer for IPC_STAT, IPC_SET */
           unsigned short  *array;  /* Array for GETALL, SETALL */
        };
        
        /*
         * Decrement or increment a semaphore. See the documentation
         * of the methods 'wait_on' and 'signalize'.
         * See the man semop(2)
         * */
        void op(int semnum, bool signal_action);
};


#endif
