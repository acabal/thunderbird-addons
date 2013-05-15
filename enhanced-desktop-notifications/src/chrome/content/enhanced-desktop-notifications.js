var enhancedDesktopNotifications = {
	MSG_FOLDER_INBOX: 0x00001000,
	MSG_FOLDER_GMAIL: '[Gmail]',
	MSG_FOLDER_TRASH: 0x00000100,
	MSG_FOLDER_SENT: 0x00000200,
	MSG_FOLDER_DRAFTS: 0x00000400,
	MSG_FOLDER_QUEUE: 0x00000800,
	MSG_FOLDER_JUNK: 0x40000000,
	
	notifications: [],
	
	mailSession: '',
	notifyFlags: '',
	timeoutId: -1,
	
	isInterestingFolder: function(folder){
		//For flag constants see http://mxr.mozilla.org/mozilla/source/mailnews/base/public/nsMsgFolderFlags.idl

		//If we're only looking at the inbox, then check that now
		if(enhancedDesktopNotifications.inboxOnly && !folder.getFlag(enhancedDesktopNotifications.MSG_FOLDER_INBOX))
			return false;
		
		if(folder.prettiestName == enhancedDesktopNotifications.MSG_FOLDER_GMAIL) //gmail root folder
			return false;
			
		if(folder.getFlag(enhancedDesktopNotifications.MSG_FOLDER_TRASH)) //trash
			return false;
			
		if(folder.getFlag(enhancedDesktopNotifications.MSG_FOLDER_SENT)) //sent mail
			return false;
			
		if(folder.getFlag(enhancedDesktopNotifications.MSG_FOLDER_DRAFTS)) //drafts
			return false;
			
		if(folder.getFlag(enhancedDesktopNotifications.MSG_FOLDER_QUEUE)) //queue
			return false;
			
		if(folder.getFlag(enhancedDesktopNotifications.MSG_FOLDER_JUNK)) //junk
			return false;
			
		return true;
	},

	folderListener: {
		OnItemAdded: function(parent, item, viewString) {
				//It appears we have to validate these object types by casting them first, otherwise their attributes will be undefined.
				//Not sure why.
               			var x = item instanceof Components.interfaces.nsIMsgDBHdr;
				var y = parent instanceof Components.interfaces.nsIMsgFolder;
				
				if(!item.isRead && enhancedDesktopNotifications.isInterestingFolder(parent) && item.subject.indexOf('[SPAM]') == -1){ //only for new items
					enhancedDesktopNotifications.addToNotificationQueue(parent.rootFolder.prettiestName, parent.rootFolder.prettiestName + " has new mail", "From " + item.author + "\\n" + item.subject);
				}
		},
		//The following must be defined, or we get exceptions thrown
		OnItemRemoved: function(parent, item, viewString) {},
		OnItemPropertyFlagChanged: function(item, property, oldFlag, newFlag) {},
		OnItemEvent: function(item, event) {},
		
		OnFolderLoaded: function(aFolder) {},
		OnDeleteOrMoveMessagesCompleted: function(aFolder) {},
		OnItemPropertyChanged: function(parent, item, viewString) {},
		OnItemIntPropertyChanged: function(item, property, oldVal, newVal) {},
		OnItemBoolPropertyChanged: function(item, property, oldValue, newValue) {},
		OnItemUnicharPropertyChanged: function(item, property, oldValue, newValue) {}
	},
	
	//Do the dirty work of showing a notification.
	showNotification: function(subject, body){
		var file = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsIFile);		
		file.initWithPath("/usr/bin/env");
		
		var args = ["notify-send", "--urgency=normal", "--icon=mail-notification", subject, body];
		var process = Components.classes["@mozilla.org/process/util;1"].createInstance(Components.interfaces.nsIProcess);
		process.init(file);
		
		process.run(false, args, args.length);
	},
	
	//We use this function to stack notifications of many new mails received at once.
	//For example, if we start TB in the morning, we may have 100 new messages.  This function queues the notifications so that we show 1 notification for the 100 messages instead of 100 notifications.
	addToNotificationQueue: function(account, subject, body){
		enhancedDesktopNotifications.notifications.push({"account":account, "subject":subject, "body":body});
		
		if(enhancedDesktopNotifications.notifications.length == 1){
			//If we have any items in the queue, we set a timeout on this function to execute 1 second later.
			//That will give us enough time to process many messages added at once.
			setTimeout(function(){
				if(enhancedDesktopNotifications.notifications.length == 1){
					//Only one mail received, show subject and sender.
					enhancedDesktopNotifications.showNotification(enhancedDesktopNotifications.notifications[0].subject, enhancedDesktopNotifications.notifications[0].body);
				}
				else{
					//Many emails received, group them by account and show 1 notification.
					var uniqueAccounts = [];
					
					for each(var notif in enhancedDesktopNotifications.notifications){
						var add = true;
						
						for each(var account in uniqueAccounts){
							if(account.name == notif.account){
								account.count++;
								add = false;
							}
						}
						
						if(add){
							uniqueAccounts.push({"name":notif.account, "count":1});
						}
					}
					
					body = ""
					totalCount = 0;
					for each(account in uniqueAccounts){
						body += account.name + " has " + account.count + " new message";
						if(account.count != 1)
							body += "s";
							
						totalCount += account.count;
						
						body += "\\n";
					}
					
					//Remove extra newline from body
					body = body.substring(0, body.length - 2);
					
					//Handle the subject of the notification
					subject = "You have " + totalCount + " new messages";

					enhancedDesktopNotifications.showNotification(subject, body);
				}
				
				//Flush the notification queue
				enhancedDesktopNotifications.notifications = [];
			}, 1000)
		}
	}
};


//Plugin entry point
enhancedDesktopNotifications.mailSession = Components.classes["@mozilla.org/messenger/services/session;1"].getService(Components.interfaces.nsIMsgMailSession);
enhancedDesktopNotifications.notifyFlags = Components.interfaces.nsIFolderListener.all;
enhancedDesktopNotifications.mailSession.AddFolderListener(enhancedDesktopNotifications.folderListener, enhancedDesktopNotifications.notifyFlags);
