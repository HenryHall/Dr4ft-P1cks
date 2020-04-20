(function(){
    'use strict';

    console.log(`Dr4ft P1ck content registered`);

    /**
     * @type {GameData}
     */
    let gameData, apiKey;

    //Check if user has entered a game room, if not attach listener
    if(GameUtils.inGameRoom()){
        run();
    } else if ("onhashchange" in window){
        window.addEventListener('hashchange', function () {
            if(GameUtils.inGameRoom()){
                run();
            } else if(gameData) {
                stop();
            }
        });
    }


    function run(){
        console.log(`Dr4ft P1ck content running`);

        let loggingIntervalId;
        let watchZonesIntervalId;

        //Ask for API key
        chrome.runtime.sendMessage({from: 'content_script', subject: "api_key_request", message: "please"}, apiKeyUpdate);
        //Listen for API key updates
        chrome.extension.onMessage.addListener(apiKeyUpdate);

        gameData = new GameData(apiKey);
        gameData.start()
            .then(function(){
                // loggingIntervalId = setInterval(console.log, 5000, gameData);
                watchZonesIntervalId = setInterval(watchZones, 250);

                return gameData.runningGamePromise;
            })
            .then(function(gameOverPromiseResolution){
                console.log('The draft has ended');
                let submitUI = SubmitUI.open();
                submitUI.registerCallback(function(){
                    submitUI.disableButton();
                    gameData.submitDraft()
                        .then(function(){
                            submitUI.setSuccess("Draft successfully submitted!");
                            clearInterval(watchZonesIntervalId);
                        })
                        .catch(function(error){
                            console.error(error);
                            submitUI.setError("There was a problem submitting your draft, please try again.");
                        })
                        .finally(function(){
                            submitUI.enableButton();
                        });
                });
            })
            .catch(function(error){
                clearInterval(loggingIntervalId);
                clearInterval(watchZonesIntervalId);
                console.error(error);
            });

    }

    function watchZones(){
        const zoneElements = [...document.querySelectorAll('.zone')];
        zoneElements.forEach((zoneElement) => {
            let zone = Zone.newFromHTMLElement(zoneElement);
            if(typeof gameData.zones[zone.name] === 'undefined'){
                gameData.zones[zone.name] = zone;
            }

            let cardElements = [...zoneElement.querySelectorAll('.card')];
            cardElements.forEach((cardElement) => {
                if(!Card.isTagged(cardElement)){
                    let card = Card.new(cardElement, zone.name);
                    if(zone.name === Zone.PACK){
                        gameData.zones[Zone.PACK].addCard(card.name);
                    }
                }
            });
        });
    }

    function stop(){
        if(gameData){
            gameData.stop();
        }
    }

    function apiKeyUpdate(response){
        if(typeof chrome.runtime.lastError === undefined){
            console.error("Chrome runtime error, could not get API key.");
        } else {
            if (response.from === "background_script") {
                if(response.subject === "api_key_result") {
                    if(response.status === "success") {
                        if(typeof gameData !== 'undefined'){
                            gameData.apiKey = response.message;
                        }
                    } else if(response.status === "not_set") {
                        //Maybe handle eventually?
                    } else {
                        console.error("Storage error, could not get API key.");
                    }
                }
            }
        }
    }

})();