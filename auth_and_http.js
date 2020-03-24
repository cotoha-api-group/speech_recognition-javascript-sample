//環境変数(全ファイル共通)
const oauth_url = "https://api.ce-cotoha.com/v1/oauth/accesstokens";
const stt_api_url = "https://api.ce-cotoha.com/api/asr";
const buffer_size = 4096; // 0, 256, 512, 1024, 2048, 4096, 8192, 16384
const interval_time = 240; // ms

var access_token = null;
var domain_id = null;
var model_name = null;
var sampling_rate = null;
var chunk_size = null;
var record_flag = false;
var cancel_flag = false;
var condition = null;
var start_button = null;
var stop_button = null;
var cancel_button = null;
var dict_button = null;
var audio_buffer = null;
var file_audio = [];
var dict_file = null;
var temp_dic_count = 0;
var asr_count = 0;
var stream_file_name = null;
var file_file_name = null;

//設定処理
function set_up(){
    access_token = null;
    var client_id = document.getElementById("client_id").value;
    var client_secret = document.getElementById("client_secret").value;
    domain_id = document.getElementById("domain_id").value;
    model_name = document.getElementById("model_name").value;
    condition = document.getElementById("condition");
    start_button = document.getElementsByClassName("start_button");
    stop_button = document.getElementsByClassName("stop_button");
    cancel_button = document.getElementsByClassName("cancel_button");
    dict_button = document.getElementsByClassName("dict_button");

    var data = {"grantType":"client_credentials", "clientId":client_id, "clientSecret":client_secret};
    data = JSON.stringify(data);
    http_request(oauth_url, "post", "json", function(response_json){
        access_token = response_json.access_token;
        able_button(start_button);
        able_button(dict_button);
        condition.innerHTML = "音声認識開始前";
        change_tab("stt");
        document.getElementById("audio_file4stream").addEventListener("change", handle_audio_file_select4streaming, false);
        document.getElementById("audio_file4file").addEventListener("change", handle_audio_file_select4file, false);
        document.getElementById("dict_file").addEventListener("change", handle_dict_file_select, false);
    }, data);
}

//HTTP通信
function http_request(url, method, response_type, callback, data = {}, callback_error = function(){}){
    try{
        var http = new XMLHttpRequest();
        http.open(method, url);
        if(access_token){
            http.setRequestHeader("Authorization","Bearer "+access_token);
        }
        else{
            http.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
        }
        http.responseType = response_type;
        http.send(data);
        http.onreadystatechange = function(){
            if(http.readyState == 4){
                if(http.status == 0){
                    window.alert("[ERROR]通信失敗");
                    callback_error();
                }
                else{
                    console.log("--- Response Status ---");
                    console.log("Status Code: " + http.status);
                    console.log("Status Text: " + http.statusText);
                    console.log("-----------------------");
                    
                    if((200 <= http.status && http.status < 300) || (http.status == 304)){
                        console.log("--- Response Header ---");
                        console.log(http.getAllResponseHeaders())
                        console.log("-----------------------");
                        if(http.response){
                            if(response_type == "text"){
                                boundary = "--" + http.getResponseHeader("Content-Type").split("=")[1];
                                var response_text_array = http.response.split(boundary);
                                callback(response_text_array);    
                            }
                            else if(response_type == "json"){
                                callback(http.response);
                            }
                        }
                        else{
                            callback();
                        }
                    }
                    else{
                        console.log("--- Response Header ---");
                        console.log(http.getAllResponseHeaders());
                        console.log("--- Response Body ---");
                        console.log(http.response);
                        console.log("-----------------------");
                        if(access_token){
                            if(response_type == "text"){
                                boundary = "--" + http.getResponseHeader("Content-Type").split("=")[1];
                                var response_text_array = http.response.split(boundary);
                                callback_error(response_text_array);
                            }
                            else if(response_type == "json"){
                                callback_error(http.response.slice(-1)[0].errorinfo);
                            }
                        }
                        else{
                            window.alert("[ERROR]アクセストークン取得失敗\nhttpステータスコード:" + http.status+"\nmessage:"+http.response.message);
                        }
                    }
                }
            }
        };
    }
    catch(e){
        window.alert(e.message);
        callback_error();
    }
}