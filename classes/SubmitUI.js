
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
     * @return {EventListenerReference}
     */
    registerCallback(callbackFn){
        let target = this.element.querySelector('.draft-submit');
        let eventListenerReference = new EventListenerReference(target, 'click', callbackFn);
        eventListenerReference.register();
        this.eventCallbackReferences.push(eventListenerReference);
        return eventListenerReference;
    }

    unregisterAllCallbacks(){
        this.eventCallbackReferences.forEach(eventCallbackReference => eventCallbackReference.unregister());
    }

    disableButton(){
        let submitButton = this.element.querySelector('.draft-submit');
        submitButton.setAttribute("disabled", "");
    }

    enableButton(){
        let submitButton = this.element.querySelector('.draft-submit');
        submitButton.removeAttribute("disabled");
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
        let submitButton = this.element.querySelector('.draft-submit');
        submitButton.style.display = 'none';
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

        let messageDiv = document.createElement('div');
        messageDiv.classList.add('submit-message');
        messageDiv.innerText = "Submit your draft data to Dr4ft P1cks.";

        let noteDiv = document.createElement('div');
        noteDiv.style.fontSize = '.75em';
        noteDiv.style.color = "#555";
        noteDiv.style.marginBottom = '10px';
        noteDiv.innerText = "Otherwise, submitted automatically next draft.";

        let submitBtn = document.createElement('button');
        submitBtn.classList.add('btn', 'btn-lg', 'draft-submit');
        submitBtn.innerHTML = 'Submit';
        submitBtn.addEventListener('click', (e) => console.log(`Submit clicked!`))    //todo

        fieldset.appendChild(legend);
        fieldset.appendChild(messageDiv);
        fieldset.appendChild(noteDiv);
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
