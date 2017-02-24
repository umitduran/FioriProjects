sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/Device",
	"com/silverline/ticariurun/model/models"
], function(UIComponent, Device, models) {
	"use strict";

	return UIComponent.extend("com.silverline.ticariurun.Component", {

		metadata: {
			manifest: "json"
		},

		/**
		 * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
		 * @public
		 * @override 
		 */
		init: function() {
			// call the base component's init function
			UIComponent.prototype.init.apply(this, arguments);
			
			// set the device model
			this.setModel(models.createDeviceModel(), "device");
			
			//sabit değerleri oku
			this.setModel(models.createSabitModel(), "sabit");
			
			//ui konfigürasyonu
			this.setModel(models.createUIModel(), "ui");
			
			this.setModel(models.createMainModel());
			
			// create the views based on the url/hash
			this.getRouter().initialize();			
			
			if (!String.prototype.endsWith) {
			  String.prototype.endsWith = function(searchString, position) {
			      var subjectString = this.toString();
			      if (typeof position !== 'number' || !isFinite(position) || Math.floor(position) !== position || position > subjectString.length) {
			        position = subjectString.length;
			      }
			      position -= searchString.length;
			      var lastIndex = subjectString.lastIndexOf(searchString, position);
			      return lastIndex !== -1 && lastIndex === position;
			  };
			}			
		},
		getContentDensityClass : function() {
		      if (this._sContentDensityClass === undefined) {
		             // check whether FLP has already set the content density class; do nothing in this case
		             if (jQuery(document.body).hasClass("sapUiSizeCozy") || jQuery(document.body).hasClass("sapUiSizeCompact")) {
		                   this._sContentDensityClass = "";
		             } else {
		                    // Store "sapUiSizeCompact" or "sapUiSizeCozy" in this._sContentDensityClass, depending on which modes are supported by the app.
		                    // E.g. the “cozy” class in case sap.ui.Device.support.touch is “true” and “compact” otherwise.
		                    this._sContentDensityClass = "sapUiSizeCompact";
		             }
		      }
		      return this._sContentDensityClass;
		}		
	});

});