
if (typeof arikaim !== 'object') {
    throw new Error("Arikaim library not loaded!");   
}

/**
 * @class Table
 *
 */
function Table() {
    this.removeSelectedRows = function(selected) {
        if (isArray(selected) == false) {
            return false;
        }
        $.each(selected,function(index,value) {
            $('#' + value).remove();
        });
    };
}

/**
 *  @class TemplateEngine
 *  Simple template engine parse tags <% var name %>  
 */
function TemplateEngine() {    
    var template_tags = ['<%','%>'];

    var parseTemplateVariable = function(name) {        
        var regexp = new RegExp('[' + template_tags[0] + '][' + template_tags[1] + ']','gi');
        return name.replace(regexp,'').trim();      
    };

    this.render = function(text,data) {
        var value = '';
        var regexp = new RegExp(template_tags[0] + '([^' + template_tags[1] + ']+?)' + template_tags[1],'gi');
        var result = text.match(regexp);

        if (isArray(result) == false) {
            return text;
        }
        for (var i = 0; i < result.length; i++) {                      
            var template_variable = parseTemplateVariable(result[0]);
            if (template_variable != false) {
                value = getValue(template_variable,data,'');
            }
            text = text.replace(result[0],value);
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

    this.clear = function(selector) {
        $(selector)[0].reset();
        $(selector).trigger('reset');
        $(selector).each(function() {  
            this.reset();
        }); 
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
        var button = $("input[type=submit]",selector);

        if ($(button).length == 0) {
            button = $(selector).find('.save-button');
        }
        if ($(button).length == 0) {
            button = $(selector).find('.submit-button');
        }

        return button;
    };

    this.onSubmit = function(selector, action, onSuccess, onError, submit_button) {
        var deferred = new $.Deferred();

        if (isEmpty(submit_button) == true) {
            var submit_button = this.findSubmitButton(selector);
        }

        $(selector).off();
        $(selector).submit(function(event) {
            self.clearErrors(selector);
            event.preventDefault();   
            self.disable(selector);
            arikaim.ui.disableButton(submit_button,true);
            var data = self.serialize(selector);

            if (self.validate(selector) == false) {    
                arikaim.ui.enableButton(submit_button);   
                self.enable(selector);  
                self.showValidationErrors(selector);
                deferred.reject();  
                callFunction(onError);               
            } else {
                // form is valid
                var action_result = callFunction(action,data);
             
                if (isPromise(action_result) == true) {                   
                    action_result.done(function(result) {
                        arikaim.ui.enableButton(submit_button);                        
                        self.enable(selector); 
                        callFunction(onSuccess,result);
                        deferred.resolve(result); 
                    }).fail(function(errors) { 
                        arikaim.ui.enableButton(submit_button);                          
                        self.enable(selector);                     
                        self.addFieldErrors(selector,errors);
                        self.showErrors(errors);
                        deferred.reject(errors); 
                        callFunction(onError,errors); 
                    });
                } else {
                    arikaim.ui.enableButton(submit_button);                      
                    if (action_result === true) {
                        deferred.resolve(data);  
                        callFunction(onSuccess,data);
                    }
                }
            }
        });

        return deferred.promise();
    };

    this.toObject = function(form_array) {        
        var result = {};
        if (isArray(form_array) == false) {
            return result;
        }
        for (var i = 0; i < form_array.length; i++){
            result[form_array[i]['name']] = form_array[i]['value'];
        }
        return result;
    };

    this.addFieldErrors = function(selector,errors) {
        if (isArray(errors) == false) {
            return false;
        }
        errors.forEach(function(error) {
            $(selector).form('add prompt',error.field_name,error.message);
        });
    };
    
    this.disable = function(selector,css_class) {
        css_class = getDefaultValue(css_class,'disabled'); 
        $(selector).children().addClass(css_class);
    };
    
    this.enable = function(selector,css_class) {
        css_class = getDefaultValue(css_class,'disabled'); 
        $(selector).children().removeClass(css_class);
    };

    this.addRules = function(selector,rules,form_settings) {
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
        var message = $(selector).find('.errors.message');
        if (isObject(message) == true) {
            arikaim.ui.show(message);
        }
    };

    this.showMessage = function(options) {
        
        if (isObject(options) == false) {
            options = { message: options };
        }
        var element = getValue('element',options,null); 
        var css_class = getValue('class',options,null);   
        var remove_class = getValue('remove_class',options,'error');     
        if (isEmpty(element) == true) {
            element = ($('#message').length == 0) ? '.message' : '#message';
        }
        var message = getValue('message',options,''); 
        var hide = getValue('hide',options,2000);  
        if (css_class != null) {
            $(element).addClass(css_class).removeClass(remove_class);
        }
    
        arikaim.ui.show(element);
        if (hide > 0) {
            $(element).delay(hide).animate({ opacity: 0 }, 200);
        } 
        if ($(element).find('.header').length != 0) {
            $(element).find('.header').html(message);
        } else {
            $(element).html(message);
        }       
    };

    this.clearErrors = function(selector) {      
        $(selector).find('.errors').html('');    
        $(selector).find('.errors').hide();
        $(selector).find('.error').find('.prompt').remove();
    };   

    this.showErrors = function(errors, element, component) {
        var element = getDefaultValue(element,'.errors');  
        var message = '';
        if (isArray(errors) == true) {
            for (var index = 0; index < errors.length; index++) {
                var error = errors[index];              
                if (isObject(error) == true) {
                    var error_label = "";
                    if (isObject(component) == true) {                     
                        error_label = component.getProperty(error.field_name + ".label");
                    }
                    error = "<span>" + error_label + "</span> " + error.message;
                }
                message += "<li>" + error + "</li>";
            }
        } 
        if (isString(errors) == true) {
            message = "<li>" + errors + "</li>";
        }
    
        this.showMessage({
            element: element,
            message: message,
            hide: 0
        })        
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
            self.disableButton(button,true);
          
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

    this.initImageLoader = function() {
        $.each($('img'),function() {
            var data_src = $(this).attr('data-src');
            if (data_src) {
                $(this).attr('src',data_src);
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

    this.tab = function(selector, content_selector, params_list) {
        params_list = getDefaultValue(params_list,[]);
        params_list.push("language"); 
        params_list.push("uuid");
        selector = getDefaultValue(selector,'.tab-item');
        content_selector = getDefaultValue(content_selector,'tab_content');

        this.button(selector,function(element) {
            var component = $(element).attr('component');
            var params = {};
            if (isArray(params_list) == true) {
                params_list.forEach(function(value) {
                    var attr = self.getAttr(element,value,null);
                    if (attr != null) {
                        params[value] = attr;
                    }
                });
            }          
            self.setActiveTab(element,selector);
            return arikaim.page.loadContent({
                id: content_selector,
                component: component,
                params: params
            });   
        });
    };

    this.setActiveTab = function(selector, tab_items_selector) {      
        tab_items_selector = getDefaultValue(tab_items_selector,'.tab-item');
        $(tab_items_selector).removeClass('active');
        $(selector).addClass('active');     
    };

    this.enableButton = function(element) {       
        $(element).removeClass('disabled loading');
    };

    this.disableButton = function(element, loading_only) {   
        if (loading_only == true) {
            $(element).addClass('loading');
        } else {
            $(element).addClass('disabled loading');
        }            
    };

    this.show = function(element) {
        $(element).show();
        $(element).removeClass('hidden');
        $(element).removeClass('invisible');     
        $(element).css('visibility','visible');
        $(element).css('opacity','1');
    };

    this.hide = function(element,placeholder) {
        if (placeholder == true) {
            $(element).css('opacity','0');
        } else {
            $(element).hide();
            $(element).addClass('hidden');
            $(element).removeClass('visible');
            $(element).css('visibility','hidden');
        }
    };
    
    this.getChecked = function(selector) {
        var selected = [];
        $(selector + ":checked").each(function(index) {
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

    this.selectAll = function(element, item_class, icon_selector) {
        item_class = getDefaultValue(item_class,'.selected-row');
        icon_selector = getDefaultValue(icon_selector,'#all_icon');

        var value = $(element).attr('data-value');
        if (value == 'select') {
            $(item_class).prop('checked',true);               
            $(element).attr('data-value','unselect');
            $(icon_selector).addClass('check');
        } else{
            $(icon_selector).removeClass('check');               
            $(item_class).prop('checked',false);
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
    var on_content_ready = null;
    var loader = '';
    var default_loader = '<div class="ui active blue centered loader"></div>';
    var default_language = '';
    var language;

    this.setLoader = function(loader_code) {
        loader = loader_code
    };

    this.getLoader = function() {     
        return (isEmpty(loader) == true) ? default_loader : loader;
    };

    this.onContentReady = function(callback) {
        on_content_ready = callback;
    };

    this.onReady = function(callback) {        
        $(document).ready(callback);
    };

    this.reload = function() {
        location.reload(true);
    };

    this.getProperty = function(property_name) {
        var data = components[component_name];
        return (isJSON(data) == true) ? JSON.parse(components[component_name]) : false;        
    };

    this.getPageName = function() {
        return name;
    };

    this.hasLib = function(lib_name) {
        return (properties.library.indexOf(lib_name) > 0) ? true : false;           
    };

    this.setProperties = function(params) {            
        name = params.name;
        properties = params; 
        default_language = params.default_language;   
        language = params.language;
        return true;
    };

    this.removeLoader = function(selector) {
        selector = getDefaultValue(selector,'#loader');
        $(selector).remove();
    };

    this.showLoader = function(element,loader, append) {
        append = getDefaultValue(append,false);
        loader = getDefaultValue(loader,this.getLoader());     
    
        $(element).append(loader);
        $('#loader').dimmer({});
    };

    this.setContent = function(element,content) {
        $(element).html(content);
    };

    this.replaceContent = function(element,content) {
        $(element).replaceWith(content);
    };
    
    this.loadProperties = function(name,onSuccess,onError) {
        name = getDefaultValue(name,'');  
        arikaim.log('Load page properties: ' + name);
        arikaim.get('/core/api/ui/page/properties/' + name,function(result) {          
            self.setProperties(result.properties);                     
            self.setLoader(getValue('properties.loader',result,''));
            arikaim.log('Page properties loaded!');
            callFunction(onSuccess,result);
        },function(errors) {
            arikaim.log('Error loading page properties: ' + name);
            callFunction(onError,errors);
        });
    };

    this.loadContent = function(params,onSuccess,onError) {       
        var component_name = getValue('component',params,'no-name');       
        var component_params = getValue('params',params,'');
        var element_id = getValue('id',params);
        var element = getValue('element',params);
        var loader = getValue('loader',params,null);
        var replace = getValue('replace',params,false);
        var use_header = getValue('use_header',params,false);
        var include_files = getValue('include_files',params,true);

        if (isEmpty(element_id) == false) {
            element = '#' + element_id;
        }
          
        this.showLoader(element,loader);
    
        arikaim.component.load(component_name,function(result) { 
            self.removeLoader(); 
            if (replace == false) {
                arikaim.page.setContent(element,result.html);
            } else {
                $(element).replaceWith(result.html);
            }
            callFunction(onSuccess,result);                       
        },function(errors) {
            // errors load component
            self.removeLoader();
            self.showErrorMessage(params,errors);
            callFunction(onError,errors);   
        },component_params,use_header,include_files);
    };

    this.showErrorMessage = function(params,errors) {
        var element_id = getValue('id',params);
        var element = getValue('element',params);
        var message = { message: errors[0] };
        
        if (isEmpty(element_id) == false) {
            element = '#' + element_id;
        }      
        arikaim.component.load('components:message.error',function(result) { 
            arikaim.page.setContent(element,result.html); 
        },null,message);
    };

    this.showSystemErrors = function(errors,element) {
        element = getDefaultValue(element,'.error');
        $(element + " ul").html("");
        this.show(element);
        if (isObject(errors) == true) {
            $.each(errors, function(key,value) {
                $(element + " ul").append("<li>" + value + "</li>");
            });  
        } else {
            $(element).append("<li>" + errors + "</li>");
        }
    };

    this.loadPage = function(name,onSuccess,onError) {    
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
function Component(prop) {
    
    var properties = {};

    this.getProperty = function(name) {
        return getObjectProperty(name,properties);
    };

    this.getProperties = function() {
        return properties;
    };

    this.setProperties = function(json_data) {
        if (isJSON(json_data) == true) {
            properties = JSON.parse(json_data);
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
   
    this.get = function(component_name) {
        return (isEmpty(components[component_name]) == false) ? components[component_name] : false;          
    };

    this.getAll = function() {
        return components;
    };

    this.set = function(component_name,component_properties) {
        var component = new Component(component_properties);
        components[component_name] = component;
    };

    this.resolveUrl = function(component_name,params) {
        var url = '/core/api/ui/component/' + component_name;
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

    this.loadContent = function(component_name,onSuccess,onError,params,use_header) {
        return this.load(component_name,onSuccess,onError,params,use_header,false);
    };
    
    this.loadProperties = function(component_name, params, onSuccess, onError) {        
        return arikaim.apiCall('/core/api/ui/component/properties/' + component_name,onSuccess,onError,params);      
    };

    this.loadDetails = function(component_name, params, onSuccess, onError) {    
        return arikaim.apiCall('/core/api/ui/component/details/' + component_name,onSuccess,onError,params);      
    };

    this.load = function(component_name,onSuccess,onError,params,use_header,include_files) {  
        if (isEmpty(include_files) == true) {
            include_files = true;
        }               
        var url = (use_header == true) ? this.resolveUrl(component_name,params) : this.resolveUrl(component_name,null);
       
        return arikaim.apiCall(url,'GET',params,function(result) {
            arikaim.component.set(component_name,result.properties);
            callFunction(onSuccess,result);
            if (include_files == true) {
                self.includeFiles(result,function(files_loaded) {   
                    // event
                    arikaim.log('component ' + component_name + ' loaded!');           
                },function(url) {
                    var name = url.split('/').pop();                   
                    // event
                });
            }
        },function(errors) {
            arikaim.log('Error loading component ' + component_name);
            callFunction(onError,errors);
        });
    };

    this.includeFiles = function(response,onSuccess,onFileLoaded) {
        var js_files  = response.js_files;
        var css_files = response.css_files;
        
        var files_count = 0;
        var loaded_files = 0;
    
        if (css_files != false) {
            files_count = files_count + css_files.length;
            css_files.forEach(function(file) {              
                arikaim.includeCSSFile(file.url);
                loaded_files++;
                if (loaded_files == files_count) {
                    callFunction(onSuccess,loaded_files);
                } 
            }, this);
        }

        if (isEmpty(js_files) == false) {
            var files = Object.values(js_files);
            files_count = files_count + files.length;
            
            files.forEach(function(file) {  
                if (isEmpty(file.params) == false) {
                    if (arikaim.findScript(file.url) == false) {                      
                        var async = (file.params.indexOf('async') > -1) ? true : false;
                        var crossorigin = (file.params.indexOf('crossorigin') > -1) ? 'anonymous' : null;
                        arikaim.loadScript(file.url,async,crossorigin);
                    }        
                } else {
                    arikaim.includeScript(file.url,function() {
                        loaded_files++;
                        callFunction(onFileLoaded,file.url);
                        if (loaded_files == files_count) {
                            callFunction(onSuccess,loaded_files);
                        }               
                    });
                }                                            
            }, this);
        }
        if (loaded_files == files_count) {
            callFunction(onSuccess,loaded_files);
        }
    };   
}

Object.assign(arikaim,{ ui: new ArikaimUI() });
Object.assign(arikaim,{ page: new Page() });
Object.assign(arikaim,{ component: new HtmlComponent() });