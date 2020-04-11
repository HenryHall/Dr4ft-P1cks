
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
        this.draftComplete = false;

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
         * @type {Object.<string,Zone>}
         */
        this.zones = {};

        /**
         * @type {?number}
         */
        this.intervalTimer = null;

        /**
         * @type {EventListenerReference}
         */
        this.cardWatcher = new EventListenerReference(window, 'cardClick', this.onCardClick.bind(this));
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
    static DR4FT_P1CKS_URL = 'superinvalidurlplaceholder';

    async start(){
        let savedData = await this.checkForSavedData(this.gameId);
        if(savedData){
            this.load(savedData);
        } else {
            this.gameInfo = await GameUtils.getGameInfo();
        }

        this.cardWatcher.register();
        this.intervalTimer = setInterval(this.watchZones.bind(this), 250);

        this.removeExtraneousSaves()
            .catch(error => console.error(error));
    }

    stop(){
        clearInterval(this.intervalTimer);
        this.intervalTimer = null;
        let submitUI = SubmitUI.open();
        submitUI.registerCallback(this.submitDraft.bind(this));
    }

    watchZones(){
        const zoneElements = [...document.querySelectorAll('.zone')];
        zoneElements.forEach((zoneElement) => {
            let zone = Zone.newFromHTMLElement(zoneElement);
            if(typeof this.zones[zone.name] === 'undefined'){
                this.zones[zone.name] = zone;
            }
    
            let cardElements = [...zoneElement.querySelectorAll('.card')];
            cardElements.forEach((cardElement) => {
                if(!Card.isTagged(cardElement)){
                    let card = Card.new(cardElement, zone.name);
                    if(zone.name === Zone.PACK){
                        this.zones[Zone.PACK].addCard(card.name);
                    }
                }
            });
        });
    }

    /**
     * @return {number}
     */
    increasePickCount(){
        this.pickCount++;
        this.checkDraftComplete();
        return this.pickCount;
    }

    /**
     * @return {Boolean}
     */
    checkDraftComplete(){
        if(this.gameInfo.expectedPickTotal === this.picks.length){
            this.draftComplete = true;
            this.stop();
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
     * @property {Boolean} draftComplete
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
            draftComplete: this.draftComplete,
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
     * Resolves primary key, GameData.gameId
     * @return {Promise<string>}
     */
    async save(){
        let gameTable = DBService.getTableInstance(GameData.DB_TABLE);

        let entry = {
            id: this.gameId,
            modified: new Date(),
            draftcompleted: this.draftComplete,
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
        this.draftComplete = gameDataObject.draftComplete;
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

    //todo
    async submitDraft(){
        this.cardWatcher.unregister();
        let gameDataObject = this.serialize();

        return fetch(GameData.DR4FT_P1CKS_URL + 'submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(gameDataObject)
        })
        .then((response) => {
            if(response.ok){
                this.submitted = true;
                this.save()
                    .catch((error) => {
                        throw new Error(error);
                    });
            } else {
                throw new Error(response.statusText);
            }
        })
        .catch((error) => {
            console.error(error);
            //todo
        });
    }

    async removeExtraneousSaves(){
        let gameTable = DBService.getTableInstance(GameData.DB_TABLE);
        return gameTable
            .where("id")
            .notEqual(this.gameId)
            .and(entry => entry.submitted === true || entry.draftcompleted === false)
            .delete();
    }
}
