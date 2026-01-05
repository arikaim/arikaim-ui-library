/**
 *  Arikaim
 *  @copyright  Copyright (c) Konstantin Atanasov <info@arikaim.com>
 *  @license    http://www.arikaim.com/license
 *  http://www.arikaim.com
 */
'use strict';

class View  {
   
    constructor() {
        this.messagesComponentName = null;
        this.itemComponentName = null;
        this.itemSelector = 'row_';
        this.itemsSelector = 'view_items';
        this.messages = null;
    }
   
    setItemsSelector(selector) {
        this.itemsSelector = selector;
    };

    setItemSelector(selector) {
        this.itemSelector = selector;
    };

    setItemComponentName(name) {
        this.itemComponentName = name
    };

    deleteItem(key) {
        $('#' + this.itemSelector + key).remove();                
    };

    updateItem(uuid) {
        return arikaim.page.loadContent({
            id: this.itemSelector + uuid,         
            replace: true,
            component: this.itemComponentName,
            params: {
                uuid: uuid
            }
        },() => {
            this.initRows();
        });
    };

    addItem(params) {
        return arikaim.page.loadContent({
            id: this.itemsSelector,         
            prepend: true,  
            component: this.itemComponentName,
            params: params
        },() => {
            this.initRows();
        });
    };

    setMessagesComponent(name) {
        this.messagesComponentName = name;
    };

    getMessage(key) {
        if (isObject(this.messages) == false) {
            this.loadMessages(null,function(messages) {              
                return getValue(key,messages,'');
            });
        }
      
        return getValue(key,this.messages,'');
    };

    loadMessages(componentName, onSuccess) {
        if (isObject(this.messages) == true) {
            callFunction(onSuccess,this.messages);
            return;
        }
        componentName = getDefaultValue(componentName,this.messagesComponentName);
        
        arikaim.component.loadProperties(componentName,(params) => { 
            this.messages = params.messages;
            callFunction(onSuccess,params.messages);
        }); 
    };

    init() {};
    initRows() {};
    loadRows() {};
}