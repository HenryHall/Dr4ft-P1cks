
//Check if user has entered a game room, if not attach listener
if(GameUtils.inGameRoom()){
    run();
} else if ("onhashchange" in window){
    window.addEventListener('hashchange', function () {
        if(GameUtils.inGameRoom()){
            run();
        }
    });
}


function run(){
    console.log(`Dr4ft P1ck extension loaded`);
    //todo
    // chrome.browserAction.setBadgeText({text: 'ON'});
    // chrome.browserAction.setBadgeBackgroundColor({color: '#4688F1'});

    const gameData = new GameData();
    gameData.start()
        .then(function(){
            // let submitUI = SubmitUI.open();  //todo
            setInterval(console.log, 5000, gameData);
        });
}
