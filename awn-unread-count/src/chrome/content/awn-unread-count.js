Components.utils.import("resource://app/modules/iteratorUtils.jsm");

var awnUnreadCount = {
	MSG_FOLDER_FLAG_MAIL: 0x0004,
	MSG_FOLDER_INBOX: 0x00001000,
	MSG_FOLDER_GMAIL: '[Gmail]',
	MSG_FOLDER_TRASH: 0x00000100,
	MSG_FOLDER_SENT: 0x00000200,
	MSG_FOLDER_DRAFTS: 0x00000400,
	MSG_FOLDER_QUEUE: 0x00000800,
	MSG_FOLDER_JUNK: 0x40000000,
	
	mailSession: '',
	notifyFlags: '',
	timeoutId: -1,
	
	onLoad : function(e) {
		//Read preferences
		const PREF_SERVICE = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService);
		this.prefs = PREF_SERVICE.getBranch("extensions.awn-unread-count@alexcabal.com.");
		this.prefs.QueryInterface(Components.interfaces.nsIPrefBranch);
		this.prefs.addObserver("", this, false);
		
     		if(this.prefs.prefHasUserValue("inboxOnly"))
 			this.inboxOnly = this.prefs.getBoolPref("inboxOnly");
 		else
 			this.inboxOnly = false;
 			
 		if(this.prefs.prefHasUserValue("useBadge"))
 			this.useBadge = this.prefs.getBoolPref("useBadge");
 		else
 			this.useBadge = true;
 		
 		//Run this function immediately on startup to get unread messages since our last close, without waitin for an item change event
		awnUnreadCount.onItemCountChanged();
	},
	
	onClose: function(e) {
		this.prefs.removeObserver("", this);
		
		this.resetUnreadCount();
	},
	
	resetUnreadCount: function() {
		this.updateUnreadCount(0, true);
	},
	
	updateUnreadCount: function(x, blockingProcess){
		const DIR_SERVICE = new Components.Constructor("@mozilla.org/file/directory_service;1","nsIProperties");
		try { 
			path=(new DIR_SERVICE()).get("ProfD", Components.interfaces.nsIFile).path; 
		} catch (e) {
			alert(error);
		}
		
		path = path + "/extensions/awn-unread-count@alexcabal.com/chrome/content/awn-notify.py";
		
		var file = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsIFile);		
		file.initWithPath("/usr/bin/env");
		
		var args = ["python", path, x, this.useBadge];
		var process = Components.classes["@mozilla.org/process/util;1"].createInstance(Components.interfaces.nsIProcess);
		process.init(file);
		
		process.run(blockingProcess, args, args.length);
	},

	onItemCountChanged : function() {
		if (this.timeoutId != -1) {
			window.clearTimeout(this.timeoutId);
		}
		// Schedule on the main thread
		this.timeoutId = window.setTimeout(function(){ awnUnreadCount.performUnreadCount(); }, 1000, this);
	},
	
	performUnreadCount: function() {
		var totalCount = 0;
		
		for each(let account in fixIterator(MailServices.accounts.accounts, Components.interfaces.nsIMsgAccount)){
			var rootFolder = account.incomingServer.rootFolder; // nsIMsgFolder            
			if (rootFolder.hasSubFolders) {
				totalCount += awnUnreadCount.getTotalCount(rootFolder);
			}
		}
		
		awnUnreadCount.updateUnreadCount(totalCount, false);
	},

	getTotalCount: function(rootFolder) {
		var totalCount = 0;
		var subFolders = rootFolder.getFoldersWithFlags(this.MSG_FOLDER_FLAG_MAIL); //nsIArray
		var subFoldersEnumerator = subFolders.enumerate();
		
		while(subFoldersEnumerator.hasMoreElements()) {
			var folder = subFoldersEnumerator.getNext().QueryInterface(Components.interfaces.nsIMsgFolder);
			if(this.isInterestingFolder(folder)){
				var count = folder.getNumUnread(false);
				if(count < 0) //Sometimes local folders can have a negative unread count for some reason
					count = 0;
				totalCount += count;
			}
		}
	
		return totalCount;
	},
	
	isInterestingFolder: function(folder){
		//For flag constants see http://mxr.mozilla.org/mozilla/source/mailnews/base/public/nsMsgFolderFlags.idl

		//If we're only looking at the inbox, then check that now
		if(awnUnreadCount.inboxOnly && !folder.getFlag(awnUnreadCount.MSG_FOLDER_INBOX))
			return false;
		
		if(folder.prettiestName == awnUnreadCount.MSG_FOLDER_GMAIL) //gmail root folder
			return false;
			
		if(folder.getFlag(awnUnreadCount.MSG_FOLDER_TRASH)) //trash
			return false;
			
		if(folder.getFlag(awnUnreadCount.MSG_FOLDER_SENT)) //sent mail
			return false;
			
		if(folder.getFlag(awnUnreadCount.MSG_FOLDER_DRAFTS)) //drafts
			return false;
			
		if(folder.getFlag(awnUnreadCount.MSG_FOLDER_QUEUE)) //queue
			return false;
			
		if(folder.getFlag(awnUnreadCount.MSG_FOLDER_JUNK)) //junk
			return false;
			
		return true;
	},

	folderListener : {
		OnItemAdded : function(parent, item, viewString) {
				//It appears we have to validate these object types by casting them first, otherwise their attributes will be undefined.
				//Not sure why.
               			var x = item instanceof Components.interfaces.nsIMsgDBHdr;
				var y = parent instanceof Components.interfaces.nsIMsgFolder;
				
				awnUnreadCount.onItemCountChanged();
		},
		OnItemRemoved : function(parent, item, viewString) {
				awnUnreadCount.onItemCountChanged();
		},
		OnItemPropertyFlagChanged : function(item, property, oldFlag, newFlag) {
			if (property == "Status"){
				awnUnreadCount.onItemCountChanged();
			}
		},
		OnItemEvent : function(item, event) {
				awnUnreadCount.onItemCountChanged();
		},
		
		OnFolderLoaded : function(aFolder) {},
		OnDeleteOrMoveMessagesCompleted : function(aFolder) {},
		OnItemPropertyChanged : function(parent, item, viewString) {},
		OnItemIntPropertyChanged : function(item, property, oldVal, newVal) {},
		OnItemBoolPropertyChanged : function(item, property, oldValue, newValue) {},
		OnItemUnicharPropertyChanged : function(item, property, oldValue, newValue) {}
	},
	
	observe: function(subject, topic, data) {
		if (topic != "nsPref:changed") {
			return;
		}
 
		switch(data) {
			case "inboxOnly":
				this.inboxOnly = this.prefs.getBoolPref("inboxOnly");
				awnUnreadCount.onItemCountChanged();
			case "useBadge":
				this.useBadge = this.prefs.getBoolPref("useBadge");
				awnUnreadCount.onItemCountChanged();
		}
	}
};


//Plugin entry point
window.addEventListener("load", function(e) { awnUnreadCount.onLoad(e); }, false);
window.addEventListener("close", function(e) { awnUnreadCount.onClose(e); }, false); 

awnUnreadCount.mailSession = Components.classes["@mozilla.org/messenger/services/session;1"].getService(Components.interfaces.nsIMsgMailSession);
awnUnreadCount.notifyFlags = Components.interfaces.nsIFolderListener.all;
awnUnreadCount.mailSession.AddFolderListener(awnUnreadCount.folderListener, awnUnreadCount.notifyFlags);
