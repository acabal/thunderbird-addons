var markGmailRead = {
	MSG_FOLDER_GMAIL: '[Gmail]',
	MSG_FOLDER_GMAIL_ALL_MAIL: 'All Mail',
	MSG_FOLDER_GMAIL_IMPORTANT: 'Important',
	MSG_FOLDER_GMAIL_STARRED: 'Starred',
	MSG_FOLDER_FLAG_MAIL: 0x0004,
	timeoutId: -1,
	mailSession: '',
	notifyFlags: '',

	onLoad: function(e) {
 		//Run this function immediately on startup to clear Gmail folders
		markGmailRead.onItemCountChanged();
	},

	folderListener: {
		OnItemAdded: function(parent, item, viewString){
				markGmailRead.onItemCountChanged();
		},
		OnItemRemoved: function(parent, item, viewString){
				markGmailRead.onItemCountChanged();
		},
		OnItemPropertyFlagChanged: function(item, property, oldFlag, newFlag){
			if (property == "Status"){
				markGmailRead.onItemCountChanged();
			}
		},
		OnItemEvent: function(item, event){
				markGmailRead.onItemCountChanged();
		},
		
		//These functions must be defined or we get exceptions
		OnFolderLoaded: function(aFolder) {},
		OnDeleteOrMoveMessagesCompleted: function(aFolder) {},
		OnItemPropertyChanged: function(parent, item, viewString) {},
		OnItemIntPropertyChanged: function(item, property, oldVal, newVal) {},
		OnItemBoolPropertyChanged: function(item, property, oldValue, newValue) {},
		OnItemUnicharPropertyChanged: function(item, property, oldValue, newValue) {}
	},
	
	onItemCountChanged: function(){
		if(this.timeoutId != -1){
			window.clearTimeout(this.timeoutId);
		}
		
		// Schedule on the main thread
		this.timeoutId = window.setTimeout(function(){ markGmailRead.markAllGmailRead(); }, 1000, this);
	},
	
	markAllGmailRead: function(){
		var acctMgr = Components.classes["@mozilla.org/messenger/account-manager;1"].getService(Components.interfaces.nsIMsgAccountManager);
		var accounts = acctMgr.accounts;
		
		for(var i = 0; i < accounts.Count(); i++){
			var account = accounts.QueryElementAt(i, Components.interfaces.nsIMsgAccount);
			var rootFolder = account.incomingServer.rootFolder; // nsIMsgFolder            
			if(rootFolder.hasSubFolders){
				markGmailRead.markGmailRead(rootFolder);
			}
		}
	},
	
	markGmailRead: function(rootFolder){
		var subFolders = rootFolder.getFoldersWithFlags(this.MSG_FOLDER_FLAG_MAIL); //nsIArray
		var subFoldersEnumerator = subFolders.enumerate();
		
		while(subFoldersEnumerator.hasMoreElements()){
			var folder = subFoldersEnumerator.getNext().QueryInterface(Components.interfaces.nsIMsgFolder);
			if(folder.prettiestName == markGmailRead.MSG_FOLDER_GMAIL){
				//The [Gmail] folder doesn't return an unread message count, even if subfolders have unread items.
				//So we iterate over each subfolder and mark it as read that way.
				var gmailSubFolders = folder.getFoldersWithFlags(this.MSG_FOLDER_FLAG_MAIL); //nsIArray
				var gmailSubFoldersEnumerator = gmailSubFolders.enumerate();
				while(gmailSubFoldersEnumerator.hasMoreElements()){
					var gmailFolder = gmailSubFoldersEnumerator.getNext().QueryInterface(Components.interfaces.nsIMsgFolder);
					//Don't mark various special folder as read, because that might mess up the inbox.
					if(gmailFolder.getNumUnread(false) > 0 
					&& gmailFolder.prettiestName != markGmailRead.MSG_FOLDER_GMAIL_ALL_MAIL
					&& gmailFolder.prettiestName != markGmailRead.MSG_FOLDER_GMAIL_IMPORTANT
					&& gmailFolder.prettiestName != markGmailRead.MSG_FOLDER_GMAIL_STARRED){
						gmailFolder.markAllMessagesRead(null);
					}
				}
			}
		}
	}
};


//Plugin entry point
window.addEventListener("load", function(e) { markGmailRead.onLoad(e); }, false);

markGmailRead.mailSession = Components.classes["@mozilla.org/messenger/services/session;1"].getService(Components.interfaces.nsIMsgMailSession);
markGmailRead.notifyFlags = Components.interfaces.nsIFolderListener.all;
markGmailRead.mailSession.AddFolderListener(markGmailRead.folderListener, markGmailRead.notifyFlags);
