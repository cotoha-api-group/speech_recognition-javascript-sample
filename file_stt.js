//ファイル音声認識
//ファイル読み込み
function handle_audio_file_select4file(e) {
    audio_buffer = null;
    file_file_name = null;
    var file = e.target.files[0];
    var reader = new FileReader();
    var sampling_rate_offset = 24;

    reader.onload = function(the_file){
        var target_audio = the_file.target.result;
        const fmt_view = new DataView(target_audio, 12, 4);
        var fmt_check = fmt_view.getUint32(0, true);
        if(fmt_check != 0x20746D66){
            const offset_view = new DataView(target_audio, 16, 4);
            var offset = offset_view.getUint32(0, true) + 8;
            sampling_rate_offset += offset;
        }
        const view = new DataView(target_audio, sampling_rate_offset,4);
        sampling_rate = view.getUint32(0, true);
        var audio_ctx = new AudioContext({
            sampleRate: sampling_rate
        });

        audio_ctx.decodeAudioData(the_file.target.result).then(function(decoded_data){
            var decoded_audio_array = decoded_data.getChannelData(0);
            audio_buffer = audio2int16(decoded_audio_array);
            var paths = document.getElementById("audio_file4file").value.split(/\/|\\/);
            file_file_name = paths.pop()
         }).catch(function(e){
            window.alert("音声ファイル読み込みエラー：\n" + e.message);
            return;
        });
        window.alert("音声ファイル読み込み完了");
        audio_ctx.close();
    };
    if(file){
        reader.readAsArrayBuffer(file);
    }
}

