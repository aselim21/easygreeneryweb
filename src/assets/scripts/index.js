window.addEventListener('DOMContentLoaded', (event) => {
    console.log('DOM fully loaded and parsed');
    const serverURL = 'http://localhost:3000';
    


    //listenWaterMeButton(serverURL);
    //listenSensorPlantDataButton(serverURL);
    listenButton('sensor-plant-data-js', serverURL, 'sensor_plant_data');
    listenButton('water-me-js', serverURL, 'water_me');
    
 
    //listenbutton('update-plant-info', serverURL, POSTInfoToServer, data, 'plant');
    // const button = document.getElementById('update-plant-info');
    // button.addEventListener("click", (ev) => {
    //     var data = getFormDataAsJSON();
    //     console.log(data);
    //     var xhttp = new XMLHttpRequest();
    //     xhttp.open("POST", serverUrl, true);
    //     xhttp.setRequestHeader("Accept", "application/json");
    //     xhttp.setRequestHeader("Content-Type", "application/json");
    //     xhttp.send(data);
    // });


});
function getCurrentTime(){
    let now     = new Date(); 
    let year    = now.getFullYear();
    let month   = now.getMonth()+1; 
    let day     = now.getDate();
    let hour    = now.getHours();
    let minute  = now.getMinutes();
    let second  = now.getSeconds(); 
    if(month.toString().length == 1) {
         month = '0'+month;
    }
    if(day.toString().length == 1) {
         day = '0'+day;
    }   
    if(hour.toString().length == 1) {
         hour = '0'+hour;
    }
    if(minute.toString().length == 1) {
         minute = '0'+minute;
    }
    if(second.toString().length == 1) {
         second = '0'+second;
    }   
    const dateTime = year+'/'+month+'/'+day+' '+hour+':'+minute+':'+second;   
     return dateTime;
}
function listenButton(buttonId, serverURL, endpoint){
    const button = document.getElementById(buttonId);
    button.addEventListener("click", (ev) => {
        const data = `{"${endpoint}":`+`"${getCurrentTime()}"}`;
        console.log(data);
        POSTInfoToServer(data, `${serverURL}/${endpoint}`);
    });
}
// function listenWaterMeButton(serverURL){
//     let endpoint = 'water_me';
//     const button = document.getElementById('water-me-js');
//     button.addEventListener("click", (ev) => {
//         const data = '{"water_me":'+`"${getCurrentTime()}"}`;
//         console.log(data);
//         POSTInfoToServer(data, `${serverURL}/${endpoint}`);
//     });
// }
// function listenSensorPlantDataButton(serverURL){
//     let endpoint = 'sensor_plant_data';
//     const button = document.getElementById('sensor-plant-data-js');
//     button.addEventListener("click", (ev) => {
//         const data = '{"sensor_plant_data":'+`"${getCurrentTime()}"}`;
//         console.log(data);
//         POSTInfoToServer(data, `${serverURL}/${endpoint}`);
//     });
// }




function POSTInfoToServer(data, serverURL_Endpoint) {
    var xhttp = new XMLHttpRequest();
    xhttp.open("POST", serverURL_Endpoint, true);
    xhttp.setRequestHeader("Accept", "application/json");
    xhttp.setRequestHeader("Content-Type", "application/json");
    xhttp.send(data);
}


function listenUpdateButton() {
    const button = document.getElementById('update-plant-info');
    console.log(button);
}

function getFormDataAsJSON() {
    const data = $('form').serializeArray().reduce(function (obj, item) {
        obj[item.name] = item.value;
        return obj;
    }, {});
    const jsondata = JSON.stringify(data);
    return jsondata;
}