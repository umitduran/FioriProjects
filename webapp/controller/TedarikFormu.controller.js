sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/routing/History",
	"sap/m/MessageToast",
	"sap/ui/model/json/JSONModel",
	"com/silverline/ticariurun/util/common"
], function(Controller, History, MessageToast, JSONModel, Common) {
	"use strict";

	return Controller.extend("com.silverline.ticariurun.controller.TedarikFormu", {

		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf com.silverline.ticariurun.view.TedarikFormu
		 */
			onInit: function() {
				var oView = this.getView();
				var oComp = this.getOwnerComponent();
				oView.addStyleClass(oComp.getContentDensityClass());
				var mainModel = oComp.getModel();
				

			},
			onNavBack: function () {
				var oHistory = History.getInstance();
				var sPreviousHash = oHistory.getPreviousHash();
	
				if (sPreviousHash !== undefined) {
					window.history.go(-1);
				} else {
					var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
					oRouter.navTo("talepformu", true);
				}
				this.handleOdemeSekliTedarikValueHelp();
				this.handleTeslimSekliTedarikValueHelp();
			},	
			_updateIconColor : function(idTab,state)  {
				var oIconTab = this.getView().byId(idTab);			
				if (oIconTab) {
					var sColor = "Positive";
					if (!state) {
						sColor = "Negative";
					} 
					oIconTab.setIconColor(sColor);
				}
			},
			_validateForm : function(sFormId) {
				var oMainModel = this.getView().getModel();
				var oUIModel = this.getView().getModel("ui");
				var oMainForm = this.getView().byId(sFormId);
				var oDummyModel = new JSONModel();
				return Common.validateAll(oMainForm,oUIModel,oDummyModel,oMainModel);
			},
			_onBeforeKaydet : function () {
				var bResult1 = this._validateForm("idUrunOzellikTedarikForm");
				this._updateIconColor("idUrunOzellikTedarikTab", bResult1);
				var bResult2 = this._validateForm("idGenelBilgilerTedarikForm");
				this._updateIconColor("idGenelBilgilerTedarikTab", bResult2);
				return bResult1 && bResult2;
			},
			onUrunOnay : function () {
				var oModel = this.getView().getModel();
				var result = this._onBeforeKaydet();
				if (!result) {
				MessageToast.show("Tüm zorunlu alanları doldurun!");
				return;
				}
				
				
			},
			handleOdemeSekliTedarikValueHelp : function(oEvent) {
				var oModel = this.getView().getModel("genel");
				var textEl = this.getView().byId("idOdemeSekliAdi");
				Common.handleValueHelp(this,oEvent.getSource(),textEl,"OdemeKosuluKodu","OdemeKosuluAciklamasi",oModel,"/OdemeKosuluSet",this.getView(),"Ödeme Şekli");
			},
		
			handleTeslimSekliTedarikValueHelp : function(oEvent) {
				var oModel = this.getView().getModel("genel");
				var textEl = this.getView().byId("idTeslimSekliAdi");
				Common.handleValueHelp(this,oEvent.getSource(),textEl,"TeslimSekliKodu","TeslimSekliAciklamasi",oModel,"/TeslimSekliSet",this.getView(),"Teslim Şekli");
			}

		/**
		 * Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
		 * (NOT before the first rendering! onInit() is used for that one!).
		 * @memberOf com.silverline.ticariurun.view.TedarikFormu
		 */
		//	onBeforeRendering: function() {
		//
		//	},

		/**
		 * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
		 * This hook is the same one that SAPUI5 controls get after being rendered.
		 * @memberOf com.silverline.ticariurun.view.TedarikFormu
		 */
		//	onAfterRendering: function() {
		//
		//	},

		/**
		 * Called when the Controller is destroyed. Use this one to free resources and finalize activities.
		 * @memberOf com.silverline.ticariurun.view.TedarikFormu
		 */
		//	onExit: function() {
		//
		//	}

	});

});