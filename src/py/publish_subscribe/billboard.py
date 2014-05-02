
if __name__ == '__main__':
   import notifier, syslog
   syslog.syslog(syslog.LOG_WARNING, "[WARNING] The 'billboard.py' is deprecated, use 'notifier.py'")
   notifier.main()
