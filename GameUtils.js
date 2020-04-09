
class GameUtils{
    constructor(){}

    /**
     * Check if the user is in a game room
     * @returns {Boolean}
     */
    static inGameRoom(){
        const hashMatch = /#g/;
        return hashMatch.test(document.location.hash);
    }

    /**
     * Get the game room identifier
     * @returns {string}
     */
    static getGameId(){
        const hashRegex = /(?![\#g\/])[a-z0-9\-]+/;
        const gameId = document.location.hash.match(hashRegex)[0];
        if(!gameId){ throw new Error(`No game has found!`); }

        return gameId;
    }

    /**
     * @typedef GameRoomInfo
     * @type {Object}
     * @property {string} draftType
     * @property {number} packCount
     * @property {number} packSize
     * @property {number} poolSize
     * @property {number} expectedPickTotal
     */

    /**
     * Returns a promise that resolves the game room info object
     * @returns {Promise<GameRoomInfo>}
     */
    static getGameInfo(attempts){
        attempts = attempts || 1;

        return new Promise((resolve, reject) => {
            if(attempts > 5){ return reject( new Error('Max attempts') ); }
    
            try {
                const controlsPanel = document.querySelector('.start-controls');
                const gameInfoDivs = [...controlsPanel.querySelectorAll('div')];

                /**
                 * @type {GameRoomInfo}
                 */
                const gameRoomInfo = {};

                gameInfoDivs.forEach(function(div) {
                    let info = div.innerText;
                    if(/Type/.test(info)){
                        gameRoomInfo.draftType = info.match(/(?<=Type: )[A-Za-z0-9 ]+/)[0].trim();
                    } else if (/Info/.test(info)){
                        let infoMatch = info.match(/[0-9]+/g);
                        gameRoomInfo.packCount = infoMatch[0];
                        gameRoomInfo.packSize = infoMatch[1];
                        gameRoomInfo.poolSize = infoMatch[2];
                        gameRoomInfo.expectedPickTotal = gameRoomInfo.packCount * gameRoomInfo.packSize;
                    }
                });
        
                resolve(gameRoomInfo);
            } catch(error) {
                setTimeout(() => resolve(this.getGameInfo(attempts + 1)), 1000);
            }
        });
    }
}
