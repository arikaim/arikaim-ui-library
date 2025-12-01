

class Form {

    #rules;
    #selector;

    constructor(selector, rules) {
        this.#selector = selector;
        this.#rules = rules;
    }

    validate(action, onSuccess, onError) {
        var submitButton = this.findSubmitButton(selector);

        $(this.#selector).off();     
        $(this.#selector).unbind();

        $(this.#selector).on('submit',(event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            if (window.event && window.event.keyCode == 13) {
                // prevent default form submit 
                return false;
            }
             
            this.clearErrors();
            this.disable();
            arikaim.ui.disableButton(submitButton);
            var data = this.serialize();

            /** 
            if (self.validate(selector) == false) {    
                arikaim.ui.enableButton(submitButton);   
                self.enable();  
                self.showValidationErrors();
                callFunction(onError);               
            } else {
                // form is valid
                var actionResult = callFunction(action,data);
             
                if (isPromise(actionResult) == true) {                      
                    actionResult.then(function(result) {
                        arikaim.ui.enableButton(submitButton);                        
                        self.enable(); 
                        callFunction(onSuccess,result);
                    }).catch(function(errors) {                                          
                        if (isObject(errors) == true && isArray(errors) == false) {
                            errors = '';                         
                        }

                        arikaim.ui.enableButton(submitButton);                          
                        self.enable();                     
                        self.addFieldErrors(selector,errors);
                        
                        if (isEmpty(errors) == false) {
                            self.showErrors(errors);
                        }
                      
                        callFunction(onError,errors); 
                    });
                } else {
                    if (actionResult === false) {
                        arikaim.ui.enableButton(submitButton);    
                        callFunction(onError,data);
                    }                                    
                    if (actionResult === true || isEmpty(actionResult) == true) {
                        arikaim.ui.enableButton(submitButton);    
                        callFunction(onSuccess,data);
                    }
                }
            }
                */
        });
    };

    showValidationErrors() {       
        var message = $(this.#selector).find('.errors.message');
        if (isObject(message) == true) {
            arikaim.ui.show(message);
        }
    };

    clear() {
        $(this.#selector)[0].reset();
        $(this.#selector).trigger('reset');
        $(this.#selector).each(function() {  
            this.reset();
        }); 
        this.clearErrors();
    };

    populate(data) {
        $.each(data,function (key, value) {
            $('[name="' + key + '"]',this.#selector).val(value);
        });
    };

    clearErrors() {
        console.log('clear errors');
    }

    serialize(replaceFields) {
        var data = $(this.#selector).serializeArray();
        if (isEmpty(replaceFields) == true) {
            return data;
        }
        Object.entries(replaceFields).forEach(function(item) {           
            data = self.replaceValue(data,item[0],item[1]);
        });

        return data;
    };

    disable(cssClass) {
        cssClass = getDefaultValue(cssClass,'disabled'); 
        $(this.#selector).children().addClass(cssClass);
    };

    enable(cssClass) {
        cssClass = getDefaultValue(cssClass,'disabled'); 
        $(this.#selector).children().removeClass(cssClass);
    };
}
