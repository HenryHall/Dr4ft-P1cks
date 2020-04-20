
class GameData{
    constructor(apiKey){
        /**
         * @type {string}
         */
        this.apiKey = apiKey;

        /**
         * @type {string}
         */
        this.gameId = GameUtils.getGameId();

        /**
         * @type {?GameRoomInfo}
         */
        this.gameInfo = null;

        /**
         * @type {Boolean}
         */
        this.submitted = false;

        /**
         * @type {Boolean}
         */
        this.draftCompleted = false;

        /**
         * @type {number}
         */
        this.pickCount = 0;

        /**
         * @type {string}
         */
        this.lastPackClick = '';

        /**
         * @typedef DraftPick
         * @type {Object}
         * @property {string} pick
         * @property {Array.<string>} packSnapshot
         */

        /**
         * @type {Array.<DraftPick>}
         */
        this.picks = [];

        /**
         * @type {Object.<string,ZoneDataObject>}
         */
        this.zones = {};

        /**
         * @type {EventListenerReference}
         */
        this.cardWatcher = new EventListenerReference(window, 'cardClick', this.onCardClick.bind(this));

        /**
         * @type {?Promise}
         */
        this.runningGamePromise = null;

        /**
         * @type {?Function}
         */
        this.resolveRunningPromise = null;

        /**
         * @type {?Function}
         */
        this.rejectRunningPromise = null;
    }

    /**
     * @type {string}
     */
    static GAME_VERSION = "1.0";

    /**
     * @type {string}
     */
    static DB_TABLE = 'gamedata';

    /**
     * @type {string}
     */
    static DR4FT_P1CKS_URL = 'https://dr4ftp1cks.herokuapp.com/';

    async start(){
        this.runningGamePromise = new Promise((resolve, reject) => {
            this.resolveRunningPromise = resolve;
            this.rejectRunningPromise = reject;
        });

        this.cardWatcher.register();

        //No need to watch the result, only care if it errors
        this.submitPreviousSaves()
            .then(this.removeExtraneousSaves.bind(this))
            .catch(error => console.error(error));

        let savedData = await this.checkForSavedData(this.gameId)
        if(savedData){
            this.load(savedData);
            this.checkDraftCompleted();
        } else {
            this.gameInfo = await GameUtils.getGameInfo();
        }
    }

    /**
     * Used for ending the game early, before checkDraftCompleted returns true
     * @param {string} [reason]
     */
    stop(reason){
        reason = reason || "The draft was ended early."
        this.cardWatcher.unregister();
        this.rejectRunningPromise(reason);
    }

    /**
     * @return {number}
     */
    increasePickCount(){
        this.pickCount++;
        this.checkDraftCompleted();
        return this.pickCount;
    }

    /**
     * @return {Boolean}
     */
    checkDraftCompleted(){
        if(this.gameInfo.expectedPickTotal === this.picks.length){
            this.draftCompleted = true;
            this.resolveRunningPromise();
            return true;
        } else {
            return false;
        }
    }

    /**
     * @param {CardClickEvent} event
     * @return {Promise<string|void>}
     */
    async onCardClick(event){
        let {cardName, zoneName, keypressSnapshot} = event.detail;
        let removedCard;

        switch(zoneName){
            case Zone.PACK:
                if(this.lastPackClick === cardName){
                    this.zones[Zone.MAINBOARD].addCard(cardName);
                    let pickData = {pick: cardName, packSnapshot: this.zones[Zone.PACK].cards.slice()};
                    this.zones[Zone.PACK].clearCards();
                    this.picks.push(pickData);
                    this.lastPackClick = '';
                    this.increasePickCount();
                } else {
                    this.lastPackClick = cardName;
                    return Promise.resolve(); //Nothing to save
                }
                break;

            case Zone.MAINBOARD:
                removedCard = this.zones[Zone.MAINBOARD].removeCard(cardName);
                if(keypressSnapshot.getKeyStatusByName('Shift')){
                    this.zones[Zone.JUNK].addCard(removedCard);    
                } else {
                    this.zones[Zone.SIDEBOARD].addCard(removedCard);    
                }                
                break;

            case Zone.SIDEBOARD:
                removedCard = this.zones[Zone.SIDEBOARD].removeCard(cardName);
                if(keypressSnapshot.getKeyStatusByName('Shift')){
                    this.zones[Zone.JUNK].addCard(removedCard);
                } else {
                    this.zones[Zone.MAINBOARD].addCard(removedCard);
                }
                break;

            case Zone.JUNK:
                removedCard = this.zones[Zone.JUNK].removeCard(cardName);
                if(keypressSnapshot.getKeyStatusByName('Shift')){
                    this.zones[Zone.MAINBOARD].addCard(removedCard);
                } else {
                    this.zones[Zone.SIDEBOARD].addCard(removedCard);
                }
                break;

            default:
                throw new Error(`Unknown zone click action, cardName: ${cardName}, zoneName: ${zoneName}`);
        }

        return this.save()
            .catch((error) => {
                console.error(`Failed to save game data.`, error);
            });
    }

