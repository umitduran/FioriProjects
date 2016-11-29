sap.ui.define([
	"sap/ui/model/json/JSONModel"
], function(JSONModel) {
	"use strict";

	return {
		getSabitText: function(oModel,sPath,sKey) {
			if (!sKey) {
				return "";
			}
			var value = sKey;		 
			var collection = oModel.getProperty(sPath);
			jQuery.each(collection, function(arrkey,arrval) {
				if (arrval.key===sKey) {
					value = arrval.value;
					return false;
				}
			});	
			return value;
		}
	};

});