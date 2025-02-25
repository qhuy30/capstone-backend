var trycatch = require('trycatch');
var crypto = require('crypto-js');
var setting = require('../../utils/setting');
/**LOGIC */
var logic  ={};
logic.algorithm={};
logic.algorithm.parseData = function(options,data){
    let temp  =logic.algorithm.copyValue(data);
    for (var i in temp){
        for (var j in options){
            switch(options[j].v_type){
                case "Number":
                temp[i][j]= parseFloat(temp[i][j]);
                break;
                case "Date":
                    let d  = new Date(temp[i][j]);
                    temp[i][j]  = logic.algorithm.numberToString(d.getDate())+ "/" 
                    +logic.algorithm.numberToString(d.getMonth()+1)+"/"
                    +d.getFullYear()+" "
                    +logic.algorithm.numberToString(d.getHours())+ ":" 
                    +logic.algorithm.numberToString(d.getMinutes())+ ":" 
                    +logic.algorithm.numberToString(d.getSeconds());

                break;
            }
        }
    }
    return temp;
}

logic.algorithm.checkCondition = function(item,condition){
    if (condition.$or){
        let resultAr =[];
        for (var i in condition.$or){
            resultAr.push(checkCondition(item,condition.$or[i]));
        }
        for(var i in resultAr){
            if(resultAr[i]){
                item = undefined;
                condition = undefined;
                resultAr = undefined;
                return true;}
        }
        item = undefined;
        condition = undefined;
        resultAr = undefined;
        return false;
    }

    if(condition.$and){
        let resultAr =[];
        for (var i in condition.$and){
            resultAr.push(checkCondition(item,condition.$and[i]));
        }
        for(var i in resultAr){
            if(!resultAr[i]){
                item = undefined;
                condition = undefined;
                resultAr = undefined;
                return false;
            }
        }
        item = undefined;
        condition = undefined;
        resultAr = undefined;
        return true;
    }
    let field = logic.algorithm.getPropertyByIndex(condition,0);
    let operator = logic.algorithm.getPropertyByIndex(condition[field],0);

    //needed optimize this algorithm!!!!
    switch(operator){
        case "$eq":
            if(logic.algorithm.getValueOfProperty(item,field) == condition[field][operator]){
                item = undefined;
                condition = undefined;
                resultAr = undefined;
                field = undefined;
                operator = undefined;
                return true;
            }else{
                item = undefined;
                condition = undefined;
                resultAr = undefined;
                field = undefined;
                operator = undefined;
                return false;
            } 
        break;
        case "$gt":
            if(logic.algorithm.getValueOfProperty(item,field) > condition[field][operator]){
                item = undefined;
                condition = undefined;
                resultAr = undefined;
                field = undefined;
                operator = undefined;
                return true;
            }else{
                item = undefined;
                condition = undefined;
                resultAr = undefined;
                field = undefined;
                operator = undefined;
                return false;
            } 
        break;
        case "$gte":
            if(logic.algorithm.getValueOfProperty(item,field) >= condition[field][operator]){
                item = undefined;
                condition = undefined;
                resultAr = undefined;
                field = undefined;
                operator = undefined;
                return true;
            }else{
                item = undefined;
                condition = undefined;
                resultAr = undefined;
                field = undefined;
                operator = undefined;
                return false;
            } 
        break;
        case "$lt":
            if(logic.algorithm.getValueOfProperty(item,field) < condition[field][operator]){
                item = undefined;
                condition = undefined;
                resultAr = undefined;
                field = undefined;
                operator = undefined;
                return true;
            }else{
                item = undefined;
                condition = undefined;
                resultAr = undefined;
                field = undefined;
                operator = undefined;
                return false;
            } 
        break;
        case "$lte":
            if(logic.algorithm.getValueOfProperty(item,field) <= condition[field][operator]){
                item = undefined;
                condition = undefined;
                resultAr = undefined;
                field = undefined;
                operator = undefined;
                return true;
            }else{
                item = undefined;
                condition = undefined;
                resultAr = undefined;
                field = undefined;
                operator = undefined;
                return false;
            } 
        break;
        case "$ne":
            if(logic.algorithm.getValueOfProperty(item,field) != condition[field][operator]){
                item = undefined;
                condition = undefined;
                resultAr = undefined;
                field = undefined;
                operator = undefined;
                return true;
            }else{
                item = undefined;
                condition = undefined;
                resultAr = undefined;
                field = undefined;
                operator = undefined;
                return false;
            } 
        break;
        case "$in":
            if(logic.validate.checkValueInArray('',logic.algorithm.getValueOfProperty(item,field),condition[field][operator]).status){
                item = undefined;
                condition = undefined;
                resultAr = undefined;
                field = undefined;
                operator = undefined;
                return true;
            }else{
                item = undefined;
                condition = undefined;
                resultAr = undefined;
                field = undefined;
                operator = undefined;
                return false;
            } 
        break;
        case "$nin":
            if(!logic.validate.checkValueInArray('',logic.algorithm.getValueOfProperty(item,field),condition[field][operator]).status){
                item = undefined;
                condition = undefined;
                resultAr = undefined;
                field = undefined;
                operator = undefined;
                return true;
            }else{
                item = undefined;
                condition = undefined;
                resultAr = undefined;
                field = undefined;
                operator = undefined;
                return false;
            } 
        break;
    }
}
logic.algorithm.filterData = function(data,query,bussiness){
    let tempFilter =[];

    if (query.filter && !bussiness){
        for (var i in data){
            if(logic.algorithm.checkCondition(data[i],query.filter)){
                tempFilter.push(data[i]);
            }
        }
    }else{
        tempFilter = logic.algorithm.copyValue(data);
    }
 
    let tempSort = tempFilter;
    if (query.sort && logic.algorithm.countPropertyObject(query.sort)>0){
        for (var i =0;i<tempSort.length;i++){
            let max ={
                val:logic.algorithm.copyValue(tempSort[i]),
                index:i
            };
            for (var j =i+1;j<tempSort.length;j++ ){
                for(var z in query.sort){
                    if (query.sort[z] ===1){
                        if (typeof max.val[z] !="undefined" 
                            && typeof max.val[z] !="undefined" ){
                                if(typeof tempSort[j][z] !="undefined" 
                                && typeof tempSort[j][z] !="undefined"){
                                    if(max.val[z]>tempSort[j][z]){
                                        max.val =logic.algorithm.copyValue(tempSort[j]);
                                        max.index =j;
                                        break;
                                    }
                                }else{
                                    max =tempSort[j];
                                    break;
                                }
                        }
                    }else{
                        if (typeof max.val[z] !="undefined" 
                            && typeof max.val[z] !="undefined" ){
                                if(typeof tempSort[j][z] !="undefined" 
                                && typeof tempSort[j][z] !="undefined"){
                                    if(max.val[z]<tempSort[j][z]){
                                        max.val =logic.algorithm.copyValue(tempSort[j]);
                                        max.index =j;
                                        break;
                                    }
                                }
                        }else{
                            if(typeof tempSort[j][z] !="undefined" 
                            && typeof tempSort[j][z] !="undefined"){
                                    max.val =logic.algorithm.copyValue(tempSort[j]);
                                    max.index =j;
                                    break;
                            }
                        }
                    }
                    if (max.val[z]!== tempSort[j][z]){break;}
                }
            }
            tempSort[max.index] = logic.algorithm.copyValue(tempSort[i]);
            tempSort[i] = logic.algorithm.copyValue(max.val);
        }
    }

    let result =[];
    for (var i =(query.offset||0); i<tempSort.length;i++){
        if (!query.top || query.top==0){
            result.push(tempSort[i]);
        }else{
            if (result.length<query.top){
                result.push(tempSort[i]);
            }else{
                break;
            }
        }
    }
    tempFilter =undefined;
    tempSort = undefined;
    return result;
}
logic.algorithm.genInsertQuery = function(collection,item){
    let queryInsert ="INSERT INTO "+setting.data.connect.or.userSchema+"."+ collection +" (";

    let count = 1;
    for (var i in item){
        queryInsert +=i;
        if (count<logic.algorithm.countPropertyObject(item) ){
            queryInsert+= ", ";
        }
        count++;
    }
    queryInsert+= ")";
    queryInsert+=  " VALUES (";
    count =1;
    for (var i in item){
        queryInsert +=":"+i;
        if (count<logic.algorithm.countPropertyObject(item) ){
            queryInsert+= ", ";
        }
        count++;
    }
    queryInsert+= ")";
    count = undefined;
    collection = undefined ; 
    item = undefined ;
    return queryInsert;
}
logic.algorithm.getPropertyByIndex = function(obj,index){
    let temp  =[];
    for (var i in obj){
        temp.push(i);
    }
    return temp[index];
}
logic.algorithm.getValueOfProperty = function(obj,field){
    let ar  = field.split(".");
    for (var i in ar){
        if(obj[ar[i]]){
            obj = obj[ar[i]];
        }else{
            return undefined;
        }
    }
    ar = undefined;
    return obj;
}
logic.algorithm.subArray = function(ar,key,val){
    if (!ar || !key || !val){return [];}
    let temp =[];
    for (var i in ar){
        if (ar[i][key] ==val){
            temp.push(ar[i]);
        }
    }
    return temp;
}
logic.algorithm.countPropertyObject = function(obj){
    let count  = 0 ;
    for (var i in obj){
        count ++;
    }
    return count;
}
logic.algorithm.getIndexByPropertyObject = function(proper,obj){
    let count =0;
    for (var i in obj){
        if (proper == i){
            return count;
        }
        count ++;
    }
    return -1;
}
logic.algorithm.numberToString = function(val){
    if (val<10){return "0"+val.toString()}
    else{ return val.toString();}
}

