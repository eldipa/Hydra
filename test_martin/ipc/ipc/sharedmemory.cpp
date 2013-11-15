
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


#include <sys/shm.h>
#include "oserror.h"
#include "log.h"

#include "sharedmemory.h"
#include "commonipc.h"

void SharedMemory::mark_to_be_destroyed() {
   Log::debug("%s shared memory using the path %s with key %x.", "Marking (to be destroyed)", path.c_str(), key);
   if(shmctl(fd, IPC_RMID, 0) == -1) {
      throw OSError("The shared memory "
            MESSAGE_Key_Path_Permissions
            " cannot be marked to be destroyed",
            key, path.c_str(), permissions);
   }
}

SharedMemory::SharedMemory(const char *absolute_path, char proj_id, size_t size, 
                           int permissions, bool create, bool only_for_read) : owner(create),
   path(absolute_path), 
   permissions(permissions),
   size(size),
   attach_point(0) {
   key = get_key(absolute_path, proj_id);
      Log::debug("%s shared memory using the path %s with key %x.", (create? "Creating" : "Getting"), absolute_path, key);
      fd = shmget(key, size, (create ? (IPC_CREAT | IPC_EXCL) : 0) | permissions);
      if(fd == -1) {
         throw OSError("The shared memory %s "
               MESSAGE_Key_Path_Permissions,
               (create ? "cannot be created" : "does not exist"), 
               key, path.c_str(), permissions);
      }

      attach_point = shmat(fd, 0, (only_for_read ? SHM_RDONLY : 0));
      if(attach_point == (void*)-1) {
         if(owner) try {
            mark_to_be_destroyed();
         } catch(const std::exception &e) {
            Log::debug("An exception occurred:\n%s\nMay be that will be responsible of other exceptions.", e.what());
         } catch(...) {
            Log::debug("An unknow exception occurred.\nMay be that will be responsible of other exceptions.");
         }

         throw OSError("The shared memory "
               MESSAGE_Key_Path_Permissions
               " cannot be attached for %s",
               key, path.c_str(), permissions,
               (only_for_read ? "only read" : "read and write"));

      }
   }


SharedMemory::~SharedMemory() throw() {
   if(owner) {
      Log::debug("%s shared memory using the path %s with key %x.", "Marking (to be destroyed)", path.c_str(), key);
      if(shmctl(fd, IPC_RMID, 0) == -1) {
         Log::crit("An exception happend during the course of a destructor:\n%s", OSError("The shared memory "
                  MESSAGE_Key_Path_Permissions
                  " cannot be marked to be destroyed",
                  key, path.c_str(), permissions).what());
      }
   }
   if(shmdt(attach_point) == -1) {
      Log::crit("An exception happend during the course of a destructor:\n%s", OSError("The shared memory "
            MESSAGE_Key_Path_Permissions
            " cannot be deattached",
            key, path.c_str(), permissions).what());
   }
}


