//辞書追加リスト選択
function handle_dict_file_select(e) {
    remove_all_child("dict_reg_list");
    dict_file = e.target.files[0];
    var reader = new FileReader();

    reader.onload = function(the_file){
        var dict_lines = the_file.target.result.split("\n");
        var dict_reg_list = document.getElementById("dict_reg_list");
        for(i=0;i<dict_lines.length;i++){
            var dict_line = document.createElement("tr");

            var split_tab = dict_lines[i].split("\t");

            var hyoki = document.createElement("td");
            var hyoki_text = document.createTextNode(split_tab[0]);
            hyoki.appendChild(hyoki_text);
            dict_line.appendChild(hyoki);

            var yomi = document.createElement("td");
            var yomi_text = document.createTextNode(split_tab[1]);
            yomi.appendChild(yomi_text);
            dict_line.appendChild(yomi);

            if(split_tab[2]){
                var omomi_text = document.createTextNode(split_tab[2]);
            }
            else{
                var omomi_text = document.createTextNode("省略");
            }

            var omomi = document.createElement("td");
            omomi.appendChild(omomi_text);
            dict_line.appendChild(omomi);    

            dict_reg_list.appendChild(dict_line);
        }
        window.alert("tsvファイル読み込み完了");
    }
    if(dict_file){
        reader.readAsText(dict_file);
    }
}

//辞書追加リストアップロード
function upload_list(){
    disable_button(dict_button);
    if(!dict_file){
        window.alert("辞書追加リストファイルが読み込まれていません。");
        able_button(dict_button);
        return;
    }
    var api_url = stt_api_url + "/v1/speech_words/" + model_name + "/upload?domainid=" + domain_id;
    var form_data = new FormData();
    form_data.append("cascadeword", dict_file);
    http_request(api_url, "post", "text", function(response_text_array){
        console.log(response_text_array[2]);
        window.alert("辞書追加リストアップロード完了");
        dict_file = null;
        document.getElementById("dict_file").value = "";                
        remove_all_child("dict_reg_list");
        able_button(dict_button);
    }, form_data, function(response_text_array){
        var error_text_array = response_text_array[1].split('name="status"');
        var error_text = error_text_array[1].replace(/^(?:\n|\r\n)+|(?:\n|\r\n)+$/g,"")
        window.alert("辞書追加リストアップロードエラー\n" + error_text);
        dict_file = null;
        document.getElementById("dict_file").value = "";                
        remove_all_child("dict_reg_list");
        able_button(dict_button);
    });
}

//辞書追加リストクリア
function clear_list(){
    disable_button(dict_button);
    var api_url = stt_api_url + "/v1/speech_words/" + model_name + "/clear?domainid=" + domain_id;
    http_request(api_url, "get", "text", function(){
        window.alert("辞書追加リストクリア完了");
        able_button(dict_button);
    }, {}, function(response_text_array){
        var error_text_array = response_text_array[1].split('name="status"');
        var error_text = error_text_array[1].replace(/^(?:\n|\r\n)+|(?:\n|\r\n)+$/g,"")
        window.alert("辞書追加リストクリアエラー\n" + error_text);  
        able_button(dict_button);  
    });
}

//辞書追加リストダウンロード
function download_list(){
    disable_button(dict_button);
    var api_url = stt_api_url + "/v1/speech_words/" + model_name + "/download?domainid=" + domain_id;
    http_request(api_url, "get", "text", function(response_text_array){
        tsv_text_array = response_text_array[2].split('name="cascadeword"');
        tsv_text = tsv_text_array[1].replace(/^(?:\n|\r\n)+|(?:\n|\r\n)+$/g,"");
        var url = window.URL || window.webkitURL;
        document.getElementById("download").download = "download.tsv";
        var blob = new Blob([tsv_text], {type:"text/tab-separated-values"});
        document.getElementById("download").href = url.createObjectURL(blob);
        window.alert("辞書追加リストダウンロード完了");
        able_button(dict_button);
    }, {}, function(response_text_array){
        var error_text_array = response_text_array[1].split('name="status"');
        var error_text = error_text_array[1].replace(/^(?:\n|\r\n)+|(?:\n|\r\n)+$/g,"")
        window.alert("辞書追加リストダウンロードエラー\n" + error_text);  
        able_button(dict_button);  
    });
}

//辞書追加リスト適用状態取得
function isset_list(){
    disable_button(dict_button);
    var api_url = stt_api_url + "/v1/speech_words/" + model_name + "/isset?domainid=" + domain_id;
    http_request(api_url, "get", "text", function(response_text_array){
        response_json = JSON.parse(response_text_array[0]);
        if(response_json.isSet){
            var isset = "未適用リスト無し";
        }
        else{
            var isset = "未適用リスト有り";
        }
        window.alert("辞書追加リスト適用状態取得完了\n適用状態：" + isset);
        able_button(dict_button);
    }, {}, function(response_text_array){
        var error_text_array = response_text_array[1].split('name="status"');
        var error_text = error_text_array[1].replace(/^(?:\n|\r\n)+|(?:\n|\r\n)+$/g,"")
        window.alert("辞書追加リスト適用状態取得エラー\n" + error_text);  
        able_button(dict_button);  
    });
}