//音声認識処理
function file_speech_recognition(){
    disable_button(start_button);
    if(!audio_buffer){
        window.alert("音声ファイルが読み込まれていません。");
        able_button(start_button);
        return;
    }
    var api_url = stt_api_url + "/v1/speech_recognition/" + model_name;
    var form_data = new FormData();

    var start_line = document.createElement("tr");
    var start_header = document.createElement("th");
    var start_message = document.createTextNode("ファイル音声認識結果(" + file_file_name + ")");
    start_header.colSpan = 5
    start_header.appendChild(start_message);
    start_line.appendChild(start_header);

    var start_json = {
        "msg": {
            "msgname":"start"
        },
        "param": {
            "baseParam.samplingRate": sampling_rate,
            "recognizeParameter.domainId": domain_id,
            "baseParam.filler": document.getElementById("filler").checked,
            "baseParam.reading": document.getElementById("reading").checked,
            "baseParam.delimiter": document.getElementById("delimiter").checked,
            "baseParam.punctuation": document.getElementById("punctuation").checked,
            "recognizeParameter.maxResults": to_halfwidth(document.getElementById("max_results").value)
        }
    };

    if(document.getElementById("use_temp_dic").checked){
        var words = [];
        var temp_dic_children = document.getElementById("temp_dic_reg_list").children;
        for(var i = 0; i < temp_dic_children.length; i++){
            var temp_dic_word = {
                "surface": temp_dic_children[i].children[1].innerHTML,
                "reading": temp_dic_children[i].children[2].innerHTML,
                "prob": temp_dic_children[i].children[3].innerHTML
            }
            words.push(temp_dic_word);
        }
        Object.assign(start_json,{"words": words});
    }

    form_data.append("parameter", JSON.stringify(start_json));
    var blob = new Blob([audio_buffer], { type: "application/octet-stream"});
    form_data.append("audio", blob);
    var stop_json = {msg:{msgname:"stop"}};
    form_data.append("command", JSON.stringify(stop_json));

    http_request(api_url, "post", "json", function(response_json){
        result_list.appendChild(start_line);
        for(var i in response_json){
            var recieve_message_json = response_json[i];
            if (!recieve_message_json || !recieve_message_json.msg || !recieve_message_json.msg.msgname){
                window.alert("unknow error occored\nresponse: " + recieve_message_json);
                cancel();
                return;
            }
            switch(recieve_message_json.msg.msgname){
                case "started":
                    "file speech recognition started"
                    break;
                case "speechStartDetected":
                    console.log("speech start detected");
                    break;
                case "speechEndDetected":
                    console.log("speech end detected");
                    break;
                case "recognized":
                    switch(recieve_message_json.result.type){
                        case 1:
                        case 2:
                            if(recieve_message_json.result.sentence && recieve_message_json.result.sentence.length != 0){
                                console.log("speech is recognized");
                                var result_line = document.createElement("tr");
                                var result_c_1 = document.createElement("td");
                                var result_c_2 = document.createElement("td");
                                var result_c_3 = document.createElement("td");

                                if(recieve_message_json.result.sentence.length == 1){
                                    var result_json = recieve_message_json.result.sentence[0];
                                    
                                    var result_surface = document.createTextNode(result_json.surface);
                                    var result_score = document.createTextNode(result_json.score);
                                    if(result_json.reading != undefined){
                                        var result_reading = document.createTextNode(result_json.reading);
                                    }
                                    else{
                                        var result_reading = document.createTextNode("");
                                    }
                                }
                                else{
                                    var result_surface = document.createElement("details");
                                    var result_reading = document.createElement("details");
                                    var result_score = document.createElement("details");

                                    for(var i = 0; i < recieve_message_json.result.sentence.length; i++){
                                        var result_json = recieve_message_json.result.sentence[i];
                                        if(i == 0){
                                            var result_surface_n = document.createElement("summary");
                                            result_surface_n.innerHTML = (i + 1) + "： " + result_json.surface;

                                            var result_score_n = document.createElement("summary");
                                            result_score_n.innerHTML = (i + 1) + "： " + result_json.score;

                                        }
                                        else{
                                            var result_surface_n = document.createTextNode((i + 1) + "： " + result_json.surface);
                                            var result_score_n = document.createTextNode((i + 1) + "： " + result_json.score);
                                        }
                                        result_surface.appendChild(result_surface_n);
                                        result_score.appendChild(result_score_n);
                                        if(i != 0){
                                            result_surface.appendChild(document.createElement("br"));
                                            result_score.appendChild(document.createElement("br"));
                                        }

                                        if(result_json.reading != undefined){
                                            if(i == 0){
                                                var result_reading_n = document.createElement("summary");
                                                result_reading_n.innerHTML = (i + 1) + "： " + result_json.reading;
                                            }
                                            else{
                                                var result_reading_n = document.createTextNode((i + 1) + "： " + result_json.reading);
                                            }
                                            result_reading.appendChild(result_reading_n);
                                            if(i != 0){
                                                result_reading.appendChild(document.createElement("br"));
                                            }
                                        }
                                        else{
                                            result_reading = document.createTextNode("");
                                        }
                                    }
                                }

                                result_c_1.appendChild(result_surface);                
                                result_line.appendChild(result_c_1);

                                result_c_2.appendChild(result_reading);
                                result_line.appendChild(result_c_2);

                                result_c_3.appendChild(result_score);
                                result_line.appendChild(result_c_3);

                                var result_c_4 = document.createElement("td");
                                var result_st = document.createTextNode(result_json.startTime);
                                result_c_4.appendChild(result_st);
                                result_line.appendChild(result_c_4);

                                var result_c_5 = document.createElement("td");
                                var result_et = document.createTextNode(result_json.endTime);
                                result_c_5.appendChild(result_et);
                                result_line.appendChild(result_c_5);

                                result_list.appendChild(result_line);
                            }
                            break;
                        default:
                            break;
                    }
                    break;
                case "completed":
                    break;
                default:
                    break;
            }
        }
        audio_buffer = null;
        document.getElementById("audio_file4file").value = "";
        able_button(start_button);
    },form_data,function(response_json){
        window.alert("ファイル音声認識エラー\ncode：" + response_json.code + "\nmessage：" + response_json.message + "\nlevel：" + response_json.level + "\ndetail：" + response_json.detail);
        able_button(start_button);
    });
}
