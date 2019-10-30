# Thunderbird Addons
A handful of simple Thunderbird addons that I've developed and found helpful.

### Enhanced Desktop Notifications
Uses notify-send to provide new mail notifications with a nicer icon, grouped notifications, and notifications for all new mail, not just the mail Ubuntu thinks is important. **Linux only.**<br>
[→ Add-on page](https://addons.thunderbird.net/de/thunderbird/addon/enhanced-desktop-notifications/)<br>

### Hide Local Folders
Hides the "Local Folders" entry in the folder pane.  Local folders will continue to work as usual, they're just not displayed.<br>
[→ Add-on page](https://addons.thunderbird.net/de/thunderbird/addon/hide-local-folders/)<br>

### Mark GMail Read
Automatically marks all messages in the "[Gmail]" folder and all subfolders as read. If your GMail uses localized (translated) Gmail folder names, you set them in Thunderbird preferences: `extensions.mark_gmail_read.folder_names.(all_mail|important|starred)`.<br>
[→ Add-on page](https://addons.thunderbird.net/de/thunderbird/addon/mark-gmail-read/)<br>

### Mark Junk Read
Keeps all messages in Thunderbird junk folders, and folders named "junk" or "spam", marked as read.  Useful for IMAP servers that pre-sort junk mail, potentially leaving you with a junk folder constantly filling up with unread messages.<br>
[→ Add-on page](https://addons.thunderbird.net/de/thunderbird/addon/mark-junk-read/)<br>

## Building
Run the `build` script in this repo to build all of the addons at once.

An *.xpi* file is just a zip file; so, to "build" from source, just create a zip file of the contents of each addon directory and change the extension to .xpi.

## Installing
Download any of the *.xpi* files in this repository and add them to Thunderbird using the "Hamburger menu → Add-ons" dialog.
