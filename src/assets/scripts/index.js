window.addEventListener('DOMContentLoaded', (event) => {
    console.log('DOM fully loaded and parsed');
    const serverUrl ='http://localhost:3000/plants';
    const button = document.getElementById('update-plant-info');
    button.addEventListener("click",(ev)=>{
        var data = $('form').serializeArray().reduce(function(obj, item) {
                    obj[item.name] = item.value;
                    return obj;
                }, {});
                console.log(data);
                const jsondata =  JSON.stringify(data);
                console.log(jsondata);
                // $.post(serverUrl,jsondata, function(jsondata, status){
                //     console.log(`${jsondata}  and status is ${status}`)
                // });
                var xhttp = new XMLHttpRequest();
                xhttp.open("POST", serverUrl);
                xhttp.setRequestHeader("Accept", "application/json");
                xhttp.setRequestHeader("Content-Type", "application/json");
                // xhttp.setRequestHeader("Access-Control-Allow-Origin", "http://127.0.0.1:5500");
                xhttp.send(jsondata);
                // $.ajax({
                //     type: "POST",
                //     url: "http://localhost:3000/plants",
                //     data: JSON.stringify(data),
                //     contentType: "application/json",
                //     crossDomain: true,
                //     success: function (result) {
                //       console.log(result);
                //     },
                //     error: function (result, status) {
                //       console.log(result);
                //     }
                //  });
    });
    
    // button.click(()=>{
    //     //$.post()
    //     var data = $('#form').serializeArray().reduce(function(obj, item) {
    //         obj[item.name] = item.value;
    //         return obj;
    //     }, {});
    //     console.log(data);
    // })

});

function listenbutton(button,todo){



}
function sendPlantUpdateInfoToServer(){

}

function listenUpdateButton(){
    const button = document.getElementById('update-plant-info');
    console.log(button);
}