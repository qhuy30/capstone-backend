const city = require('./directory/city');
const country = require('./directory/country');
const district = require('./directory/district');
const ward = require('./directory/ward');
const village = require('./directory/village');
// const competence = require('./directory/competence');
const larbor_contract_type = require('./directory/larbor_contract_type');
const type_of_residence = require('./directory/type_of_residence');
const specialized = require('./directory/specialized');
const religion = require('./directory/religion');
const education = require('./directory/education');
const nationality = require('./directory/nationality');
const degree = require('./directory/degree');
const state_management = require('./directory/state_management');
const computer_skills = require('./directory/computer_skills');
const english_level = require('./directory/english_level');
const political_theory = require('./directory/political_theory');
const folk = require('./directory/folk');
const family_relationship = require('./directory/family_relationship');
const job = require('./directory/job');
const notifygroup = require('./directory/notify_group');
const kind_of_dispatch_to = require('./directory/kind_of_dispatch_to');
const incomming_dispatch_book = require('./directory/incomming_dispatch_book');
const leave_form_type = require('./directory/leave_form_type');
const document_type = require('./directory/document_type');
const status_of_signing = require('./directory/status_of_signing');
const incomming_dispatch_priority = require('./directory/incomming_dispatch_priority');
const method_of_sending_dispatch_to = require('./directory/method_of_sending_dispatch_to');
const leaving_form_approval_status = require('./directory/leaving_form_approval_status');
const task_priority = require('./directory/task_priority');
const task_type = require('./directory/task_type');
const outgoing_dispatch_book_type = require('./directory/outgoing_dispatch_book_type');
const function_apply = require('./directory/function_apply');
const room_type = require('./directory/room_type');
const role = require('./directory/role');
const directories =[
    city,country,district,ward,village,
    larbor_contract_type,type_of_residence,
    specialized,religion,education,nationality,
    degree,state_management,computer_skills,
    english_level,political_theory,folk,family_relationship,
    job,notifygroup,kind_of_dispatch_to,
    incomming_dispatch_book,leave_form_type,document_type,
    status_of_signing ,incomming_dispatch_priority,method_of_sending_dispatch_to,
    leaving_form_approval_status,task_priority,task_type,
    outgoing_dispatch_book_type,function_apply, room_type, role
];

var obj ={
    name:"directory",
    items:[]
};

for(var z in directories){
    for(var i in directories[z].items){
        obj.items.push({
            master_key: directories[z].name
        })
    
        for(var j in directories[z].items[i]){
            obj.items[obj.items.length-1][j] = directories[z].items[i][j];
        }
    }
}

module.exports = obj;

