function update_to_2_5_4(){
  var db = chrome.extension.getBackgroundPage().Database;
  db.query('CREATE TABLE '+db.table+'_temp (id INTEGER PRIMARY KEY ASC, name VARCHAR, data TEXT,timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)',[],function(tx,r){
    db.query('INSERT INTO '+db.table+'_temp SELECT id,name,data,id FROM '+db.table,[],function(tx,r){
      db.query('DROP TABLE '+db.table+';',[],function(tx,r){
        db.query('ALTER TABLE '+db.table+'_temp RENAME TO '+db.table+';',[],function(tx,r){
        })
      });
    });
  });
}

function getVersion() {
  var details = chrome.app.getDetails();
  return details.version;
}

chrome.runtime.onInstalled.addListener(function(event){
  if(event.reason == 'update'){
      var prev_version = event.previousVersion.replace(/\./g,'_')
      var version = getVersion().replace(/\./g,'_')
      window['update_to_'+version]()
  }
})