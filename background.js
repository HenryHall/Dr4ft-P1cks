
console.log("Dr4ft-Picks background.js running");

chrome.runtime.onInstalled.addListener(function() {
    chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
        chrome.declarativeContent.onPageChanged.addRules([{
            conditions: [
                new chrome.declarativeContent.PageStateMatcher({
                    pageUrl: {urlMatches: "dr4ft.info/*"}
                })
            ],
            actions: [new chrome.declarativeContent.ShowPageAction()]
        }]);
    });
});


chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.subject === "api_key_request") {
        //Who cares who is asking!  This isn't secure anyways
        chrome.storage.sync.get(["Dr4ftP1cks-api-key"], function(result) {
            let value = result["Dr4ftP1cks-api-key"];
            if(typeof chrome.runtime.lastError !== 'undefined'){
                sendResponse({from: "background_script", subject: "api_key_result", status: "error"});
                setBadgeError();
            } else if(typeof value === 'undefined') {
                sendResponse({from: "background_script", subject: "api_key_result", status: "not_set"});
                setBadgeError();
            } else {
                sendResponse({from: "background_script", subject: "api_key_result", status: "success", message: value});
                resetBadge();
            }
        });

        //Indicate async
        return true;
    }

    if (request.from === "popup_script") {
        if(request.subject === "api_key_update"){
            chrome.storage.sync.set({"Dr4ftP1cks-api-key": request.message}, function() {
                if(typeof chrome.runtime.lastError === 'undefined'){
                    sendResponse({from: "background_script", subject: "api_key_result", status: "success", message: request.message});
                    //Make sure the extension knows about the update
                    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                        chrome.tabs.sendMessage(tabs[0].id,{from: 'background_script', subject: "api_key_result", status: "success", message: request.message});
                    });
                    resetBadge();
                } else {
                    sendResponse({from: "background_script", subject: "api_key_result", status: "error"});
                    setBadgeError();
                }
            });

            //Indicate async
            return true;
        }
    }
});


function setBadgeError(){
    chrome.browserAction.setBadgeText({text: '!!!'});
    chrome.browserAction.setBadgeBackgroundColor({color: '#ff0000'});
}

function resetBadge(){
    chrome.browserAction.setBadgeText({text: ''});
}

