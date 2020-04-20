
(function(){

    console.log("Dr4ft-Picks popup.js running");

    const errorMessageDiv = document.getElementById("errorMessage");
    const apiKeyInput = document.getElementById("api-key-input");
    const apiKeySubmitButton = document.getElementById("api-key-submit");
    const apiKeyEditButton = document.getElementById("api-key-edit");

    apiKeySubmitButton.addEventListener('click', saveApiKey);
    apiKeyEditButton.addEventListener('click', enterSubmitMode);

    //Request the API key immediately
    chrome.runtime.sendMessage({from: 'popup_script', subject: "api_key_request", message: "please"}, receiveApiKeyMessage);

    function saveApiKey(){
        let apiKey = apiKeyInput.value;
        chrome.runtime.sendMessage({from: 'popup_script', subject: "api_key_update", message: apiKey}, receiveApiKeyMessage);
    }

    function receiveApiKeyMessage(response){
        if(typeof chrome.runtime.lastError === undefined){
            showErrorMessage("Chrome runtime error, please try again!");
        } else {
            if (response.from === "background_script") {
                //Handle requests from background_script
                if(response.subject === "api_key_result") {
                    if(response.status === "success") {
                        enterValidMode(response.message);
                    } else if(response.status === "not_set") {
                        showErrorMessage("Please provide your API key.");
                        enterSubmitMode();
                    } else {
                        showErrorMessage("Storage error, please try again!");
                        enterSubmitMode();
                    }
                }
            }
        }
    }

    //Does not mean the apiKey is valid, only that the user has provided a key and it was successfully saved
    function enterValidMode(apiKey){
        apiKeyInput.value = apiKey;
        hideErrorMessage();
        apiKeyInput.setAttribute('readonly', '');
        apiKeySubmitButton.classList.add('hidden');
        apiKeyEditButton.classList.remove('hidden');
        apiKeyEditButton.removeAttribute('disabled');
    }

    function enterSubmitMode(){
        apiKeyInput.removeAttribute('readonly');
        apiKeyEditButton.classList.add('hidden');
        apiKeySubmitButton.classList.remove('hidden');
        apiKeySubmitButton.removeAttribute('disabled');
    }

    function showErrorMessage(message){
        errorMessageDiv.classList.remove('hidden');
        errorMessageDiv.innerText = message;
    }

    function hideErrorMessage(){
        errorMessageDiv.classList.add('hidden');
    }

})();
