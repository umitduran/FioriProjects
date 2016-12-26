sap.ui.define([
	"sap/ui/core/mvc/Controller"
], function(Controller) {
	"use strict";

	return Controller.extend("com.silverline.ticariurun.controller.Result", {

			onInit: function() {
			
				var height = jQuery(window).height();
				height = height + "px";
				var panel = this.getView().byId("idPanel");
				panel.setHeight(height);
					//setTimeout(function () { window.close();}, 3000);
				//this.getRouter = sap.ui.core.UIComponent.getRouterFor(this);	
				this.getRouter().attachRoutePatternMatched(this._handleRouteMatched, this);
			},
			getRouter : function() {
				var oComponent = this.getOwnerComponent();
				return oComponent.getRouter();		
			},
			_handleRouteMatched : function (oEvent) {	
		
				var stalepno = oEvent.getParameter("arguments").talepno;
				var sAction  = oEvent.getParameter("name");
				if (sAction === "success" && stalepno !== undefined && stalepno !== null) {	
				this.getView().byId("idMessage").setText(stalepno + " numaralı talep yaratıldı!");
				}else{
					this.getView().byId("idSuccess").setVisible("false");
					this.getView().byId("idMessage").setText("Hata Olustu");	
				}
			}

		/**
		 * Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
		 * (NOT before the first rendering! onInit() is used for that one!).
		 * @memberOf com.silverline.ticariurun.view.Result
		 */
		//	onBeforeRendering: function() {
		//
		//	},

		/**
		 * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
		 * This hook is the same one that SAPUI5 controls get after being rendered.
		 * @memberOf com.silverline.ticariurun.view.Result
		 */
		//	onAfterRendering: function() {
		//
		//	},

		/**
		 * Called when the Controller is destroyed. Use this one to free resources and finalize activities.
		 * @memberOf com.silverline.ticariurun.view.Result
		 */
		//	onExit: function() {
		//
		//	}

	});

});