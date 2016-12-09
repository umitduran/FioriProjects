/* eslint-disable no-console */
sap.ui.define([
], function() {
	"use strict";
	return {
	checkRequired : function (src) {
		var metadata = src.getMetadata();
		var type = metadata.getName();		
		var valueStateExceptions = ['sap.m.Table','sap.m.UploadCollection'];
		var value = "";
		if (type==="sap.m.ComboBox") {
			value = src.getSelectedKey(); 
		} else if (type==="sap.m.Input" || type==="sap.m.DatePicker") {
			value = src.getValue();
			if (!value) {
				value = src.getProperty("value");
			}
		} else if (type==="sap.m.MultiInput") {
			if (src.getTokens().length>0) {
				value = src.getTokens()[0].getText();
			}
			value = src.getTokens().length;
		} else if (type==="sap.m.MultiComboBox") {
			var selected = src.getSelectedItems();
			if (selected.length>0) {
				value = selected.length;
			}
		} else if (type==="sap.m.Table") {
			var items = src.getBinding("items");
			var length = items.getLength();
			if (length>0) {
				value = true;
			} else {
				value = false;
			}
		} else if (type==="sap.m.UploadCollection") {
			var ucitems = src.getItems();
			var uclength = ucitems.length;
			if (uclength>0) {
				value = true;
			} else {
				value = false;
			}
		}
		if (!value) {			
			if (valueStateExceptions.indexOf(type)<0) {
				src.setValueState(sap.ui.core.ValueState.Error);
				src.setValueStateText("Zorunlu Alan");
			} else {				
				if (type==="sap.m.Table") {
					src.setNoDataText("Zorunlu Alan");
					src.setShowNoData(true);
				} else if (type==="sap.m.UploadCollection") {
					src.setNoDataText("Zorunlu Alan");
				}
			}
			return false;
		} else {
			if (valueStateExceptions.indexOf(type)<0) {
				src.setValueState(sap.ui.core.ValueState.None);
				src.setValueStateText("");
			} else {
				if (type==="sap.m.Table") {
					src.setNoDataText("");
					src.setShowNoData(false);
				} else if (type==="sap.m.UploadCollection") {
					src.setNoDataText("");
				}
			}
			return true;
		}
	},
	getRequired : function (src) {
		var id = src.getId();
		if (id.endsWith(".Text")) {
			id = id.replace(".Text","");
		}
		var labelId = id + "Label";
		var label = sap.ui.getCore().byId(labelId);
		var required = false;
		if (label) {
			required = label.getRequired();
		}
		return required;
	},	
	updateForm : function (frm,uimodel,bpmModel,mainModel) {
		var that = this;
		var currentStep = "";
		if (bpmModel) {
			currentStep = bpmModel.getProperty("/currentStep");		
		}
		if (currentStep===undefined || currentStep==="") {
			currentStep = mainModel.getProperty("/data/CurrentStep");
		}
		if (currentStep==="Yeni") {
			currentStep = "MT1";
		} else if (currentStep==="") {
			currentStep = "XX";
		}
		//frm panel veya simpleform oldugu zaman calisiyor. 
		var content = frm.getContent();
		//var uimodel = sap.ui.getCore().getModel("uimodel");
		var uidata = uimodel.getData();
		var skip = ['sap.ui.core.Title','sap.m.ToolbarSpacer'];
		var requiredElements = ['sap.m.Label'];
		var editableElements = ['sap.m.ComboBox','sap.m.Input','sap.m.MultiComboBox','sap.m.MultiInput','sap.m.TextArea','sap.m.CheckBox','sap.m.DatePicker'];
		var editableTableElements = ['sap.m.Table'];
		var editableListElements = ['sap.m.List'];
		var editableUploadCollectionElements = ['sap.m.UploadCollection'];
		var visibleElements = ['sap.m.ComboBox','sap.m.Input','sap.m.MultiComboBox','sap.m.MultiInput','sap.m.Table','sap.m.Button','sap.m.Panel','sap.m.TextArea','sap.m.CheckBox','sap.m.DatePicker'];
		jQuery.each(content,function(key,el) {
			var processed = false;
			var type = el.getMetadata().getName();
			if (skip.indexOf(type)>=0) {
				return true;
			}
			var id = el.getId();
			var idx1 = id.indexOf("-__");
			if (idx1>0) {
				id = id.split("-__")[0];
			}
			var idx2 = id.indexOf("--");
			if (idx2>0) {
				id = id.substring(id.indexOf("--")+4);
			} else {
				id = id.substring(2);
			}
			if (id.endsWith('Label')) {
				id = id.replace('Label','');
			}
			var uiObj = that._generateUIObj(uidata,id,currentStep);			
			
			if (requiredElements.indexOf(type)>=0) {
				var required = that.evaluateCondition(uiObj,"required",mainModel);
				el.setRequired(required);
				processed = true;
			}			
			if (editableElements.indexOf(type)>=0) {
				var editable = that.evaluateCondition(uiObj,"editable",mainModel);
				el.setEditable(editable);
				processed = true;
			}			
			if (visibleElements.indexOf(type)>=0) {
				var visible = that.evaluateCondition(uiObj,"visible",mainModel);
				el.setVisible(visible);
				processed = true;
			}		
			if (editableTableElements.indexOf(type)>=0) {
				var teditable = that.evaluateCondition(uiObj,"editable",mainModel);
				var toolbar = el.getHeaderToolbar();
				if (!teditable) {
					if (toolbar!==undefined) {
						toolbar.setVisible(editable);
					}
					var columns = el.getColumns();
					var items = el.getItems();
					if (items.length>0) {
						var cells = items[0].getCells();					
						jQuery.each(cells,function(arrkey,cell) {
							var ctype = cell.getMetadata().getName();
							if (ctype==="sap.m.Button") {
								columns[arrkey].setVisible(editable);
							}
						});
					}
				}
				processed = true;
			}
			if (editableListElements.indexOf(type)>=0) {
				var leditable = that.evaluateCondition(uiObj,"editable",mainModel);
				var ltoolbar = el.getHeaderToolbar();
				if (!leditable) {
					if (ltoolbar!==undefined) {
						ltoolbar.setVisible(editable);
					}
					el.setMode(sap.m.ListMode.None);
				}
				processed = true;
			}
			
			if (editableUploadCollectionElements.indexOf(type)>=0) {
				var uceditable = that.evaluateCondition(uiObj,"editable",mainModel);
				if (!uceditable) {
					el.setUploadEnabled(false);
					var elitems = el.getItems();
					jQuery.each(elitems, function(arrkey,val) {
						val.setVisibleDelete(false);	
					});					
				}
				processed = true;
			}
			if (!processed) {
				console.log('common.js updateForm:Attribute update  for '+type+' is not implemented!');
			}
		});
	},
	_generateUIObj : function (uidata,id,currentStep) {
		var uiObj = {};
		uiObj.conditions = [];
		if (uidata[id]===undefined && uidata["DEFAULT"]===undefined) {
				return true;
		} else {				
			var props = ["required","visible","editable"];
			props.forEach(function(prop) {
				if (uidata[id]!==undefined && 
				    uidata[id][currentStep]!==undefined &&
				    uidata[id][currentStep][prop]!==undefined) {
					uiObj[prop] = uidata[id][currentStep][prop];
				} else if (uidata[id]!==undefined && 
						   uidata[id][prop]!==undefined) {
					uiObj[prop] = uidata[id][prop];
				} else if (uidata["DEFAULT"][prop]) {
					uiObj[prop] = uidata["DEFAULT"][prop];
				}				
			});
			if (uidata[id]!==undefined) {
				if (uidata[id][currentStep] !== undefined &&
				    uidata[id][currentStep].conditions!==undefined) {
					jQuery.merge(uiObj.conditions,uidata[id][currentStep].conditions);				
				}
				if (uidata[id].conditions!==undefined) {
					jQuery.merge(uiObj.conditions,uidata[id].conditions);
				}
				if (uidata[id]===undefined &&
					uidata["DEFAULT"].conditions!==undefined) {
					jQuery.merge(uiObj.conditions,uidata["DEFAULT"].conditions);
				}
			}
			/*
			if (uidata[id]==undefined) {
				if (uidata["DEFAULT"].conditions!=undefined) {
					uiObj.conditions = uidata["DEFAULT"].conditions;
				}
			} else if (uidata[id][currentStep] != undefined &&
			    uidata[id][currentStep].conditions!=undefined) {
				uiObj.conditions = uidata[id][currentStep].conditions; 
			} else if (uidata[id].conditions!=undefined) {
				uiObj.conditions = uidata[id].conditions;
			}
			*/
		}
		return uiObj;
	},
	_getCleanId : function(el) {
		var id = el.getId();		
		var idx1 = id.indexOf("-__");
		if (idx1>0) {
			id = id.split("-__")[0];
		}
		var idx2 = id.indexOf("--");
		if (idx2>0) {
			id = id.substring(id.indexOf("--")+4);
		} else {
			id = id.substring(2);
		}			
		return id;
	},
	_getCurrentStep : function(bpmModel,mainModel) {
		var currentStep = bpmModel.getProperty("/currentStep");		
		if (currentStep===undefined || currentStep==="") {
			currentStep = mainModel.getProperty("/data/CurrentStep");
		}						
		
		if (currentStep==="Yeni") {
			currentStep = "MT1";
		}
		return currentStep;
	},
	validateUploadCollection : function(uc,uimodel,bpmModel,mainModel) {
		var uidata = uimodel.getData();
		var id = this._getCleanId(uc);
		var currentStep = this._getCurrentStep(bpmModel);
		var validate = true;
		var uiObj = this._generateUIObj(uidata,id,currentStep);
		//var required = this.isRequired(uiObj);
		var required = this.evaluateCondition(uiObj,"required",mainModel);
		if (required) {			
			var result = this.checkRequired(uc);
			if (!result) {
				validate = false;
				console.log(id+' is required!');
			}
		}	
		return validate;
	},
	validateAll : function (frm,uimodel,bpmModel,mainModel) {
		
		var that = this;
		
		var currentStep = that._getCurrentStep(bpmModel,mainModel);
		
		that.updateForm(frm,uimodel,bpmModel,mainModel);
		var content = frm.getContent();
		var validate = true;
		//var uimodel = sap.ui.getCore().getModel("uimodel");
		var uidata = uimodel.getData();
		var skip = ['sap.ui.core.Title','sap.m.Label'];
		var run = ['sap.m.ComboBox','sap.m.Input','sap.m.MultiComboBox','sap.m.MultiInput','sap.m.Table','sap.m.DatePicker','sap.m.TextArea'];
		content.forEach(function(el){			
			var type = el.getMetadata().getName();
			if (skip.indexOf(type)>=0) {
				return;
			}
			if (run.indexOf(type)>=0) {
				var id = that._getCleanId(el);	
				
				var uiObj = that._generateUIObj(uidata,id,currentStep); 
				
				var required = that.evaluateCondition(uiObj,"required",mainModel);
				type = el.getMetadata().getName();
				if (required) {			
					var result = that.checkRequired(el);
					if (!result) {
						validate = false;
						console.log(id+' is required!');
					}
				} else if (type !== 'sap.m.Table') {
					if (el.getValueState() === sap.ui.core.ValueState.Error) {					
						el.setValueState(sap.ui.core.ValueState.None);
					}					
				} else {					
					el.setNoDataText("");
					el.setShowNoData(false);					
				}			
			} else {
				
				console.log('common.js validateAll:Validation for '+type+' is not implemented!');
			}
		});
		return validate;
	},
	evaluateCondition : function(value,attr,mainModel) {
		if ((typeof value[attr])==="boolean") {
			return value[attr];
		}		
		var result = false;
		jQuery.each(value.conditions, function(key,cond) {
			var fval = mainModel.getProperty(cond.field);
			if (fval===undefined && cond.field !=='') {
				console.log(cond.field+' not found in the data model!');
				return false;
			}				
			if (fval!==null) {
				fval = fval.toLowerCase();
			}
			cond.value = cond.value.toLowerCase();
			if (cond.option==="EQ") {
				if (fval===cond.value) {
					result = cond.attributes[attr];
					if (result!==undefined) {
						return false;
					}
				}
			} else if (cond.option==="NE") {
				if (fval!==cond.value) {
					result = cond.attributes[attr];
					if (result!==undefined) {
						return false;
					}
				}
			} else if (cond.option==="CT") {
				if (fval.indexOf(cond.value)>=0) {
					result = cond.attributes[attr];
					if (result!==undefined) {
						return false;
					}
				}
			} else if (cond.option==="NC") {
				if (fval.indexOf(cond.value)<0) {
					result = cond.attributes[attr];
					if (result!==undefined) {
						return false;
					}
				}
			} else if (cond.option==="ELSE") {
				result = cond.attributes[attr];
				if (result!==undefined) {
					return false;
				}
			}				
		});
		return result;		
	},
	handleValueHelp : function(controller,inputEl,textEl,keyProp,valueProp,model,path,view,title,valueChanged) {
        var itemTemplate = new sap.m.StandardListItem({
            title: "{"+valueProp+"}",
            info: "{"+keyProp+"}"
        });
        if (this._valueHelpDialog===undefined) {
        	this._valueHelpDialog = {};
        }
        var valueHelpDialogId = path + inputEl.getId();
		if (!this._valueHelpDialog[valueHelpDialogId]) {

            var selectDialog = new sap.m.SelectDialog({
                title : title,
                noDataText : '',
                search : function(evt) {
                    var sValue = evt.getParameter("value");
                    if (sValue==="") {
                    	evt.getSource().getBinding("items").filter([]);
                    	return;
                    }
                    var oFilter1 = new sap.ui.model.Filter(
                        valueProp,
                        sap.ui.model.FilterOperator.Contains, sValue
                    );
                    var oFilter2 = new sap.ui.model.Filter(
                        keyProp,
                        sap.ui.model.FilterOperator.Contains, sValue
                    );
                    var oFilter = new sap.ui.model.Filter({filters:[oFilter1,oFilter2],and:false});

                    evt.getSource().getBinding("items").filter(oFilter);
                },
                confirm : function(evt) {
                	var aContexts = evt.getParameter("selectedContexts");
                	var obj = aContexts[0].getObject();                	
                	var type = inputEl.getMetadata().getName();
                	if (type==="sap.m.MultiInput") {
                		var bFound = false;
						jQuery.each(inputEl.getTokens(),function(key,el) {
							var tokenKey = el.getKey();                		
                			if (tokenKey===obj[keyProp]) {
                				bFound = true;
                				return false;
                			}
						});
						if (!bFound) {
	                		var oToken = new sap.m.Token({key: obj[keyProp], text: obj[valueProp]});
	                		inputEl.addToken(oToken);
						}
                	} else {
                		inputEl.setValue(obj[keyProp]);
                	}                	
                	if (textEl && textEl!=="") {
                		textEl.setValue(obj[valueProp]);
                	}
                	evt.getSource().getBinding("items").filter([]);
                	if (typeof controller.updateForms === "function") {
                		controller.updateForms();
                	}
                	if (valueChanged) { 
                		valueChanged(inputEl);
                	}
                }
            });            
            this._valueHelpDialog[valueHelpDialogId] = selectDialog;

            view.addDependent(this._valueHelpDialog[valueHelpDialogId]);
            
            this._valueHelpDialog[valueHelpDialogId].setModel(model);
            this._valueHelpDialog[valueHelpDialogId].bindAggregation("items", path, itemTemplate);

        }

        this._valueHelpDialog[valueHelpDialogId].open();		
	},
	dateFormat: function(val) {
		if (!val || val.length<10) {
			return val;
		}
		return val.substring(8,10) + '-' + val.substring(5,7) + '-' + val.substring(0,4);
	},
	
	timeFormat: function(val) {
		return val.replace('PT','').replace('H',':').replace('M',':').replace('S','');
	},
	
	compareDate : function(date1,date2,checkTime) {
	//date1 ile date2 karşılatırılır, date1>=date2 ise true, değilse false döner
	//checkTime parametresi true ise saati de karşılaştırır, false ise saati dikkate almaz
		if (!checkTime) {
			date1.setHours(0,0,0,0);
			date2.setHours(0,0,0,0);
		}
		if (date1 >= date2) {
			return true;
		} else {
			return false;
		}

	
	
	}
	
};
});