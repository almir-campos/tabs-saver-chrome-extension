function SavedTabsList(db){
  this.db = db;
  this.container = $('#saved-list ul.tabs-groups');
  this.events_was_inizialized = false;
  this.sort_type = localStorage.getItem('sort_type') != null ? localStorage.getItem('sort_type') : 'timestamp';
  this.sort_direction = localStorage.getItem('sort_direction') != null ? localStorage.getItem('sort_direction') : 'desc';
}

SavedTabsList.prototype.create = function(){
//    this.db = chrome.extension.getBackgroundPage().Database;
  order_by = 'ORDER BY '+this.sort_type+' '+this.sort_direction;
  (function(self){
    self.db.query('SELECT id,name,data,timestamp FROM storage '+order_by,[],function(tx,r){
      var tabs_data = []

      for(i=0;i < r.rows.length; i++){
        tabs_data[i] = r.rows.item(i)
      }

      self.tabs_data = tabs_data;
      self.render(self.tabs_data);
    });
  })(this);
};
SavedTabsList.prototype.render = function(tabs_data){
  var content = '';
  this.container.html('')
  for(var i=0;i<tabs_data.length;i++ ){
    content += this.renderSavedTab(tabs_data[i].id, tabs_data[i].name);
  }
  this.addContent(content);
  $('html').css('height','10px');
  $('body').css('height','10px');
  this.initEvents();
};

SavedTabsList.prototype.addContent = function(content){
  this.container.append(content);
};

SavedTabsList.prototype.addNewInList = function(id,name){
  this.addContent(this.renderSavedTab(id, name));
};

SavedTabsList.prototype.renderSavedTab = function(id,name){
    return '<li><div class="control bg-info">'+
              '<span class="delete buttons"><img src="/images/delete_icon.png"></span>'+
              '<span class="add-to-list buttons"><img src="/images/plus_icon.png"></span>'+
              '<span class="update-list buttons"><img src="/images/save_icon.gif"></span>'+
              '<span class="rename buttons"><img src="/images/Icon_Rename.gif"></span>'+
              '</div>'+
              '<img  class="options" src="/images/Gear.png">'+
              '<span class="item '+id+'">'+name+'</span>&nbsp;'+
              '<span class="edit buttons"><img src="/images/down_arrow.png"></span>'+
              '</li>';
};