    /**
     * @typedef GameDataObject
     * @type {Object}
     * @property {string} id
     * @property {string} gameVersion
     * @property {GameRoomInfo} gameInfo
     * @property {Boolean} submitted
     * @property {Boolean} draftCompleted
     * @property {number} pickCount
     * @property {Array.<DraftPick>} picks
     * @property {Array.<Zone>} zones
     */

    /**
     * @return {GameDataObject}
     */
    serialize(){
        return {
            id: this.gameId,
            gameVersion: GameData.GAME_VERSION,
            gameInfo: this.gameInfo,
            submitted: this.submitted,
            draftCompleted: this.draftCompleted,
            pickCount: this.pickCount,
            picks: this.picks,
            zones: Object.values(this.zones).map(zone =>  zone.serialize())
        };
    }

    /**
     * @param {string} gameId 
     */
    checkForSavedData(gameId){
        let db = DBService.getTableInstance(GameData.DB_TABLE);
        return db.get(gameId)
            .then(gameSave => {return gameSave ? gameSave.data : null});
    }

    /**
     * @typedef GameSaveState
     * @type {Object}
     * @property {string} id
     * @property {Date} modified
     * @property {boolean} draftCompleted
     * @property {boolean} submitted
     * @property {GameDataObject} data
     */

    /**
     * Resolves primary key, GameData.gameId
     * @return {Promise<string>}
     */
    async save(){
        let gameTable = DBService.getTableInstance(GameData.DB_TABLE);

        /**
         * @type {GameSaveState}
         */
        let entry = {
            id: this.gameId,
            modified: new Date(),
            draftCompleted: this.draftCompleted,
            submitted: this.submitted,
            data: this.serialize()
        };

        return gameTable.put(entry);
    }

    /**
     * @param {GameDataObject} gameDataObject 
     */
    load(gameDataObject){
        this.pickCount = Number(gameDataObject.pickCount);
        this.submitted = gameDataObject.submitted;
        this.draftCompleted = gameDataObject.draftCompleted;
        this.gameId = gameDataObject.id;
        this.gameInfo = gameDataObject.gameInfo;
        this.picks = gameDataObject.picks;
        this.zones = {};

        //todo: something wrong with pack data loading, test in morning
        //Refreshing the page sets all cards from sideboard/junk back into main
        //Move cards from all other zones into mainboard
        gameDataObject.zones.map(zoneData => this.zones[zoneData.name] = new Zone(zoneData));
        Object.values(this.zones).forEach((zone) => {
            switch(zone.name){
                case Zone.MAINBOARD:
                    break;

                case Zone.SIDEBOARD:
                case Zone.JUNK:
                    let cardArrayClone = zone.clearCards();
                    cardArrayClone.map(card => this.zones[Zone.MAINBOARD].addCard(card));
                    break;

                case Zone.PACK:
                    zone.clearCards();  //start fresh
                    break;

                default:
                    throw new Error(`Unable to load unknown zone ${zone.name}`);
            }
        });
    }

    /**
     * @return {Promise<Response>}
     */
    async submitDraft(){
        this.cardWatcher.unregister();
        let gameDataObject = this.serialize();

        return this.uploadDraft(gameDataObject)
            .then((response) => {
                this.submitted = true;
                this.save()
                    .catch((error) => {
                        throw new Error(error);
                    });
            });
    }

    /**
     * @returns {Promise<number>}
     */
    async removeExtraneousSaves(){
        let gameTable = DBService.getTableInstance(GameData.DB_TABLE);
        return gameTable
            .where("id")
            .notEqual(this.gameId)
            .and(entry => entry.submitted === true || entry.draftCompleted === false)
            .delete();
    }

    /**
     * @returns {Array.<Promise<Response>>}
     */
    async submitPreviousSaves(){
        let gameTable = DBService.getTableInstance(GameData.DB_TABLE);
        let savePromises = [];

        /**
         * @type {Array.<GameSaveState>}
         */
        let previousSaves = await gameTable
            .where("id")
            .notEqual(this.gameId)
            .and(entry => entry.submitted === false || entry.draftCompleted === true)
            .each((gameSaveState) => {
                //todo: should this be using the bulk upload method instead?
                let savePromise = this.uploadDraft(gameSaveState.data)
                    .then(function(){
                        gameSaveState.submitted = true;
                        return gameTable.put(gameSaveState);
                    });
                savePromises.push( savePromise );
            });

        return Promise.allSettled(savePromises);
    }

    /**
     * @param {GameDataObject} gameDataObject
     * @returns {Promise<Response>}
     */
    async uploadDraft(gameDataObject){
        return fetch(GameData.DR4FT_P1CKS_URL + 'submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify(gameDataObject)
        })
            .then((response) => {
                if(response.ok){
                    return response;
                } else {
                    throw new Error(response.statusText);
                }
            });
    }

    //Todo, is this needed?
    async bulkUploadDrafts(gameDataObjects){
        return fetch(GameData.DR4FT_P1CKS_URL + 'submit/bulk', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(gameDataObjects)
        })
            .then((response) => {
                if(response.ok){
                    return response;
                } else {
                    throw new Error(response.statusText);
                }
            });
    }
}
