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
	
				this.getRouter().attachRoutePatternMatched(this._onRouteMatched, this);
		
			},
			getRouter : function() {
				var oComponent = this.getOwnerComponent();
				return oComponent.getRouter();		
			},		
			onBeforeRendering : function() {
				var uiModel = this.getView().getModel("ui");				
				var oTest = uiModel.getProperty("/DEFAULT");
				if (oTest===undefined) {
					var oController = this;
					uiModel.attachRequestCompleted(function(oEvent){
						oController._updateForms(this._action);
					});					
				} else {
					this._updateForms(this._action);
				}
			},				
			_onRouteMatched : function(oEvent) {
				var oController = this; 
				var oView = this.getView();
				var oMainModel = oView.getModel();
				var sRouteName = oEvent.getParameter("name");
				var oModel = new JSONModel();
				if (sRouteName==="tedarikformu") {
					var sItemNo = oEvent.getParameter("arguments").itemno;
					var sAction = oEvent.getParameter("arguments").action; 
					
					var oData = oMainModel.getData();
					var sUrunGorseli = oData.TedarikCollection[sItemNo].UrunGorseli;
					var oImage = oView.byId("idGorselImageTedarik");
					oImage.setSrc("/logo~ui~talep/DownloadServlet?id="+sUrunGorseli);
					
					oController._action = sAction;
					if (!sItemNo && sItemNo==='')  {
						oView.setModel(oModel,"tedarik");
					} else {
						
						var oTedarikData = oMainModel.getProperty("/TedarikCollection/"+sItemNo);
						oModel.setData(oTedarikData);
						oView.setModel(oModel,"tedarik");
						
						var sTedarikNumarasi = oTedarikData.TedarikNumarasi;
						if (sTedarikNumarasi) {	
							var i18nModel = this.getView().getModel("i18n");
							var oBundle = i18nModel.getResourceBundle();
							var sText = "("+sTedarikNumarasi+")";
							var sTitle = oBundle.getText("TedarikFormuTitle", [sText]);
							var oPage = this.getView().byId("idTedarikFormuPage");
							oPage.setTitle(sTitle);
						}
						
					}
					oController._updateForms(oController._action);
				} else if (sRouteName==="tedarikformuekle") {
					oController._action = "";
					oModel.setProperty("/Metinler",{});
					oModel.setProperty("/Metinler/OdemeKosuluAciklamasi","");
					oModel.setProperty("/Metinler/TeslimSekliAciklamasi","");
					oView.setModel(oModel,"tedarik");
					oController._updateForms(oController._action);
				}
			},				
			onNavBack: function () {
				var oUrunOzellikForm = this.getView().byId("idUrunOzellikTedarikForm");
				var oGenelBilgilerForm = this.getView().byId("idGenelBilgilerTedarikForm");
				Common.resetFormValidation(oUrunOzellikForm);
				Common.resetFormValidation(oGenelBilgilerForm);
				var oModel = this.getView().getModel();
				oModel.setProperty('/refreshRequired',"noChange");
				var oRouter = this.getRouter();
				this._updateIconColor("idUrunOzellikTedarikTab", true);
				this._updateIconColor("idGenelBilgilerTedarikTab", true);
				oRouter.navTo("talepformu", true);
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
			_updateForms : function(sAction) {
				this._updateForm("idUrunOzellikTedarikForm",sAction);
				this._updateForm("idGenelBilgilerTedarikForm",sAction);		
			},
			_updateForm : function(sFormId,sAction) {
				var oMainModel = this.getView().getModel();
				var oUIModel = this.getView().getModel("ui");
				var oMainForm = this.getView().byId(sFormId);
				var bpmModel = this.getView().getModel("bpm");
				Common.updateForm(oMainForm,oUIModel,bpmModel,oMainModel,sAction);
			},
			_onBeforeKaydet : function () {
				var bResult1 = this._validateForm("idUrunOzellikTedarikForm");
				this._updateIconColor("idUrunOzellikTedarikTab", bResult1);
				var bResult2 = this._validateForm("idGenelBilgilerTedarikForm");
				this._updateIconColor("idGenelBilgilerTedarikTab", bResult2);
				return bResult1 && bResult2;
			},
			onUrunKaydet : function () {
				var oController = this;
				oController.getView().setBusy(true);
				var result = this._onBeforeKaydet();
				if (!result) {
					oController.getView().setBusy(false);
					var sWarningMessage = this._getBundleText("warningMessage");
					MessageToast.show(sWarningMessage);
					return;
				} else {
					var mainModel = this.getView().getModel();
					var eModel = this.getView().getModel("ecc");
					var tModel = this.getView().getModel("tedarik");
					var oData = mainModel.getData();
					var tData = tModel.getData();
					var oTedarik = {};
					
					oTedarik.TalepNumarasi = oData.TalepNumarasi;
					oTedarik.UrunGorseli = tData.UrunGorseli;
					oTedarik.UrunOzellikleri = tData.UrunOzellikleri;
					oTedarik.Fiyat = parseFloat(tData.Fiyat).toFixed(2);
					oTedarik.OzelDurum = tData.OzelDurum;
					oTedarik.ParaBirimi = tData.ParaBirimi;
					oTedarik.OdemeSekli = tData.OdemeSekli;
					oTedarik.TeslimSekli = tData.TeslimSekli;
					oTedarik.UretimSuresi = tData.UretimSuresi;
					oTedarik.MinimumSiparisMiktari = parseInt(tData.MinimumSiparisMiktari,10);
					oTedarik.TedarikNumarasi = tData.TedarikNumarasi;
					oTedarik.Secildi = tData.Secildi;
					oTedarik.Ekleyen=' ';
					
					eModel.create('/TedarikSet', oTedarik, {
						success : function (oResponse) {
							oController.getView().setBusy(false);
							var sMessageSuccess = oController._getBundleText("TedarikSuccess");
							MessageToast.show(sMessageSuccess,{duration : 3000});
							oController.byId("idGorselImageTedarik").setSrc("");
							oController.byId("idGorselUploadTedarik").setValue("");
							oController.getRouter().navTo("talepformu");
						},
						error  : function (oError) {
							oController.getView().setBusy(false);
							var sMessageError = oController._getBundleText("TedarikError");
							MessageToast.show(sMessageError);
						}
					});
					
				}
			},
			_getBundleText : function (sKey,sParameter1,sParameter2,sParameter3,sParameter4) {
				var i18nModel = this.getView().getModel("i18n");
				var oBundle = i18nModel.getResourceBundle();
				var sValue = oBundle.getText(sKey, [sParameter1,sParameter2,sParameter3,sParameter4]);	
				return sValue;
			},
			onGorselUploadComplete : function (oEvent) {
				var sResponse = oEvent.getParameter("responseRaw");
				var sStatus = oEvent.getParameter("status");
				var sWarningMessage;
				if (sStatus !== 200) {
					sResponse = sResponse.length > 50 ? sResponse.substring(0, 50) + "..." : sResponse;
					sWarningMessage = this._getBundleText("ErrorMessage");
					MessageToast.show(sWarningMessage+" :"+sResponse);
				} else if (sResponse.search("User authentication failed")>0) {
					sWarningMessage = this._getBundleText("enterMessage");
					MessageToast.show(sWarningMessage);
				} else if (sResponse.search("An unexpected problem has occurred")>0 ||
						   sResponse.search("Application error occurred during the request processing")>0) {
					sWarningMessage = this._getBundleText("loadingError");	   	
					MessageToast.show(sWarningMessage);
				} else {
					sWarningMessage = this._getBundleText("loadingSuccess");
					MessageToast.show(sWarningMessage+" :"+sResponse);
					var oModel = this.getView().getModel("tedarik");
					var sFilename = oModel.getProperty("/GorselFileName");
					oModel.setProperty("/UrunGorseli",sResponse);
					var oImage = this.getView().byId("idGorselImageTedarik");
					oImage.setSrc("/logo~ui~talep/DownloadServlet?id="+sResponse+"&amp;filename="+sFilename);
				}	
				
			},
			onGorselUploadChange : function (oEvent) {
					this.handleGorselUpload(oEvent);
			},
			handleGorselUpload : function(oEvent) {
				var oModel = this.getView().getModel();
				var oFileUploader = this.getView().byId("idGorselUploadTedarik");
				var type = "TUTD";			
				var filename = oFileUploader.getValue();
				if (!filename) {
					var sWarningMessage = this._getBundleText("chooseFile");
					MessageToast.show(sWarningMessage);
				} else {
					oModel.setProperty("/GorselFileName",filename);
				}
				var objid = jQuery.sap.uid();
				//var filename = evt.mParameters.mParameters.newValue;
				oFileUploader.removeAllHeaderParameters();
				oFileUploader.addHeaderParameter( 
						new sap.ui.unified.FileUploaderParameter({
							name : "filename",
							value : encodeURI(filename)
						}) 
					);		
				oFileUploader.addHeaderParameter( 
						new sap.ui.unified.FileUploaderParameter({
							name : "objid",
							value : objid
						}) 
					);		
				oFileUploader.addHeaderParameter( 
						new sap.ui.unified.FileUploaderParameter({
							name : "type",
							value : type
						}) 
					);					
				oFileUploader.setSendXHR(true);
				oFileUploader.upload();			
			},
			handleOdemeSekliTedarikValueHelp : function(oEvent) {
				var oModel = this.getView().getModel("genel");
				var textEl = this.getView().byId("idOdemeSekliTedarikAdi");
				Common.handleValueHelp(this,oEvent.getSource(),textEl,"OdemeKosuluKodu","OdemeKosuluAciklamasi",oModel,"/OdemeKosuluSet",this.getView(),"Ödeme Şekli");
			},
		
			handleTeslimSekliTedarikValueHelp : function(oEvent) {
				var oModel = this.getView().getModel("genel");
				var textEl = this.getView().byId("idTeslimSekliTedarikAdi");
				Common.handleValueHelp(this,oEvent.getSource(),textEl,"TeslimSekliKodu","TeslimSekliAciklamasi",oModel,"/TeslimSekliSet",this.getView(),"Teslim Şekli");
			}
	});

});