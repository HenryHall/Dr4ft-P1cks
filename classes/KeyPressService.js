
/**
 * @namespace {KeyPressService} KeyPressService
 */
const KeyPressService = (function(){
        /**
         * @typedef KeyStatus
         * @type {Object}
         * @property {number} id
         * @property {string} name - Short name: Shift vs Left/RightShift
         * @property {boolean} isDown
         */

        /**
         * <keyName, KeyStatus> key value pair
         * @type {Object.<string,KeyStatus>}
         */
        const keys = {};

        /**
         * @param {KeyboardEvent} keyboardEvent 
         * @param {boolean} isDown 
         * @returns {KeyStatus}
         */
        function setKeyStatus(keyboardEvent, isDown){
            const keyCode = keyboardEvent.keyCode;
            const keyName = keyboardEvent.key;
            if(keys.hasOwnProperty(keyName)){
                keys[keyName].isDown = isDown;
            } else {
                keys[keyName] = {id: keyCode, name: keyName, isDown: isDown}
            }

            return keys[keyName];
        }

        class KeyPressService{
            /**
             * When strictMode is false, if there is no data for a key,
             * is is assumed to not be pressed.  Defaults to false
             * @param {boolean} strictMode 
             */
            constructor(strictMode){
                /**
                 * @type {boolean}
                 */
                this.strictMode = strictMode || false;

                /**
                 * @type {EventListenerReference}
                 */
                this.keyDownListener = new EventListenerReference(window,'keydown', (e) => setKeyStatus(e, true));

                /**
                 * @type {EventListenerReference}
                 */
                this.keyUpListener = new EventListenerReference(window, 'keyup', (e) => setKeyStatus(e, false));

                this.keyDownListener.register();
                this.keyUpListener.register();
            }

            /**
             * @return {Object.<string,KeyStatus>}
             */
            getSnapshot(){
                let keysCopy = JSON.parse(JSON.stringify(keys));
                return new KeypressSnapshot(keysCopy, this.strictMode);
            }
        }


        class KeypressSnapshot{
            constructor(keysCopy, strictMode){
                /**
                 * @type {Object.<string,KeyStatus>}
                 */
                this.keys = keysCopy;

                /**
                 * @type {boolean}
                 */
                this.strictMode = strictMode;
            }

            /**
             * @param {number} keyCode
             * @return {?boolean}
             */
            getKeyStatusByCode(keyCode){
                let key = Object.values(keys).find(key => key.id === keyCode);
                if(key){
                    return key.isDown;
                } else {
                    if(this.strictMode){
                        return null;    //No data
                    } else {
                        return false;   //Assume it is not pressed
                    }
                }
            }

            /**
             * @param {string} keyName 
             * @return {?boolean}
             */
            getKeyStatusByName(keyName){
                if(keys.hasOwnProperty(keyName)){
                    return keys[keyName].isDown;
                } else {
                    if(this.strictMode){
                        return null;    //No data
                    } else {
                        return false;   //Assume it is not pressed
                    }
                }
            }
        }

        return new KeyPressService(false);
    }
)();
