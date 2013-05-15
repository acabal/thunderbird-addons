#Thunderbird Addons

##About
A handful of simple Thunderbird addons that I've developed and found helpful.

###AWN Unread Count
Shows the number of unread messages in all accounts over the Thunderbird icon in the AWN dock.  Linux only.

###Enhanced Desktop Notifications
Uses notify-send to provide new mail notifications with a nicer icon, grouped notifications, and notifications for all new mail, not just the mail Ubuntu thinks is important. Linux only.

###Hide Local Folders
Hides the "Local Folders" entry in the folder pane.  Local folders will continue to work as usual, they're just not displayed.

###Mark Gmail Read
Keeps all messages in the [Gmail] IMAP folder marked as read.  Useful for the drafts, spam, and sent messages folder, which frequently accumulate unread messages in Gmail.

###Mark Junk Read
Keeps all messages in Thunderbird junk folders, and folders named "junk" or "spam", marked as read.  Useful for IMAP servers that pre-sort junk mail, potentially leaving you with a junk folder constantly filling up with unread messages.

###Subject Generator
Adds a "Subject!" button to the Compose Mail window that changes the message subject to a random subject line from Yahoo! Mail's Subject-O-Matic.

##Building
A .xpi file is just a zip file; so, to "build" from source, just create a zip file of the contents of the src/ directory and change the extension to .xpi.

##Installing
Download any of the .xpi files in this repository and add them to Thunderbird using the Tools->Addons dialog.