SavedTabsList.prototype.initEvents = function(){
  if(this.events_was_inizialized == true){
    return;
  }
  (function(self){
    var width = localStorage.getItem('main_width');
    if(width != null){
      $('#main').width(width);
    }
    $('#saved-list').click(function(){
      $('#saved-list .control').css('display','none');
    });
    $('.sort-control a').click(function(){
      if($(this).attr('class') == self.sort_type){
        self.sort_direction = self.sort_direction == 'desc' ? 'asc': 'desc';
      }
      self.sort_type = $(this).attr('class');
      localStorage.setItem('sort_type',self.sort_type)
      localStorage.setItem('sort_direction',self.sort_direction)
      self.create();
    });
    $('#saved-list span.item').live('mousedown',function(event){
      if((event.which == 1 || event.which == 2) && !event.altKey){
          var alwaysAdd = localStorage.getItem('alwaysAdd');
          if(typeof alwaysAdd == 'undefined' || alwaysAdd == ''){
            alwaysAdd = false;
          }else{
            alwaysAdd = alwaysAdd >0
          }
          var id = $(this).attr('class').match(/[0-9]+/)[0];
          var close = !(event.ctrlKey || event.which == 2 || alwaysAdd);

          var newWindow = false;
          if(parseInt(localStorage.getItem('newWindow')) === 1){
              newWindow = !event.shiftKey;
          }else{
              newWindow = event.shiftKey;
          }
          self.db.query('SELECT name,data FROM storage WHERE id='+id,[],function(tx,r){
            self.openSavedTabs(close,newWindow, r);
          });
      }
      event.preventDefault();
      return false;
    });

    $('#saved-list img.options').live('click',function(){
      $(this).prev('.control').fadeIn(250);

    });

    $('#saved-list .delete').live('click',function(event){
      if(!confirm('Are you sure to delete this item?')){
        return;
      }
      var id = $(this).parent().nextAll('.item').attr('class').match(/[0-9]+/)[0];
      try{
        $(this).parent().parent('li').next('.edited-tab').remove();
        
        $(this).parent().parent('li').remove();
      }catch(e){}
      self.db.query('DELETE FROM storage WHERE id='+id,[],function(){
        StatusMessanger.showMessage('Tab Group deleted', 1000);
      });
      return false;
    });

    $('#saved-list .edit').live('click',function(event){
      var clicked = $(this);
      if(clicked.hasClass('in-edit')){
        clicked.children().attr('src','/images/down_arrow.png');
        clicked.parent('li').next('.edited-tab').slideUp(500,function(){
          $(this).children().children('.delete-tab').die('click');
          $(this).remove();
          clicked.removeClass('in-edit');
        });
      }else{
        var tabsList = new TabList(clicked,self.db);
        tabsList.loadById($(this).prev('.item').attr('class').match(/[0-9]+/)[0]);
        clicked.children().attr('src','/images/right_arrow.png');
      }
      return false;
    });

     $('#saved-list .add-to-list').live('click', function(event){
      var clicked = $(this);
      var tabsList = new TabList(clicked,self.db);
      chrome.tabs.getSelected(null,function(tabData){
          tabsList.addToId(clicked,tabData,clicked.parent().nextAll('.item').attr('class').match(/[0-9]+/)[0]);
        });
    });

    $('#saved-list .update-list').live('click', function(event){
      var data;
      var id = $(this).parent().nextAll('.item').attr('class').match(/[0-9]+/)[0];
      if(!confirm('Are you sure? All data in this group will be rewrited')){
          return;
      }
      try{
          $(this).parent().parent().next('.edited-tab').remove();
          //arrowIcon = $(this).parent().nextAll('in-edit')
          $(this).parent().nextAll('.in-edit').removeClass('in-edit').children().attr('src','/images/down_arrow.png');
      }catch(e){}
      chrome.windows.getCurrent(function(win){
          chrome.tabs.getAllInWindow(win.id, function(tabsArray){
            data = '[';
            for(var i=0; i < tabsArray.length; i++){
              data += '{"item":"tab'+i+'","title":"'+addSlashes(tabsArray[i].title)+'","url":"'+addSlashes(tabsArray[i].url)+'","icon":"'+tabsArray[i].favIconUrl+'","selected":'+tabsArray[i].selected +',"pinned":'+tabsArray[i].pinned+'}';
              if((i+1)<tabsArray.length){
                data += ',';
              }
            }
            data +=']';
            self.db.query("UPDATE "+self.db.table+" SET data='"+data+"' WHERE id="+id,[],function(tx,r){
//              Drive.updateGroup(id, data);
              StatusMessanger.showMessage('Tabs group updated', 1000);
            });
          });
        });
    });

    $('#saved-list .rename').live('click', function(event){
      var item = $(this).parent().nextAll('.item');
      var name = item.text();
      var width = item.innerWidth()+10;
      var input = $('<input type="text" name="item-input" class="item" value="'+name+'" style="width:'+width+'px; border:0">');
      item.replaceWith(input);
      input.focus();
      input.keydown(function(event){
        if (event.keyCode == '13') {
          event.preventDefault();
          self.rename(item,input)
        }
      });
      input.focusout(function(){
        self.rename(item,input)
      });
    });
    self.events_was_inizialized = true;
  })(this);
};

SavedTabsList.prototype.rename = function(link,input){
  var newName = '';
  var id = link.attr('class').match(/[0-9]+/)[0];
  newName = input.val();
  if(newName.length == 0){
    input.replaceWith(link);
    StatusMessanger.showError('New group name is too short', 2000);
  }else{
    link.text(newName);
    input.replaceWith(link);
    this.db.query('UPDATE storage SET name="'+newName+'" WHERE id='+id,[],function(){
//      Drive.renameGroup(id,newName);
      StatusMessanger.showMessage('Group name changed', 1000);
    });
  }
};

SavedTabsList.prototype.openSavedTabs = function(close,newWindow,r){
  var tabs  = {};
  try{
    tabs = new TabsData(r.rows.item(0).data,r.rows.item(0).name);
    if(tabs.getLength() == 0){
        StatusMessanger.showMessage('Group is empty', 1000);
        return false;
    }
    tabs.openTabs(close,newWindow);
  }catch(e){}
};