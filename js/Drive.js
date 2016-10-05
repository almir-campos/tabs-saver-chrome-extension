var clientId = '341513326547-p1kcdepd7ngqhdrvuq7js2t0k45s2an4.apps.googleusercontent.com';
var scopes = 'https://www.googleapis.com/auth/drive.file';
var apiKey ='AIzaSyDmmMmrgLjUZaRUFuDDX-8qdC204ygT6_4';

var Drive = {
  synhronize: localStorage.getItem('drive') === 1,
  authorized: false,
  access_token:'',
  loaded_files: {},
  sendGroup:function(groupId,name,links){
    if(!this.synhronize){
        return;
    }
  },
  updateGroup:function(groupId,links){
    if(!this.synhronize){
      return;
    }
  },
  renameGroup:function(groupId,name){
    if(!this.synhronize){
      return;
    }
  },

  // Search for exported file and download it content
  importData: function(){
    if(!this.authorized){
      this.authorize('importData');
      return;
    }
    var self = this;
    StatusMessanger.fastMessage('Exported tabs groups loading...');
    gapi.client.drive.files.list({title:'tabssaver_tabs.tsd',trashed:false}).execute(function(files){
      var result = [];
      tabs_html = '';
      if(typeof files == 'undefined'){
        return;
      }
      if(typeof files.items != 'undefined'){
        tabs_html += '<table>';
        tabs_html += '<tr><th>File Name</th><th>Last modified Date</th><th>Owner</th><th>Operation</th></tr>';
        for(id in files.items){
          var file = files.items[id];
          if(file.fileExtension != 'tsd' || file.explicitlyTrashed){
            continue;
          }
          console.log(file);
          result[id] = file;
          tabs_html += '<tr class="tabs-saver-file" ts-index="'+id+'"><td>'+
            file.title+'</td><td>'+
            new Date(file.modifiedDate).toLocaleString()+'</td><td>'+
            file.ownerNames.join(', ')+
            '</td><td><a href="#" operation="replace" >Replace all</a> <a href="#" operation="add" >Add to exists</a></td></li>';
//          <a href="#" operation="share" >Share groups</a>
        }
        tabs_html += '</table>';
      }
      if(result.length > 0){
        $('#files_list').html(tabs_html);
        StatusMessanger.fastMessage('loading completed.');
      }else{
        $('#files_list').html('There is no stored groups for that account');
      }
      StatusMessanger.hideMessages();
      self.loaded_files = result;
    });
    return false;
  },

  // Send data to google Drive
  exportData: function(title){
    if(title == ''){
      title = 'tabssaver_tabs';
    }
    if(!this.authorized){
      this.authorize('exportData');
      return;
    }
    var self = this;
    var db = chrome.extension.getBackgroundPage().Database;
    var loadedData = {};
    db.query('SELECT name,data,timestamp FROM storage',[],function(tx,r){
      var row;
      var data = '';
      for (var i=0; i < r.rows.length; i++) {
        row = r.rows.item(i);
        data += '{"name":"'+row.name+'",';
        data += '"data":'+row.data+',';
        data += '"timestamp":"'+row.timestamp+'"}||||\n';
      }
      if(data != ''){
        StatusMessanger.fastMessage('Sending tabs groups data to Google Drive');
        gapi.client.drive.files.insert({'resource':{
          title: encodeURIComponent(title)+'.tsd',
          mimeType: 'text/json',
          uploadType: 'multipart',
          body : data
        }}).execute(function(file){
            if(file.id){
              gapi.client.request({
                'path': '/upload/drive/v2/files/'+ file.id,
                'method': 'PUT',
                'body': data,
                'callback':function(file){
                  StatusMessanger.fastMessage('Tabs groups was successfully exported to Google Drive');
                  self.importData();
                }});
            }
          });
      }
    });
  },

  // Get file content from google drive and insert it into local DB
  replaceGroups: function(id){
    if(!confirm('All your tabs will be replaced. Are you sure want to continue?')){
      return;
    }
    this.getFileContent(id,function(value){
      var groupsCount = 0;
      if(value){
        var db = chrome.extension.getBackgroundPage().Database;
        var matches = value.match(/\{[^;\n]+/ig);
        if(matches.length > 0){
          db.query("DELETE FROM "+db.table,[],function(tx,r){
            StatusMessanger.fastMessage('Old groups was removed');
          });
        }
        if(matches){
          for(var i=0; i < matches.length; i++){
            var rawObject = JSON.parse(matches[i]);
			var timestamp = typeof rawObject.timestamp != 'undefined' ? rawObject.timestamp : i;
            db.query("INSERT INTO "+db.table+" (name,data,timestamp) VALUES('"+addSlashes(rawObject.name)+"','"+JSON.stringify(rawObject.data)+"','"+timestamp+"')",[],function(tx,r){
              groupsCount++;
              StatusMessanger.fastMessage(groupsCount+' from '+matches.length+' groups was imported');
              StatusMessanger.hideMessages();
            });
          }
        }
        if(groupsCount == 0){
          StatusMessanger.fastMessage('Error: Groups wasn\'t imported');
          StatusMessanger.hideMessages();
        }
      }
    });
  },

  addGroups: function(id){
    this.getFileContent(id,function(value){
      var groupsCount = 0;
      if(value){
        var db = chrome.extension.getBackgroundPage().Database;
        var matches = value.split("||||");
        if(matches){
          for(var i=0; i < matches.length; i++){
            var rawObject = JSON.parse(matches[i]);
			var timestamp = typeof rawObject.timestamp != 'undefined' ? rawObject.timestamp : i;
            db.query("INSERT INTO "+db.table+" (name,data,timestamp) VALUES('"+addSlashes(rawObject.name)+"','"+JSON.stringify(rawObject.data)+"','"+timestamp+"')",[],function(tx,r){
              groupsCount++;
              StatusMessanger.fastMessage(groupsCount+' from '+matches.length+' groups was added');
              StatusMessanger.hideMessages();
            });
          }
        }
        if(groupsCount == 0){
          StatusMessanger.fastMessage('Error: Groups wasn\'t added');
          StatusMessanger.hideMessages();
        }
      }
    });
  },

//  shareGroups: function(id){
//    if(typeof Share.setItemIds != 'undefined'){
//      Share.setItemIds([id]);
//      Share.showSettingsDialog();
//    }
//  },

  getFileContent : function(id,callback){
    var xhr = new XMLHttpRequest();
    if(typeof this.loaded_files[id] == 'undefined'){
      return;
    }
    var url = this.loaded_files[id].downloadUrl;
    xhr.open('GET', url);
    xhr.setRequestHeader('Authorization', 'Bearer ' + gapi.auth.getToken().access_token);
    xhr.onload = function() {
      callback(xhr.responseText);
    };
    xhr.onerror = function() {
      console.log('error')
    };
    xhr.send();
  },

  // AUthorize application with google auth
  authorize: function(callback){
    var self = this;
    gapi.client.setApiKey(apiKey);
    gapi.auth.authorize({client_id: clientId, scope: scopes, immediate: true}, function(authResult){
      if (authResult && !authResult.error) {
        self.authorized = true;
        self.access_token = authResult.access_token;
        self[callback]();
      } else {
        StatusMessanger.fastMessage('Please authorize to access tabs saver Drive feature');
        setTimeout(function(){
          StatusMessanger.hideMessages();
          gapi.auth.authorize({client_id: clientId, scope: scopes, immediate: false}, function(authResult){
            StatusMessanger.fastMessage('You was successfully authorized');
            self.authorized = true;
            self.access_token = authResult.access_token;
            self[callback]();
          },1000);
        })
      }
    })
  }
};
function init(){
  gapi.client.load('drive', 'v2',function(){
    Drive.importData();
  });
}
