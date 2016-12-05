sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/m/MessageToast",
	"sap/m/MessageBox",
	"sap/m/Token",
	"sap/ui/model/json/JSONModel",
	"com/silverline/ticariurun/util/util",
	"com/silverline/ticariurun/util/common",
	"com/silverline/ticariurun/model/models"
], function(Controller,MessageToast,MessageBox,Token,JSONModel,Util,Common,models) {
	"use strict";
	return Controller.extend("com.silverline.ticariurun.controller.TalepFormu", {
		onInit : function() {
			var oView = this.getView();
			var oComp = this.getOwnerComponent();
			var mainModel = oComp.getModel();
			var oHedefUlke = this.getView().byId("idHedefUlke");
			var oTedarikKisiti = this.getView().byId("idTedarikKisiti");
			var taskId = jQuery.sap.getUriParameters().get("taskId");
			taskId = 1;
			if (taskId) {
				var bpmModel = models.createBPMModel(taskId);
				this.getView().setModel(bpmModel, "bpm");
				var talepNumarasi = bpmModel.getProperty("/TalepNumarasi");
				if (talepNumarasi) {
					oView.setBusy(true);
					var eccModel = oComp.getModel("ecc");
					var genelModel = oComp.getModel("genel");
					//eccModel.setUseBatch(false);
					var sPath = '/TalepSet(\''+talepNumarasi+'\')';
					
					eccModel.read(sPath, 
					{
						urlParameters : { "$expand":"TalepToYorum,TalepToUlke,TalepToMetinler"},
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
							mainModel.setProperty('/Markalar',oData.Marka);
							var oHedefFiyat = oView.byId("idHedefFiyat");
							var oHedefAdet = oView.byId("idHedefAdet");
							var oMinimumSiparis = oView.byId("idMinimumSiparis");
							var oOdemeSekliAdi = oView.byId("idOdemeSekliAdi");
							var oTeslimSekliAdi = oView.byId("idTeslimSekliAdi");
							var oMarkaAdi = oView.byId("idMarkaAdi");
							oOdemeSekliAdi.setValue(oData.TalepToMetinler.OdemeKosuluAciklamasi);
							oTeslimSekliAdi.setValue(oData.TalepToMetinler.TeslimSekliAciklamasi);
							oMarkaAdi.setValue(oData.TalepToMetinler.MarkaAciklamasi);
							oHedefFiyat.setValue(oData.HedefFiyat);
							oHedefAdet.setValue(oData.HedefAdet);
							oMinimumSiparis.setValue(oData.MinimumSiparisMiktari);
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
							var aYorumlar = [];
							jQuery.each(oData.TalepToYorum.results,function(key,el) {

								var row = {
									KullaniciAdi : el.KullaniciAdi,
									YorumTarihi : el.YorumTarihi,
									Yorum : el.Yorum
								};
								aYorumlar.push(row);
							});
							mainModel.setProperty('/Yorumlar',aYorumlar);
							oView.setBusy(false);
						},
						error : function(err) {
							oView.setBusy(false);
						}							
					});
					
/*					eccModel.read(sPath,null,null,
					  //  {
							// "$expand":"TalepToYorum,TalepToUlke"
					  //  },
					    false,null,null
					    function (mData,mResponse) {
							mainModel.setProperty('UrunGrubu',mData.UrunGrubu);
							oView.setBusy(false);
					    },
					    function(oError) {
					    	oView.setBusy(false);
						}
					);
					eccModel.attachRequestCompleted(function(oEvent) {
						var oModel = oEvent.getSource();
					});
*/					
				}
			}
		},
		onBeforeRendering : function() {
			var oController = this;
			var uiModel = this.getView().getModel("ui");
			uiModel.attachRequestCompleted(function(oEvent){
				oController.updateForms();
			});			
		},
		onUrunGrubuChanged : function(oEvent) {
			var oMainModel = this.getView().getModel();
			var sUrunGrubu = oMainModel.getProperty("/UrunGrubu");
			var oUrunGrubuTab = this.getView().byId("idUrunGrubuTab");
			var oSabitModel = this.getView().getModel("sabit"); 
			var sUrunGrubuText = Util.getSabitText(oSabitModel,"/UrunGrubu", sUrunGrubu);
			oUrunGrubuTab.setText(sUrunGrubuText);
			
		},
/*		onUrunGrubuNext : function(oEvent) {
			var bResult = this.validateForm("idUrunGrubuForm");
			if (bResult) {
				var oTab = this.getView().byId("idIconTabBar");
				oTab.setSelectedKey("UrunOzellik");
			}
			
		},*/
		updateIconColor : function(idTab,state)  {
			var oIconTab = this.getView().byId(idTab);			
			if (oIconTab) {
				var sColor = "Positive";
				if (!state) {
					sColor = "Negative";
				} 
				oIconTab.setIconColor(sColor);
			}
		},
		onBeforeKaydet : function() {
	 		var bResult1 = this.validateForm("idUrunGrubuForm");
			this.updateIconColor("idUrunGrubuTab", bResult1);
			var bResult2 = this.validateForm("idUrunOzellikForm");
			this.updateIconColor("idUrunOzellikTab", bResult2);
			var bResult3 = this.validateForm("idGenelBilgilerForm");
			this.updateIconColor("idGenelBilgilerTab", bResult3);
			var bResult4 = this.validateForm("idYorumlarForm");
			this.updateIconColor("idYorumlarTab", bResult4);
			var bResult5 = this.validateForm("idEklerForm");
			this.updateIconColor("idEklerTab", bResult5);
			return bResult1 && bResult2 && bResult3 && bResult4 && bResult5;
		},
		onKaydet : function(oEvent) {
			var oModel = this.getView().getModel();
			var result = this.onBeforeKaydet();
			if (!result) {
				MessageToast.show("Tüm zorunlu alanları doldurun!");
				return;
			}
			var dHedefSipiarisTarihi = new Date(oModel.getProperty("/HedefSiparisTarihi"));
			var validDate = Common.compareDate(dHedefSipiarisTarihi,new Date(),false);
			if (!validDate) {
				var oHedefSiparisTarihi = this.getView().byId("idHedefSiparisTarihi");
				oHedefSiparisTarihi.setValueState(sap.ui.core.ValueState.Error);
				oHedefSiparisTarihi.setValueStateText("Geçersiz Tarih");	
				MessageToast.show("Hedef Sipariş Tarihi geçmiş tarih girilemez!");
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
			
			//oTalep.HedefSiparisTarihi = oData.HedefSiparisTarihi + "T00:00:00";                         
			oTalep.OdemeSekli = oData.OdemeSekli;
			oTalep.TeslimSekli = oData.TeslimSekli;  
			oTalep.Marka = oData.Marka;
			oTalep.TalepToYorum = [
				{
					TalepNumarasi : '',
					KullaniciAdi : '',
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
			
			eModel.create('/TalepSet', oTalep, null, null, null);
			
			eModel.attachRequestCompleted(function (eEvent) {
				var sResponse = eEvent.getParameter("response");
				var oResponse = JSON.parse(sResponse.responseText);
				if (oResponse.error) {
					MessageToast.show("Hata Oluştu:"+oResponse.error.message.value);
				} else { 
			    	MessageToast.show(oResponse.d.TalepNumarasi+" numaralı talep yaratıldı!");
				}
			});
/*			eModel.attachRequestFailed(function () {
				MessageToast.show("Hata oluştu!");
			});			
*/		},
		validateForm : function(sFormId) {
			var oMainModel = this.getView().getModel();
			var oUIModel = this.getView().getModel("ui");
			var oMainForm = this.getView().byId(sFormId);
			var oDummyModel = new JSONModel();
			return Common.validateAll(oMainForm,oUIModel,oDummyModel,oMainModel);
		},
		updateForms : function() {
			this.updateForm("idUrunGrubuForm");
			this.updateForm("idUrunOzellikForm");
			this.updateForm("idGenelBilgilerForm");
			this.updateForm("idYorumlarForm");
			this.updateForm("idEklerForm");			
		},
		updateForm : function(sFormId) {
			var oMainModel = this.getView().getModel();
			var oUIModel = this.getView().getModel("ui");
			var oMainForm = this.getView().byId(sFormId);
			var bpmModel = this.getView().getModel("bpm");
			Common.updateForm(oMainForm,oUIModel,bpmModel,oMainModel);
		},
		onFileUploadChange : function(evt) {
			var uc = evt.getSource();
	
			var filename = evt.mParameters.mParameters.newValue;// eslint-disable-line
			
			var mainModel = this.getView().getModel();
			//var pid = mainModel.getProperty("/ProcessId");
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
		},		
		onFileDeleted : function() {
		},
		onGorselUploadChange : function (oEvent) {
			this.handleGorselUpload(oEvent);	
		},
		handleGorselUpload : function(oEvent) {
			var oModel = this.getView().getModel();
			var oFileUploader = this.getView().byId("idGorselUpload");
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
		onGorselUploadComplete : function(oEvent) {
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
				var oImage = this.getView().byId("idGorselImage");
				oImage.setSrc("/logo~ui~talep/DownloadServlet?id="+sResponse+"&amp;filename="+sFilename);
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
				MessageToast.show("Kullanıcı oturumu kapalı. Sisteme yeniden giriş yapınız.");
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
				//this.saveFileDataSAP(row);
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
			
		}
		
		
	});
});