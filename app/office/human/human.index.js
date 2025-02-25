module.exports = [
    {
        nameCollection: "labor_contract",
        items: [
            {
                keys: { fullname: "text" },
                type: { language_override: "dummy",name:"tosearch_labor_contract" }
            }
        ]
    },
    {
        nameCollection: "employee",
        items: [
            {
                keys:{fullname: "text"},
                type: { language_override: "dummy" ,name:"tosearch_employee"}
            }
        ]
    },
    {
        nameCollection: "training_school",
        items: [
            {
                keys: { title: "text" },
                type: { language_override: "dummy",name:"tosearch_training_school" }
            }
        ]
    }
];