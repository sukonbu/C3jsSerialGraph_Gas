	//chrome packaged appではalert()は使用が制限されている
	(function(){
		var select = null; //セレクトボックスの選択肢を格納するもの
		var connectionId = 0;
		var selctedPort = null;
		var reading = false;
		var data = "";
		var id = 0;
		var CORRECTION = 0.5;

		var dataBuf  =[];
		var stringBuf = [];

		var arrayReceived = [];



		var graphArray = [];

		var column = [];

		var timeArray =[];
		var nowDay;

		var caution = 200;

		var chart = c3.generate({
			bindto: '#chart',
			size:{
				width: 950,
				height: 500
			},
			data: {
				x: 'x',
				columns:[
				['x',[]],
				['Alcohol',[]],
				['Methane',[]],
				['Hydrogen',[]],
				],
				names:{
					Alcohol:'アルコール',
					Methane:'メタン',
					Hydrogen:'水素'
				},

				type: 'line',
			},
			axis:{
				x:{
					type:'timeseries',
					label:'計測時刻(時:分：秒 ミリ秒)',
					tick: {
						format: function(x){return x.getHours()+':'+x.getMinutes()+':'+x.getSeconds()+' '+x.getMilliseconds();},
						outer: false
					},
					padding:{
						left:20,
						right:500
					},
						//height: 20
					},
					y:{
						label:'濃度',
						max: 300,
						min: 0
					},

				},
				grid:{
					x:{
						show:true
					},
					y:{
						show:true
					}
				}

			});
		function calcGasValue(value){
			var val = 0;
			console.log(value);
			val = Math.pow(10,3.0-2.7*Math.log10(22*(1023/value-1)/10));
			console.log(val);
			return val;
		}


		function convertArrayBufferToString(buf){
			var bufView = new Uint8Array(buf);
			var encodedString = String.fromCharCode.apply(null,bufView);
			return decodeURIComponent(escape(encodedString));
		}

		function init(){
			select = document.getElementById('ports');

			document.getElementById('open').addEventListener('click',openPort);
			document.getElementById('close').addEventListener('click',closePort);
			document.getElementById('setVal').addEventListener('click',setYaxisVal);
			document.getElementById('setCautionVal').addEventListener('click',setCautionVal);

			chrome.serial.getDevices(function(devices){
				devices.forEach(function(port){	
							//select menuに追加
							var option = document.createElement('option');
							option.value = port.path;
							option.text = port.displayName ? port.displayName : port.path;
							select.appendChild(option);
						});
			});

		}

		function setYaxisVal(){
			var maxYVal = parseFloat(document.getElementById('yaxisVal').value);
			console.log(maxYVal);
			if(isNaN(maxYVal)){
				consile.log("Y軸最大値の設定が不正な値です");
			}else {
				chart.axis.max({
					y:maxYVal
				});
			}
		}
		function setCautionVal(){
			var cautionVal = parseFloat(document.getElementById('cautionVal').value);
			console.log(cautionVal);
			if(isNaN(cautionVal)){
				console.log("危険値の設定が不正な値です");
			}else {
				caution = cautionVal;
			}
		}

		var onConnectCallback = function(connectionInfo){
			connectionId = connectionInfo.connectionId;
		};

		function openPort(){
			selectedPort = select.childNodes[select.selectedIndex].value;
			var baudRate = parseInt(document.getElementById('baud').value,10);
			var options = {
				'bitrate':baudRate,
				'receiveTimeout':1000
			};

			graphArray = [];
			timeArray = [];

			chrome.serial.connect(selectedPort,options,onConnectCallback);

		}

		var onDisconnectionCallback = function(result){
			if(result){
				console.log('disconeccted');
			}else{
				console.log('error');
			}
		};


		function closePort(){

			var disconnect = chrome.serial.disconnect(connectionId,onDisconnectionCallback);
			console.log(stringBuf);
		}


		function getTimeHMS(date){
			//めんどいのでコピペ（ありがたや）
			//http://yut.hatenablog.com/entry/20111015/1318633937
			if (date == 'undefined') {
				date = new Date();
			}
			var d = date;

			var hour  = ( d.getHours()   < 10 ) ? '0' + d.getHours()   : d.getHours();
			var min   = ( d.getMinutes() < 10 ) ? '0' + d.getMinutes() : d.getMinutes();
			var sec   = ( d.getSeconds() < 10 ) ? '0' + d.getSeconds() : d.getSeconds();
			var msec  = ( d.getMilliseconds() < 10 ) ? '0' + d.getMilliseconds() : d.getMilliseconds();
			//print( year + '-' + month + '-' + day + ' ' + hour + ':' + min + ':' + sec );
			var timeString = hour +':' + min + ':' + sec + ':' + msec;

			return timeString;
		}

		function updateDisplay(data) {
			if (typeof(data) == 'undefined') {
				return;
			}
			document.getElementById('w_time').getElementsByClassName('data')[0].innerText = getTimeHMS(data.time);
			document.getElementById('w_Alcohol').getElementsByClassName('data')[0].innerText = data.Alcohol;
			document.getElementById('w_Methane').getElementsByClassName('data')[0].innerText = data.Methane;
			document.getElementById('w_Hydrogen').getElementsByClassName('data')[0].innerText = data.Hydrogen;

			document.getElementById('w_Alcohol').getElementsByClassName('caution')[0].innerText = "平常";
			document.getElementById('w_Methane').getElementsByClassName('caution')[0].innerText = "平常";
			document.getElementById('w_Hydrogen').getElementsByClassName('caution')[0].innerText = "平常";
			//if (data.Alcohol > calcGasValue(caution)) {
			if (data.Alcohol > caution) {
				document.getElementById('w_Alcohol').classList.add('danger');
				document.getElementById('w_Alcohol').getElementsByClassName('caution')[0].innerText = "危険";
			} else {
				document.getElementById('w_Alcohol').classList.remove('danger');
			}

			//if (data.Methane > calcGasValue(caution)) {
			if (data.Methane > caution) {
				document.getElementById('w_Methane').classList.add('danger');
				document.getElementById('w_Methane').getElementsByClassName('caution')[0].innerText = "危険";
			} else {
				document.getElementById('w_Methane').classList.remove('danger');
			}

			//if (data.Hydrogen > calcGasValue(caution)) {
			if (data.Hydrogen > caution) {
				document.getElementById('w_Hydrogen').classList.add('danger');
				document.getElementById('w_Hydrogen').getElementsByClassName('caution')[0].innerText = "危険";
			} else {
				document.getElementById('w_Hydrogen').classList.remove('danger');
			}

		}

		var onReceiveCallback = function(info){
			if(info.connectionId == connectionId && info.data){
				var str = convertArrayBufferToString(info.data);

				//console.log(str);
				//シリアル通信はちゃんと数字列でデータが飛んで来るとは限らない（空白とか、数字のみとかの可能性がある）
				for(var i = 0; i < str.length; i++){
					if(str[i] == '-'){
						var str2 = dataBuf.join('');

						//--グラフに値を追加する部分---
						var time = new Date();
						var values = str2.split(',');

						//console.log(values);

						//javascriptではforEachは配列の中身を変化させることはできない(参照のみ)
						//rubyとかjava8とかにもあるmapメソッドを使う(中身を走査する点ではforEachと同じ)
						values = values.map(function(c){
							//return calcGasValue(c).toFixed(2); //ppm計算っぽいなにか
							return c;   //そのままの値を出力
						});

						//console.log(values);

						//必要な構造→  [['x',,,,,,],['serial',値0,値1,値2,値3,,,],[],[]
						var timeSerial = ['x'];
						var columnSake = ['Alcohol'];
						var columnMethane = ['Methane'];
						var columnHydro = ['Hydrogen'];

						var columns = [];
						var tempColumns = [];
						//ここではcolumnsの中身に、先頭に'serial'を置いた配列columnをpushする

						updateDisplay({
							time: time,
							Alcohol: values[0],
							Methane: values[1],
							Hydrogen: values[2],
						});
						if(graphArray.length >= 20){
							chart.flow({
								columns: [
								['x',time],
								['Alcohol',values[0]],
								['Methane',values[1]],
								['Hydrogen',values[2]],
								]
							});

						}else{
							timeArray.push(time);

							graphArray.push(values);

							graphArray.forEach(function(c){
								columnSake.push(c[0]);
								columnMethane.push(c[1]);
								columnHydro.push(c[2]);
							});

							timeArray.forEach(function(c){
								timeSerial.push(c);
							});

							columns.push(timeSerial);

							columns.push(columnSake);
							columns.push(columnMethane);
							columns.push(columnHydro);

							chart.load({
								columns: columns   
							});

						}
						//----------------------

						dataBuf = [];
					}else{
						dataBuf.push(str[i]);
					}
				}
			}
		};
		chrome.serial.onReceive.addListener(onReceiveCallback);



		var onReceiveErrorCallback = function(info){
			console.log('onReceiveErrorCallback');
		};
		chrome.serial.onReceiveError.addListener(onReceiveErrorCallback);


		window.onload = init;
	})();
