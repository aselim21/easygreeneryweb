const serverURL = 'https://easygreeneryweb.vercel.app';

window.addEventListener('DOMContentLoaded', (event) => {
    console.log('DOM fully loaded and parsed');

    listenButton('sensor-plant-data-js', serverURL, 'sensor_plant_data');
    listenButton('water-me-js', serverURL, 'water_me');
    listenSaveButton('save-plant-js', serverURL, 'save_plant');
    httpGetHistoryAsync(`${serverURL}/history`, './template.mustache');
    httpGetHistoryAsync(`${serverURL}/nickname`, false);
});

function httpGetHistoryAsync(theUrl, the_template) {
    const xhttp = new XMLHttpRequest();
    xhttp.open("GET", theUrl);
    xhttp.send();

    xhttp.onreadystatechange = (e) => {
        if (the_template != '') {
            fetch(the_template).then((response) => response.text()).then((template) => {
                const obj = JSON.parse(xhttp.responseText);
                let rendered = Mustache.render(template, obj);
                document.getElementById('target').innerHTML = rendered;
            });
        } else {
            document.getElementById('nickname').innerHTML = xhttp.responseText;
        }
    }
}

function getCurrentTime() {
    let now = new Date();
    let year = now.getFullYear();
    let month = now.getMonth() + 1;
    let day = now.getDate();
    let hour = now.getHours();
    let minute = now.getMinutes();
    let second = now.getSeconds();
    if (month.toString().length == 1) {
        month = '0' + month;
    }
    if (day.toString().length == 1) {
        day = '0' + day;
    }
    if (hour.toString().length == 1) {
        hour = '0' + hour;
    }
    if (minute.toString().length == 1) {
        minute = '0' + minute;
    }
    if (second.toString().length == 1) {
        second = '0' + second;
    }
    const dateTime = year + '/' + month + '/' + day + ' ' + hour + ':' + minute + ':' + second;
    return dateTime;
}
function listenButton(buttonId, serverURL, endpoint) {
    const button = document.getElementById(buttonId);
    button.addEventListener("click", (ev) => {
        const data = `{"${endpoint}":` + `"${getCurrentTime()}"}`;
        POSTInfoToServer(data, `${serverURL}/${endpoint}`);
    });
}
function listenSaveButton(buttonId, serverURL, endpoint) {
    const button = document.getElementById(buttonId);
    button.addEventListener("click", (ev) => {
        const data = getFormDataAsJSON();
        POSTInfoToServer(data, `${serverURL}/${endpoint}`);
        setTimeout(function () {
            httpGetHistoryAsync(`${serverURL}/nickname`, false);
        }, 1000);
    });
}

function POSTInfoToServer(data, serverURL_Endpoint) {
    var xhttp = new XMLHttpRequest();
    xhttp.open("POST", serverURL_Endpoint, true);
    xhttp.setRequestHeader("Accept", "application/json");
    xhttp.setRequestHeader("Content-Type", "application/json");
    xhttp.send(data);

    setTimeout(function () {
        httpGetHistoryAsync(`${serverURL}/history`, './template.mustache');
    }, 7000);
}


function listenUpdateButton() {
    const button = document.getElementById('update-plant-info');
}

function getFormDataAsJSON() {
    const data = $('form').serializeArray().reduce(function (obj, item) {
        obj[item.name] = item.value;
        return obj;
    }, {});
    const jsondata = JSON.stringify(data);
    return jsondata;
}
