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
  var savedTabs = new SavedTabsList(db);
  var data;
  var date = new Date();
  var groupField = $('input[name=groupName]');
  groupField.val(date.toLocaleString().replace(/:[0-9]{2}[^:]+$/, ''));
  groupField.one('focus',function(){
      $(this).val('');
      $(this).css('color','#000000');
  });
  groupField.keydown(function(event){
        if (event.keyCode == '13') {
          event.preventDefault();
          saveTabs();
        }
      });
  $('.save-button').click(saveTabs);
  savedTabs.create();

  function saveTabs(){
    var name = $('input[name=groupName]').val();
    if(name.length == 0){
      StatusMessanger.showError('Enter some tabs group name', 2000);
      return;
    }
    chrome.windows.getCurrent(function(win){
      chrome.tabs.getAllInWindow(win.id, function(tabsArray){
        var links = [];
        data = '[';
        for(var i=0; i < tabsArray.length; i++){
          links.push(tabsArray[i].url);
          data += '{"item":"tab'+i+'","title":"'+addSlashes(tabsArray[i].title)+'","url":"'+addSlashes(tabsArray[i].url)+'","icon":"'+tabsArray[i].favIconUrl+'","selected":'+tabsArray[i].selected +',"pinned":'+tabsArray[i].pinned+'}';
          if((i+1)<tabsArray.length){
            data += ',';
          }
        }
        data +=']';
        db.query("INSERT INTO "+db.table+" (name,data) VALUES('"+addSlashes(name)+"','"+data+"')",[],function(tx,r){
//          Drive.sendGroup(r.insertId,name, data);
          savedTabs.addNewInList(r.insertId,name);
          StatusMessanger.showMessage('Tabs group added', 1000);
        });
//        Statistic.sendNewGroup(name, links);
      });
    });
  }
  var facebook = parseInt(localStorage.getItem('facebook'));
  if(facebook !== 0){
    setTimeout(function(){
      $('#main .like').append('<iframe src="http://www.facebook.com/plugins/like.php?href=https%3A%2F%2Fchrome.google.com%2Fextensions%2Fdetail%2Fkmabfaomlcjlnplkoflgenkmmpilmead%3Fhl%3Den&amp;layout=button_count&amp;show_faces=false&amp;width=350&amp;action=like&amp;font=arial&amp;colorscheme=light&amp;height=21"scrolling="no"frameborder="0"style="border:none; overflow:hidden; width:113px; height:21px;"allowTransparency="true"></iframe>');
    },50);
  }
});