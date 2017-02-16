sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/odata/ODataModel",
	"sap/m/MessageToast",
	"sap/ui/Device",
	"sap/ui/core/format/DateFormat"
], function(JSONModel, ODataModel,MessageToast,Device,DateFormat) {
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
			var sFullName = "";
			var sUserId = "";
			if (sap.ushell) {
				var oUserInfo = sap.ushell.Container.getUser();
				sFullName = oUserInfo.getFullName();
				sUserId = oUserInfo.getId();
			}
			oModel.setProperty("/TalepEden",sUserId);
			oModel.setProperty("/Username",sUserId);
			var oDateFormat = DateFormat.getInstance({pattern: "dd.MM.yyyy", style: "short"});
			var sToday = oDateFormat.format(new Date());
			oModel.setProperty("/TalepTarihi",sToday); 
			var oTalepToMetinler = {};
			oModel.setProperty('/TalepToMetinler',oTalepToMetinler);			
			return oModel;
		},
		createBPMModel : function(oController,taskId) {
			
			var taskDataSvcURL = "/bpmodata/taskdata.svc/" + taskId;
			var taskDataODataModel = new ODataModel(taskDataSvcURL, true);
			
		    if (taskId != null) {
		    	taskDataODataModel.read(
		    			"/InputData", 
		    			null,
		    			{ 
		    				"$expand":"UrunTalebiType" 
		    			}, 		    			 
		    			false, 
						function(oData,oResponse) {
		    				var sTalepNumarasi = oData.results[0].UrunTalebiType.TalepNumarasi;
		    				var sTalepBasligi = oData.results[0].UrunTalebiType.TalepBasligi;
		    				var sCurrentStep = oData.results[0].UrunTalebiType.CurrentStep;
		    				var sCustomCurrentStep = jQuery.sap.getUriParameters().get("currentStep");
		    				if (sCustomCurrentStep) {
		    					sCurrentStep = sCustomCurrentStep; 
		    				}
							var bpmData = {
								TaskId : taskId,
								TalepNumarasi : sTalepNumarasi,
								currentStep : sCurrentStep,
								TalepBasligi : sTalepBasligi,
								refreshRequired : false
							};
							var bpmModel = new JSONModel(bpmData);
							var oComp = oController.getOwnerComponent();
							oComp.setModel(bpmModel, "bpm");
							oController.modifyScreen(sCurrentStep);
		    			},
						function(oError) {
							var sMessageError = this.getBundleText("ErrorMessage");
							MessageToast.show(sMessageError);
		    			}
		    	); 	    				
		    }
		},
		getBundleText : function (sKey,sParameter1,sParameter2,sParameter3,sParameter4) {
			var i18nModel = this.getView().getModel("i18n");
			var oBundle = i18nModel.getResourceBundle();
			var sValue = oBundle.getText(sKey, [sParameter1,sParameter2,sParameter3,sParameter4]);	
			return sValue;
		},
		createUIModel: function() {
			var sRootPath = jQuery.sap.getModulePath("com.silverline.ticariurun");   
			var oModel = new JSONModel(sRootPath+"/model/ui.json");
			oModel.setDefaultBindingMode("OneWay");
			return oModel;
		}

	};

});