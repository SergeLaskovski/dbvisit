"use strict";

window.jsonData = {};

//check if JQuery is loaded
window.onload = function() {
    if (window.jQuery) { 
        //get data and render chart 
        getChartData();
        //add listener to add button
        $("#add-new-form").hide();
        $("#added-success").hide();
        $("body").on("click","main .add-new", function(){ addNew() });  
    } else {
        console.log("JQuery is not loaded");
    }
}

//render chart
function renderChart(jsonData) {

   
    if(typeof(jsonData.parameters) == 'undefined' || jsonData.parameters.length<1){
        showError("No parameters in JSON");
        return;
    }

    //sort array by param name
    jsonData.parameters = jsonData.parameters.sort(function(first,second){
        var a = first.name;
        var b = second.name;
    
        if(a > b) {
            return 1;
        } else if(a < b) {
            return -1;
        } else {
            return 0;
        }
    });

    //populate storage
    window.jsonData.parameters = jsonData.parameters.slice();


    const $container = $("#chart-container");
    var row = '';
    var editDisabledClass = '';
    var columnDisabledClass = '';

    $container.empty();

    $.map( jsonData.parameters, function( jsonDataItem, index ) {
        
        columnDisabledClass = '';
        editDisabledClass = '';
                
        if( typeof(jsonDataItem.value) == 'undefined' ){ jsonDataItem.value = ''; }
        
        if( jsonDataItem.disabled === true ){
            columnDisabledClass = ' value-disabled';
            editDisabledClass = ' is-invisible';
        }
        
        row =  '\
            <div class="columns is-vcentered chart-row" id="'+index+'">\
                <div class="column">'+jsonDataItem.name+'</div>\
                <div class="column">\
                    <div class="columns chart-value-area is-mobile'+columnDisabledClass+'">\
                        <div class="column-narrow chart-edit" id="edit-icon-'+index+'"><i class="material-icons hover-icon edit-icon'+editDisabledClass+'">edit</i></div>\
                        <div class="column chart-value" id="value-'+index+'">'+jsonDataItem.value+'</div>\
                        <div class="column-narrow is-mobile chart-del" id="del-'+index+'"><i class="material-icons hover-icon del-icon">delete</i></div>\
                    </div>\
                </div>\
            </div>\
        ';
        
        $container.append(row);

        if( jsonDataItem.disabled !== true ){
            //set event for editing value
            $("body").one("click","#value-"+index, function(){ editValue(index) });  
            $("body").one("click","#edit-icon-"+index, function(){ editValue(index) });          
        } else{
            $("body").off("click","#value-"+index);
            $("body").off("click","#edit-icon-"+index);
        }
        //set event for deleting value
        $("body").off('click',"#del-"+index);
        $("body").one("click","#del-"+index, function(){ deleteRow(index) });         

    });

 
}

//get JSON data from source
function getChartData(){

    $.getJSON( "data.txt", function(data) {
        window.jsonData = data;
        renderChart(data)
    })
    .fail(function() {
        showError( "No valid JSON" );
    });    
}

function editValue(index){
    const $container = $("#value-"+index);
    var valueToEdit = window.jsonData.parameters[index]['value'];
    var inputField = '\
        <div class="value-editor">\
            <input type="text" value="'+valueToEdit+'">\
            <div class="buttons is-centered">\
                <button class="button is-success" onClick="saveValue('+index+')">Save</button>\
                <button class="button is-info" onClick="closeValueEditor('+index+',\''+valueToEdit+'\')">Close</button>\
            </div>\
        </div>\
    ';

    $("main").addClass('disabled');
    $container.empty().append(inputField);
    //sanitize VALUE input 'on the fly'
    $container.find("input").on("input", function(){
        $(this).val( sanitizeString($(this).val()) );
    })

}

function closeValueEditor(index,value){
    const $container = $("#value-"+index);
    $container.empty().append(value);
    $("main").removeClass('disabled');
    $("body").one("click","#value-"+index, function(){ editValue(index) }) 
    $("body").one("click","#edit-icon-"+index, function(){ editValue(index) });   
}

function saveValue(index){
    /*call back-end API to save data here
        Some AJAX function to save data in backend 
        On success do the rest
    */

    const $container = $("#value-"+index);
    var newVal = $container.find("input").val();
    newVal = sanitizeString(newVal);

    //save new value to our storage
    window.jsonData.parameters[index]['value'] = newVal;
    
    closeValueEditor(index,newVal);
}

function deleteRow(index){

    var r = confirm("Do you really want to delete\n"+window.jsonData.parameters[index]['name']+"?");
    if (r === false) { 
        $("body").one("click","#del-"+index, function(){ deleteRow(index) });
        return;
    } 
    
     /*call back-end API to delete data here
        Some AJAX function to deete data in backend 
        On success do the rest
    */

    //delete from local storage
    window.jsonData.parameters.splice(index, 1);

    //rerender chart
    renderChart(window.jsonData);
}

function addNew(){
    //open form
    $("#add-new-form").slideToggle();
    //add listener on close button
    $("#add-new-form #add-close").off("click").on("click", function(){
        $("#add-new-form").slideToggle();
    });
    //sanitize NAME input 'on the fly'
    $("input[name=add-name]").on("input", function(){
        $(this).val( sanitizeNewName($(this).val()) );
    })
    //sanitize VALUE input 'on the fly'
    $("input[name=add-value]").on("input", function(){
        $(this).val( sanitizeString($(this).val()) );
    })

    //add event listener to SAVE button
    $("#add-new-form #add-save").off("click").on("click", function(){
        saveNew();
    });
}

function saveNew(){
    //check if NAME exists
    var name = $("input[name=add-name]").val();
    var value = $("input[name=add-value]").val();
    
    if( name.length<1 ){
        alert("NAME can't be empty");
        return;
    }

    value = sanitizeString(value);

    /*AJAX call for back-end function to save new data here
    on success do following*/


    //close and empty add form
    $("input[name=add-name]").val('');
    $("input[name=add-value]").val('');
    $("#add-new-form").slideToggle();

    //update ur local storage
    window.jsonData.parameters.unshift({"name":name,"value":value});

    //show success message
    $("#added-success").slideToggle();
    setTimeout(function(){
        $("#added-success").slideToggle();
    },3000)
    //rerender chart
    renderChart(window.jsonData);

}

function sanitizeString(str){
    //Just basic sanitazation, as I don't know the demands for values
    return str.replace(/[^0-9a-z-A-Z \/\-_!?\\,.:]/g, "").replace(/ +/, " ");
}

function sanitizeNewName(str){
    str = str.replace(" ","_");
    str = str.replace(/[^a-z0-9 _-]/gim,"");
    return str.toUpperCase().trim();
}

//helper function to handle error messages
function showError(msg){
    console.log(msg);
}