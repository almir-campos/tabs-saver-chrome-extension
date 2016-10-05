function addSlashes(string){
  if(typeof string == 'string'){
    string = string.replace(/`/g, "``");
    string = string.replace(/'/g, "''");
    string = string.replace(/"/g, "''");
  }
  return string;
}

$(document).ready(function(){
    var db = chrome.extension.getBackgroundPage().Database;
    var loadedData = {};
    $('.json-data').attr('disabled','1');
    $('input[name=main_width]').val(localStorage.getItem('main_width'));
    db.query('SELECT name,data,timestamp FROM storage',[],function(tx,r){
        var row;
        var dataRaw = '';
        for (var i=0; i < r.rows.length; i++) {
            row = r.rows.item(i);
            dataRaw += '{"name":"'+row.name+'",';
            dataRaw += '"data":'+row.data+',';
            dataRaw += '"timestamp":"'+row.timestamp+'"}||||\n';
        }
        if(dataRaw){
          $('#download-link').attr('href',window.URL.createObjectURL(new Blob([dataRaw], {type:'application\/octet-stream'})));
        }
    });
    var send = localStorage.getItem('send');
    if(parseInt(send) === 0){
        $('input[name=send]').removeAttr('checked');
    }
    $('input[type=checkbox]').each(function(){
        var item = $(this);
        var value = localStorage.getItem(item.attr('name'));
        if(value === null){
            return;
        }
        if(parseInt(value) === 0){
            item.removeAttr('checked');
        }else{
            item.attr('checked','true');
        }
    });
    $('input[type=checkbox]').click(function(){
        var name = $(this).attr('name');
        var value = $(this).attr('checked') ? 1: 0;
        localStorage.setItem(name,value);
    });
    $('input[name=main_width]').keyup(function(){
      var item = $(this);
      var val = parseInt($(this).val());
      if(typeof val == 'number'){
        localStorage.setItem('main_width',val);
      }
    });
    $('input[name=import-button]').click(function(){
        if(loadedData == ''){
          alert('Please select some file first');
          return;
        }
        var value = loadedData;
        var groupsCount = 0;
        if(value){
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
        }
    });
    $('#files_list .tabs-saver-file a').live('click',function(){
      var index = $(this).parents('.tabs-saver-file').attr('ts-index');
      var operation = $(this).attr('operation');
      if(index !=''){
        switch(operation){
          case 'replace':
            Drive.replaceGroups(index);
            break;
          case 'add':
            Drive.addGroups(index);
            break;
        }
      }
      return false;
    })
    $('input[name=tabs_data]').change(function(e){
      var file = e.target.files[0]; // FileList object

      if (!file.name.match('.tsd')) {
        alert('wrong file format');
        return;
      }

      var reader = new FileReader();

      // Closure to capture the file information.
      reader.onload = (function(theFile) {
        return function(e) {
          // Render thumbnail.
          loadedData = e.target.result;
        };
      })(file);
      reader.readAsText(file)
    });
    $('input[name=drive-export-button]').click(function(){
      Drive.exportData($('input[name=file_title]').val());
    });
});
