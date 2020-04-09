
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
         * @type {Array<string>}
         */
        this.pickOrder = [];

        /**
         * @type {Object.<string,Zone>}
         */
        this.zones = {};

        /**
         * @type {?number}
         */
        this.intervalTimer = null;
    }

    static DB_TABLE = 'gamedata';
    static DR4FT_P1CKS_URL = 'https://myapp.com/';

    async start(){
        let savedData = await this.checkForSavedData(this.gameId);
        if(savedData){
            this.load(savedData);
        } else {
            this.gameInfo = await GameUtils.getGameInfo();
        }
        window.addEventListener('cardClick', this.onCardClick.bind(this));
        // window.addEventListener('draftSubmit', this.)
        this.intervalTimer = setInterval(this.watchZones.bind(this), 250);
    }

    stop(){
        this.draftComplete = true;
        clearInterval(this.intervalTimer);
        this.intervalTimer = null;
        let submitUI = SubmitUI.open();
        submitUI.registerCallback(this.submitDraft.bind(this));
    }

    watchZones(){
        const zoneElements = [...document.querySelectorAll('.zone')];
        zoneElements.forEach((zoneElement) => {
            let zone = Zone.newFromHTMLElement(zoneElement);
            if(typeof this.zones[zone.name] === 'undefined' || zone.name === Zone.PACK){
                this.zones[zone.name] = zone;
            }
    
            let cardElements = [...zoneElement.querySelectorAll('.card')];
            cardElements.forEach((cardElement) => {
                if(!Card.isTagged(cardElement)){
                    let card = Card.new(cardElement, zone.name);
                }
            });
        });
    }

    /**
     * @return {number}
     */
    increasePickCount(){
        this.pickCount++;
        this.checkDraftComplete()
        return this.pickCount;
    }

    /**
     * @return {Boolean}
     */
    checkDraftComplete(){
        if(this.gameInfo.expectedPickTotal === this.pickOrder){
            this.stop();
            return true;
        } else {
            return false;
        }
    }

    /**
     * @param {CardClickEvent} event
     */
    async onCardClick(event){
        let {cardName, zoneName, keypressSnapshot} = event.detail;
        let removedCard = null;

        switch(zoneName){
            case Zone.PACK:
                if(this.lastPackClick === cardName){
                    this.zones[Zone.MAINBOARD].addCard(cardName);
                    this.pickOrder.push(cardName);
                    this.lastPackClick = '';
                    this.increasePickCount();
                } else {
                    this.lastPackClick = cardName;
                    return; //Nothing to save
                }
                break;

            case Zone.MAINBOARD:
                removedCard = this.zones[Zone.MAINBOARD].removeCard(cardName);
                if(keypressSnapshot['Shift'].isDown){
                    this.zones[Zone.JUNK].addCard(removedCard);    
                } else {
                    this.zones[Zone.SIDEBOARD].addCard(removedCard);    
                }                
                break;

            case Zone.SIDEBOARD:
                removedCard = this.zones[Zone.SIDEBOARD].removeCard(cardName);
                if(keypressSnapshot['Shift'].isDown){
                    this.zones[Zone.JUNK].addCard(removedCard);
                } else {
                    this.zones[Zone.MAINBOARD].addCard(removedCard);
                }
                break;

            case Zone.JUNK:
                removedCard = this.zones[Zone.JUNK].removeCard(cardName);
                if(keypressSnapshot['Shift'].isDown){
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
                console.log(`Failed to save game data.`, error);
            });
    }

    /**
     * @typedef GameDataObject
     * @type {Object}
     * @property {string} id
     * @property {GameRoomInfo} gameInfo
     * @property {Boolean} submitted
     * @property {Boolean} draftComplete
     * @property {number} pickCount
     * @property {Array.<string>} pickOrder
     * @property {Array.<Zone>} zones
     */

    /**
     * @return {GameDataObject}
     */
    serealize(){
        return {
            id: this.gameId,
            gameInfo: this.gameInfo,
            submitted: this.submitted,
            draftComplete: this.draftComplete,
            pickCount: this.pickCount,
            pickOrder: this.pickOrder,
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
    save(){
        let gameTable = DBService.getTableInstance(GameData.DB_TABLE);

        let entry = {
            id: this.gameId,
            modified: new Date(),
            submitted: this.submitted,
            data: this.serealize()
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
        this.pickOrder = gameDataObject.pickOrder;
        this.zones = {};

        //Refreshing the page sets all cards from sideboard/junk back into main
        //Move cards from all other zones into mainboard
        gameDataObject.zones.map(zoneData => this.zones[zoneData.name] = new Zone(zoneData));
        Object.values(this.zones).forEach((zone) => {
            if(zone.name !== Zone.MAINBOARD){
                for(let i=zone.cards.length-1; i >= 0; i--){
                    let cardName = zone.cards[i];
                    zone.removeCard(cardName);
                    this.zones[Zone.MAINBOARD].addCard(cardName);
                }
            }
        });
    }

    //todo
    async submitDraft(){
        let gameDataObject = this.serealize();

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
}
