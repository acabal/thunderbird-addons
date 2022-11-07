const MSG_FOLDER_GMAIL = '[Gmail]';
let NUM_MESSAGES_TO_APPROVE = 10;
let foldersForApproval = new Set();
let approvalWindows = {};
let approvedFolders = new Set();
let blacklistedFolders = new Set();
let approvedFoldersSession = new Set();
let blacklistedFoldersSession = new Set();

async function* iterateMessageList(messageList) {
  for (let message of messageList.messages) {
    yield message;
  }

  while (messageList.id) {
    messageList = await messenger.messages.continueList(messageList.id);
    for (let message of messageList.messages) {
      yield message;
    }
  }
}

async function shouldHandleFolder(folder)
{
  // We need to skip All Mail, Starred and Important. All of these have the .type property undefined
  if (!folder.type)
    return false;

  if (blacklistedFolders.has(getFolderKey(folder)) || blacklistedFoldersSession.has(getFolderKey(folder)))
    return false;

  let parentFolders = await messenger.folders.getParentFolders(folder);
  if (!parentFolders || parentFolders.length === 0)
    return false;

  for (let parent of parentFolders)
  {
    if (parent.name === MSG_FOLDER_GMAIL)
      return true;
  }
  return false;
}

async function handleMessage(message, sender, sendResponse) {
  if (message && message.action)
  {
    let key = getFolderKey(message.folder);
    switch (message.action)
    {
      case "mgrApprove":
        if (message.approve) {
          console.warn("MGR: Approved marking messages in " + message.folder.path + " as read.");
          processFolder(message.folder, true);
        }
        if (message.persist === "forever") {
          if (message.approve) {
            console.log("MGR: Will always mark messages from " + key + " as read.");
            approvedFolders.add(key);
            messenger.storage.local.set({ approved: [...approvedFolders] });
          } else {
            console.log("MGR: Will not mark messages from " + key + " as read.");
            blacklistedFolders.add(key);
            messenger.storage.local.set({ blacklisted: [...blacklistedFolders] });
          }
        } else if (message.persist === "session") {
          if (message.approve) {
            console.log("MGR: Will always mark messages from " + key + " as read in this session.");
            approvedFoldersSession.add(key);
          } else {
            console.log("MGR: Will not mark messages from " + key + " as read in this session.");
            blacklistedFoldersSession.add(key);
          }
        }
        break;
    }
  }
}

function getFolderKey(folder) {
  return folder.accountId + folder.path;
}

async function askForPermission(folder, numUnread) {
  let key = getFolderKey(folder);
  if (foldersForApproval.has(key))
    return;
  foldersForApproval.add(key);
  let account = await messenger.accounts.get(folder.accountId);
  let url = "approve.html";
  url += "?numUnread=" + numUnread;
  url += "&accountId=" + encodeURIComponent(folder.accountId);
  url += "&accountName=" + encodeURIComponent(account.name);
  url += "&folder=" + encodeURIComponent(folder.path);
  url += "&type=" + folder.type;
  messenger.windows.create({"url": url, "type": "popup", "allowScriptsToClose": true, "width": 480, "height": 128}).then((window) => {
    approvalWindows[window.id] = key;
  });
}

function onWindowRemoved(windowId)
{
  if (windowId in approvalWindows)
  {
    let key = approvalWindows[windowId];
    foldersForApproval.delete(key);
    delete approvalWindows[windowId];
  }
}

async function processFolder(folder, hasPermission = false) {
  messenger.messages.query({"folder": folder, "unread": true, "includeSubFolders": true}).then(
    async (messageList) => {
      let key = getFolderKey(folder);
      if (!hasPermission && messageList.messages.length > NUM_MESSAGES_TO_APPROVE && !approvedFolders.has(key) && !approvedFoldersSession.has(key))
      {
        askForPermission(folder, messageList.messages.length);
        return;
      }
      for await (let message of iterateMessageList(messageList)) {
        await messenger.messages.update(message.id, {"read": true});
        console.info("MGR: folder: " + folder.path + ", msg id: " + message.id + " was marked as read.");
      }
    },
    (error) => {
      console.error("MGR: folder: " + folder.path + ", error: " + error);
    }
  );
}

async function onFolderInfoChangedListener(folder, folderInfo) {
  if (folderInfo.unreadMessageCount === 0 || !await shouldHandleFolder(folder))
    return;

  await processFolder(folder);
}

async function load() {

  console.log("MGR: load started");

  let config = await messenger.storage.local.get({
    approved: [],
    blacklisted: [],
    updateNoticeShown: false,
    numMessagesToApprove: NUM_MESSAGES_TO_APPROVE,
  });

  NUM_MESSAGES_TO_APPROVE = config.numMessagesToApprove;

  if (!config.updateNoticeShown)
  {
    let msg = "Addon Mark GMail Read has been updated for TB 102 and newer. " +
      "The way it works has changed a bit, so it will now ask you to confirm when more than " +
      NUM_MESSAGES_TO_APPROVE + " messages should be marked as read at once. " +
      "If you have any comments to this new approach, let me know at addons.thunderbird.net."
    messenger.notifications.create({type: "basic", title: "Mark GMail Read", message: msg});
    messenger.storage.local.set({updateNoticeShown: true});
  }

  for (let key of config.approved) {
    approvedFolders.add(key);
    console.log("MGR: Will always mark messages from " + key + " as read.");
  }

  for (let key of config.blacklisted) {
    blacklistedFolders.add(key);
    console.log("MGR: Will not mark messages from " + key + " as read.");
  }

  messenger.runtime.onMessage.addListener(handleMessage);
  messenger.windows.onRemoved.addListener(onWindowRemoved);

  messenger.folders.onFolderInfoChanged.addListener(onFolderInfoChangedListener);

  for (let account of await messenger.accounts.list(true)) {
    for (let folder of await messenger.folders.getSubFolders(account, true)) {
      for (let subFolder of folder.subFolders) {
        shouldHandleFolder(subFolder).then((should) => {
          if (!should)
            return;
          messenger.folders.getFolderInfo(subFolder).then((info) => {
            const numUnread = info.unreadMessageCount;
            console.log("MGR: SubFolder " + subFolder.name + " (" + account.id + subFolder.path + ", type " + subFolder.type + ", unread: " + numUnread + ")");
            if (numUnread > 0)
              processFolder(subFolder);
          });
        });
      }
    }
  }
}

document.addEventListener("DOMContentLoaded", load);