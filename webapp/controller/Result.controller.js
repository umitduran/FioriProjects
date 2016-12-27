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
			_handleRouteMatched : function (oEvent) {	
				//FIXME Hata mesajları I18N den alınacak şekilde düzenlenecek.
				// var bModel = oController.getView().getModel("i18n");
				// var oBundle = bModel.getResourceBundle();		    	
				// var sMessage = oController.getBundleText("TalepSavedWithBPM",sTalepNumarasi);
				// MessageBox.success(sMessage);
				
				var resultModel = this.getView().getModel("result");
				var sTalepNo = oEvent.getParameter("arguments").talepno;
				var sAction  = oEvent.getParameter("arguments").action;
				var sMessage = "";
				if (sAction === "success" && sTalepNo) {	
					sMessage = sTalepNo + " numaralı talep yaratıldı!";
					resultModel.setProperty("/success",true);
					resultModel.setProperty("/error",false);
				} else if (sAction === "approve") {
					sMessage = "Talep onaylandı ve bir sonraki adıma iletildi!";
					resultModel.setProperty("/success",true);
					resultModel.setProperty("/error",false);
				} else if (sAction === "revizyon") {
					sMessage = "Talep revizyona gönderildi!";
					resultModel.setProperty("/success",true);
					resultModel.setProperty("/error",false);
				} else {
					sMessage = "Hata Olustu!";
					resultModel.setProperty("/success",false);
					resultModel.setProperty("/error",true);
				}
				resultModel.setProperty("/message",sMessage);
			}
	});

});