define([ 'jquery', 'layout', 'shortcuts', 'event_handler', 'd3' ], function($, layout, shortcuts, event_handler, d3) {

    function ProcessView() {
        this.super("Process View");

        this._$container = $('<div style="width: 100%; height: 100%;"> </div>');

        this._$out_of_dom = this._$container;

        this.EH = event_handler.get_global_event_handler();   
        
        var my_self = this;

//        this.mis = '{"nodes":[{"group":1,"pid":"1","ppid":"0","command":"/sbin/init"},{"group":1,"pid":"2","ppid":"0","command":"[kthreadd]"},{"group":1,"pid":"3","ppid":"2","command":"[ksoftirqd/0]"},{"group":1,"pid":"5","ppid":"2","command":"[kworker/0:0H]"},{"group":1,"pid":"7","ppid":"2","command":"[rcu_sched]"},{"group":1,"pid":"8","ppid":"2","command":"[rcu_bh]"},{"group":1,"pid":"9","ppid":"2","command":"[migration/0]"},{"group":1,"pid":"10","ppid":"2","command":"[watchdog/0]"},{"group":1,"pid":"11","ppid":"2","command":"[watchdog/1]"},{"group":1,"pid":"12","ppid":"2","command":"[migration/1]"},{"group":1,"pid":"13","ppid":"2","command":"[ksoftirqd/1]"},{"group":1,"pid":"15","ppid":"2","command":"[kworker/1:0H]"},{"group":1,"pid":"16","ppid":"2","command":"[watchdog/2]"},{"group":1,"pid":"17","ppid":"2","command":"[migration/2]"},{"group":1,"pid":"18","ppid":"2","command":"[ksoftirqd/2]"},{"group":1,"pid":"19","ppid":"2","command":"[kworker/2:0]"},{"group":1,"pid":"20","ppid":"2","command":"[kworker/2:0H]"},{"group":1,"pid":"21","ppid":"2","command":"[watchdog/3]"},{"group":1,"pid":"22","ppid":"2","command":"[migration/3]"},{"group":1,"pid":"23","ppid":"2","command":"[ksoftirqd/3]"},{"group":1,"pid":"25","ppid":"2","command":"[kworker/3:0H]"},{"group":1,"pid":"26","ppid":"2","command":"[watchdog/4]"},{"group":1,"pid":"27","ppid":"2","command":"[migration/4]"},{"group":1,"pid":"28","ppid":"2","command":"[ksoftirqd/4]"},{"group":1,"pid":"30","ppid":"2","command":"[kworker/4:0H]"},{"group":1,"pid":"31","ppid":"2","command":"[watchdog/5]"},{"group":1,"pid":"32","ppid":"2","command":"[migration/5]"},{"group":1,"pid":"33","ppid":"2","command":"[ksoftirqd/5]"},{"group":1,"pid":"35","ppid":"2","command":"[kworker/5:0H]"},{"group":1,"pid":"36","ppid":"2","command":"[watchdog/6]"},{"group":1,"pid":"37","ppid":"2","command":"[migration/6]"},{"group":1,"pid":"38","ppid":"2","command":"[ksoftirqd/6]"},{"group":1,"pid":"40","ppid":"2","command":"[kworker/6:0H]"},{"group":1,"pid":"41","ppid":"2","command":"[watchdog/7]"},{"group":1,"pid":"42","ppid":"2","command":"[migration/7]"},{"group":1,"pid":"43","ppid":"2","command":"[ksoftirqd/7]"},{"group":1,"pid":"45","ppid":"2","command":"[kworker/7:0H]"},{"group":1,"pid":"46","ppid":"2","command":"[khelper]"},{"group":1,"pid":"47","ppid":"2","command":"[kdevtmpfs]"},{"group":1,"pid":"48","ppid":"2","command":"[netns]"},{"group":1,"pid":"49","ppid":"2","command":"[perf]"},{"group":1,"pid":"50","ppid":"2","command":"[khungtaskd]"},{"group":1,"pid":"51","ppid":"2","command":"[writeback]"},{"group":1,"pid":"52","ppid":"2","command":"[ksmd]"},{"group":1,"pid":"53","ppid":"2","command":"[khugepaged]"},{"group":1,"pid":"54","ppid":"2","command":"[crypto]"},{"group":1,"pid":"55","ppid":"2","command":"[kintegrityd]"},{"group":1,"pid":"56","ppid":"2","command":"[bioset]"},{"group":1,"pid":"57","ppid":"2","command":"[kblockd]"},{"group":1,"pid":"58","ppid":"2","command":"[ata_sff]"},{"group":1,"pid":"59","ppid":"2","command":"[md]"},{"group":1,"pid":"60","ppid":"2","command":"[devfreq_wq]"},{"group":1,"pid":"63","ppid":"2","command":"[kworker/2:1]"},{"group":1,"pid":"64","ppid":"2","command":"[kworker/3:1]"},{"group":1,"pid":"65","ppid":"2","command":"[kworker/4:1]"},{"group":1,"pid":"71","ppid":"2","command":"[kswapd0]"},{"group":1,"pid":"72","ppid":"2","command":"[vmstat]"},{"group":1,"pid":"73","ppid":"2","command":"[fsnotify_mark]"},{"group":1,"pid":"74","ppid":"2","command":"[ecryptfs-kthrea]"},{"group":1,"pid":"86","ppid":"2","command":"[kthrotld]"},{"group":1,"pid":"87","ppid":"2","command":"[acpi_thermal_pm]"},{"group":1,"pid":"88","ppid":"2","command":"[scsi_eh_0]"},{"group":1,"pid":"89","ppid":"2","command":"[scsi_tmf_0]"},{"group":1,"pid":"90","ppid":"2","command":"[scsi_eh_1]"},{"group":1,"pid":"91","ppid":"2","command":"[scsi_tmf_1]"},{"group":1,"pid":"94","ppid":"2","command":"[scsi_eh_2]"},{"group":1,"pid":"95","ppid":"2","command":"[scsi_tmf_2]"},{"group":1,"pid":"96","ppid":"2","command":"[scsi_eh_3]"},{"group":1,"pid":"97","ppid":"2","command":"[scsi_tmf_3]"},{"group":1,"pid":"100","ppid":"2","command":"[ipv6_addrconf]"},{"group":1,"pid":"121","ppid":"2","command":"[deferwq]"},{"group":1,"pid":"122","ppid":"2","command":"[charger_manager]"},{"group":1,"pid":"130","ppid":"2","command":"[kworker/7:1H]"},{"group":1,"pid":"193","ppid":"2","command":"[firewire]"},{"group":1,"pid":"194","ppid":"2","command":"[kworker/1:1H]"},{"group":1,"pid":"195","ppid":"2","command":"[scsi_eh_4]"},{"group":1,"pid":"196","ppid":"2","command":"[scsi_tmf_4]"},{"group":1,"pid":"197","ppid":"2","command":"[scsi_eh_5]"},{"group":1,"pid":"198","ppid":"2","command":"[scsi_tmf_5]"},{"group":1,"pid":"199","ppid":"2","command":"[firewire_ohci]"},{"group":1,"pid":"200","ppid":"2","command":"[kworker/6:1H]"},{"group":1,"pid":"201","ppid":"2","command":"[kworker/5:1H]"},{"group":1,"pid":"202","ppid":"2","command":"[kworker/0:1H]"},{"group":1,"pid":"212","ppid":"2","command":"[jbd2/sda1-8]"},{"group":1,"pid":"213","ppid":"2","command":"[ext4-rsv-conver]"},{"group":1,"pid":"353","ppid":"1","command":"upstart-udev-bridge"},{"group":1,"pid":"369","ppid":"1","command":"/lib/systemd/systemd-udevd"},{"group":1,"pid":"414","ppid":"2","command":"[jbd2/sda3-8]"},{"group":1,"pid":"417","ppid":"2","command":"[ext4-rsv-conver]"},{"group":1,"pid":"457","ppid":"1","command":"upstart-file-bridge"},{"group":1,"pid":"466","ppid":"1","command":"rsyslogd"},{"group":1,"pid":"482","ppid":"1","command":"dbus-daemon"},{"group":1,"pid":"555","ppid":"1","command":"/usr/sbin/bluetoothd"},{"group":1,"pid":"564","ppid":"1","command":"avahi-daemon:"},{"group":1,"pid":"565","ppid":"564","command":"avahi-daemon:"},{"group":1,"pid":"575","ppid":"1","command":"/lib/systemd/systemd-logind"},{"group":1,"pid":"579","ppid":"1","command":"/usr/sbin/cupsd"},{"group":1,"pid":"589","ppid":"2","command":"[krfcommd]"},{"group":1,"pid":"595","ppid":"2","command":"[edac-poller]"},{"group":1,"pid":"597","ppid":"2","command":"[kworker/4:1H]"},{"group":1,"pid":"598","ppid":"2","command":"[kworker/3:1H]"},{"group":1,"pid":"601","ppid":"2","command":"[kworker/2:1H]"},{"group":1,"pid":"669","ppid":"2","command":"[kvm-irqfd-clean]"},{"group":1,"pid":"726","ppid":"1","command":"upstart-socket-bridge"},{"group":1,"pid":"761","ppid":"1","command":"/usr/sbin/ModemManager"},{"group":1,"pid":"795","ppid":"2","command":"[hd-audio1]"},{"group":1,"pid":"798","ppid":"2","command":"[hd-audio0]"},{"group":1,"pid":"861","ppid":"1","command":"NetworkManager"},{"group":1,"pid":"875","ppid":"1","command":"/usr/lib/policykit-1/polkitd"},{"group":1,"pid":"959","ppid":"1","command":"/usr/sbin/cups-browsed"},{"group":1,"pid":"1010","ppid":"1","command":"/sbin/getty"},{"group":1,"pid":"1014","ppid":"1","command":"/sbin/getty"},{"group":1,"pid":"1020","ppid":"1","command":"/sbin/getty"},{"group":1,"pid":"1021","ppid":"1","command":"/sbin/getty"},{"group":1,"pid":"1024","ppid":"1","command":"/sbin/getty"},{"group":1,"pid":"1075","ppid":"1","command":"cron"},{"group":1,"pid":"1081","ppid":"1","command":"/usr/sbin/irqbalance"},{"group":1,"pid":"1095","ppid":"1","command":"/usr/sbin/kerneloops"},{"group":1,"pid":"1130","ppid":"1","command":"whoopsie"},{"group":1,"pid":"1181","ppid":"1","command":"/sbin/getty"},{"group":1,"pid":"1186","ppid":"1","command":"acpid"},{"group":1,"pid":"1198","ppid":"1","command":"lightdm"},{"group":1,"pid":"1210","ppid":"1198","command":"/usr/bin/X"},{"group":1,"pid":"1213","ppid":"1","command":"/usr/lib/accountsservice/accounts-daemon"},{"group":1,"pid":"1229","ppid":"1","command":"/usr/bin/nvidia-persistenced"},{"group":1,"pid":"1230","ppid":"861","command":"/sbin/dhclient"},{"group":1,"pid":"1244","ppid":"2","command":"[kauditd]"},{"group":1,"pid":"1285","ppid":"1198","command":"lightdm"},{"group":1,"pid":"1314","ppid":"1","command":"/usr/lib/upower/upowerd"},{"group":1,"pid":"1357","ppid":"1","command":"/usr/lib/rtkit/rtkit-daemon"},{"group":1,"pid":"1567","ppid":"861","command":"/usr/sbin/dnsmasq"},{"group":1,"pid":"1724","ppid":"1","command":"/usr/lib/colord/colord"},{"group":1,"pid":"1739","ppid":"1","command":"/usr/bin/gnome-keyring-daemon"},{"group":1,"pid":"1741","ppid":"1285","command":"init"},{"group":1,"pid":"1824","ppid":"1741","command":"dbus-daemon"},{"group":1,"pid":"1835","ppid":"1741","command":"upstart-event-bridge"},{"group":1,"pid":"1841","ppid":"1741","command":"/usr/lib/i386-linux-gnu/hud/window-stack-bridge"},{"group":1,"pid":"1858","ppid":"1741","command":"upstart-dbus-bridge"},{"group":1,"pid":"1859","ppid":"1741","command":"upstart-dbus-bridge"},{"group":1,"pid":"1864","ppid":"1741","command":"upstart-file-bridge"},{"group":1,"pid":"1872","ppid":"1741","command":"/usr/lib/i386-linux-gnu/bamf/bamfdaemon"},{"group":1,"pid":"1873","ppid":"1741","command":"/usr/bin/ibus-daemon"},{"group":1,"pid":"1887","ppid":"1741","command":"/usr/lib/gnome-settings-daemon/gnome-settings-daemon"},{"group":1,"pid":"1895","ppid":"1741","command":"/usr/lib/at-spi2-core/at-spi-bus-launcher"},{"group":1,"pid":"1896","ppid":"1741","command":"/usr/lib/gvfs/gvfsd"},{"group":1,"pid":"1897","ppid":"1741","command":"gnome-session"},{"group":1,"pid":"1904","ppid":"1895","command":"/bin/dbus-daemon"},{"group":1,"pid":"1907","ppid":"1741","command":"/usr/lib/gvfs/gvfsd-fuse"},{"group":1,"pid":"1918","ppid":"1873","command":"/usr/lib/ibus/ibus-dconf"},{"group":1,"pid":"1920","ppid":"1873","command":"/usr/lib/ibus/ibus-ui-gtk3"},{"group":1,"pid":"1922","ppid":"1741","command":"/usr/lib/ibus/ibus-x11"},{"group":1,"pid":"1926","ppid":"1741","command":"/usr/lib/at-spi2-core/at-spi2-registryd"},{"group":1,"pid":"1948","ppid":"1873","command":"/usr/lib/ibus/ibus-engine-simple"},{"group":1,"pid":"1959","ppid":"1741","command":"/usr/bin/pulseaudio"},{"group":1,"pid":"1980","ppid":"1897","command":"/usr/bin/gnome-shell"},{"group":1,"pid":"1983","ppid":"1741","command":"/usr/lib/dconf/dconf-service"},{"group":1,"pid":"1997","ppid":"1741","command":"/usr/lib/gnome-shell/gnome-shell-calendar-server"},{"group":1,"pid":"2003","ppid":"1741","command":"/usr/lib/evolution/evolution-source-registry"},{"group":1,"pid":"2008","ppid":"1741","command":"/usr/lib/telepathy/mission-control-5"},{"group":1,"pid":"2013","ppid":"1741","command":"/usr/lib/gvfs/gvfs-udisks2-volume-monitor"},{"group":1,"pid":"2016","ppid":"1","command":"/usr/lib/udisks2/udisksd"},{"group":1,"pid":"2027","ppid":"1741","command":"/usr/lib/gvfs/gvfs-afc-volume-monitor"},{"group":1,"pid":"2032","ppid":"1741","command":"/usr/lib/gvfs/gvfs-gphoto2-volume-monitor"},{"group":1,"pid":"2036","ppid":"1741","command":"/usr/lib/gvfs/gvfs-mtp-volume-monitor"},{"group":1,"pid":"2045","ppid":"1897","command":"nautilus"},{"group":1,"pid":"2047","ppid":"1897","command":"/usr/lib/i386-linux-gnu/indicator-power/indicator-power-service"},{"group":1,"pid":"2054","ppid":"1897","command":"/usr/lib/i386-linux-gnu/indicator-bluetooth/indicator-bluetooth-service"},{"group":1,"pid":"2101","ppid":"1741","command":"/usr/lib/evolution/evolution-calendar-factory"},{"group":1,"pid":"2105","ppid":"1741","command":"/usr/lib/i386-linux-gnu/gconf/gconfd-2"},{"group":1,"pid":"2108","ppid":"1741","command":"/usr/lib/gvfs/gvfsd-trash"},{"group":1,"pid":"2127","ppid":"1741","command":"/usr/lib/gvfs/gvfsd-metadata"},{"group":1,"pid":"2130","ppid":"1741","command":"/usr/lib/gvfs/gvfsd-burn"},{"group":1,"pid":"2137","ppid":"1980","command":"/usr/lib/firefox/firefox"},{"group":1,"pid":"2228","ppid":"1741","command":"/usr/bin/zeitgeist-daemon"},{"group":1,"pid":"2234","ppid":"1741","command":"/usr/lib/i386-linux-gnu/zeitgeist-fts"},{"group":1,"pid":"2236","ppid":"1741","command":"zeitgeist-datahub"},{"group":1,"pid":"2258","ppid":"2234","command":"/bin/cat"},{"group":1,"pid":"2261","ppid":"1741","command":"/home/nicolas/Escritorio/Eclipse"},{"group":1,"pid":"2339","ppid":"1897","command":"update-notifier"},{"group":1,"pid":"2402","ppid":"1980","command":"skype"},{"group":1,"pid":"2407","ppid":"2261","command":"/usr/bin/python"},{"group":1,"pid":"2492","ppid":"1897","command":"/usr/lib/i386-linux-gnu/deja-dup/deja-dup-monitor"},{"group":1,"pid":"2512","ppid":"2261","command":"/usr/bin/python"},{"group":1,"pid":"2534","ppid":"1980","command":"gnome-terminal"},{"group":1,"pid":"2542","ppid":"2534","command":"gnome-pty-helper"},{"group":1,"pid":"2543","ppid":"2534","command":"bash"},{"group":1,"pid":"2555","ppid":"2534","command":"bash"},{"group":1,"pid":"2615","ppid":"1741","command":"dbus-launch"},{"group":1,"pid":"2618","ppid":"1741","command":"//bin/dbus-daemon"},{"group":1,"pid":"2668","ppid":"1741","command":"kdeinit4:"},{"group":1,"pid":"2671","ppid":"2668","command":"kdeinit4:"},{"group":1,"pid":"2673","ppid":"1741","command":"kdeinit4:"},{"group":1,"pid":"5534","ppid":"2","command":"[kworker/4:2]"},{"group":1,"pid":"5635","ppid":"2","command":"[kworker/6:2]"},{"group":1,"pid":"6886","ppid":"2","command":"[kworker/3:0]"},{"group":1,"pid":"6985","ppid":"2","command":"[kworker/1:0]"},{"group":1,"pid":"8551","ppid":"2","command":"[kworker/1:2]"},{"group":1,"pid":"10044","ppid":"2","command":"[kworker/0:0]"},{"group":1,"pid":"10513","ppid":"2","command":"[kworker/6:1]"},{"group":1,"pid":"11602","ppid":"2","command":"[kworker/7:2]"},{"group":1,"pid":"11617","ppid":"2","command":"[kworker/u16:2]"},{"group":1,"pid":"12418","ppid":"2","command":"[kworker/0:2]"},{"group":1,"pid":"12906","ppid":"2","command":"[kworker/7:0]"},{"group":1,"pid":"13463","ppid":"2","command":"[kworker/5:0]"},{"group":1,"pid":"13709","ppid":"2","command":"[kworker/5:1]"},{"group":1,"pid":"13812","ppid":"2","command":"[kworker/u16:1]"},{"group":1,"pid":"13948","ppid":"2543","command":"sudo"},{"group":1,"pid":"13949","ppid":"13948","command":"/bin/bash"},{"group":1,"pid":"13950","ppid":"13949","command":"python"},{"group":1,"pid":"13951","ppid":"13950","command":"/bin/sh"},{"group":1,"pid":"13953","ppid":"13951","command":"/bin/bash"},{"group":1,"pid":"13955","ppid":"13953","command":"/home/nicolas/Descargas/nwjs-v0.12.3-linux-ia32/nw"},{"group":1,"pid":"13957","ppid":"13955","command":"/home/nicolas/Descargas/nwjs-v0.12.3-linux-ia32/nw"},{"group":1,"pid":"13959","ppid":"1741","command":"python"},{"group":1,"pid":"13975","ppid":"13955","command":"/proc/self/exe"},{"group":1,"pid":"13986","ppid":"13957","command":"/home/nicolas/Descargas/nwjs-v0.12.3-linux-ia32/nw"},{"group":1,"pid":"13988","ppid":"13957","command":"/home/nicolas/Descargas/nwjs-v0.12.3-linux-ia32/nw"},{"group":1,"pid":"13992","ppid":"2","command":"[kworker/u16:0]"},{"group":1,"pid":"14015","ppid":"13986","command":"/bin/sh"},{"group":1,"pid":"14016","ppid":"14015","command":"ps"},{"group":1,"pid":"14017","ppid":"14015","command":"awk"}],"links":[{"source":2,"target":1,"value":1},{"source":3,"target":1,"value":1},{"source":4,"target":1,"value":1},{"source":5,"target":1,"value":1},{"source":6,"target":1,"value":1},{"source":7,"target":1,"value":1},{"source":8,"target":1,"value":1},{"source":9,"target":1,"value":1},{"source":10,"target":1,"value":1},{"source":11,"target":1,"value":1},{"source":12,"target":1,"value":1},{"source":13,"target":1,"value":1},{"source":14,"target":1,"value":1},{"source":15,"target":1,"value":1},{"source":16,"target":1,"value":1},{"source":17,"target":1,"value":1},{"source":18,"target":1,"value":1},{"source":19,"target":1,"value":1},{"source":20,"target":1,"value":1},{"source":21,"target":1,"value":1},{"source":22,"target":1,"value":1},{"source":23,"target":1,"value":1},{"source":24,"target":1,"value":1},{"source":25,"target":1,"value":1},{"source":26,"target":1,"value":1},{"source":27,"target":1,"value":1},{"source":28,"target":1,"value":1},{"source":29,"target":1,"value":1},{"source":30,"target":1,"value":1},{"source":31,"target":1,"value":1},{"source":32,"target":1,"value":1},{"source":33,"target":1,"value":1},{"source":34,"target":1,"value":1},{"source":35,"target":1,"value":1},{"source":36,"target":1,"value":1},{"source":37,"target":1,"value":1},{"source":38,"target":1,"value":1},{"source":39,"target":1,"value":1},{"source":40,"target":1,"value":1},{"source":41,"target":1,"value":1},{"source":42,"target":1,"value":1},{"source":43,"target":1,"value":1},{"source":44,"target":1,"value":1},{"source":45,"target":1,"value":1},{"source":46,"target":1,"value":1},{"source":47,"target":1,"value":1},{"source":48,"target":1,"value":1},{"source":49,"target":1,"value":1},{"source":50,"target":1,"value":1},{"source":51,"target":1,"value":1},{"source":52,"target":1,"value":1},{"source":53,"target":1,"value":1},{"source":54,"target":1,"value":1},{"source":55,"target":1,"value":1},{"source":56,"target":1,"value":1},{"source":57,"target":1,"value":1},{"source":58,"target":1,"value":1},{"source":59,"target":1,"value":1},{"source":60,"target":1,"value":1},{"source":61,"target":1,"value":1},{"source":62,"target":1,"value":1},{"source":63,"target":1,"value":1},{"source":64,"target":1,"value":1},{"source":65,"target":1,"value":1},{"source":66,"target":1,"value":1},{"source":67,"target":1,"value":1},{"source":68,"target":1,"value":1},{"source":69,"target":1,"value":1},{"source":70,"target":1,"value":1},{"source":71,"target":1,"value":1},{"source":72,"target":1,"value":1},{"source":73,"target":1,"value":1},{"source":74,"target":1,"value":1},{"source":75,"target":1,"value":1},{"source":76,"target":1,"value":1},{"source":77,"target":1,"value":1},{"source":78,"target":1,"value":1},{"source":79,"target":1,"value":1},{"source":80,"target":1,"value":1},{"source":81,"target":1,"value":1},{"source":82,"target":1,"value":1},{"source":83,"target":1,"value":1},{"source":84,"target":1,"value":1},{"source":85,"target":0,"value":1},{"source":86,"target":0,"value":1},{"source":87,"target":1,"value":1},{"source":88,"target":1,"value":1},{"source":89,"target":0,"value":1},{"source":90,"target":0,"value":1},{"source":91,"target":0,"value":1},{"source":92,"target":0,"value":1},{"source":93,"target":0,"value":1},{"source":94,"target":93,"value":1},{"source":95,"target":0,"value":1},{"source":96,"target":0,"value":1},{"source":97,"target":1,"value":1},{"source":98,"target":1,"value":1},{"source":99,"target":1,"value":1},{"source":100,"target":1,"value":1},{"source":101,"target":1,"value":1},{"source":102,"target":1,"value":1},{"source":103,"target":0,"value":1},{"source":104,"target":0,"value":1},{"source":105,"target":1,"value":1},{"source":106,"target":1,"value":1},{"source":107,"target":0,"value":1},{"source":108,"target":0,"value":1},{"source":109,"target":0,"value":1},{"source":110,"target":0,"value":1},{"source":111,"target":0,"value":1},{"source":112,"target":0,"value":1},{"source":113,"target":0,"value":1},{"source":114,"target":0,"value":1},{"source":115,"target":0,"value":1},{"source":116,"target":0,"value":1},{"source":117,"target":0,"value":1},{"source":118,"target":0,"value":1},{"source":119,"target":0,"value":1},{"source":120,"target":0,"value":1},{"source":121,"target":0,"value":1},{"source":122,"target":121,"value":1},{"source":123,"target":0,"value":1},{"source":124,"target":0,"value":1},{"source":125,"target":107,"value":1},{"source":126,"target":1,"value":1},{"source":127,"target":121,"value":1},{"source":128,"target":0,"value":1},{"source":129,"target":0,"value":1},{"source":130,"target":107,"value":1},{"source":131,"target":0,"value":1},{"source":132,"target":0,"value":1},{"source":133,"target":127,"value":1},{"source":134,"target":133,"value":1},{"source":135,"target":133,"value":1},{"source":136,"target":133,"value":1},{"source":137,"target":133,"value":1},{"source":138,"target":133,"value":1},{"source":139,"target":133,"value":1},{"source":140,"target":133,"value":1},{"source":141,"target":133,"value":1},{"source":142,"target":133,"value":1},{"source":143,"target":133,"value":1},{"source":144,"target":133,"value":1},{"source":145,"target":133,"value":1},{"source":146,"target":143,"value":1},{"source":147,"target":133,"value":1},{"source":148,"target":141,"value":1},{"source":149,"target":141,"value":1},{"source":150,"target":133,"value":1},{"source":151,"target":133,"value":1},{"source":152,"target":141,"value":1},{"source":153,"target":133,"value":1},{"source":154,"target":145,"value":1},{"source":155,"target":133,"value":1},{"source":156,"target":133,"value":1},{"source":157,"target":133,"value":1},{"source":158,"target":133,"value":1},{"source":159,"target":133,"value":1},{"source":160,"target":0,"value":1},{"source":161,"target":133,"value":1},{"source":162,"target":133,"value":1},{"source":163,"target":133,"value":1},{"source":164,"target":145,"value":1},{"source":165,"target":145,"value":1},{"source":166,"target":145,"value":1},{"source":167,"target":133,"value":1},{"source":168,"target":133,"value":1},{"source":169,"target":133,"value":1},{"source":170,"target":133,"value":1},{"source":171,"target":133,"value":1},{"source":172,"target":154,"value":1},{"source":173,"target":133,"value":1},{"source":174,"target":133,"value":1},{"source":175,"target":133,"value":1},{"source":176,"target":174,"value":1},{"source":177,"target":133,"value":1},{"source":178,"target":145,"value":1},{"source":179,"target":154,"value":1},{"source":180,"target":177,"value":1},{"source":181,"target":145,"value":1},{"source":182,"target":177,"value":1},{"source":183,"target":154,"value":1},{"source":184,"target":183,"value":1},{"source":185,"target":183,"value":1},{"source":186,"target":183,"value":1},{"source":187,"target":133,"value":1},{"source":188,"target":133,"value":1},{"source":189,"target":133,"value":1},{"source":190,"target":189,"value":1},{"source":191,"target":133,"value":1},{"source":192,"target":1,"value":1},{"source":193,"target":1,"value":1},{"source":194,"target":1,"value":1},{"source":195,"target":1,"value":1},{"source":196,"target":1,"value":1},{"source":197,"target":1,"value":1},{"source":198,"target":1,"value":1},{"source":199,"target":1,"value":1},{"source":200,"target":1,"value":1},{"source":201,"target":1,"value":1},{"source":202,"target":1,"value":1},{"source":203,"target":1,"value":1},{"source":204,"target":1,"value":1},{"source":205,"target":1,"value":1},{"source":206,"target":185,"value":1},{"source":207,"target":206,"value":1},{"source":208,"target":207,"value":1},{"source":209,"target":208,"value":1},{"source":210,"target":209,"value":1},{"source":211,"target":210,"value":1},{"source":212,"target":211,"value":1},{"source":213,"target":133,"value":1},{"source":214,"target":211,"value":1},{"source":215,"target":212,"value":1},{"source":216,"target":212,"value":1},{"source":217,"target":1,"value":1},{"source":218,"target":215,"value":1},{"source":219,"target":218,"value":1},{"source":220,"target":218,"value":1}]}'
        
        this.mis = '{"nodes":[], "links":[]}';	
        	
        this.configGraph();
        
        setInterval(function() {
        	my_self.loadProcessData();
		}, 2000);
        
    };
    
    ProcessView.prototype.loadProcessData = function() {
    	var my_self = this;
    	
//    	console.log("Ahi va");
        
        function findIndexByKeyValue(arraytosearch, key, valuetosearch) {
        	for (var i = 0; i < arraytosearch.length; i++) {
	        	if (arraytosearch[i][key] == valuetosearch) {
	        		return i;
	        	}
        	}
        	return null;
        }
        
        my_self.stopAnimation();
        
        var sys = require('sys')
        var exec = require('child_process').exec;
        var child;
        child = exec("ps axj | awk '{printf $1 \" \"; printf $2 \" \"; print $10;}'", function (error, stdout, stderr) {
        	
        	var dict ={"nodes": [], "links": []};
        	
        	var processes = stdout.split("\n");
        	
        	var i = 0;
        	for (process in processes) {
        		data = processes[process].split(" ");
        		dict.nodes[i] = {"group": 1, "pid": data[1], "ppid": data[0], "command": data[2]};
        		i = i+1;
        	}
        	dict.nodes.shift();
        	dict.nodes.pop();
        	
        	i = 0;
        	for(process in dict.nodes){
        		if(dict.nodes[process].ppid != "0"){
        			dict.links[i] = {"source": parseInt(process), "target": findIndexByKeyValue(dict.nodes, "pid", dict.nodes[process].ppid), "value":1};
        			i = i+1;
        		}
        	}
        	
        	my_self.mis = JSON.stringify(dict);
        	
        	my_self.graph = JSON.parse(my_self.mis);
        	
        	
        	
        	my_self.force.nodes(my_self.graph.nodes).links(my_self.graph.links);

        	my_self.createLines();

        	my_self.createNodes();
        	
        	my_self.startAnimation();

//        	console.log(JSON.stringify(dict));
        	
        	if (error !== null) {
        		console.log('exec error: ' + error);
        	}
        });
    };
  
    ProcessView.prototype.configGraph = function() {
    	var my_self = this;
    	
    	//Set up the force layout
        this.force = d3.layout.force().charge(-120).linkDistance(30);
        
        this.zoom = d3.behavior.zoom().on("zoom", function() {my_self.autoPanZoom()});
        
        var drag = d3.behavior.drag()
        .origin(function(d) { return d; })
        .on("dragstart", this.dragstarted)
        .on("drag", this.dragged)
        .on("dragend", this.dragended);

        var margin = {top: -5, right: -5, bottom: -5, left: -5};
        
        //Append a SVG to the body of the html page. Assign this SVG as an object to svg
        this.svg = d3.select(this._$container.get(0)).append("svg").attr('style', 'width: 100%; height: 100%;');

        this.rect = this.svg.append("g").append("rect")
            .attr("width", this._$container.width())
            .attr("height", this._$container.height())
            .style("fill", "none")
            .style("pointer-events", "all")
            .call(this.zoom);
            
        this.g = this.svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.right + ")")
            .call(this.zoom);

        //Read the data from the mis element 
        this.graph = JSON.parse(this.mis);

        //Creates the graph data structure out of the json data
        this.force.nodes(this.graph.nodes).links(this.graph.links);
        
        this.createLines();

        this.createNodes();

        this.tickConfig();
               
		this.createZoomControl(); 
    };
    
    //Create all the line svgs but without locations yet
    ProcessView.prototype.createLines = function() {
    	this.link = this.g.selectAll(".link").data(this.graph.links).enter().append("line").attr("class", "link").style(
                "stroke-width", function(d) {
                    return Math.sqrt(d.value);
                });
    };
    
    //Do the same with the circles for the nodes
    ProcessView.prototype.createNodes = function() {
    	var my_self = this;
    	
    	//Set up the colour scale
        var color = d3.scale.category20();
        
        var tooltip = d3.select("body").append("div").attr("class", "tooltip").style("opacity", 0);
        
    	this.node = this.g.selectAll(".node").data(this.graph.nodes).enter().append("circle").attr("class", "node").attr("r", 8)
        .style("fill", function(d) {
            return color(d.group);
        }).call(this.force.drag).on(
                "mouseover",
                function(d, i) {
                	// disable zoom
                	my_self.g.on(".zoom", null);
                    tooltip.transition().duration(200).style("opacity", .9);
                    tooltip.html(my_self.graph.nodes[i].command + " " + my_self.graph.nodes[i].pid).style("left", (d3.event.pageX) + "px").style("top",
                            (d3.event.pageY - 28) + "px");
                }).on("mouseout", function(d) {
            tooltip.transition().duration(500).style("opacity", 0);
            //reenable zoom
            my_self.g.call(my_self.zoom);
        });
    };
    
    ProcessView.prototype.tickConfig = function() {
    	//Now we are giving the SVGs co-ordinates - the force layout is generating the co-ordinates which this code is using to update the attributes of the SVG elements
        var tickCount = 0;
        var skipFrame = 10; //Modificar este valor para saltaear frame de renderizado
        var my_self = this;
        
        this.force.on("tick", function() {
            tickCount = tickCount + 1;
            if (tickCount % skipFrame == 0) {
            	my_self.link.attr("x1", function(d) {
                    return d.source.x;
                }).attr("y1", function(d) {
                    return d.source.y;
                }).attr("x2", function(d) {
                    return d.target.x;
                }).attr("y2", function(d) {
                    return d.target.y;
                });

            	my_self.node.attr("cx", function(d) {
                    return d.x;
                }).attr("cy", function(d) {
                    return d.y;
                });
//            	my_self.node.each(my_self.collide(0.5)); //De momento deshabilitado ya que hace que el grafo no converja
            }
            ;
        });
    };
    
    ProcessView.prototype.startAnimation = function() {
    	this.force.start();
    };
    
    ProcessView.prototype.stopAnimation = function() {
    	this.force.stop();
    };
    
    ProcessView.prototype.dragstarted = function(d) {
    	d3.event.sourceEvent.stopPropagation();
  	  	d3.select(this).classed("dragging", true);
    };
    
    ProcessView.prototype.dragged = function(d) {
    	d3.select(this).attr("cx", d.x = d3.event.x).attr("cy", d.y = d3.event.y);
    };
    
    ProcessView.prototype.dragended = function(d) {
    	d3.select(this).classed("dragging", false);
    };
    
    //Codigo para evitar que nodos quedes superpuestos
    ProcessView.prototype.collide = function(alpha) {
    	var padding = 1; // separation between circles
        var radius = 8;
    	var quadtree = d3.geom.quadtree(this.graph.nodes);
        return function(d) {
            var rb = 2 * radius + padding, nx1 = d.x - rb, nx2 = d.x + rb, ny1 = d.y - rb, ny2 = d.y + rb;
            quadtree.visit(function(quad, x1, y1, x2, y2) {
                if (quad.point && (quad.point !== d)) {
                    var x = d.x - quad.point.x, y = d.y - quad.point.y, l = Math.sqrt(x * x + y * y);
                    if (l < rb) {
                        l = (l - rb) / l * alpha;
                        d.x -= x *= l;
                        d.y -= y *= l;
                        quad.point.x += x;
                        quad.point.y += y;
                    }
                }
                return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
            });
        };;
    };
    
    //Resize: Cambia el tamaño del cuadro donde se dibuja el grafo
    ProcessView.prototype.resize = function() {
    	width = this._$container.width(), height = this._$container.height();
        this.svg.attr("width", width).attr("height", height);
        this.rect.attr("width", width).attr("height", height);
        this.force.size([ width, height ]).resume();
    };
    
    //Rescale: cambia el zoom del grafo segun la rueda del mouse
    ProcessView.prototype.autoPanZoom = function() {
    	trans=d3.event.translate;
  	  	scale=d3.event.scale;

  	  	this.g.attr("transform",
  	      "translate(" + trans + ")"
  	      + " scale(" + scale + ")");
    };
    
    ProcessView.prototype.manualPan = function(dx, dy) {
    	var currentx = d3.transform(this.g.attr("transform")).translate[0];
    	var currenty = d3.transform(this.g.attr("transform")).translate[1];
    	var currentScale = d3.transform(this.g.attr("transform")).scale[0];
    	
    	trans = (currentx + dx) + "," + (currenty + dy);
    	this.g.attr("transform",
      	      "translate(" + trans + ")"
      	      + " scale(" + currentScale + ")");
    	
    	this.zoom.scale(currentScale);
    	this.zoom.translate([currentx + dx, currenty + dy]);
    };
    
    ProcessView.prototype.manualZoom = function(scale) {
    	var currentx = d3.transform(this.g.attr("transform")).translate[0];
    	var currenty = d3.transform(this.g.attr("transform")).translate[1];
    	var currentScale = d3.transform(this.g.attr("transform")).scale[0];
    	var newScale = scale * currentScale;
    	trans = currentx  + "," +currenty ;
    	
    	this.g.attr("transform",
        	      "translate(" + trans + ")"
        	      + " scale(" + newScale + ")");
    	
    	this.zoom.scale(newScale);
    	this.zoom.translate([currentx, currenty]);
    };
    
    ProcessView.prototype.createZoomControl = function() {
    	//Control de zoom y pan manual
    	var my_self = this;
    	
        this.svg.append("circle").attr("cx", 50).attr("cy", 50).attr("r", 42).attr("fill", "white").attr("opacity", "0.75");
        
        this.svg.append("path").attr("d", "M50 10 l12   20 a40, 70 0 0,0 -24,  0z").attr("class", "button").on("click", function() {my_self.manualPan( 0, 50)});
        this.svg.append("path").attr("d", "M10 50 l20  -12 a70, 40 0 0,0   0, 24z").attr("class", "button").on("click", function() {my_self.manualPan( 50, 0)});
        this.svg.append("path").attr("d", "M50 90 l12  -20 a40, 70 0 0,1 -24,  0z").attr("class", "button").on("click", function() {my_self.manualPan( 0, -50)});
        this.svg.append("path").attr("d", "M90 50 l-20 -12 a70, 40 0 0,1   0, 24z").attr("class", "button").on("click", function() {my_self.manualPan( -50, 0)});
        
        this.svg.append("circle").attr("cx", 50).attr("cy", 50).attr("r", 20).attr("class", "compass");
        this.svg.append("circle").attr("cx", 50).attr("cy", 41).attr("r", 8).attr("class", "button").on("click", function() {my_self.manualZoom(0.8)});
        this.svg.append("circle").attr("cx", 50).attr("cy", 59).attr("r", 8).attr("class", "button").on("click", function() {my_self.manualZoom(1.2)});
        
        this.svg.append("rect").attr("x", 46).attr("y", 39.5).attr("width", 8).attr("height", 3).attr("class", "plus-minus");
        this.svg.append("rect").attr("x", 46).attr("y", 57.5).attr("width", 8).attr("height", 3).attr("class", "plus-minus");
        this.svg.append("rect").attr("x", 48.5).attr("y", 55).attr("width", 3).attr("height", 8).attr("class", "plus-minus");

    };
   
    ProcessView.prototype.render = function() {
        if (this._$out_of_dom) {

            this._$out_of_dom.appendTo(this.box);
            this._$out_of_dom = null;

        }
        
        this.resize();

    };

    ProcessView.prototype.unlink = function() {
        if (!this._$out_of_dom) {
            this._$out_of_dom = this._$container.detach();
        }
    };

    ProcessView.prototype.__proto__ = layout.Panel.prototype;

    return {
        ProcessView : ProcessView
    };

});
