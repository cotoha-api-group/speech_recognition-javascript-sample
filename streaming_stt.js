//ストリーミング音声認識
//音声認識処理(通信関連処理)
function stt_worker_func(){
    var xhr = null;
    var url = null;
    var interval_time = null;
    var start_time = null;
    var end_time = null;

    addEventListener("message", on_message, false);

    function on_message(e) {
        var cmd = e.data.cmd;
        var data = e.data.data || null;
        var uuid = e.data.uuid || null;
        var token = e.data.token || null;
        switch (cmd) {
            case "create":
                url = e.data.url;
                interval_time = e.data.interval;
                if(xhr){
                    xhr.abort();
                    xhr = null;
                }
                xhr = new XMLHttpRequest();
                xhr.withCredentials = true;
                xhr.responseType = "text";
                break;

            case "request":
                try{
                    if(xhr){
                        xhr.open("POST", url, false);
                        if(data instanceof Int16Array || data instanceof Float32Array || data instanceof ArrayBuffer) {
                            xhr.setRequestHeader("Content-Type", "application/octet-stream");
                        }
                        else{
                            xhr.setRequestHeader("Content-Type", "application/json");
                        }
                        if(uuid){
                            xhr.setRequestHeader("Unique-ID", uuid);
                        }
                        if(token){
                            xhr.setRequestHeader("Authorization", "Bearer "+token);
                        }
                        if(data){
                            if(start_time){
                                end_time = performance.now();
                                exe_time = interval_time - (end_time - start_time);
                            }
                            else{
                                exe_time = 0;
                            }
                            setTimeout(function(){
                                start_time = performance.now();
                                xhr.send(data);
                                if((200 <= xhr.status && xhr.status < 300) || (xhr.status == 304)){
                                    if(!xhr.responseText.length){
                                        postMessage({cmd:"response", data:null});
                                    }
                                    else{
                                        var res_array = JSON.parse(xhr.responseText);
                                        postMessage({cmd:"response", data:res_array});
                                    }
                                }
                                else{
                                    var res_error_array = JSON.parse(xhr.responseText);
                                    postMessage({cmd:"error", data:res_error_array});

                                }
                            }, exe_time);
                        }
                        else{
                            postMessage({cmd:"response", data:null});
                        }
                    }
                }
                catch(e){
                    postMessage({cmd:"error", data:e.message + ": " + xhr.responseText});
                }
                break;
            case "destroy" :
                if(xhr){
                    xhr.abort();
                    xhr = null;
                }
                postMessage({cmd:"destroy"});
                //self.close()
                break;
            default :
                break;
        }
    }
}

