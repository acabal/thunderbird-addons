# Thunderbird Addons

A handful of simple Thunderbird addons that I've developed and found helpful.

## Enhanced Desktop Notifications

Uses `notify-send` to provide new mail notifications with a nicer icon, grouped notifications, and notifications for all new mail, not just the mail Ubuntu thinks is important. __Linux only.__

[→ Add-on page](https://addons.thunderbird.net/en-US/thunderbird/addon/enhanced-desktop-notifications/)

## Hide Local Folders

Hides the "Local Folders" entry in the folder pane.  Local folders will continue to work as usual, they're just not displayed.

[→ Add-on page](https://addons.thunderbird.net/en-US/thunderbird/addon/hide-local-folders/)

## Mark Gmail Read

Automatically marks all messages in the "[Gmail]" folder and all subfolders as read. 

**IMPORTANT!**
If your GMail uses localized (translated) Gmail folder names, you have to set three of them in [Thunderbird preferences](https://support.mozilla.org/en-US/kb/config-editor):

```
extensions.mark_gmail_read.folder_names.all_mail = "All mail"
extensions.mark_gmail_read.folder_names.important = "Important"
extensions.mark_gmail_read.folder_names.starred = "Starred"
```

If these names do not correspond to the actually shown folder names under the "[GMail]" folder, you can expect unwanted behavior, e.g. marking all messages in all folders as read.

[→ Add-on page](https://addons.thunderbird.net/en-US/thunderbird/addon/mark-gmail-read/)

## Mark Junk Read

Keeps all messages in Thunderbird junk folders, and folders named "junk" or "spam", marked as read.  Useful for IMAP servers that pre-sort junk mail, potentially leaving you with a junk folder constantly filling up with unread messages.

[→ Add-on page](https://addons.thunderbird.net/en-US/thunderbird/addon/mark-junk-read/)

## Building

Run the `build` script in this repo to build all of the addons at once.

An `.xpi` file is just a zip file. To "build" from source, just create a zip file of the contents of each addon directory and change the extension to `.xpi`.

## Installing

Download any of the `.xpi` files in this repository and add them to Thunderbird using the "Hamburger menu → Add-ons" dialog.
