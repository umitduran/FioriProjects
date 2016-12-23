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
			oModel.setProperty("/TalepEden","Abdulbasit Gülşen");
			oModel.setProperty("/Username","DEVELOPER3");
			var oDateFormat = DateFormat.getInstance({pattern: "dd.MM.yyyy", style: "short"});
			var sToday = oDateFormat.format(new Date());
			oModel.setProperty("/TalepTarihi",sToday); 
			var oTalepToMetinler = {};
			oModel.setProperty('/TalepToMetinler',oTalepToMetinler);			
			return oModel;
		},
		createBPMModel : function(oView,taskId) {
			
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
		    				var sCurrentStep = oData.results[0].UrunTalebiType.CurrentStep;
							var bpmData = {
								TaskId : taskId,
								TalepNumarasi : sTalepNumarasi,
								currentStep : sCurrentStep
							};
							var bpmModel = new JSONModel(bpmData);
							oView.setModel(bpmModel, "bpm");
		    			},
						function(oError) {
							//FIXME resource bundle'dan hata mesajı getirilecek.
							MessageToast.show("Hata oluştu!");
		    			}
		    	); 	    				
		    }
		},
		createUIModel: function() {
			var sRootPath = jQuery.sap.getModulePath("com.silverline.ticariurun");   
			var oModel = new JSONModel(sRootPath+"/model/ui.json");
			oModel.setDefaultBindingMode("OneWay");
			return oModel;
		}

	};

});