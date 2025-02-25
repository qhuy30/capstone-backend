function generateObj(ar){
    let result ={};
    for (let i in ar){
        for (let j in ar[i]){
            result[j] =ar[i][j];
        }
    }
    return result;
}

const configAr =[
    require('./human.const')
]; 
module.exports = generateObj(configAr);