logic.algorithm.getNow = function(){
    var ddd = new Date();
    return ddd.getTime();
}
logic.algorithm.convertToNumber = function(val) {
    var data = ["", "", "hai", "ba", "bon", "nam", "sau"];
    return data[val];
}
logic.algorithm.onlyUnique = function(value, index, self) { 
    return self.indexOf(value) === index;
}
logic.algorithm.daysInMonth = function(month,year){
    return new Date(year, month, 0).getDate();
}
logic.algorithm.removeUTF8 =function (input) {
    if (!input) { return ""; }
    var str = input;
    str = str.toLowerCase();
    str = str.replace(/ /g, "-");
    str = str.replace(/'|"|`\~|\?|/g, "");
  
    str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
    str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
    str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
    str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
    str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
    str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
    str = str.replace(/đ/g, "d");
    return str;
}
logic.algorithm.copyValue = function(value){
    return JSON.parse(JSON.stringify(value));
}
logic.algorithm.copyProperty = function(obj1,obj2){
    let temp = logic.algorithm.copyValue(obj2);
    for (var i in temp){
        obj1[i] = temp[i];
    }
    return logic.algorithm.copyValue(obj1);
}
logic.algorithm.findChildItems = function(id,array){
    let temp  =[];
    for (var i in array){
        if (array[i].parentid == id){
            temp.push(array[i]);
        }
    }
    if (temp.length>0){
        let temp2=[];
        for (var i in temp){
            temp2 = temp2.concat(logic.algorithm.findChildItems(temp[i].id,array));
        }
        temp = temp.concat(temp2);
    }
    temp2 = undefined;
    return temp;
}
logic.algorithm.genContext = function(context){
   return  crypto.AES.encrypt(JSON.stringify(context), setting.secretkey).toString();
}
logic.algorithm.readContext = function(context){
    return JSON.parse(crypto.AES.decrypt(context, setting.secretkey).toString(crypto.enc.Utf8));
}

module.exports = logic;