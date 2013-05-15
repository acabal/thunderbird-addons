#!/usr/bin/env python

###########################
# Awn-notif python script #
###########################

import sys
import dbus
import os
import os.path

# Args :
#sys.argv[1] -> number of new mail (0 remove the message)
#sys.argv[2] -> true if using a badge instead of an icon message

# Get the unread mail number
if len(sys.argv) < 2:
    count = 0
else:
    count = int(sys.argv[1])

# Get whether or not to use a badge
if len(sys.argv) < 3:
    useBadge = 0
else:
    useBadge = sys.argv[2]
    
messageType = "message"
if useBadge == "1" or useBadge.lower() == "true":
	messageType = "badge"

# Replace the message number if needed
countText = '%i'
countText = countText % count

# Get awn
bus = dbus.SessionBus()
awnObj = bus.get_object("net.launchpad.DockManager", "/net/launchpad/DockManager")
awn = dbus.Interface(awnObj, "net.launchpad.DockManager")
paths = awn.GetItems();

for i in paths:
	itemObj = bus.get_object("net.launchpad.DockManager", i)
	item = dbus.Interface(itemObj, "net.launchpad.DockItem")
	itemProperties = dbus.Interface(item, "org.freedesktop.DBus.Properties")
	desktopFile = itemProperties.Get("net.launchpad.DockItem", "DesktopFile")
	if "thunderbird" in desktopFile:
		if count > 0:
			item.UpdateDockItem({messageType:countText})
		else:
			item.UpdateDockItem({messageType:""})
		break #only show the number in the first tb icon
			
# Switch the ASUS led
if os.path.exists('/proc/acpi/asus/mled'):
    if mail_number == 0:
        os.system('echo 0 > /proc/acpi/asus/mled')
    else:
        os.system('echo 1 > /proc/acpi/asus/mled')
