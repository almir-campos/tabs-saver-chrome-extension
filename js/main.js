var Database ={
  dbSize: 5*1024*1024,
  table: 'storage',
  db: openDatabase('tabsStorage','1.0','store user saved tabs',this.dbSize),
  onError: function(tx, e){
    alert('error:'+ e.message);
  },
  query:function(query,args,callback){
    this.db.transaction(function(tx){
      tx.executeSql(query,args,callback,function(tx,e){
        alert('error '+e.message);
      });
    });
  },
  init: function(){
    this.query('CREATE TABLE IF NOT EXISTS '+this.table+
               ' (id INTEGER PRIMARY KEY ASC, name VARCHAR, data TEXT,timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)',[],this.onSuccess);
  },
  uninstall: function(){
    this.query('DROP TABLE IF EXISTS ?', [this.table] );
  }
};
Database.init();