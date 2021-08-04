window.addEventListener('DOMContentLoaded', (event) => {
    console.log('DOM fully loaded and parsed');
    const serverURL = 'http://localhost:3000';

    listenbutton('update-plant-info', serverURL, POSTInfoToServer);
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

function listenbutton(buttonID, serverURL, todo) {
    const button = document.getElementById(buttonID);
    console.log(button);
    button.addEventListener("click", (ev) => {
        var data = getFormDataAsJSON();
        console.log(data);
        todo(data, `${serverURL}/plants`);
        
    });

}
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