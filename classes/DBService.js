
/**
 * @namespace DBService
 */
const DBService = (function(){

    let _database = null;

    class DBService{}
    
    DBService.DB_NAME = 'Dr4ftP1cks';

    DBService.initialize = function(){
        const db = new Dexie(DBService.DB_NAME);

        db.version(1)
            .stores({
                gamedata: 'id,modified'
            });

        _database = db;
    }

    /**
     * @param {string} tableName
     * @return {Dexie}
     */
    DBService.getTableInstance = function(tableName){
        if(_database){
            return _database[tableName];
        } else {
            DBService.initialize();
            return _database[tableName];
        }
    }

    return DBService;

})();
