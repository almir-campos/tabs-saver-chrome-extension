function TabsData(unserializedData,name){
  this.tabsData = JSON.parse(unserializedData);
  this.rebuildFromOld();
  this.name = typeof name == 'string' ? name: '';
}
// to perform from old format to new
TabsData.prototype.rebuildFromOld = function(){
  var out = [];
  var tempObj = {};
  var tabId = '';
  if(this.tabsData instanceof Array){
    return;
  }
  for(tabId in this.tabsData){
    tempObj = {};
    tempObj.item = tabId;
    tempObj.title = this.tabsData[tabId][0];
    tempObj.url = this.tabsData[tabId][1];
    tempObj.icon = this.tabsData[tabId][2];
    tempObj.selected = this.tabsData[tabId][3];
    tempObj.pinned = false;
    out.push(tempObj);
  }
  this.tabsData = out;
};
TabsData.prototype.openTabs = function(close,newWindow){
  var tab;
  var currentTabs;
  (function(self){
    if(newWindow){
        self.openTabsInNewWindow();
    }else if(close == true){
      chrome.windows.getCurrent({populate:true},function(win){
          for(tab in self.tabsData){
            chrome.tabs.create({url:self.tabsData[tab].url,selected:self.tabsData[tab].selected,pinned:self.tabsData[tab].pinned});
          }
          for(var key in win.tabs){
            chrome.tabs.remove(win.tabs[key].id);
          }
      });
    }else{
      for(tab in self.tabsData){
        chrome.tabs.create({url:self.tabsData[tab].url,selected:self.tabsData[tab].selected});
      }
    }
  })(this);
};
TabsData.prototype.openTabsInNewWindow = function(){
    var links = [];
    var tabsData = this.tabsData;
    for(var key in tabsData){
        links.push(tabsData[key].url);
    }
    chrome.windows.create({type:'normal',url:links},function(win){
        for(var key in win.tabs){
            win.tabs[key].selected = tabsData[key].selected;
            win.tabs[key].pinned = tabsData[key].pinned;
            chrome.tabs.reload(win.tabs[key].id);
        }
    });
}
TabsData.prototype.serialize = function(){
  var data = '[';
  var tab;
  for(tab in this.tabsData){
    data += '{"item":"'+this.tabsData[tab].item+'","title":"'+addSlashes(this.tabsData[tab].title)+'","url":"'+addSlashes(this.tabsData[tab].url)+'","icon":"'+this.tabsData[tab].icon+'","selected":'+this.tabsData[tab].selected +',"pinned":'+this.tabsData[tab].pinned+'},';
  }
  data +=']';
  data = data.replace(/,]$/, ']');
  return data;
}
TabsData.prototype.deleteTab = function(tabMarker){
  for(var tab in this.tabsData){
    if(this.tabsData[tab].item == tabMarker){
      delete this.tabsData[tab];
      return true;
    }
  }
  return false;
};
TabsData.prototype.addTab = function(newTabData){
  this.tabsData.push(newTabData);
}
TabsData.prototype.getTabItem = function(key){
  if(typeof this.tabsData[key] != 'undefined'){
    return this.tabsData[key];
  }else{
    return false;
  }
}
TabsData.prototype.getLength = function(){
  var length = 0;
  var tab;
  for(tab in this.tabsData){
    length++;
  }
  return length;
};
