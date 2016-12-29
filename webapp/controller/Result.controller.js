sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel"
], function(Controller,JSONModel) {
	"use strict";

	return Controller.extend("com.silverline.ticariurun.controller.Result", {

			onInit: function() {
				var height = jQuery(window).height();
				height = height + "px";
				var panel = this.getView().byId("idPanel");
				panel.setHeight(height);
				this.getRouter().attachRoutePatternMatched(this._handleRouteMatched, this);
				var resultModel = new JSONModel({
					message : "",
					success : false,
					error : false
				});
				this.getView().setModel(resultModel,"result");
			},
			getRouter : function() {
				var oComponent = this.getOwnerComponent();
				return oComponent.getRouter();		
			},
			onNavBack : function () {
				var oRouter = this.getRouter();
				oRouter.navTo("talepformu", true);	
			},
			_handleRouteMatched : function (oEvent) {	
				var resultModel = this.getView().getModel("result");
				var sTalepNo = oEvent.getParameter("arguments").talepno;
				var sAction  = oEvent.getParameter("arguments").action;
				var sMessageText = "";
				if (sAction === "success" && sTalepNo) {	
					var sMessage = "";
					sMessageText = this.getBundleText("SuccessMessage");
					sMessage = sTalepNo + " " + sMessageText; 
					resultModel.setProperty("/success",true);
					resultModel.setProperty("/error",false);
				} else if (sAction === "approve") {
					sMessageText = this.getBundleText("ApproveMessage");
					sMessage = sTalepNo + " " + sMessageText;
					resultModel.setProperty("/success",true);
					resultModel.setProperty("/error",false);
				} else if (sAction === "revizyon") {
					sMessageText = this.getBundleText("RevizyonMessage");
					sMessage = sTalepNo + " " + sMessageText;
					resultModel.setProperty("/success",true);
					resultModel.setProperty("/error",false);
				} else {
					sMessageText = this.getBundleText("ErrorMessage");
					sMessage = sMessageText;
					resultModel.setProperty("/success",false);
					resultModel.setProperty("/error",true);
				}
				resultModel.setProperty("/message",sMessage);
			},
			getBundleText : function (sKey,sParameter1,sParameter2,sParameter3,sParameter4) {
				var i18nModel = this.getView().getModel("i18n");
				var oBundle = i18nModel.getResourceBundle();
				var sValue = oBundle.getText(sKey, [sParameter1,sParameter2,sParameter3,sParameter4]);	
				return sValue;
			}
	});

});