
class Card{
    /**
     * @param {string} cardName
     * @param {string} zoneName
     */
    constructor(cardName, zoneName){
        /**
         * type{string}
         */
        this.name = cardName;

        /**
         * @type {string}
         */
        this.zoneName = zoneName;

        /**
         * @type {?EventListenerReference}
         */
        this.clickListenerReference = null;
    }

    /**
     * @typedef CardClickEvent
     * @type {Object}
     * @property {Boolean} bubbles
     * @property {CardClickEventDetails} detail
     */

    /**
     * @typedef CardClickEventDetails
     * @property {string} cardName
     * @property {string} zoneName
     * @property {Object.<number,KeyStatus>} keypressSnapshot
     */

    /**
     * @private
     * @param {Event} event
     */
    _onClick(event){
        event.target.dispatchEvent(
            new CustomEvent('cardClick', {
                bubbles: true,
                detail: {
                    cardName: this.name,
                    zoneName: this.zoneName,
                    keypressSnapshot: KeyPressService.getSnapshot()
                }
            })
        );
    }

    tag(htmlElement){
        htmlElement.setAttribute('tagged', 'null');
        this.clickListenerReference = new EventListenerReference(htmlElement, 'click', this._onClick.bind(this));
        this.clickListenerReference.register();
    };

    /**
     * @param {HTMLElement} htmlElement 
     * @param {string} zoneName
     * @returns {Card}
     */
    static new(htmlElement, zoneName){
        let cardName = Card.extractName(htmlElement);
        let card = new Card(cardName, zoneName);
        card.tag(htmlElement);
        return card;
    }

    /**
     * @param {HTMLElement} cardElement
     * @returns {Boolean}
     */
    static isTagged(cardElement){
        return cardElement.hasAttribute('tagged');
    };

    /**
     * @param {HTMLElement} cardElement
     * @return {string}
     */
    static extractName(cardElement){
        return cardElement.querySelector('img').getAttribute("title");
    };
}
