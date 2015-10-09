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

		var chart = c3.generate({
				bindto: '#chart',
				data: {
					x: 'x',
					columns:[
						['x',[]],
						['Alcohol',[]],
						['Methane',[]],
						['Hydrogen',[]],
					],

					type: 'line'
				},
				axis:{
					x:{
						type:'timeseries',
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
						max: 95,  //最大1024
						min: 5
					},

				}

		});


		function convertArrayBufferToString(buf){
			var bufView = new Uint8Array(buf);
			var encodedString = String.fromCharCode.apply(null,bufView);
			return decodeURIComponent(escape(encodedString));
		}

		function init(){
			select = document.getElementById('ports');

			document.getElementById('open').addEventListener('click',openPort);
			document.getElementById('close').addEventListener('click',closePort);

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

		var onConnectCallback = function(connectionInfo){
			connectionId = connectionInfo.connectionId;
		};

		function openPort(){
			selectedPort = select.childNodes[select.selectedIndex].value;
			var baudRate = parseInt(document.getElementById('baud').value);
			var options = {
				'bitrate':baudRate,
				'receiveTimeout':1000
			};

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
			if (data.Alcohol > 50) {
				document.getElementById('w_Alcohol').classList.add('danger');
			} else {
				document.getElementById('w_Alcohol').classList.remove('danger');
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
							
						console.log(values);

						//javascriptではforEachは配列の中身を変化させることはできない(参照のみ)
						//rubyとかjava8とかにもあるmapメソッドを使う(中身を走査する点ではforEachと同じ)
						values = values.map(function(c){
							return (c * 100/1024).toFixed(2);
						});

						console.log(values);

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