sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"sap/ui/Device",
	"sap/ui/core/format/DateFormat"
], function(JSONModel, Device,DateFormat) {
	"use strict";

	return {

		createDeviceModel: function() {
			var oModel = new JSONModel(Device);
			oModel.setDefaultBindingMode("OneWay");
			return oModel;
		},
		createSabitModel: function() {
			var sRootPath = jQuery.sap.getModulePath("com.silverline.ticariurun");   
			var oModel = new JSONModel(sRootPath+"/model/sabit.json");
			oModel.setDefaultBindingMode("OneWay");
			return oModel;
		},
		createMainModel: function() {
			var oModel = new JSONModel();
			oModel.setProperty("/TalepEden","Abdulbasit Gülşen");
			var oDateFormat = DateFormat.getInstance({pattern: "dd.MM.yyyy", style: "short"});
			var sToday = oDateFormat.format(new Date());
			oModel.setProperty("/TalepTarihi",sToday); 
			return oModel;
		},
		createUIModel: function() {
			var sRootPath = jQuery.sap.getModulePath("com.silverline.ticariurun");   
			var oModel = new JSONModel(sRootPath+"/model/ui.json");
			oModel.setDefaultBindingMode("OneWay");
			return oModel;
		}

	};

});