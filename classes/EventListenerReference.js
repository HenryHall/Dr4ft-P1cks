
class EventListenerReference {
    constructor(target, type, callback, options) {
        /**
         * @type {EventTarget}
         */
        this.target = target;

        /**
         * @type {string}
         */
        this.type = type;

        /**
         * @type {EventListener}
         */
        this.callback = callback;

        /**
         * @type {boolean}
         */
        this.options = options;
    }

    register(){
        this.target.addEventListener(this.type, this.callback, this.options || null);
    }

    unregister(options){
        this.target.removeEventListener(this.type, this.callback, options);
    }
}