//音声認識処理(メイン制御処理)
function speech_recognition(){    
    disable_button(start_button);
    condition.innerHTML = "音声認識開始処理中";
    var recog_flag = false;
    var progress_flag = false;
    cancel_flag = false;
    record_flag = false;
    var result_list = document.getElementById("result_list");
    var stt_worker = new Worker(URL.createObjectURL(new Blob(["("+stt_worker_func.toString()+")()"], {type: "text/javascript"})));
    var uuid = null;
    var audio_context = null;

    if(file_audio.length == 0){
        var audio_buffer_array = [];
        var ctx = new AudioContext();
        stream_file_name = "マイク入力";
        sampling_rate = ctx.sampleRate;
        ctx.close();
        ctx = null;    
    }
    else{
        var audio_buffer_array = file_audio;
    }

    var start_line = document.createElement("tr");
    var start_header = document.createElement("th");
    var start_message = document.createTextNode("ストリーミング音声認識結果(" + stream_file_name + ")");
    start_header.colSpan = 5
    start_header.appendChild(start_message);
    start_line.appendChild(start_header);

    chunk_size = Math.floor(sampling_rate*interval_time/1000);
    var audio_processor = null;
    var url_with_model = stt_api_url + "/v1/speech_recognition/" + model_name;

    stt_worker.postMessage({cmd:"create", url:url_with_model, interval:interval_time});

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
            "recognizeParameter.enableProgress": document.getElementById("progress").checked,
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

    stt_worker.postMessage({cmd:"request", data:JSON.stringify(start_json), token:access_token});

    stt_worker.addEventListener("message", function(e) {
        var cmd = e.data.cmd;
        var data = e.data.data || null;
        switch(cmd){
            case "response":
                try{
                    if(data){
                        for(var i in data){
                            var recieve_message_json = data[i];
                            if (!recieve_message_json || !recieve_message_json.msg || !recieve_message_json.msg.msgname){
                                window.alert("不明なエラーが発生しました。\nresponse: " + recieve_message_json);
                                cancel();
                                return;
                            }
                            switch(recieve_message_json.msg.msgname){
                                case "started":
                                    recog_flag = true;
                                    uuid = recieve_message_json.msg.uniqueId;
                                    if(file_audio.length == 0){
                                        record_flag = true;
                                        var audio_device = navigator.mediaDevices.getUserMedia({video: false, audio: true});
                                        audio_device.then(function(stream){
                                            if(!audio_context){
                                                audio_context = new AudioContext();
                                                if(audio_context.sampleRate != sampling_rate){
                                                    audio_context = null;
                                                    window.alert("サンプリングレートが一致しません。\nもう一度やり直してください。");
                                                    cancel();
                                                    return;
                                                }
                                            }
                                            audio_processor = audio_context.createScriptProcessor(buffer_size, 1, 1);
                                            var audio_source = audio_context.createMediaStreamSource(stream);
                                            audio_source.connect(audio_processor);
                                            audio_processor.onaudioprocess = onAudioProcess;
                                            audio_processor.connect(audio_context.destination);                                            condition.innerHTML = "音声認識中(マイク入力)";
                                            able_button(stop_button);
                                            able_button(cancel_button);
                                            result_list.appendChild(start_line);
                                        }).catch(function(e){
                                            window.alert("マイク起動エラー\n" + e.message);
                                            cancel();
                                            return;
                                        });
                                    }
                                    else{
                                        condition.innerHTML = "音声認識中(ファイル入力)";
                                        able_button(cancel_button);
                                        result_list.appendChild(start_line);
                                    }
                                    break;
                                case "speechStartDetected":
                                    console.log("speech start detected");
                                    break;
                                case "speechEndDetected":
                                    console.log("speech end detected");
                                    break;
                                case "recognized":
                                    switch(recieve_message_json.result.type){
                                        case 0:
                                            progress_flag = true;
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
                
                                                    if(progress_flag){
                                                        var result_reading = document.createTextNode("認識途中結果");
                                                        result_line.style.backgroundColor = "#CCCCCC";   
                                                    }
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

                                                if(progress_flag){
                                                    result_c_2.colSpan = 4;
                                                    progress_flag = false;
                                                    result_line.appendChild(result_c_2);
                                                }
                                                else{
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
                                                }
                                                result_list.appendChild(result_line);
                                            }
                                            break;
                                        default:
                                            break;
                                    }
                                    break;
                                case "completed":
                                    if(audio_processor){
                                        audio_processor.disconnect();
                                        audio_processor = null;
                                    }
                                    if(audio_context){
                                        audio_context.close();
                                        audio_context = null;
                                    }
                                    condition.innerHTML = "音声認識終了";
                                    recog_flag=false;
                                    stt_worker.postMessage({cmd:"destroy"});
                                    break;
                                default:
                                    break;
                            }
                        }
                        if(recog_flag){
                            send_voice();
                        }
                    }
                    else{
                        send_voice();
                    }
                }
                catch(e){
                    window.alert("ストリーミング音声認識エラー\n" + e.message);
                    cancel();
                    return;
                }
                break;
            case "destroy":
                if(audio_processor){
                    audio_processor.disconnect();
                    audio_processor = null;
                }
                if(audio_context){
                    audio_context.close();
                    audio_context = null;
                }
                file_audio = [];
                document.getElementById("audio_file4stream").value = "";                
                disable_button(stop_button);
                disable_button(cancel_button);
                able_button(start_button);        
                break;
            case "error":
                record_flag = false;
                recog_flag = false;
                stt_worker.postMessage({cmd:"destroy"});
                condition.innerHTML = "音声認識エラー";
                window.alert("ストリーミング音声認識エラー\ncode：" + data.slice(-1)[0].errorinfo.code + "\nmessage：" + data.slice(-1)[0].errorinfo.message + "\nlevel：" + data.slice(-1)[0].errorinfo.level + "\ndetail：" + data.slice(-1)[0].errorinfo.detail);
                break;
            default :
                break;
        }
    }, false);

    var send_voice = function() {
        var voice_data = null;
        if(cancel_flag){
            cancel();
        }
        else{
            if(audio_buffer_array.length >= chunk_size){
                voice_data = audio_buffer_array.splice(0, chunk_size);
                var short_buffer = audio2int16(voice_data);
                stt_worker.postMessage({cmd:"request", data:short_buffer, uuid:uuid, token:access_token});
            }
            else{
                if(record_flag){
                    stt_worker.postMessage({cmd:"request", data:null, uuid:uuid, token:access_token});
                }
                else{
                    if(audio_buffer_array.length){
                        voice_data = audio_buffer_array;
                        var short_buffer = audio2int16(voice_data);
                        stt_worker.postMessage({cmd:"request", data:short_buffer, uuid:uuid, token:access_token});
                        audio_buffer_array = [];
                    }
                    else{
                        var stop_json = {msg:{msgname:"stop"}};
                        stt_worker.postMessage({cmd:"request", data:JSON.stringify(stop_json), uuid:uuid, token:access_token});
                    }
                }
            }
        }
    };

    var onAudioProcess = function(e) {
        if(record_flag){
            Array.prototype.push.apply(audio_buffer_array, e.inputBuffer.getChannelData(0));
        }
    };

    var cancel = function(){
        try {
            if (audio_processor) {
                audio_processor.disconnect();
                audio_processor = null;
            }
            if(recog_flag){
                var cancel_json = {msg:{msgname:"cancel"}};
                stt_worker.postMessage({cmd:"request", data:JSON.stringify(cancel_json), uuid:uuid, token:access_token});
            }
        }
        catch(e){
            window.alert("音声認識キャンセルエラー\n" + e.message);
        }
    };
}

