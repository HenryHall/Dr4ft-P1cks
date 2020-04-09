
class Zone{
    /**
     * @typedef ZoneDataObject
     * @type {Object}
     * @property {string} name
     * @property {Array.<string>} cards
     */

    /**
     * @param {ZoneDataObject} zoneDataObject 
     */
    constructor(zoneDataObject){
        /**
         * @type {string}
         */
        this.name = zoneDataObject.name;

        /**
         * @type {Array<string>}
         */
        this.cards = zoneDataObject.cards;
    }

    /**
     * @param {string} cardName
     */
    removeCard(cardName) {
        let cardIndex = this.cards.indexOf(cardName);
        if(cardIndex === -1){
            throw new Error(`${cardName} could not be removed from ${this.name} zone.`);
        }

        return this.cards.splice(cardIndex, 1)[0];
    }

    /**
     * @param {string} cardName
     */
    addCard(cardName) {
        this.cards.push(cardName);
    }

    /**
     * @return {ZoneDataObject}
     */
    serialize(){
        return {
            name: this.name,
            cards: this.cards
        }
    }

    /**
     * @param {HTMLElement} zoneElement
     * @returns {Zone}
     */
    static newFromHTMLElement(zoneElement){
        let zoneDataObject = {
            name: Zone.getZoneName(zoneElement),
            cards: []
        };

        return new Zone(zoneDataObject);
    }

    /**
     * @param {HTMLElement} zoneElement
     * @returns {string}
     */
    static getZoneName(zoneElement){
        const zoneHeader = zoneElement.querySelector('h1').querySelector('span').innerText;
        const test = /[A-Za-z\s]+/;
        const match = zoneHeader.match(test)[0].trim().toLowerCase();

        switch(match){
            case 'pack':
                return Zone.PACK;
            case 'main deck':
                return Zone.MAINBOARD;
            case 'sideboard':
                return Zone.SIDEBOARD;
            case 'junk':
                return Zone.JUNK;
            default:
                throw new Error(`Unknown zone header ${match}.`);
        }
    }

    static PACK = "Pack";
    static MAINBOARD = "Mainboard";
    static SIDEBOARD = "Sideboard";
    static JUNK = "Junk";
}
