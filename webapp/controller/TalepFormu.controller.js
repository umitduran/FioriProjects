sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/m/MessageToast",
	"sap/m/MessageBox",
	"sap/m/Token",
	"sap/ui/core/format/DateFormat",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/odata/ODataModel",
	"com/silverline/ticariurun/util/util",
	"com/silverline/ticariurun/util/common",
	"com/silverline/ticariurun/model/models"
], function(Controller,MessageToast,MessageBox,Token,DateFormat,JSONModel,ODataModel,Util,Common,models) {
	"use strict";
	return Controller.extend("com.silverline.ticariurun.controller.TalepFormu", {
		onInit : function() {
			var oView = this.getView();
			var oComp = this.getOwnerComponent();
			oView.addStyleClass(oComp.getContentDensityClass());
			var taskId = jQuery.sap.getUriParameters().get("taskId");
	
			if (taskId) {
				this.taskId = taskId;
				models.createBPMModel(this, taskId);
			}
			this.getRouter().attachRoutePatternMatched(this._onRouteMatched, this);
		},
		modifyScreen : function(sCurrentStep) {
			switch (sCurrentStep) {
				case "20":
					this.modifyScreen20();
					break;
			}
		},
		modifyScreen20 : function() {
			var oTable = this.getView().byId("idUrunTedarikTable");
			oTable.setMode(sap.m.ListMode.SingleSelectLeft);
		},
		_onRouteMatched : function(oEvent) {
			var sRouteName = oEvent.getParameter("name");
			var oModel = this.getView().getModel();
			var sRefreshRequired = oModel.getProperty("/refreshRequired");
			
			if (sRouteName === "talepformu" && sRefreshRequired === "clear") {
				this.byId("idGorselImage").setSrc("");
				this.byId("idGorselUpload").setValue("");
				this.byId("idHedefUlke").removeAllTokens();
				this.byId("idTedarikKisiti").removeAllTokens();
				var sTalepEden = oModel.getProperty("/TalepEden");
				var sTalepTarihi = oModel.getProperty("/TalepTarihi");
				oModel.setData({});
				oModel.setProperty('/TalepEden',sTalepEden);
				oModel.setProperty('/TalepTarihi',sTalepTarihi);
			}
			else if (sRouteName === "talepformu" && sRefreshRequired === "noChange") {
				delete oModel.oData.refreshRequired;
			}
			else if (sRouteName==="talepformu") {
				var bpmModel = this.getView().getModel("bpm");
				this._reloadAfterBPMLoaded = false;
				if (!bpmModel) {
					//callback ile çağrılacak. 
					this._reloadAfterBPMLoaded = true;
				} else {
					this._reloadTalepData();	
				}
			}
		},
		onBPMModelLoaded : function() {
			if (this._reloadAfterBPMLoaded) {
				this._reloadTalepData();
			}
		},
		onIptal : function() {
			var result = this._onBeforeKaydet();
            if (!result) {
                var sWarningMessage = this._getBundleText("requiredFieldMessage");
                MessageToast.show(sWarningMessage);
            } else {
            	this._claimAndComplete("Iptal");
            }
		},
		onOnayla : function() {
			var result = this._onBeforeKaydet();
			if (!result) {
				var sWarningMessage = this._getBundleText("requiredFieldMessage");
				MessageToast.show(sWarningMessage);
				return;
			}			
			this.getView().setBusy(true);
			var bpmModel = this.getView().getModel("bpm");
			var sCurrentStep = bpmModel.getProperty("/currentStep");
			
			switch (sCurrentStep) {
				case "20":
					this._onOnayla20(); 
					break;
				case "60": 
					this._onOnayla60(sCurrentStep);
					break;
				case "70" : 
					this._onOnayla70(sCurrentStep);
					break;
				case "230" : 
					this._onOnayla230(sCurrentStep);
					break;
				case "270" :
					this._onOnayla270(sCurrentStep);
					break;
				default :
					this._claimAndComplete();
					break;
			}
		},
		_onOnayla60 : function(sCurrentStep) {
			var oMainModel = this.getView().getModel();
			var eccModel = this.getView().getModel("ecc");
			var sTalepNumarasi = oMainModel.getProperty('/TalepNumarasi');
 			var sNumuneKodu = oMainModel.getProperty('/Numune');
			eccModel.callFunction("/SetNumuneKodu",{
				urlParameters : {
					"TalepNumarasi" : sTalepNumarasi,
					"Statu" : sCurrentStep,
					"Numune" : sNumuneKodu
				},
				success : function () {

				},
				error : function () {

				}
			});
			this._claimAndComplete();
		},
		_onOnayla70 : function (sCurrentStep) {
			var oMainModel = this.getView().getModel();
			var eccModel = this.getView().getModel("ecc");
			var sTalepNumarasi = oMainModel.getProperty('/TalepNumarasi');
			var sVarisNoktasi = oMainModel.getProperty('/VarisNoktasi');
			var sNumuneGeldi = this.byId("idNumuneGeldi").getSelected();

			eccModel.callFunction("/UpdateNumuneInfo",{
				urlParameters : {
					"TalepNumarasi" : sTalepNumarasi,
					"Statu" : sCurrentStep,
					"VarisNoktasi" : sVarisNoktasi,
					"NumuneGeldi" : sNumuneGeldi
				},
				success : function () {

				},
				error : function () {

				}
			});
			this._claimAndComplete();
		},
		_onOnayla230 : function () {
			var oMainModel = this.getView().getModel();
			var eccModel = this.getView().getModel("ecc");
			var sTalepNumarasi = oMainModel.getProperty('/TalepNumarasi');
			var sMalzeme = oMainModel.getProperty('/Malzeme');

			eccModel.callFunction("/SetMalzemeKodu",{
				urlParameters : {
					"TalepNumarasi" : sTalepNumarasi,
					"Malzeme" : sMalzeme
				},
				success : function () {

				},
				error : function () {

				}
			});
			this._claimAndComplete();
		},
		_onOnayla270 : function () {
			var oController = this;
			var oMainModel = oController.getView().getModel();
			var oList = oMainModel.getProperty("/MaterialDocuments");
			var checkEmpty = false;
			jQuery.each(oList, function (key,el) {			
				if (!el.DocumentType) {
					checkEmpty = true; 	
				}
			});
			if (checkEmpty) {
				var sWarningMessage = this._getBundleText("requiredFieldMessage");
				this.getView().setBusy(false);
				MessageToast.show (sWarningMessage);
				return;
			}
			var eccModel = oController.getView().getModel("ecc");
			var iCounter = 0;
			var iListSize = oList.length;
			jQuery.each(oList, function (key,el) {
				var row = {
					TalepNumarasi : el.TalepNumarasi,
					DocumentId : el.DocumentId,
					DocumentType : el.DocumentType
				};
				eccModel.create('/DokumanlarSet', row, {
					success : function () {
						iCounter++;
						if (iCounter===iListSize) {
							oController.getView().setBusy(false);
						}
					},
					error : function () {
						iCounter++;
						if (iCounter===iListSize) {
							oController.getView().setBusy(false);
						}
					}
				});
				
			});
			this._claimAndComplete();
		},
		_setSAPStatus : function(sCurrentStep,sTalepNumarasi,sAction) {
			var oController = this;
			var oMainModel = oController.getView().getModel();
			if (sTalepNumarasi === null) {
				sTalepNumarasi = oMainModel.getProperty('/TalepNumarasi');
			}
			var sYorum = oMainModel.getProperty("/Yorum");
			var eccModel = oController.getView().getModel("ecc");
			eccModel.callFunction("/SetTalepStatus",{
				urlParameters : {"TalepNumarasi" : sTalepNumarasi,
				                 "Statu" : sCurrentStep,
								 "Action" : sAction,
								 "Yorum" : sYorum
				},
				success : function(oData, response) {

                },
				error : function(oError){
					oController.getView().setBusy(false);
                	oController._onGeneralError();
                }
			});

		},
		_onOnayla20 : function(sAction) {
			var oController = this;
			var oTable = this.getView().byId("idUrunTedarikTable");
			var oSelectedItem = oTable.getSelectedItem();
			if (!oSelectedItem) {
				var sWarningMessage = this._getBundleText("urunSecMessage");
				MessageToast.show(sWarningMessage);
				oController.getView().setBusy(false);
			} else {
				var sPath = oSelectedItem.getBindingContextPath();
				var oMainModel = this.getView().getModel();
				var eccModel = this.getView().getModel("ecc");
				var oTedarikData = oMainModel.getProperty(sPath);
				var sTedarikNumarasi = oTedarikData.TedarikNumarasi;
				eccModel.callFunction("/SelectUrunTedarik",{
					urlParameters : {"TedarikNumarasi" : sTedarikNumarasi  },
					success : function(oData, response) {
						if (sAction) {
							oController._claimAndComplete("UrunRevizyon");
						} else {
                    		oController._claimAndComplete();
						}
                    },
					error : function(oError){
						oController.getView().setBusy(false);
                    	oController._onGeneralError();
                    }
				});

			}
		},
		onRevizyon : function() {
			var result = this._onBeforeKaydet();
			if (!result) {
				var sWarningMessage = this._getBundleText("requiredFieldMessage");
				MessageToast.show(sWarningMessage);
			} else {
				var bpmModel = this.getView().getModel("bpm");
				var sCurrentStep = bpmModel.getProperty("/currentStep");
				if (sCurrentStep==="20") {
					this._onOnayla20("UrunRevizyon");
				} else {
					this._claimAndComplete("Revizyon");	
				}
			}
		},
		onBypass : function() {
			var result = this._onBeforeKaydet();
			if (!result) {
				var sWarningMessage = this._getBundleText("requiredFieldMessage");
				MessageToast.show(sWarningMessage);
			} else {
				this._claimAndComplete();
			}
		},
		onSartliOnay : function() {
			var result = this._onBeforeKaydet();
			if (!result) {
				var sWarningMessage = this._getBundleText("requiredFieldMessage");
				MessageToast.show(sWarningMessage);
			} else {
				this._claimAndComplete("SartliOnay");
			}
		},
		onRed : function() {
			var result = this._onBeforeKaydet();
			if (!result) {
				var sWarningMessage = this._getBundleText("requiredFieldMessage");
				MessageToast.show(sWarningMessage);
			} else {
				this._claimAndComplete("Red");
			}
		},
		onNumuneAlinmayacak : function() {
			var result = this._onBeforeKaydet();
			if (!result) {
				var sWarningMessage = this._getBundleText("requiredFieldMessage");
				MessageToast.show(sWarningMessage);
			} else {
				var bpmModel = this.getView().getModel("bpm");
				var sCurrentStep = bpmModel.getProperty("/currentStep");
			
				if (sCurrentStep === "70") {
					var oMainModel = this.getView().getModel();
					var eccModel = this.getView().getModel("ecc");
					var sTalepNumarasi = oMainModel.getProperty('/TalepNumarasi');
					var sVarisNoktasi = oMainModel.getProperty('/VarisNoktasi');
					var sNumuneGeldi = this.byId("idNumuneGeldi").getSelected();
		
					eccModel.callFunction("/UpdateNumuneInfo",{
						urlParameters : {
							"TalepNumarasi" : sTalepNumarasi,
							"Statu" : sCurrentStep,
							"VarisNoktasi" : sVarisNoktasi,
							"NumuneGeldi" : sNumuneGeldi
						},
						success : function () {
		
						},
						error : function () {
		
						}
					});
				}
				this._claimAndComplete("NumuneAlinmayacak");
			}
		},
		onFinalNumuneAlinmayacak : function() {
			var result = this._onBeforeKaydet();
			if (!result) {
				var sWarningMessage = this._getBundleText("requiredFieldMessage");
				MessageToast.show(sWarningMessage);
			} else {
				this._claimAndComplete("FinalNumuneAlinmayacak");
			}
		},
		onNumuneTalep : function () {
			var result = this._onBeforeKaydet();
			if (!result) {
				var sWarningMessage = this._getBundleText("requiredFieldMessage");
				MessageToast.show(sWarningMessage);
			} else {
				this._claimAndComplete("NumuneTalebi");
			}
		},
		_claimAndComplete : function(sAction) {
			var oController = this;
			var bpmModel = this.getView().getModel("bpm");
			if (bpmModel) {
				var sTaskId = bpmModel.getProperty("/TaskId");
				var sTalepNumarasi = bpmModel.getProperty("/TalepNumarasi");
				if (sTaskId) {
					var aData = jQuery.ajax({
			            type : "GET",
			            contentType : "application/json",
			            url : "/lib~bpmapi/TaskUtil?service=claim&taskid="+sTaskId,
			            async: false,
			            success : function(data,textStatus, jqXHR) {
							if (data==="OK") {
								var sCurrentStep = bpmModel.getProperty("/currentStep");
								oController._completeBPM(oController,sTaskId,sTalepNumarasi,sCurrentStep,sAction);
								if (!sAction) {
									sAction = "Onayla";
								}
								oController._setSAPStatus(sCurrentStep, sTalepNumarasi,sAction);
								oController._yorumEkle();
							} else {
								oController.getView().setBusy(false);
								oController._onGeneralError();
							}
			            },
			            error : function () {
			            	oController.getView().setBusy(false);
			            	oController._onGeneralError();
			            }
					});
				}
			}
		},
		_completeBPM : function(oController,sTaskId,sTalepNumarasi,sCurrentStep,sAction) {
			var taskDataSvcURL = "/bpmodata/taskdata.svc/" + sTaskId;
			var taskDataODataModel = new ODataModel(taskDataSvcURL, true);

			if (sAction && sAction!=="NumuneAlinmayacak"
						&& sAction!=="FinalNumuneAlinmayacak"
						&& sAction!=="Iptal"
						&& sAction!=="SartliOnay"
						&& sAction!=="Red"
			            && sAction!=="NumuneTalebi"
			            && sAction!=="UrunRevizyon") {
				var faultData = {};
				faultData.UrunTalebiType = {};
				faultData.UrunTalebiType.TalepNumarasi = sTalepNumarasi;
				faultData.UrunTalebiType.CurrentStep = "";
				faultData.UrunTalebiType.Action = "";
				//silme!
				// var faultData = {};
				// var fault = taskDataODataModel.getProperty("/Revizyon('" + sTaskId + "')/UrunTalebiType");
				// faultData.Fault = fault;
				taskDataODataModel.create("/"+sAction, faultData, null,
					function(oData,response){
						oController.getRouter().navTo("result",{
							action : 'revizyon',
							talepno : sTalepNumarasi,
							backbutton : false
						});

					},
					this._onGeneralError
				);
			} else {
				var mainModel = oController.getView().getModel();
				var ekleyen = mainModel.getProperty("/TedarikCollection/0/EkleyenBPM");
				var outputData = {};
				outputData.UrunTalebiType = {};
				outputData.UrunTalebiType.TalepNumarasi = sTalepNumarasi;
				outputData.UrunTalebiType.CurrentStep = "";
				if (sCurrentStep==="10") {
					var aTedarik = mainModel.getProperty('/TedarikCollection');
					if (aTedarik) {
						outputData.UrunTalebiType.UrunSayisi = aTedarik.length;
					}
				}
				if (!sAction) {
					sAction = "";
				}
				outputData.UrunTalebiType.Action = sAction;
				if (sCurrentStep==="20") {
					outputData.UrunTalebiType.UrunTedarikIlgiliKisi = ekleyen;
				}
				var sResultAction = "approve";
				if (sAction==="Iptal") {
					sResultAction = "cancel";
				}
				this.getView().setBusy(false);
				taskDataODataModel.create("/OutputData", outputData, null,
					function(oData,response){
						oController.getRouter().navTo("result",{
							action : sResultAction,
							talepno : sTalepNumarasi,
							backbutton : false
						});
					},
					this._onGeneralError
				);
			}
		},
		_onGeneralError : function(oError) {
			var bCompact = !!this.getView().$().closest(".sapUiSizeCompact").length;
			var sErrorMessage = this._getBundleText("generalErrorMessage");
				MessageBox.error(
					sErrorMessage,
					{
						styleClass: bCompact? "sapUiSizeCompact" : ""
					}
				);
		},
		_reloadTalepData : function() {
			var oView = this.getView();
			var oMainModel = this.getView().getModel();
			var bpmModel = this.getView().getModel("bpm");
			if (oMainModel) {
				var sTalepNumarasi = oMainModel.getProperty('/TalepNumarasi');
				var sCurrentStep = "";
				if (!sTalepNumarasi) {
					if (bpmModel) {
						sTalepNumarasi = bpmModel.getProperty("/TalepNumarasi");
						sCurrentStep = bpmModel.getProperty("/currentStep");
					}
				} else {
					if (bpmModel) {
						sCurrentStep = bpmModel.getProperty("/currentStep");
					}
				}
				if (sTalepNumarasi) {
					var sText = "("+sTalepNumarasi+")";
					var sFormTitle = bpmModel.getProperty("/TalepBasligi");
					var sTitle = sText + " " + sFormTitle;
					var oPage = this.getView().byId("idTalepFormuPage");
					oPage.setTitle(sTitle);

					oView.setBusy(true);
					this._loadTalepData(sTalepNumarasi,sCurrentStep);
				}
			}
		},
		_loadTalepData : function(sTalepNumarasi,sCurrentStep) {
			var oController = this;
			var oView = this.getView();
			var oComp = this.getOwnerComponent();
			var mainModel = oComp.getModel();
			var eccModel = oComp.getModel("ecc");
			var sPath = '/TalepSet(\''+sTalepNumarasi+'\')';

			eccModel.read(sPath,
			{
				urlParameters : { "$expand":"TalepToUlke,TalepToMetinler,TalepToTedarik,TalepToTedarik/TedarikToTedarikMetinler,TalepToEkler,TalepToIlgiliDokumanlar,TalepToLog"},
				success : function(oData,oResponse) {
					mainModel.setProperty('/UrunGrubu',oData.UrunGrubu);
					mainModel.setProperty('/UrunOzellikleri',oData.UrunOzellikleri);
					mainModel.setProperty('/HedefFiyat',oData.HedefFiyat);
					mainModel.setProperty('/HedefFiyatPB',oData.HedefFiyatPB);
					mainModel.setProperty('/HedefAdet',oData.HedefAdet);
					mainModel.setProperty('/MinimumSiparisMiktari',oData.MinimumSiparisMiktari);
					mainModel.setProperty('/WebLink',oData.WebLink);
					mainModel.setProperty('/OzelDurum',oData.OzelDurum);
					mainModel.setProperty('/HedefSiparisTarihi',oData.HedefSiparisTarihi.toLocaleDateString());
					mainModel.setProperty('/OdemeSekli',oData.OdemeSekli);
					mainModel.setProperty('/TeslimSekli',oData.TeslimSekli);
					mainModel.setProperty('/Marka',oData.Marka);
					mainModel.setProperty('/Numune',oData.Numune);
					mainModel.setProperty('/NumuneGeldi',oData.NumuneGeldi);
					mainModel.setProperty('/VarisNoktasi',oData.VarisNoktasi);
					mainModel.setProperty('/Malzeme',oData.Malzeme);
					mainModel.setProperty('/TalepNumarasi',oData.TalepNumarasi);
					mainModel.setProperty('/TalepEden',oData.TalepEden);

					oController.byId("idNumuneGeldi").setSelected(oData.NumuneGeldi);

					var oImage = oView.byId("idGorselImage");
					oImage.setSrc("/logo~ui~talep/DownloadServlet?id="+oData.UrunGorseli);

					var oUrunGrubuTab = oView.byId("idUrunGrubuTab");
					oUrunGrubuTab.setText(oData.TalepToMetinler.UrunGrubuAciklamasi);


					var oTalepToMetinler = {};
					mainModel.setProperty('/TalepToMetinler',oTalepToMetinler);

					mainModel.setProperty('/TalepToMetinler/OdemeKosuluAciklamasi',oData.TalepToMetinler.OdemeKosuluAciklamasi);
					mainModel.setProperty('/TalepToMetinler/TeslimSekliAciklamasi',oData.TalepToMetinler.TeslimSekliAciklamasi);
					mainModel.setProperty('/TalepToMetinler/MarkaAciklamasi',oData.TalepToMetinler.MarkaAciklamasi);
					mainModel.setProperty('/TalepToMetinler/MevcutKullanici',oData.TalepToMetinler.MevcutKullanici);

					var sUsername = oData.TalepToMetinler.MevcutKullanici;
					var aTedarik = [];
					jQuery.each(oData.TalepToTedarik.results,function(key,el) {
						var bChangeVisible = (sUsername===el.Ekleyen &&
						                      (sCurrentStep === "10" || sCurrentStep === "40")
						                     );
						var bDeleteVisible = (sUsername===el.Ekleyen && sCurrentStep === "10");
						var row = {
							TalepNumarasi : el.TalepNumarasi,
 							TedarikNumarasi : el.TedarikNumarasi,
 							Versiyon : el.Versiyon,
							UrunGorseli : el.UrunGorseli,
							UrunOzellikleri : el.UrunOzellikleri,
							Fiyat: el.Fiyat,
							ParaBirimi : el.ParaBirimi,
							OdemeSekli : el.OdemeSekli,
							TeslimSekli : el.TeslimSekli,
							MinimumSiparisMiktari : el.MinimumSiparisMiktari,
							OzelDurum : el.OzelDurum,
							UretimSuresi : el.UretimSuresi,
							TedarikciAdi : el.TedarikciAdi,
							Ekleyen : el.Ekleyen,
							EkleyenBPM : el.EkleyenBPM,
							Metinler : el.TedarikToTedarikMetinler,
							Change : bChangeVisible,
							Delete : bDeleteVisible,
							Secildi : el.Secildi
						};
						if (sCurrentStep==="30"||sCurrentStep==="31"||sCurrentStep==="50"||sCurrentStep==="32") {
							if (el.Secildi==="X") {
								row.Change = false;
								row.Delete = false;
								aTedarik.push(row);
							}
						} else if (sCurrentStep==="40") {
							if (el.Secildi==="X") {
								row.Delete = false;
								aTedarik.push(row);
							}
						} else if (sCurrentStep==="10" || sCurrentStep==="20") {
							aTedarik.push(row);
						} else {
							if (el.Secildi==="X") {
								aTedarik.push(row);
							}
						}

					});
					mainModel.setProperty('/TedarikCollection',aTedarik);

					var oUrunTedarikTab = oView.byId("idUrunTedarikTab");
					oUrunTedarikTab.setCount(aTedarik.length);
					var oHedefUlke = oView.byId("idHedefUlke");
					var oTedarikKisiti = oView.byId("idTedarikKisiti");
					oHedefUlke.destroyTokens();
					oTedarikKisiti.destroyTokens();
					jQuery.each(oData.TalepToUlke.results,function(key,el) {
						var oToken = new Token(
							{key: el.Ulke,
							text: el.UlkeAdi});
						if (el.KayitTipi==="H") {
							oHedefUlke.addToken(oToken);
						} else if (el.KayitTipi==="K") {
							oTedarikKisiti.addToken(oToken);
						}
					});

					var aEkler = [];
					jQuery.each(oData.TalepToEkler.results,function(key,el) {
						var row = {
							TalepNumarasi : el.TalepNumarasi,
							DocumentId : el.DocumentId,
							FileName : el.FileName
						};
						aEkler.push(row) ;
					});
					mainModel.setProperty('/Attachments',aEkler);

					var aIlgiliDocs = [];
					jQuery.each(oData.TalepToIlgiliDokumanlar.results,function(key,el) {
						var row = {
							TalepNumarasi : el.TalepNumarasi,
							DocumentId : el.DocumentId,
							FileName : el.FileName
						};
						aIlgiliDocs.push(row) ;
					});
					mainModel.setProperty('/MaterialDocuments',aIlgiliDocs);

					var aLogs = [];
					jQuery.each(oData.TalepToLog.results,function(key,el) {
						var row = {
							TalepNumarasi : el.TalepNumarasi,
							CurrentStep : el.CurrentStep,
							Action : el.Action,
							Degistiren : el.Degistiren,
							DegisiklikTarihi : el.DegisiklikTarihi,
							DegisiklikSaati : el.DegisiklikSaati,
							Yorum : el.Yorum
						};
						aLogs.push(row) ;
					});
					mainModel.setProperty('/LogCollection',aLogs);

					var oLogTab = oView.byId("idYorumlarTab");
					oLogTab.setCount(aLogs.length);

					oView.setBusy(false);
					var oEklerTab = oView.byId("idEklerTab");
					oEklerTab.setCount(aEkler.length);
					oController.updateForms();
				},
				error : function(err) {
					oView.setBusy(false);
				}
			});
		},
		getRouter : function() {
			var oComponent = this.getOwnerComponent();
			return oComponent.getRouter();
		},
		onBeforeRendering : function() {
			var oController = this;
			var uiModel = this.getView().getModel("ui");
			var oTest = uiModel.getProperty("/DEFAULT");
			if(oTest===undefined) {//uiModel Yüklenmiş mi?
				uiModel.attachRequestCompleted(function(oEvent){
					oController.updateForms();
				});
			} else {
				this.updateForms();
			}
		},
		_getBundleText : function (sKey,sParameter1,sParameter2,sParameter3,sParameter4) {
			var i18nModel = this.getView().getModel("i18n");
			var oBundle = i18nModel.getResourceBundle();
			var sValue = oBundle.getText(sKey, [sParameter1,sParameter2,sParameter3,sParameter4]);
			return sValue;
		},
		onUrunGrubuChanged : function (oEvent) {
			var oUrunGrubuTab = this.getView().byId("idUrunGrubuTab");
			var sSelectedItemText  = oEvent.getSource().getSelectedItem().getText();
			oUrunGrubuTab.setText(sSelectedItemText);
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
		_onBeforeKaydet : function() {
	 		var bResult1 = this._validateForm("idUrunGrubuForm");
			this._updateIconColor("idUrunGrubuTab", bResult1);
			var bResult2 = this._validateForm("idUrunOzellikForm");
			this._updateIconColor("idUrunOzellikTab", bResult2);
			var bResult3 = this._validateForm("idGenelBilgilerForm");
			this._updateIconColor("idGenelBilgilerTab", bResult3);
			var bResult4 = this._validateForm("idYorumlarForm");
			this._updateIconColor("idYorumlarTab", bResult4);
			var bResult5 = this._validateForm("idEklerForm");
			this._updateIconColor("idEklerTab", bResult5);
			var bResult6 = this._validateForm("idNumuneForm");
			this._updateIconColor("idNumuneTab", bResult6);
			var bResult7 = this._validateForm("idMalzemeForm");
			this._updateIconColor("idMalzemeTab", bResult7);
			return bResult1 && bResult2 && bResult3 && bResult4 && bResult5 && bResult6 && bResult7;
		},
		onKaydet : function(oEvent) {
			var oController = this;
			oController.getView().setBusy(true);
			var oModel = this.getView().getModel();
			var result = this._onBeforeKaydet();
			if (!result) {
				oController.getView().setBusy(false);
				var sWarningMessage = this._getBundleText("requiredFieldMessage");
				MessageToast.show(sWarningMessage);
				return;
			}
			var dHedefSipiarisTarihi = new Date(oModel.getProperty("/HedefSiparisTarihi"));
			var validDate = Common.compareDate(dHedefSipiarisTarihi,new Date(),false);
            if (!validDate) {
                var oHedefSiparisTarihi = this.getView().byId("idHedefSiparisTarihi");
                oHedefSiparisTarihi.setValueState(sap.ui.core.ValueState.Error);
                sWarningMessage = this._getBundleText("invalidDate");
                oHedefSiparisTarihi.setValueStateText(sWarningMessage);
                sWarningMessage = this._getBundleText("dateWarning");
                oController.getView().setBusy(false);
                MessageToast.show(sWarningMessage);
                
                return;
            }

			var oData = oModel.getData();
			var eModel = this.getView().getModel("ecc");
			var oTalep = {};
			oTalep.TalepNumarasi = '0000000000';
			oTalep.UrunGrubu = oData.UrunGrubu;
			oTalep.UrunOzellikleri = oData.UrunOzellikleri;
			oTalep.WebLink = oData.WebLink;
			oTalep.OzelDurum = oData.OzelDurum;
			oTalep.UrunGorseli = oData.UrunGorseli;
			oTalep.HedefAdet = parseInt(oData.HedefAdet,10);
			oTalep.HedefFiyat = parseFloat(oData.HedefFiyat).toFixed(2);
			oTalep.HedefFiyatPB = oData.HedefFiyatPB;
			oTalep.MinimumSiparisMiktari = parseInt(oData.MinimumSiparisMiktari,10);

			oTalep.HedefSiparisTarihi = oData.HedefSiparisTarihi + "T00:00:00";
			oTalep.OdemeSekli = oData.OdemeSekli;
			oTalep.TeslimSekli = oData.TeslimSekli;
			oTalep.Marka = oData.Marka;
			oTalep.TalepToYorum = [
				{
					TalepNumarasi : '',
					KullaniciAdi : '',
					Statu : '00',
					YorumTarihi : "1800-01-01T00:00:00",
					YorumSaati : 'PT00H00M00S',
					Yorum : oData.Yorum
				}
			];

			var oHedefUlke = this.getView().byId("idHedefUlke");
			var tokens = oHedefUlke.getTokens();
			oTalep.TalepToUlke = [];
			jQuery.each(tokens, function(idx,token) {
				var key = token.getKey();
				oTalep.TalepToUlke.push({
					TalepNumarasi : '',
					KayitTipi : 'H',
					Ulke: key
				});
			});

			var oTedarikKisiti = this.getView().byId("idTedarikKisiti");
			var tokenstk = oTedarikKisiti.getTokens();
			jQuery.each(tokenstk, function(idx,token) {
				var key = token.getKey();
				oTalep.TalepToUlke.push({
					TalepNumarasi : '',
					KayitTipi : 'K',
					Ulke: key
				});
			});
			oTalep.TalepToEkler = [];
			jQuery.each(oData.Attachments, function(key,el) {
				var rowAttachment = {
					TalepNumarasi : '',
					DocumentId : el.DocumentId
				};
				oTalep.TalepToEkler.push(rowAttachment);
			});

			eModel.create('/TalepSet', oTalep, {
				success : function (oResponse) {
					var sTalepNumarasi = oResponse.TalepNumarasi;
					var sUrunGrubu = oResponse.UrunGrubu;
					var sMarka = oResponse.Marka;
					oController._startBPM(oController,sTalepNumarasi,sUrunGrubu,sMarka);
				},
				error : function (oError) {
					oController.getView().setBusy(false);
					oController.getRouter().navTo("result",{
						action  : 'error'
					});

				}
			});
		},
		_startBPM : function(oController, sTalepNumarasi, sUrunGrubu, sMarka) {
			var sGroupServiceURL = "/lib~bpm/BPMServlet/GetUsersByGroup/BPM_TU_Uretim_Tedarik_"+sUrunGrubu;
			var startURL = "/bpmodata/startprocess.svc/ag.com/tu~bpm2/Urun Talebi";
			var oBPMServletModel = new JSONModel(sGroupServiceURL);
			oBPMServletModel.attachRequestCompleted(function(oEvent) {
				var oUrunTedarik = oBPMServletModel.getProperty("/Users");
				var bpmStartModel = new ODataModel(startURL, true);
				bpmStartModel.setCountSupported(false);
				var startData = {};
				startData.ProcessStartEvent = {};
				startData.ProcessStartEvent.UrunTalebiInType = {};
				startData.ProcessStartEvent.UrunTalebiInType.TalepNumarasi = sTalepNumarasi;
				startData.ProcessStartEvent.UrunTalebiInType.Marka = sMarka;
				startData.ProcessStartEvent.UrunTalebiInType.UrunTedarik = [];
				jQuery.each(oUrunTedarik,function(key,el) {
					var rowUrunTedarik = {
						uniqueid : el.uniqueid,
						name : el.name,
						uniquename : el.uniquename
					};
					startData.ProcessStartEvent.UrunTalebiInType.UrunTedarik.push(rowUrunTedarik);
				});
				bpmStartModel.create("/StartData",startData,null,
						function (oData,response) {
							oController._setSAPStatus("00",sTalepNumarasi,"TalepYarat");
							oController.getView().setBusy(false);
							oController.getRouter().navTo("result",{
								action : 'success',
								talepno : sTalepNumarasi,
								backbutton : true
							});
						},
						function (oError) {
							oController.getView().setBusy(false);
							oController.getRouter().navTo("result",{
								action  : 'error',
								backbutton : true
							});
						}
				);
			});
		},
		_validateForm : function(sFormId) {
			var oMainModel = this.getView().getModel();
			var oUIModel = this.getView().getModel("ui");
			var oMainForm = this.getView().byId(sFormId);
			var bpmModel = this.getView().getModel("bpm");
			if (!bpmModel) {
				bpmModel = new JSONModel();
			}
			return Common.validateAll(oMainForm,oUIModel,bpmModel,oMainModel,this.getView());
		},
		updateForms : function() {
			this.updateForm("idUrunGrubuForm");
			this.updateForm("idUrunOzellikForm");
			this.updateForm("idGenelBilgilerForm");
			this.updateForm("idYorumlarForm");
			this.updateForm("idEklerForm");
			this.updateForm("idMainTabBar");
			this.updateForm("idFooterToolbar");
			this.updateForm("idNumuneForm");
			this.updateForm("idMalzemeForm");
		},
		updateForm : function(sFormId) {
			var oMainModel = this.getView().getModel();
			var oUIModel = this.getView().getModel("ui");
			var oMainForm = this.getView().byId(sFormId);
			var bpmModel = this.getView().getModel("bpm");
			Common.updateForm(oMainForm,oUIModel,bpmModel,oMainModel,undefined,this.getView());
		},
		onIlgiliDokumanlarUploadChange : function(oEvent) {
			var oMainModel = this.getView().getModel();
			var sTalepNumarasi = oMainModel.getProperty('/TalepNumarasi');
			if (!sTalepNumarasi) {
				sTalepNumarasi = jQuery.sap.uid();
			}
			var sFilename = oEvent.mParameters.mParameters.newValue;
			var uc = oEvent.getSource();
			var fileUploader = uc._oFileUploader;
			fileUploader.addHeaderParameter(
					new sap.ui.unified.FileUploaderParameter({
						name : "filename",
						value : encodeURI(sFilename)
					})
				);
			fileUploader.addHeaderParameter(
					new sap.ui.unified.FileUploaderParameter({
						name : "objid",
						value : sTalepNumarasi
					})
				);
			fileUploader.addHeaderParameter(
				new sap.ui.unified.FileUploaderParameter({
					name : "type",
					value : "TUID" 
				})
			);
		},
		onFileUploadChange : function(evt) {
			var uc = evt.getSource();

			var filename = evt.mParameters.mParameters.newValue;

			var objid = jQuery.sap.uid();
			var fileUploader = uc._oFileUploader;
			fileUploader.addHeaderParameter(
					new sap.ui.unified.FileUploaderParameter({
						name : "filename",
						value : encodeURI(filename)
					})
				);
			fileUploader.addHeaderParameter(
					new sap.ui.unified.FileUploaderParameter({
						name : "objid",
						value : objid
					})
				);
			fileUploader.addHeaderParameter(
				new sap.ui.unified.FileUploaderParameter({
					name : "type",
					value : "TUEK" 
				})
			);
		},
		onIlgiliDokumanDeleted : function(oEvent) {
			var oMainModel = this.getView().getModel();
			var src = oEvent.getSource();
			var sDeletedItemId = src.sDeletedItemId;
			var items = src.getItems();
			var item;
			var idx;
			jQuery.each(items, function(key,val) {
				if (val.getId()===sDeletedItemId) {
					item = val;
					idx = key;
				}
			});
			var fileName = item.getFileName();
			var documentId = item.getDocumentId();

			var response = Common.deleteFile(documentId);
			if (response==="OK") {
				MessageBox.show(fileName+" dosyası silindi."+documentId);
				var aEkler = oMainModel.getProperty('/MaterialDocuments');
				aEkler.splice(idx,1);
				oMainModel.setProperty('/MaterialDocuments',aEkler);
			} else {
				MessageBox.show("Hata oluştu :"+response);
			}
			
		},
		onFileDeleted : function(oEvent) {
			var oMainModel = this.getView().getModel();
			var src = oEvent.getSource();
			var sDeletedItemId = src.sDeletedItemId;
			var items = src.getItems();
			var item;
			var idx;
			var sWarningMessage;
			jQuery.each(items, function(key,val) {
				if (val.getId()===sDeletedItemId) {
					item = val;
					idx = key;
				}
			});
			var fileName = item.getFileName();
			var documentId = item.getDocumentId();

			var response = Common.deleteFile(documentId);
			if (response==="OK") {
				sWarningMessage = this._getBundleText("fileDeleted");
				MessageBox.show(fileName+sWarningMessage+documentId);
				var aEkler = oMainModel.getProperty('/Attachments');
				aEkler.splice(idx,1);
				oMainModel.setProperty('/Attachments',aEkler);
			} else {
				sWarningMessage = this._getBundleText("ErrorMessage");
				MessageBox.show(sWarningMessage + " :"+response);
			}
		},
		onGorselUploadChange : function (oEvent) {
			this.handleGorselUpload(oEvent);
		},
		handleGorselUpload : function(oEvent) {
			var oModel = this.getView().getModel();
			var oFileUploader = this.getView().byId("idGorselUpload");
			var filename = oFileUploader.getValue();
			if (!filename) {
				var sWarningMessage = this._getBundleText("chooseFile");
				MessageToast.show(sWarningMessage);
			} else {
				oModel.setProperty("/GorselFileName",filename);
			}
			var objid = jQuery.sap.uid();
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
						value : "TUGO" 
					})
				);
			oFileUploader.setSendXHR(true);
			oFileUploader.upload();
		},
		onGorselUploadComplete : function(oEvent) {
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
				var oModel = this.getView().getModel();
				var sFilename = oModel.getProperty("/GorselFileName");
				oModel.setProperty("/UrunGorseli",sResponse);
				var oImage = this.getView().byId("idGorselImage");
				oImage.setSrc("/logo~ui~talep/DownloadServlet?id="+sResponse+"&amp;filename="+sFilename);
			}

		},
		onIlgiliDokumanlarUploadComplete : function(oEvent) {
			var params = oEvent.getParameters();
			var status = params.getParameter("status");
			var response = params.getParameter("responseRaw");
			var files = oEvent.getParameter("files");
			var sUploadedFile;
			var sWarningMessage;
			if (files) {
				sUploadedFile = oEvent.getParameter("files")[0].fileName;
			}
			if (!sUploadedFile) {
				var aUploadedFile = (oEvent.getParameters().getSource().getProperty("value")).split(/\" "/);
				sUploadedFile = aUploadedFile[0];
			}

			var mainModel = this.getView().getModel();
			var collection = mainModel.getProperty("/MaterialDocuments");
			if (!collection) {
				mainModel.setProperty("/MaterialDocuments",[]);
				collection = mainModel.getProperty("/MaterialDocuments");
			}

			if (status !== 200) {
				sWarningMessage = this._getBundleText("ErrorMessage");
				MessageToast.show(sWarningMessage+" :"+response);
				collection.push({});
				mainModel.setProperty("/MaterialDocuments",collection);
				collection.pop();
				mainModel.setProperty("/MaterialDocuments",collection);
			} else if (response.search("User authentication failed")>0) {
				sWarningMessage = this._getBundleText("enterMessage");
				MessageToast.show(sWarningMessage);
				collection.push({});
				mainModel.setProperty("/MaterialDocuments",collection);
				collection.pop();
				mainModel.setProperty("/MaterialDocuments",collection);
			} else {
				var row = {
					ProcessNo : "",
					DocumentId : response,
					FileName : sUploadedFile
				};
				collection.unshift(row);
				mainModel.setProperty("/MaterialDocuments",collection);
			}
		},
		onFileUploadComplete : function(oEvent) {
			var params = oEvent.getParameters();
			var status = params.getParameter("status");
			var response = params.getParameter("responseRaw");
			var files = oEvent.getParameter("files");
			var sUploadedFile;
			if (files) {
				sUploadedFile = oEvent.getParameter("files")[0].fileName;
			}
			if (!sUploadedFile) {
				var aUploadedFile = (oEvent.getParameters().getSource().getProperty("value")).split(/\" "/);
				sUploadedFile = aUploadedFile[0];
			}

			var mainModel = this.getView().getModel();
			var collection = mainModel.getProperty("/Attachments");
			if (!collection) {
				mainModel.setProperty("/Attachments",[]);
				collection = mainModel.getProperty("/Attachments");
			}

			if (status !== 200) {
				MessageToast.show("Hata oluştu :"+response);
				collection.push({});
				mainModel.setProperty("/Attachments",collection);
				collection.pop();
				mainModel.setProperty("/Attachments",collection);
			} else if (response.search("User authentication failed")>0) {
				var sWarningMessage = this._getBundleText("enterMessage");
				MessageToast.show(sWarningMessage);
				collection.push({});
				mainModel.setProperty("/Attachments",collection);
				collection.pop();
				mainModel.setProperty("/Attachments",collection);
			} else {
				var row = {
					ProcessNo : "",
					DocumentId : response,
					FileName : sUploadedFile
				};
				collection.unshift(row);
				mainModel.setProperty("/Attachments",collection);
			}
			var sTalepNumarasi = mainModel.getProperty("/TalepNumarasi");
			if (sTalepNumarasi !== undefined) {
				var aAttachments = mainModel.getProperty("/Attachments");
				var sDocumentId = aAttachments[0].DocumentId;
				var sFileName = aAttachments[0].FileName;
				var sObjid = jQuery.sap.uid();
					row = {
					TalepNumarasi : sTalepNumarasi,
					DocumentId : sDocumentId,
					FileName : sFileName
				};	
				var eccModel = this.getView().getModel("ecc");
				eccModel.create('/EklerSet',row,{
					success : function (resp) {
						
					},
					error : function (err) {
						
					}
				});
				
			}
		},
		handleUrunGrubuValueHelp : function(oEvent) {
			var oModel = this.getView().getModel("genel");
			Common.handleValueHelp(this,oEvent.getSource(),null,"UrunGrubuKodu","UrunGrubuAciklamasi",oModel,'/UrunGrubuSet',this.getView(),"Ürün Grubu");
		},
		handleHedefUlkeValueHelp : function(oEvent) {
			var oModel = this.getView().getModel("genel");
			Common.handleValueHelp(this,oEvent.getSource(),null,"UlkeKodu","UlkeAdi",oModel,"/UlkeSet",this.getView(),"Ülke");
		},
		handleTedarikKisitiUlkeValueHelp : function(oEvent) {
			var oModel = this.getView().getModel("genel");
			Common.handleValueHelp(this,oEvent.getSource(),null,"UlkeKodu","UlkeAdi",oModel,"/UlkeSet",this.getView(),"Ülke");
		},

		handleOdemeSekliValueHelp : function(oEvent) {
			var oModel = this.getView().getModel("genel");
			var textEl = this.getView().byId("idOdemeSekliAdi");
			Common.handleValueHelp(this,oEvent.getSource(),textEl,"OdemeKosuluKodu","OdemeKosuluAciklamasi",oModel,"/OdemeKosuluSet",this.getView(),"Ödeme Şekli");
		},

		handleTeslimSekliValueHelp : function(oEvent) {
			var oModel = this.getView().getModel("genel");
			var textEl = this.getView().byId("idTeslimSekliAdi");
			Common.handleValueHelp(this,oEvent.getSource(),textEl,"TeslimSekliKodu","TeslimSekliAciklamasi",oModel,"/TeslimSekliSet",this.getView(),"Teslim Şekli");
		},
		handleMarkaValueHelp : function (oEvent) {
			var oModel = this.getView().getModel("genel");
			var textEl = this.getView().byId("idMarkaAdi");
			Common.handleValueHelp(this,oEvent.getSource(),textEl,"MarkaKodu","Aciklama",oModel,"/MarkalarSet",this.getView(),"Marka");

		},
		_yorumEkle : function () {
			var oController = this;
			var oModel = oController.getView().getModel();
			var eccModel = oController.getView().getModel("ecc");
			var sTalepNumarasi = oModel.getProperty("/TalepNumarasi");
			var sYorum = oModel.getProperty("/Yorum");
			var bpmModel = this.getView().getModel("bpm");
			var sCurrentStep = bpmModel.getProperty("/currentStep");

			eccModel.callFunction("/YorumEkle",{
				urlParameters : {
					"TalepNumarasi" : sTalepNumarasi ,
					"Yorum"  :  sYorum,
					"Statu" : sCurrentStep
				},
				success : function(oData, response) {
                },
				error : function(oError){
                	oController._onGeneralError(oError);
                }
			});
		},
		onUrunEkle : function(oEvent) {
			this.getRouter().navTo("tedarikformuekle");
		},
		onDisplayTedarik : function(oEvent) {
			var oButton = oEvent.getSource();
			var oItem = oButton.getParent();
			var sPath = oItem.getBindingContextPath();
			var sIndex = sPath.substring(sPath.lastIndexOf("/")+1);
			this.getRouter().navTo("tedarikformu",{
				action : 'display',
				itemno : sIndex
			});
		},
		onDeleteTedarik : function(oEvent) {
			var oController = this;
			var oView = this.getView();
			var oButton = oEvent.getSource();
			var oItem = oButton.getParent();
			var sPath = oItem.getBindingContextPath();
			var oModel = this.getView().getModel();
			var oTedarikData = oModel.getProperty(sPath);
			var sTalepNumarasi = oTedarikData.TalepNumarasi;
			var sTedarikNumarasi = oTedarikData.TedarikNumarasi;
			var sTedarikVersiyon = oTedarikData.Versiyon;
			var sTedarikPath = '/TedarikSet('+
			                   'TalepNumarasi=\''+sTalepNumarasi+'\','+
			                   'TedarikNumarasi=\''+sTedarikNumarasi+'\','+
			                   'Versiyon=\''+sTedarikVersiyon+'\')';
			var eccModel = this.getView().getModel("ecc");
			oView.setBusy(true);

            eccModel.remove(sTedarikPath,{
                success : function(oData,oResponse) {
                    var sMessageSuccess = oController._getBundleText("RecordDeleted");
                    MessageToast.show(sMessageSuccess);
                    oController._loadTalepData(sTalepNumarasi);
                    oView.setBusy(false) ;
                },
                error : function(oError) {
                    var sMessageError = oController._getBundleText("ErrorOccured");
                    MessageBox.error(sMessageError);
                    oView.setBusy(false) ;
                }
            });
		},
		onChangeTedarik : function(oEvent) {
			var bpmModel = this.getView().getModel("bpm");
			var sCurrentStep = bpmModel.getProperty("/currentStep");

			var oButton = oEvent.getSource();
			var oItem = oButton.getParent();
			var sPath = oItem.getBindingContextPath();
			var sIndex = sPath.substring(sPath.lastIndexOf("/")+1);
			var sAction = "change";
			if (sCurrentStep==="40") {
				sAction = "revise";
			}
			this.getRouter().navTo("tedarikformu",{
				action : sAction,
				itemno : sIndex
			});
		},
	    ConvertActionToIcon : function(action) {
	        if (action==='TalepYarat') {
	            return "sap-icon://create-form";
	        } else if (action==='Onayla') {
	            return "sap-icon://accept";
	        } else if (action === 'Revizyon') {
	        	return "sap-icon://undo";
	        }else if (action === 'NumuneAlinmayacak') {
	        	return "sap-icon://decline";
	        }else if (action === 'Red') {
	        	return "sap-icon://decline";
	        } else if (action==='SartliOnay') {
	            return "sap-icon://accept";
	        }else {
	            return "sap-icon://task";
	        }
	    },
	    ConvertActionToIconColor : function(action) {
	        if (action==='TalepYarat') {
	            return "#4BC202";
	        } else if (action==='Onayla') {
	            return "#4BC202";
	        } else if (action === 'Revizyon') {
	        	return "#FE2E2E";
	        } else if (action === 'SartliOnay') {
	        	return "#FE2E2E";
	        } else if (action === 'Red') {
	        	return "#FE2E2E";
	        }else if (action === 'NumuneAlinmayacak') {
	        	return "#FE2E2E";
	        }else {
	            return "#000000";
	        }
	    },
	    isFileSizeExceed : function () {
	    	var sWarningMessage  = this._getBundleText("uploadError");
	    	MessageToast.show(sWarningMessage);
	    },
	    validateInput : function () {
	    	var sNumber = this.byId("idHedefFiyat").getValue();
	    	if (this._isNumber(sNumber) === false) {
	    		this.byId("idHedefFiyat").setValue("");
	    	}
	    },
	    _isNumber : function (n) {
			return !isNaN(parseFloat(n)) && isFinite(n);
		},
		onHedefUlkeChanged : function() {
			this.updateForms();	
		},
		remainLetter : function () {
			var textMax = 200;
			var textLength = this.byId("idComment").getValue().length;
			this.byId("idCountLetter").setText(textLength+"/"+"200");
		}

	});
});