//認識停止処理
function stop_sst(){
    record_flag = false;
    condition.innerHTML = "音声認識停止処理中";
    disable_button(stop_button);
    disable_button(cancel_button);
}

//認識キャンセル処理
function cancel_sst(){
    cancel_flag = true;
    record_flag = false;
    condition.innerHTML = "音声認識キャンセル処理中";
    disable_button(stop_button);
    disable_button(cancel_button);
}

//ファイル読み込み
function handle_audio_file_select4streaming(e) {
    file_audio = [];
    stream_file_name = null;
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
           for(var i = 0; i < decoded_data.length; i+=buffer_size){
               var temp_object = (decoded_data.getChannelData(0)).slice(i, i+buffer_size);
               Array.prototype.push.apply(file_audio, temp_object);
           }
           var paths = document.getElementById("audio_file4stream").value.split(/\/|\\/);
           stream_file_name = paths.pop()
        }).catch(function(e){
            window.alert("音声ファイル読み込みエラー\n" + e.message);
            return;
        });
        window.alert("音声ファイル読み込み完了");
        audio_ctx.close();
    };
    if(file){
        reader.readAsArrayBuffer(file);
    }
}

//audio bufferをint16配列に変換(ファイル音声認識でも使用)
function audio2int16(audio_buffer){
    var int_buffer = new Int16Array(audio_buffer.length);
    for (var i=0; i<audio_buffer.length; i++) {
        int_buffer[i] = audio_buffer[i]*0x7FFF;
        if(int_buffer[i] > 0x7FFF){
            int_buffer[i] = 0x7FFF;
        }
        else if(int_buffer[i] < -0x8000){
            int_buffer[i] = -0x8000;
        }
    }
    return int_buffer;
}