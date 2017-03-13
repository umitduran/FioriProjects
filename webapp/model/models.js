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

			var sGetCurrentUserUrl = "/lib~bpmapi/TaskUtil?service=currentuser";
			var oGetCurrentUserModel = new JSONModel(sGetCurrentUserUrl);
			oGetCurrentUserModel.attachRequestCompleted(function(oResponseModel) {
				var sUsername = oResponseModel.getSource().getProperty("/username");
				oModel.setProperty("/BPMUsername",sUsername);
			});
			oModel.setProperty('/TalepToMetinler',oTalepToMetinler);			
			return oModel;
		},
		createBPMModel : function(oController,taskId) {
			var sUserId = "";
			if (sap.ushell) {
				var oUserInfo = sap.ushell.Container.getUser();
				sUserId = oUserInfo.getId();
			}			
			var taskDataSvcURL = "/bpmodata/taskdata.svc/" + taskId;
			var taskDataODataModel = new ODataModel(taskDataSvcURL, true);
			if (taskId != null) {
				var sValidateUrl = "/lib~bpmapi/TaskUtil?service=validate&taskid="+taskId;
				var oValidateBPMModel = new JSONModel(sValidateUrl);
				oValidateBPMModel.attachRequestCompleted(function(oResponseModel) {
					var sStatus = oResponseModel.getSource().getProperty("/status");
					if (sStatus ==="ERROR") {
						var sErrorMessageStatusEmpty = oController._getBundleText("ErrorMessageStatusEmpty");
						MessageToast.show(sErrorMessageStatusEmpty);	
						return;
					}
					if ( sStatus !=="READY" &&
					     sStatus !=="RESERVED") {
						var sErrorMessageTaskProcessed = oController._getBundleText("ErrorMessageTaskProcessed");
						MessageToast.show(sErrorMessageTaskProcessed);						     	
						return;
					}
					var sOwnerNames = oResponseModel.getSource().getProperty("/owner");
					if (sOwnerNames.toUpperCase().indexOf(sUserId.toUpperCase())<0) {
						var sErrorMessageTaskNotAuthorized = oController._getBundleText("ErrorMessageTaskNotAuthorized");
						MessageToast.show(sErrorMessageTaskNotAuthorized);						     	
						return;
					}
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
								oController.onBPMModelLoaded();
			    			},
							function(oError) {
								var sMessageError = oController._getBundleText("ErrorMessage");
								MessageToast.show(sMessageError);
			    			}
			    	); 					
				});
	    				
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