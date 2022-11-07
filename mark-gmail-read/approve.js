let folder = null;

const Choice = {
  Yes: 0,
  No: 1,
  Never: 2,
  NeverSession: 3,
}

const Actions = {
  [Choice.Yes]: "mgrApprove",
  [Choice.No]: null,
  [Choice.Never]: "mgrNever",
  [Choice.NeverSession]: "mgrNeverSession",
}

function load() {
  let params = new URLSearchParams(document.location.search);
  let numUnread = parseInt(params.get("numUnread"));
  let account = params.get("accountName");
  folder = {
    "accountId": params.get("accountId"),
    "path": params.get("folder"),
    "type": params.get("type"),
  }

  document.getElementById("text").innerHTML = "Allow marking " + numUnread + " or more messages in folder <b>" + account + folder.path + "</b> as read?";

  document.getElementById("yes").onclick = async () => {await submit(Choice.Yes);};
  document.getElementById("no").onclick = async () => {await submit(Choice.No);};
  document.getElementById("never").onclick = async () => {await submit(Choice.Never);};
  document.getElementById("neverSession").onclick = async () => {await submit(Choice.NeverSession);};
}

async function executeAction(action) {
  if (action === null)
    return;

  await messenger.runtime.sendMessage({"action": action, "folder": folder});
}

async function submit(choice) {
  if (!folder)
    return;

  let action = Actions[choice];
  await executeAction(action);

  window.close();
}

document.addEventListener("DOMContentLoaded", load);