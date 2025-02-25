var fs =require('fs');
var { TemplateHandler } =require('easy-template-x');
const q = require('q');
const {DoxsConst} = require('./const');
class DocxProvider{
    constructor(){}

    readTemplate(path){
        let dfd = q.defer();
        fs.readFile(DoxsConst.path+path,(err,data)=>{
            if(err){
                dfd.reject({path:"DocxProvider.readTemplate.readError",err:err.toString()});
            }else{
                dfd.resolve(data);
            }
        });
        return dfd.promise;
    }


    createFileWithTemplate(template,data){
        let dfd  = q.defer();
        const handler = new TemplateHandler();
        handler.process(template, data).then(function(data){
            dfd.resolve(data);
        },function(err){
            dfd.reject({path:"DocxProvider.createFileWithTemplate.createFileError",err:err.toString()});
        });;
        return dfd.promise;
    }

    writeFile(doc){
        let dfd  = q.defer();
        fs.writeFile('myTemplate - output.docx', doc,(err,data)=>{
            if(err){
                dfd.reject({path:"DocxProvider.writeFile.writeFileError",err:err.toString()});
            }else{
                dfd.resolve(data);
            }
        });
        return dfd.promise;
    }

    generateFile(path,data){
       let dfd  = q.defer();
       let thisObj = new DocxProvider();
       thisObj.readTemplate(path).then(function(template){
        thisObj.createFileWithTemplate(template,data).then(function(res){
            dfd.resolve(res);
        },function(err){
            dfd.reject(err);
        });
       },function(err){
            dfd.reject(err);
       });
       return dfd.promise; 
    }
}

exports.DoxsProvider= new DocxProvider();