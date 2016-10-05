function TabList(clicked,db){
  this.tabsData = {};
  this.clicked = clicked;
  this.db = db;
  this.id = 0;
}
TabList.prototype.loadById = function(id){
  this.id = id;
  (function(self){
    self.db.query('SELECT data FROM storage WHERE id='+self.id,[],function(tx,r){
      if(!(self.tabsData instanceof TabsData)){
        self.tabsData = new TabsData(r.rows.item(0).data);
      }
      if(self.tabsData.getLength() == 0){
          StatusMessanger.showMessage('Group is empty', 1000);
          return;
      }
      self.render()
    });
  })(this);
};
TabList.prototype.addToId = function(clicked,tabData,id){
  this.id = id;
  (function(self){
    self.db.query('SELECT data FROM storage WHERE id='+self.id,[],function(tx,r){
      if(!(self.tabsData instanceof TabsData)){
        self.tabsData = new TabsData(r.rows.item(0).data);
      }
      self.addTab(clicked,tabData);
    });
  })(this);
};
TabList.prototype.addTab = function(clicked,tabData){
  var newTabHtml = '';
  var nextTab = 'tab'+(this.tabsData.getLength()+1);
  var list = {};
  tabData.item = nextTab;
  tabData.icon = tabData.favIconUrl;
  this.tabsData.addTab(tabData);
  this.updateData();
  newTabHtml = this.addTabHtml(tabData.url, tabData.title, nextTab, tabData.favIconUrl);
  StatusMessanger.showMessage('Tab added', 1500);
  list = clicked.parent().parent().next('ul.edited-tab');
  if(list.length > 0){
    list.append(newTabHtml);
  }
};
TabList.prototype.deleteTab = function(tabMarker){
  var changed = this.tabsData.deleteTab(tabMarker);
  if(changed){
    this.updateData();
  }
};
// TODO drive.update()
TabList.prototype.updateData = function(){
  var data = this.tabsData.serialize();
//  Drive.updateGroup(id, data);
  this.db.query("UPDATE storage SET data='"+data+"' WHERE id="+this.id,[]);
}
TabList.prototype.initEvent = function(){
  (function(self){
  self.clicked.parent().next().find('.delete-tab').click(function(){
      var tabMarker = $(this).attr('class').match(/ (tab[0-9]+)/)[1];
      $(this).parent('li').remove();
      self.deleteTab(tabMarker);
    });
    $('.edited-tab').slideDown(500,function(){
      self.clicked.addClass('in-edit');
    });
  })(this)
}
TabList.prototype.addTabHtml = function(url,title,tab,icon){
  var style = '';
  var content = '';
  if(icon != 'undefined'){
    style = 'style="background:url('+icon+') no-repeat left 3px transparent;background-size: 16px 16px;"';
  }
  content += '<li '+style+'>'
  content += '<a target="_blank" href="'+url+'" class="title">'+title+'</a>&nbsp;<span class="delete-tab '+tab+'">X</span>';
  content += '</li>';
  return content;
}
TabList.prototype.render = function(){
  var content = '<ul class="edited-tab">';
  var parentElement = this.clicked.parent('li');
  var tab = {};
  var key = 0;
  while(tab = this.tabsData.getTabItem(key)){
    content += this.addTabHtml(tab.url, tab.title, tab.item, tab.icon);
    key++;
  }
  content += '</ul>';
  parentElement.after(content);
  this.initEvent();
}