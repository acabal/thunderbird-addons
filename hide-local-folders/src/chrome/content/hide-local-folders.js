for(var i = 0; i < gFolderTreeView._modeNames.length; i++){
	let viewName = gFolderTreeView._modeNames[i];
	let view = gFolderTreeView.getFolderTreeMode(viewName);
	
	//Store the old function that generates the folder view
	view.hideLocalFolders_oldFunction = view.generateMap;

	//Override the old function with our new one that strips local folders
	view.generateMap = function(ftv){
		//Call the original function first to get the full list of folder rows.
		//We use .call() here to preserve the context of "this" within the function.
		//Without it, smart (unified) folders fail to load.
		let ftvItems = this.hideLocalFolders_oldFunction.call(view, ftv);
		
		//Remove the "Local Folder" row that was returned
		for(var j = 0; j < ftvItems.length; j++){
			if(ftvItems[j].text == "Local Folders"){
				ftvItems.splice(j, 1);
			}
		}

		return ftvItems;
	}
}
