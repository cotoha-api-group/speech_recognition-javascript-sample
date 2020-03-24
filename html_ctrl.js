//load時の実行
window.addEventListener("load",function(){
    change_tab("settings");
    var start_button = document.getElementsByClassName("start_button");
    var stop_button = document.getElementsByClassName("stop_button");
    var cancel_button = document.getElementsByClassName("cancel_button");
    var dict_button = document.getElementsByClassName("dict_button");
    disable_button(start_button);
    disable_button(stop_button);
    disable_button(cancel_button);
    disable_button(dict_button);
},false);

//ページ操作用
function change_tab(id) {
    hide("stt");
    hide("dictionary");
    hide("settings");
    hide("information");
    display(id);
}

function hide(id){
    document.getElementById(id).style.display = "none";
    document.getElementById(id+"_tab").style.borderBottom = "solid 2px black";
}

function display(id){
    document.getElementById(id).style.display = "block";
    document.getElementById(id+"_tab").style.borderBottom = "solid 2px white";
}

//ボタン操作
function able_button(buttons){
    numof_button = buttons.length;
    for(i=0;i<numof_button;i++){
        buttons[i].disabled = "";
    }
}

function disable_button(buttons){
    numof_button = buttons.length;
    for(i=0;i<numof_button;i++){
        buttons[i].disabled = "disabled";
    }
}

//子要素をすべて削除
function remove_all_child(id){
    parent_elem = document.getElementById(id);
    while(parent_elem.firstChild){
        parent_elem.removeChild(parent_elem.firstChild);
    }
}

function add_temp_dic_list(){
    var hyoki_in = document.getElementById("temp_dic_hyoki").value;
    var yomi_in = document.getElementById("temp_dic_yomi").value;
    var omomi_in = +to_halfwidth(document.getElementById("temp_dic_omomi").value);
    if(!hyoki_in || !yomi_in){
        window.alert("表記及び読みは必須項目です。");
        return;
    }

    if(omomi_in==0){
        omomi_in = 30;
    }

    var temp_dic_reg_list = document.getElementById("temp_dic_reg_list");

    var temp_dic_line = document.createElement("tr");
    temp_dic_line.id = "temp_dic_" + temp_dic_count;

    var del_button_td = document.createElement("td");
    var del_button = document.createElement("button");
    del_button.value = "temp_dic_" + temp_dic_count;
    del_button.onclick=remove_temp_dic;
    temp_dic_count++;
    del_button.innerHTML = "削除"
    del_button_td.appendChild(del_button)
    temp_dic_line.appendChild(del_button_td);


    var hyoki = document.createElement("td");
    var hyoki_text = document.createTextNode(hyoki_in);
    hyoki.appendChild(hyoki_text);
    temp_dic_line.appendChild(hyoki);

    var yomi = document.createElement("td");
    var yomi_text = document.createTextNode(yomi_in);
    yomi.appendChild(yomi_text);
    temp_dic_line.appendChild(yomi);

    var omomi = document.createElement("td");
    var omomi_text = document.createTextNode(omomi_in);
    omomi.appendChild(omomi_text);
    temp_dic_line.appendChild(omomi);

    temp_dic_reg_list.appendChild(temp_dic_line);

    var hyoki_in = document.getElementById("temp_dic_hyoki").value = "";
    var yomi_in = document.getElementById("temp_dic_yomi").value = "";
    var omomi_in = document.getElementById("temp_dic_omomi").value = "";
}

//認識結果リセット
function reset_result(){
    remove_all_child("result_list");
}

//一時辞書登録単語リセット
function reset_temp_dic(){
    remove_all_child("temp_dic_reg_list")
}

//一時辞書登録単語削除
function remove_temp_dic(){
    document.getElementById(this.value).remove();
}

//出力設定リセット
function reset_settings(){
    document.getElementById("filler").checked = false;
    document.getElementById("reading").checked = false;
    document.getElementById("delimiter").checked = true;
    document.getElementById("punctuation").checked = false;
    document.getElementById("progress").checked = false;
    document.getElementById("max_results").value = 1;
}

//全角数字を半角数字に変換
function to_halfwidth(elm){
    return elm.replace(/[０-９]/g, function(s){
        return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
    });
}
