var markJunkRead = {
	MSG_FOLDER_JUNK: 0x40000000,
	MSG_FOLDER_FLAG_MAIL: 0x0004,
	timeoutId: -1,
	mailSession: '',
	notifyFlags: '',

	onLoad: function(e) {
 		//Run this function immediately on startup to clear junk folders
		markJunkRead.onItemCountChanged();
	},

	folderListener: {
		OnItemAdded: function(parent, item, viewString){
				markJunkRead.onItemCountChanged();
		},
		OnItemRemoved: function(parent, item, viewString){
				markJunkRead.onItemCountChanged();
		},
		OnItemPropertyFlagChanged: function(item, property, oldFlag, newFlag){
			if (property == "Status"){
				markJunkRead.onItemCountChanged();
			}
		},
		OnItemEvent: function(item, event){
				markJunkRead.onItemCountChanged();
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
		this.timeoutId = window.setTimeout(function(){ markJunkRead.markAccountsRead(); }, 1000, this);
	},
	
	markAccountsRead: function(){
		var acctMgr = Components.classes["@mozilla.org/messenger/account-manager;1"].getService(Components.interfaces.nsIMsgAccountManager);
		var accounts = acctMgr.accounts;
		
		for(var i = 0; i < accounts.Count(); i++){
			var account = accounts.QueryElementAt(i, Components.interfaces.nsIMsgAccount);
			var rootFolder = account.incomingServer.rootFolder; // nsIMsgFolder            
			if(rootFolder.hasSubFolders){
				markJunkRead.markJunkRead(rootFolder);
			}
		}
	},
	
	markJunkRead: function(rootFolder){
		var subFolders = rootFolder.getFoldersWithFlags(this.MSG_FOLDER_FLAG_MAIL); //nsIArray
		var subFoldersEnumerator = subFolders.enumerate();
		
		while(subFoldersEnumerator.hasMoreElements()){
			var folder = subFoldersEnumerator.getNext().QueryInterface(Components.interfaces.nsIMsgFolder);
			
			if(folder.getFlag(markJunkRead.MSG_FOLDER_JUNK) || folder.prettiestName.toLowerCase() == 'spam' || folder.prettiestName.toLowerCase() == 'junk'){
				if(folder.getNumUnread(false) > 0){
					folder.markAllMessagesRead(null);
				}
			}
		}
	}
};


//Plugin entry point
window.addEventListener("load", function(e) { markJunkRead.onLoad(e); }, false);

markJunkRead.mailSession = Components.classes["@mozilla.org/messenger/services/session;1"].getService(Components.interfaces.nsIMsgMailSession);
markJunkRead.notifyFlags = Components.interfaces.nsIFolderListener.all;
markJunkRead.mailSession.AddFolderListener(markJunkRead.folderListener, markJunkRead.notifyFlags);
