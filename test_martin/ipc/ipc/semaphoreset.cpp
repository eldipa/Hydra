
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


#include <sys/sem.h>
#include <cstring>
#include "oserror.h"
#include "log.h"
#include <cerrno>
#include "interrupted.h"

#include "semaphoreset.h"
#include "commonipc.h"

void SemaphoreSet::destroy() {
   union semun data;
   memset(&data, '0', sizeof(union semun));

   Log::debug("%s semaphore set using the path %s with key %x.", "Destroying", path.c_str(), key);
   if(semctl(fd, 0, IPC_RMID, data) == -1) {
      throw OSError("The semaphore set (%i semaphores in it) "
            MESSAGE_Key_Path_Permissions
            " cannot be destroyed",
            semaphores, 
            key, path.c_str(), permissions);
   }
}

SemaphoreSet::SemaphoreSet(const char *absolute_path, char proj_id,
                           int semaphores, int permissions) : owner(false),
   path(absolute_path), 
   permissions(permissions),
   semaphores(semaphores) {
   key = get_key(absolute_path, proj_id);
      Log::debug("%s semaphore set using the path %s with key %x.", (false? "Creating" : "Getting"), absolute_path, key);
      fd = semget(key, semaphores, permissions);
      if(fd == -1) {
         throw OSError("The semaphore set (%i semaphores in it) does not exist "
               MESSAGE_Key_Path_Permissions,
               semaphores, 
               key, absolute_path, permissions);
      }
   }

SemaphoreSet::SemaphoreSet(const std::vector<unsigned short> &vals,
                           const char *absolute_path, char proj_id, int permissions) : owner(true),
   path(absolute_path), 
   permissions(permissions),
   semaphores((int) vals.size()) {
   key = get_key(absolute_path, proj_id);
      Log::debug("%s semaphore set using the path %s with key %x.", (true? "Creating" : "Getting"), absolute_path, key);
      fd = semget(key, semaphores, IPC_CREAT | IPC_EXCL | permissions);
      if(fd == -1) {
         throw OSError("The semaphore set (%i semaphores in it) cannot be created "
               MESSAGE_Key_Path_Permissions,
               semaphores, 
               key, absolute_path, permissions);
      }

      try {
         std::vector<unsigned short> c_vals(vals); //copy that can be altered
         union semun data;
         data.array = &c_vals[0];

         if(semctl(fd, 0, SETALL, data) == -1) {
            throw OSError("The semaphore set (%i semaphores in it) cannot be initialized "
                  MESSAGE_Key_Path_Permissions,
                  semaphores, 
                  key, absolute_path, permissions);
         }
      } catch(...) {
         if(owner) {
            destroy();
         }
         throw;
      }
   }

SemaphoreSet::~SemaphoreSet() throw() {
   if(owner) {
      union semun data;
      memset(&data, '0', sizeof(union semun));

      Log::debug("%s semaphore set using the path %s with key %x.", "Destroying", path.c_str(), key);
      if(semctl(fd, 0, IPC_RMID, data) == -1) {
         Log::crit("An exception happend during the course of a destructor:\n%s", OSError("The semaphore set (%i semaphores in it) "
                  MESSAGE_Key_Path_Permissions
                  " cannot be destroyed",
                  semaphores, 
                  key, path.c_str(), permissions).what());
      }
   }
}

void SemaphoreSet::wait_on(int semnum) {
   op(semnum, false);
}

void SemaphoreSet::signalize(int semnum) {
   op(semnum, true);
}

void SemaphoreSet::op(int semnum, bool signal_action) {
   struct sembuf dataop;
   dataop.sem_num = semnum;
   dataop.sem_op = signal_action? 1 : -1;
   dataop.sem_flg = 0;
   if(semop(fd, &dataop, 1) == -1) {
	   if(errno == EINTR){
		   throw InterruptedSyscall("The syscall semop %s was interrupted in semaphore %d",
			   signal_action ? "signal":"wait",semnum);
	   }
      throw OSError("The semaphore number %i in the set "
            MESSAGE_Key_Path_Permissions
            " cannot be %s",
            semnum, 
            key, path.c_str(), permissions,
            (signal_action ? "incremented (signal)" : "decremented (wait)"));
   }
}
