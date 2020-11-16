/**
 *  Arikaim
 *  @copyright  Copyright (c) Konstantin Atanasov <info@arikaim.com>
 *  @license    http://www.arikaim.com/license
 *  http://www.arikaim.com
*/
'use strict';

if (typeof arikaim !== 'object') {
    throw new Error('Arikaim library not loaded!');   
}

function isEmptyElement(selector) {
    if (isEmpty(selector) == true) {
        return true;
    }

    return ($(selector).html().toString().trim() == '');
}

/**
 * Text helpers
 * @class Text
 */
function Text() {
      
    this.hexNumber = function(number, length) {
        var result = number.toString(16).toUpperCase();
        while(result.length < length) {
            result = '0' + result;
        }
           
        return result;
    };
   
    this.unicodeText = function(text) {
        var i;
        var result = '';
        for(i = 0; i < text.length; ++i){           
            result += (this.isASCII(text,i) == true) ? text[i] : "\\u" + this.hexNumber(text.charCodeAt(i),4);              
        }

        return result;
    }

    this.isASCII = function(text, index) {
        index = getDefaultValue(index,0);
        return !(text.charCodeAt(index) > 126 || text.charCodeAt(index) < 32); 
    };

    this.replaceUmlautChars = function(text) {
        text = text.toLowerCase();
        text = text.replace(/ä/g,'ae');
        text = text.replace(/æ/g,'ae');
        text = text.replace(/å/g,'aa');
        text = text.replace(/ö/g,'oe');
        text = text.replace(/ø/g,'oe');
        text = text.replace(/ü/g,'ue');
        text = text.replace(/ß/g,'ss');
        text = text.replace(/é/g,'e');
        text = text.replace(/è/g,'e');
        
        return text;
    };

    this.parseVersion = function(version) {
        version = getDefaultValue(version,'0.0.0');
        var tokens = version.split('.');

        return {
            major:  (isEmpty(tokens[0]) == true) ? 0 : parseInt(tokens[0]),
            minor:  (isEmpty(tokens[1]) == true) ? 0 : parseInt(tokens[1]),
            patch:  (isEmpty(tokens[2]) == true) ? 0 : parseInt(tokens[2])
        }       
    }

    this.versionCompare = function(version1, version2) {
        version1 = this.parseVersion(version1);
        version2 = this.parseVersion(version2);
       
        if (version1.major > version2.major) return true;                   
        if (version1.major == version2.major) {
            
            if (version1.minor > version2.minor) return true;
            if (version1.minor == version2.minor) {
                if (version1.patch > version2.patch) return true;
            }
        } 

        return false;
    };

    this.createSlug = function(text) {
        if (isEmpty(text) == true) {
            return '';
        }
        var text = text.toString().trim().toLowerCase();
        text = this.replaceUmlautChars(text);

        return text.replace(/\s+/g,'-').replace(/\-\-+/g,'-');
    }

    this.escapeHtml = function(html) {
        return html
             .replace(/&/g, "&amp;")
             .replace(/</g, "&lt;")
             .replace(/>/g, "&gt;")
             .replace(/"/g, "&quot;")
             .replace(/'/g, "&#039;");
    };
}

/**
 * @class Table
 *
 */
function Table() {
    var self = this;

    this.emptyRowCode = '<tr class="empty-row"><td colspan="<% colspan %>"><% empytLabel %></td></tr>';

    this.getEmptyRowHmtlCode = function(params) {
        return arikaim.ui.template.render(this.emptyRowCode,params);       
    };

    this.removeRow = function(rowId, emptyLabel, onEmpty, colSpan) {
        emptyLabel = getDefaultValue(emptyLabel,'..');
        colSpan = getDefaultValue(colSpan,1);
        var parent = $(rowId).parent();
        $(rowId).remove();
        
        if (isEmptyElement(parent) == true) {
            var result = callFunction(onEmpty,parent);
            if (result !== false) {
                $(parent).append(this.getEmptyRowHmtlCode({ 
                    colspan: colSpan,
                    empytLabel: emptyLabel
                }));
            }           
        }
    };

    this.removeSelectedRows = function(selected) {
        if (isArray(selected) == false) {
            return false;
        }
        $.each(selected,function(index,value) {
            self.removeRow('#' + value);
        });
    };
}

/**
 *  @class TemplateEngine
 *  Simple template engine parse tags <% var name %>  
 */
function TemplateEngine() {    
    var tags = ['<%','%>'];

    var parseTemplateVariable = function(name) {        
        var regexp = new RegExp('[' + tags[0] + '][' + tags[1] + ']','gi');
        return name.replace(regexp,'').trim();      
    };

    this.render = function(text, data) {
        var value = '';
        var regexp = new RegExp(tags[0] + '([^' + tags[1] + ']+?)' + tags[1],'gi');
        var result = text.match(regexp);

        if (isArray(result) == false) {
            return text;
        }
 
        for (var i = 0; i < result.length; i++) {                      
            var templateVariable = parseTemplateVariable(result[i]);
            if (templateVariable !== false) {
                value = getValue(templateVariable,data,'');
            }
            text = text.replace(result[i],value);
        }

        return text;
    };
}

/**
 * @class Form
 * Manage html forms
 */
function Form() {
    var self = this;

    this.getSettings = function() {
        return (isEmpty($.fn.form.settings) == true) ? null : $.fn.form.settings;        
    };

    this.clear = function(selector) {
        $(selector)[0].reset();
        $(selector).trigger('reset');
        $(selector).each(function() {  
            this.reset();
        }); 
        this.clearErrors(selector);
    };

    this.populate = function (selector, data) {
        $.each(data,function (key, value) {
            $('[name="' + key + '"]',selector).val(value);
        });
    };

    this.serialize = function(selector) {
        var form = $(selector);
        return (form.length == 0) ? false : JSON.stringify(form.serializeArray());       
    };

    this.findSubmitButton = function(selector) {
        var button = $('input[type=submit]',selector);

        if ($(button).length == 0) {
            button = $(selector).find('.save-button');
        }
        if ($(button).length == 0) {
            button = $(selector).find('.submit-button');
        }

        return button;
    };

    this.serialize = function(selector, replaceFields) {
        var data = $(selector).serializeArray();
        if (isEmpty(replaceFields) == true) {
            return data;
        }
        Object.entries(replaceFields).forEach(function(item) {           
            data = self.replaceValue(data,item[0],item[1]);
        });

        return data;
    };

    this.replaceValue = function(formData, fieldName, fieldValue) {

        formData.forEach(function(item,index) {
            if (item.name == fieldName) {
                formData[index].value = fieldValue
            }
        });

        return formData;
    };

    this.onSubmit = function(selector, action, onSuccess, onError, submitButton) {
        var deferred = new $.Deferred();
        if (isEmpty(submitButton) == true) {
            var submitButton = this.findSubmitButton(selector);
        }
        $(selector).off();     
        $(selector).unbind();

        $(selector).on('submit',function(event) {
            event.preventDefault();
            event.stopImmediatePropagation();
            if (window.event && window.event.keyCode == 13) {
                // prevent default form submit 
                return false;
            }
           
            self.clearErrors(selector);          
            self.disable(selector);
            arikaim.ui.disableButton(submitButton);
            var data = self.serialize(selector);

            if (self.validate(selector) == false) {    
                arikaim.ui.enableButton(submitButton);   
                self.enable(selector);  
                self.showValidationErrors(selector);
                deferred.reject();  
                callFunction(onError);               
            } else {
                // form is valid
                var actionResult = callFunction(action,data);
             
                if (isPromise(actionResult) == true) {                   
                    actionResult.done(function(result) {
                        arikaim.ui.enableButton(submitButton);                        
                        self.enable(selector); 
                        callFunction(onSuccess,result);
                        deferred.resolve(result); 
                    }).fail(function(errors) { 
                        arikaim.ui.enableButton(submitButton);                          
                        self.enable(selector);                     
                        self.addFieldErrors(selector,errors);
                        self.showErrors(errors);
                        deferred.reject(errors); 
                        callFunction(onError,errors); 
                    });
                } else {
                    arikaim.ui.enableButton(submitButton);                      
                    if (actionResult === true) {
                        deferred.resolve(data);  
                        callFunction(onSuccess,data);
                    }
                }
            }
        });
     
        return deferred.promise();
    };

    this.toObject = function(array) {        
        var result = {};
        if (isArray(array) == false) {
            return result;
        }
        for (var i = 0; i < array.length; i++){
            result[array[i]['name']] = array[i]['value'];
        }

        return result;
    };

    this.addFieldErrors = function(selector, errors) {
        if (isArray(errors) == false) {
            return false;
        }
        errors.forEach(function(error) {
            $(selector).form('add prompt',error.field_name,error.message);
        });
    };
    
    this.disable = function(selector, cssClass) {
        cssClass = getDefaultValue(cssClass,'disabled'); 
        $(selector).children().addClass(cssClass);
    };
    
    this.enable = function(selector, cssClass) {
        cssClass = getDefaultValue(cssClass,'disabled'); 
        $(selector).children().removeClass(cssClass);
    };

    this.buildRules = function(selector, rules) {       
        var fields = $(selector).find('input, textarea, select');
        if (isEmpty(rules) == true) {
            rules = {   
                fields: {},
                inline: false,
            };
        }
    
        $.each(fields,function(index,field) {
            var fieldName = $(field).attr('name');
            if (isEmpty(rules.fields[fieldName]) == true) {
                rules.fields[fieldName] = self.createRule(field);
            }           
        });
      
        return rules;
    };

    this.createRule = function(field) {
        var rule = $(field).attr('rule');
        var ruleValue = $(field).attr('rule-value');
        var optional = $(field).attr('optional');
        var fieldId = $(field).attr('id');  
        var errorPrompt = $(field).attr('error-prompt');
        errorPrompt = (isEmpty(errorPrompt) == false) ? errorPrompt.split(',') : null;
           
        var result = {
            identifier: fieldId
        };
        if (isEmpty(rule) == true) {
            result.optional = true;
            return result;
        }
        var items = rule.split(',');
        var rules = [];
        $.each(items,function(index,item) {
            var ruleItem = {
                type: item
            };
           
            if (isEmpty(errorPrompt) == false) {
                ruleItem.prompt = errorPrompt[index];
            }
            if (isEmpty(ruleValue) == false) {
                ruleItem.value = ruleValue;
            }
            rules.push(ruleItem);           
        });
        result.rules = rules;
        result.optional = (optional == 'true') ? true : false;
                      
        return result;
    };

    this.addValidationRule = function(name, callback) {
        if (isFunction($.fn.form.settings.rules[name]) == false) {
            $.fn.form.settings.rules[name] = callback;
        }
    };

    this.addRules = function(selector, rules) {
        // custom rules 
        this.addValidationRule('scriptTag',function(value) {
            var regexp = /<script\b[^>]*>([\s\S]*?)/gmi          
            return !value.match(regexp);
        });
        this.addValidationRule('htmlTags',function(value) {
            var regexp = /<[a-z][\s\S]*>/i       
            return !value.match(regexp);
        });

        rules = this.buildRules(selector,rules);
       
        if (isEmpty(rules.onFailure) == true) {
            rules.onInvalid = function(error) {
                var message = $(selector).find('.errors.message');
                if ($(message).is(':empty') == true) {
                    $(selector).form('add prompt',$(this).attr('name'),error);              
                }
            }
        };        
        $(selector).form(rules);
        $(selector + ' :input').on('focus',function() {        
            self.clearErrors(selector);
        });
    };

    this.validate = function(selector) {
        $(selector).form('validate form');
        return $(selector).form('is valid');
    };

    this.showValidationErrors = function(selector) {      
        var fields = $(selector).form('get dirty fields');
        
        fields.each(function(index, field)  {
            $(selector).form('validate field',field.name);
        });
      
        var message = $(selector).find('.errors.message');
        if (isObject(message) == true) {
            arikaim.ui.show(message);
        }
    };

    this.showMessage = function(options) {
        if (isObject(options) == false) {
            options = { message: options };
        }
        var selector = getValue('selector',options,null); 
        var cssClass = getValue('class',options,null);   
        var removeClass = getValue('removeClass',options,'error');

        if (isEmpty(selector) == true) {
            selector = $('form').find('.success');
        }
        var message = getValue('message',options,''); 
        var hide = getValue('hide',options,2000);  

        if (cssClass != null) {
            $(selector).addClass(cssClass).removeClass(removeClass);
        }
    
        arikaim.ui.show(selector);
        if (hide > 0) {
            $(selector).delay(hide).animate({ opacity: 0 }, 200);
        } 
        if ($(selector).find('.header').length != 0) {
            $(selector).find('.header').html(message);
        } else {
            $(selector).html(message);
        }       
    };

    this.clearErrors = function(selector) {      
        $(selector).find('.errors.message').html('');
        $(selector).find('.errors').html('');    
        $(selector).find('.errors.list').remove();
        $(selector).find('.errors').hide();
        $(selector).find('.error').find('.prompt').remove();
    };   

    this.showErrors = function(errors, selector, component) {
        if (isEmpty(selector) == true) {
            selector = $('form').find('.errors');
        }       
        var message = ''; 
        if (isArray(errors) == true) {
            for (var index = 0; index < errors.length; index++) {
                var error = errors[index];
              
                if (isObject(error) == true) {
                    var errorLabel = '';
                    if (isObject(component) == true) {                     
                        errorLabel = component.getProperty(error.field_name + '.label');
                    }
                    error = '<span>' + errorLabel + '</span> ' + error.message;                 
                }
                if (isString(error) == true) {
                    message += '<li>' + error + '</li>';
                }
            }
        } else {
            message = '<li>' + errors + '</li>';           
        }
      
        this.showMessage({
            selector: selector,
            message: message,
            hide: 0
        });        
    };   
}

/**
 * @class ArikaimUI 
 * UI helpers
 */
function ArikaimUI() {
    var self = this;
    
    this.form = new Form();
    this.template = new TemplateEngine();
    this.table = new Table();

    
    this.button = function(selector, action, onSuccess, onError) {      
        $(selector).off();
        $(selector).on('click',function(event) {
            event.stopPropagation();
            var button = this;
            self.disableButton(button);
          
            var result = callFunction(action,this);
            if (isPromise(result) == true) {
                result.then(function(result) {
                    self.enableButton(button);                  
                    callFunction(onSuccess,result);
                }).catch(function(error) {
                    self.enableButton(button);                   
                    callFunction(onError,result);
                });
            } else {
                self.enableButton(button);              
                if (result !== false) {
                    callFunction(onSuccess,result);
                } else {
                    callFunction(onError,result);
                }
            }
        });
    };

    this.isActive = function(selector) {
        if ($(selector).hasClass('active') == true) {
            return true;
        }
        if ($(selector).attr('active') == 'true') {
            return true;
        }
        return false;
    };
 
    this.setActiveButton = function(selector, groupSelector) {
        var group = $(groupSelector).children();
        if (group.length > 0) {
            $.each(group,function(index,button) {
                $(button).removeClass('active');
                $(button).attr('active','false');
            });
        }
        $(selector).addClass('active');
        $(selector).attr('active','true');
    };

    this.toggleButton = function(options, onSuccess, onError) {
        var selector = (isObject(options) == true) ? options.selector : options;
        var groupSelector = getValue('groupSelector',options,null);  
        var action = getValue('action',options,null);

        this.button(selector,function(button) {
            if (self.isActive(selector) == false) {         
                self.setActiveButton(selector,groupSelector)                
            } else {              
                $(selector).removeClass('active');
                $(selector).attr('active','false');
            }
            callFunction(action,$(selector));
        },onSuccess,onError);
    }

    this.setEmptyImageOnError = function(selector, imageSrc) {
        $(selector).on('error',function() {
            if (isString(imageSrc) == true) {
                $(this).attr('src',imageSrc);
            } 
            callFunction(imageSrc,this);          
        });
    };

    this.initImageLoader = function() {
        $.each($('img'),function() {
            var dataSrc = $(this).attr('data-src');
            if (dataSrc) {
                $(this).attr('src',dataSrc);
            }
        });
    };

    this.viewPasswordButton = function(selector, fieldSelector, toggleClass) {
        toggleClass = getDefaultValue(toggleClass,'slash');
        fieldSelector = getDefaultValue(fieldSelector,'.password-field');
        
        this.button(selector,function(element) {
            $(element).find('.icon').toggleClass(toggleClass);
            $(fieldSelector).attr('type',function(index, attr) {
                return (attr == 'text') ? 'password' : 'text';
            });
        });
    };

    this.getAttr = function(selector, name, defaultValue) {
        var value = $(selector).attr(name);
        return (isEmpty(value) == true) ? defaultValue : value;
    };

    this.menu = function(itemSelector,cssClass) {
        itemSelector = getDefaultValue(itemSelector,'.menu .item');
        cssClass = getDefaultValue(cssClass,'active');
        
        $(itemSelector).on('click',function() {
            $(itemSelector).removeClass(cssClass);
            $(this).addClass(cssClass);
        }); 
    };

    this.tab = function(selector, contentSelector, paramsList) {
        paramsList = getDefaultValue(paramsList,[]);
        paramsList.push('language'); 
        paramsList.push('uuid');
        paramsList.push('extension');
        selector = getDefaultValue(selector,'.tab-item');
        contentSelector = getDefaultValue(contentSelector,'tab_content');

        this.button(selector,function(element) {
            var component = $(element).attr('component');
            var params = {};
            if (isArray(paramsList) == true) {
                paramsList.forEach(function(value) {
                    var attr = self.getAttr(element,value,null);
                    if (attr != null) {
                        params[value] = attr;
                    }
                });
            }          
            self.setActiveTab(element,selector);
            return arikaim.page.loadContent({
                id: contentSelector,
                component: component,
                params: params
            });   
        });
    };

    this.setActiveTab = function(selector, itemsSelector) {      
        itemsSelector = getDefaultValue(itemsSelector,'.tab-item');
        $(itemsSelector).removeClass('active');
        $(selector).addClass('active');     
    };

    this.enableButton = function(element) {       
        $(element).removeClass('disabled loading');
    };

    this.disableButton = function(element, loadingOnly) {   
        loadingOnly = getDefaultValue(loadingOnly,false);

        if (loadingOnly == true) {
            $(element).addClass('loading');
        } else {          
            $(element).addClass('disabled loading');
        }            
    };

    this.show = function(selector, options, removeClasses) {
        removeClasses = getDefaultValue(removeClasses,['hidden','invisible'])
        $(selector).show(options);
        $(selector).removeClass(removeClasses);      
        $(selector).css('visibility','visible');
        $(selector).css('opacity','1');
    };

    this.toggle = function(selector, options, removeClasses, placeholder) {
        var element = (isObject(selector) == true) ? selector.selector : selector;
        var value = getValue('value',selector,this.isHidden(element));

        if (value == true) {
            this.show(element,options,removeClasses);
        } else {
            this.hide(element,placeholder,options);
        }
    };

    this.isHidden = function(selector) {
        if ($(selector).css('display') == 'none' || isEmpty($(selector).css('display') == true)) {
            return true;
        } 
        if ($(selector).is(':visible') == false) {
            return true;
        }
        if ($(selector).is(':hidden') == true) {
            return true;
        }             
        if ($(selector).hasClass('hidden') == true) {
            return true;
        }
        if ($(selector).attr('opacity') == '0') {
            return true;
        }

        return false;
    };

    this.hide = function(selector, placeholder, options) {
        if (placeholder == true) {
            $(selector).css('opacity','0');
        } else {
            $(selector).hide(options);
            $(selector).addClass('hidden');
            $(selector).removeClass('visible');
            $(selector).css('visibility','hidden');
        }
    };
    
    this.getChecked = function(selector) {
        var selected = [];
        $(selector + ':checked').each(function(index) {
            if (isEmpty($(this).val()) == false) {
                selected.push($(this).val());
            }           
        });     

        return { selected: selected };
    };

    this.cssClass = function(selector, value, cssClass) {
        if (value == true) {
            $(selector).addClass(cssClass);
        } else {
            $(selector).removeClass(cssClass);
        }
    };

    this.selectAll = function(element, itemClass, iconSelector) {
        itemClass = getDefaultValue(itemClass,'.selected-row');
        iconSelector = getDefaultValue(iconSelector,'#all_icon');

        var value = $(element).attr('data-value');
        if (value == 'select') {
            $(itemClass).prop('checked',true);               
            $(element).attr('data-value','unselect');
            $(iconSelector).addClass('check');
        } else{
            $(iconSelector).removeClass('check');               
            $(itemClass).prop('checked',false);
            $(element).attr('data-value','select');
        }    
    };
}

/**
 *  @class Page
 *  
 */
function Page() {
    
    var self = this;
    var properties = {};  
    var name = null;
    var onContentReady = null;
    var defaultLoader = '<div class="ui active blue centered loader" id="loader"></div>';  
    var language = null;

    this.loader = '';

    this.toastMessage = function(message) {
        if (isObject(message) == false) {
            message = { 
                class: 'success',
                message: message,
                position: 'bottom right'
            };
        } 
        message.position = getDefaultValue(message.position,'bottom right');
        $('body').toast(message);
    };

    this.setLoader = function(loaderHtml) {
        this.loader = loaderHtml;
    };

    this.initPageLoader = function() {
        var code = $('.loader-code').html();
        if (isEmpty(code) == false) {
            this.loader = code;
        }
    };

    this.getLoader = function(code) {     
        return ((isEmpty(code) == true) && (isEmpty(this.loader) == true)) ? defaultLoader : this.loader;      
    };

    this.onContentReady = function(callback) {
        onContentReady = callback;
    };

    this.onReady = function(callback) {        
        $(document).ready(callback);
    };

    this.reload = function() {
        location.reload(true);
    };

    this.getProperty = function(name) {
        var data = components[name];
        return (isJSON(data) == true) ? JSON.parse(components[name]) : false;        
    };

    this.getPageName = function() {
        return name;
    };

    this.hasLib = function(libraryName) {
        return (properties.library.indexOf(libraryName) > 0) ? true : false;           
    };

    this.setProperties = function(params) {            
        name = params.name;
        properties = params; 
        language = params.language;

        return true;
    };

    this.removeLoader = function(selector) {
        selector = getDefaultValue(selector,'#loader');
        $(selector).remove();
    };

    this.showLoader = function(selector, loader, append) {
        append = getDefaultValue(append,false);
        loader = getDefaultValue(loader,this.getLoader());   
    
        if (append == true) {
            $(selector).append(loader);
        } else {
            $(selector).html(loader);
        }     
    };

    this.setContent = function(element, content) {
        $(element).html(content);
    };

    this.replaceContent = function(element, content) {
        $(element).replaceWith(content);
    };
    
    this.loadProperties = function(name, onSuccess, onError) {
        name = getDefaultValue(name,'');  
        arikaim.log('Load page properties: ' + name);
        arikaim.get('/core/api/ui/page/properties/' + name,function(result) {          
            self.setProperties(result.properties);                                
            arikaim.log('Page properties loaded!');
            callFunction(onSuccess,result);
        },function(errors) {
            arikaim.log('Error loading page properties: ' + name);
            callFunction(onError,errors);
        });
    };

    this.loadContent = function(params, onSuccess, onError) {       
        var componentName = getValue('component',params,'no-name');       
        var componentParams = getValue('params',params,'');
        var elementId = getValue('id',params);
        var element = getValue('element',params);
        var loaderCode = getValue('loader',params,null);
        var loaderClass = getValue('loaderClass',params,'');
        var replace = getValue('replace',params,false);
        var append = getValue('append',params,false);
        var useHeader = getValue('useHeader',params,false);
        var method = getValue('method',params,'GET');
        var includeFiles = getValue('includeFiles',params,true);
        var disableRedirect = getValue('disableRedirect',params,false);

        if (isEmpty(elementId) == false) {
            element = '#' + elementId;
        }
        var loader = this.getLoader(loaderCode);
        if (isEmpty(loaderClass) == false) {
            $('#loader').attr('class',loaderClass);
        }
        if (append !== true) {
            this.showLoader(element,loader);
        }

        arikaim.component.load(componentName,function(result) { 
            self.removeLoader(); 
            if (append == true) {              
                $(element).append(result.html);             
                callFunction(onSuccess,result);    
                return;
            }          
            if (replace == true) {
                $(element).replaceWith(result.html);
                callFunction(onSuccess,result);       
                return;
            }
            arikaim.page.setContent(element,result.html);         
            callFunction(onSuccess,result);                                          
        },function(errors,options) {
            // errors load component
            self.removeLoader();
            self.showErrorMessage(params,errors);
            if (disableRedirect == false && isEmpty(options.redirect) == false) {
                // redirect to error or login page
                arikaim.loadUrl(options.redirect,true);
            } 
          
            callFunction(onError,errors,null,options);   
        },componentParams,useHeader,includeFiles,method);
    };

    this.showErrorMessage = function(params, errors) {
        var elementId = getValue('id',params);
        var element = getValue('element',params);
        var message = { message: errors[0] };
        
        if (isEmpty(elementId) == false) {
            element = '#' + elementId;
        }      
        arikaim.component.load('components:message.error',function(result) { 
            arikaim.page.setContent(element,result.html); 
        },null,message);
    };

    this.showSystemErrors = function(errors, element) {
        element = getDefaultValue(element,'.error');
        $(element + ' ul').html('');
        this.show(element);
        if (isObject(errors) == true) {
            $.each(errors, function(key,value) {
                $(element + ' ul').append('<li>' + value + '</li>');
            });  
        } else {
            $(element).append('<li>' + errors + '</li>');
        }
    };

    this.loadPage = function(name, onSuccess, onError) {    
        this.log('Load page: ' + name);
        this.get('/core/api/ui/page/' + name,function(result) {
            arikiam.log('Page ' + name + ' loaded!'); 
            callFunction(onSuccess,result);     
        }, function(errors) {
            arikiam.log('Error loading page: ' + name);
            callFunction(onError,errors);       
        });        
    };
} 

/**
 * @class Component
 * @param {*} prop 
 */
function Component(prop,name) {
    
    var properties = {};
    this.name = name;

    this.getProperty = function(name, defaultvalue) {
        return getValue(name,properties,defaultvalue);
    };

    this.getProperties = function() {
        return properties;
    };

    this.setProperties = function(json) {
        if (isJSON(json) == true) {
            properties = JSON.parse(json);
            return true;
        }

        return false;
    };

    if (isEmpty(prop) == false) {
        this.setProperties(prop);
    }
}

/**
 * @class HtmlComponents
 * Container for all html components loaded 
 */
function HtmlComponent() {
    var self = this;
    var components = {};
    
    this.onLoaded = null;

    this.get = function(name) {
        return (isEmpty(components[name]) == false) ? components[name] : false;          
    };

    this.getAll = function() {
        return components;
    };

    this.set = function(name, properties) {
        var component = new Component(properties,name);
        components[name] = component;
    };

    this.resolveUrl = function(name, params) {
        var url = '/core/api/ui/component/' + name;
        if (isEmpty(params) == true) {
            return url;
        }
        if (isArray(params) == true) {
            for (var index = 0; index < params.length; ++index) {
                url = url + '/' + params[index];
            }            
        }

        return url;
    };

    this.loadContent = function(name, onSuccess, onError, params, useHeader, method) {
        return this.load(name,onSuccess,onError,params,useHeader,false,method);
    };
    
    this.loadProperties = function(name, params, onSuccess, onError) {        
        return arikaim.apiCall('/core/api/ui/component/properties/' + name,onSuccess,onError,params);      
    };

    this.loadDetails = function(name, params, onSuccess, onError) {    
        return arikaim.apiCall('/core/api/ui/component/details/' + name,onSuccess,onError,params);      
    };

    this.loadLibrary = function(name, onSuccess, onError) {
        arikaim.get('/core/api/ui/library/' + name,function(requestResult) {           
            self.includeFiles(requestResult,function(result) {  
                arikaim.log('Library ' + name + ' loaded.');             
                callFunction(onSuccess,requestResult);
            });
        },onError);
    };

    this.load = function(name, onSuccess, onError, params, useHeader, includeFiles, method) {  
        includeFiles = (isEmpty(includeFiles) == true) ? true : includeFiles;                     
        method = getDefaultValue(method,'GET');
        if (method.toUpperCase() != 'GET') {
            useHeader = false;
        }
        var url = (useHeader == true) ? this.resolveUrl(name,params) : this.resolveUrl(name,null);
       
        return arikaim.apiCall(url,method,params,function(result) {         
            arikaim.component.set(name,result.properties);         
            callFunction(onSuccess,result);
            if (includeFiles == true) {
                self.includeFiles(result,function(filesLoaded) {   
                    // event
                    arikaim.log('component ' + name + ' loaded!'); 
                    callFunction(self.onLoaded,self.get(name));  
                    // fire event 
                    arikaim.events.emit('component.loaded.' + name,name);       
                });
            } else {
                arikaim.log('component ' + name + ' loaded!'); 
                callFunction(self.onLoaded,self.get(name));  
                // fire event 
                arikaim.events.emit('component.loaded.' + name,name);                                   
            }
        },function(errors,options) {
            arikaim.log('Error loading component ' + name);
            callFunction(onError,errors,null,options);
        });
    };

    this.includeFiles = function(response, onSuccess, onFileLoaded) {
        var jsFiles  = response.js_files;
        var cssFiles = response.css_files;
        var filesCount = 0;
        var loadedFiles = 0;

        // load css files
        if (cssFiles != false) {
            filesCount = filesCount + cssFiles.length;
            cssFiles.forEach(function(file) {       
                arikaim.includeCSSFile(file.url);
                loadedFiles++;
            }, this);
        }
        // load js files
        if (isEmpty(jsFiles) == false) {
            var files = Object.values(jsFiles);
            filesCount = filesCount + files.length;
            
            files.forEach(function(file) {  
                if (isEmpty(file.params) == false) {
                    if (arikaim.findScript(file.url) == false) {                      
                        var async = (file.params.indexOf('async') > -1) ? true : false;
                        var crossorigin = (file.params.indexOf('crossorigin') > -1) ? 'anonymous' : null;
                        arikaim.loadScript(file.url,async,crossorigin);
                        loadedFiles++;
                        // check if all files are loaded
                        if (loadedFiles == filesCount) {
                            callFunction(onSuccess,loadedFiles);
                        }
                    }        
                } else {
                    arikaim.includeScript(file.url,function() {
                        loadedFiles++;                     
                        callFunction(onFileLoaded,file.url);  
                        // check if all files are loaded
                        if (loadedFiles == filesCount) {
                            callFunction(onSuccess,loadedFiles);
                        }
                    });
                }                                            
            }, this);
        }
    };   
}

Object.assign(arikaim,{ text: new Text() });
Object.assign(arikaim,{ ui: new ArikaimUI() });
Object.assign(arikaim,{ page: new Page() });
Object.assign(arikaim,{ component: new HtmlComponent() });

$(document).ready(function() {
    arikaim.page.initPageLoader();
});