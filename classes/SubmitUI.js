
class SubmitUI{
    constructor(){
        /**
         * @type {HTMLFieldSetElement}
         */
        this.element = SubmitUI.constructBody();

        /**
         * @type {Array.<EventListenerReference>}
         */
        this.eventCallbackReferences = [];

        let target = document.querySelector('.game-status');
        target.appendChild(this.element);
    }

    /**
     * @param {Function} callbackFn
     */
    registerCallback(callbackFn){
        let target = this.element.querySelector('.draft-submit');
        let eventListenerReference = new EventListenerReference(target, 'click', callbackFn);
        eventListenerReference.register();
        this.eventCallbackReferences.push(eventListenerReference);
    }

    unregisterAllCallbacks(){
        this.eventCallbackReferences.forEach(eventCallbackReference => eventCallbackReference.unregister());
    }

    /**
     * @param {string} message
     * @param {string} color
     * @private
     */
    _setMessage(message, color){
        let target = this.element.querySelector('.submit-message');
        target.style.color = color;
        target.innerText = message;
    }

    /**
     * @param {string} message
     */
    setOkay(message){
        this._setMessage(message, "#000");
    }

    /**
     * @param {string} errorMsg
     */
    setError(errorMsg){
        this._setMessage(errorMsg, "#9f0000");
    }

    /**
     * @param {string} successMsg
     */
    setSuccess(successMsg){
        this._setMessage(successMsg, "#009f00");
    }

    /**
     * @returns {HTMLFieldSetElement}
     */
    static constructBody(){
        let fieldset = document.createElement('fieldset');
        fieldset.classList.add('submit-controls', 'fieldset');

        let legend = document.createElement('legend');
        legend.classList.add('submit-legend', 'legend');
        legend.style.fontSize = '15px';
        legend.style.fontWeight = 'normal';
        legend.innerText = "Dr4ft P1cks";

        let textDiv = document.createElement('div');
        textDiv.classList.add('submit-message');
        textDiv.style.marginBottom = '10px';
        textDiv.innerText = "Submit your draft data to Dr4ft P1cks";

        let submitBtn = document.createElement('button');
        submitBtn.classList.add('btn', 'btn-lg', 'draft-submit');
        submitBtn.innerHTML = 'Submit';
        submitBtn.addEventListener('click', (e) => console.log(`Submit clicked!`))    //todo

        fieldset.appendChild(legend);
        fieldset.appendChild(textDiv);
        fieldset.appendChild(submitBtn);

        return fieldset;
    }

    /**
     * @return {SubmitUI}
     */
    static open(){
        return new SubmitUI();
    }
}
