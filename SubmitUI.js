
class SubmitUI{
    constructor(){
        let target = document.querySelector('.game-status');
        this.element = SubmitUI.constructBody();        
        target.appendChild(this.element);
    }

    registerCallback(callbackFn){
        let target = this.element.querySelector('.draft-submit');
        target.addEventListener('click', callbackFn);
    }

    static constructBody(){
        let fieldset = document.createElement('fieldset');
        fieldset.classList.add('submit-controls', 'fieldset');

        let legend = document.createElement('legend');
        legend.style.fontSize = '15px';
        legend.style.fontWeight = 'normal';
        legend.classList.add('submit-legend', 'legend');
        legend.innerText = "Dr4ft P1cks";

        let textDiv = document.createElement('div');
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
