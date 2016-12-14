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
						oController._updateForms();
					});					
				} else {
					this._updateForms();
				}
			},				
			_onRouteMatched : function(oEvent) {
				var oView = this.getView();
				var sRouteName = oEvent.getParameter("name");
				if (sRouteName==="tedarikformu") {
					var oModel = new JSONModel();
					oView.setModel(oModel,"tedarik");
				}
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
			_updateForms : function() {
				this._updateForm("idUrunOzellikTedarikForm");
				this._updateForm("idGenelBilgilerTedarikForm");		
			},
			_updateForm : function(sFormId) {
				var oMainModel = this.getView().getModel();
				var oUIModel = this.getView().getModel("ui");
				var oMainForm = this.getView().byId(sFormId);
				var bpmModel = this.getView().getModel("bpm");
				Common.updateForm(oMainForm,oUIModel,bpmModel,oMainModel);
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
				var tModel = this.getView().getModel("tedarik");
				var result = this._onBeforeKaydet();
				if (!result) {
					MessageToast.show("Tüm zorunlu alanları doldurun!");
					return;
				} else {
/*					var tData = tModel.getData();
					var tedarikCollection = oModel.getProperty("/TedarikCollection");
					if (!tedarikCollection) {
						tedarikCollection = [];
					}
					tedarikCollection.push(tData);
					oModel.setProperty("/TedarikCollection",tedarikCollection);*/
					this._onCreateRequest();
				}
			},
			_onCreateRequest : function () {
				var oComp = this.getOwnerComponent();
				var mainModel = oComp.getModel();
				var eModel = this.getView().getModel("ecc");
				var tModel = this.getView().getModel("tedarik");
				var oData = mainModel.getData();
				var tData = tModel.getData();
				var oTedarik = {};
				
				oTedarik.TalepNumarasi = oData.TalepNumarasi;
				oTedarik.UrunGorseli = 'urungorseli';
				oTedarik.UrunOzellikleri = tData.UrunOzellikleri;
				oTedarik.Fiyat = parseFloat(tData.Fiyat).toFixed(2);
				oTedarik.OzelDurum = tData.OzelDurumTedarik;
				oTedarik.ParaBirimi = tData.HedefFiyatPB;
				oTedarik.OdemeSekli = tData.OdemeSekli;
				oTedarik.TeslimSekli = tData.TeslimSekli;
				oTedarik.MinimumSiparisMiktari = parseInt(tData.MinimumSiparis,10);
				oTedarik.TedarikNumarasi = '0000000000';
				
				eModel.create('/TedarikSet', oTedarik, null, null, null);
					
				eModel.attachRequestCompleted(function (eEvent) {
					var sResponse = eEvent.getParameter("response");
					var oResponse = JSON.parse(sResponse.responseText);
					if (oResponse.error) {
						MessageToast.show("Hata Oluştu:"+oResponse.error.message.value);
					} else { 
				    	MessageToast.show("Basari ile kaydedildi");
					}
				});
					
				
			},
			onGorselUploadCompleteTedarik : function (oEvent) {
				var sResponse = oEvent.getParameter("responseRaw");
				var sStatus = oEvent.getParameter("status");
				//var files = oEvent.getParameter("files");
				// var sUploadedFile;
				// if (files) {
				// 	sUploadedFile = oEvent.getParameter("files")[0].fileName;
				// }
				// if (!sUploadedFile) {
				// 	var aUploadedFile = (oEvent.getParameters().getSource().getProperty("value")).split(/\" "/);
				// 	sUploadedFile = aUploadedFile[0];
				// }
				
				if (sStatus !== 200) {
					sResponse = sResponse.length > 50 ? sResponse.substring(0, 50) + "..." : sResponse;
					MessageToast.show("Hata oluştu :"+sResponse);
				} else if (sResponse.search("User authentication failed")>0) {
					MessageToast.show("Kullanıcı oturumu kapalı. Sisteme yeniden giriş yapınız.");
				} else if (sResponse.search("An unexpected problem has occurred")>0 ||
						   sResponse.search("Application error occurred during the request processing")>0) {
					MessageToast.show("Dosya yükleme sırasında hata oluştu.");
				} else {
					MessageToast.show("Dosya başarı ile yüklendi :"+sResponse);
					var oModel = this.getView().getModel();
					var sFilename = oModel.getProperty("/GorselFileName");
					oModel.setProperty("/UrunGorseli",sResponse);
					var oImage = this.getView().byId("idGorselImageTedarik");
					oImage.setSrc("/logo~ui~talep/DownloadServlet?id="+sResponse+"&amp;filename="+sFilename);
				}	
				
			},
			onGorselUploadChangeTedarik : function (oEvent) {
					this.handleGorselUpload(oEvent);
			},
			handleGorselUpload : function(oEvent) {
				var oModel = this.getView().getModel();
				var oFileUploader = this.getView().byId("idGorselUploadTedarik");
				var type = "DEF00";			
				var filename = oFileUploader.getValue();
				if (!filename) {
					MessageToast.show("Lütfen dosya seçiniz!");
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