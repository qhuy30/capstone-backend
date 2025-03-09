module.exports = [
    {
        nameCollection: "elearning",
        items: [
            {
                keys:{title: "text" ,title_search:"text", code:"text"},
                type:{language_override: "dummy",name: "tosearch_elearning"}
            },
            {
                keys:{ username: 1, employee: 1}
            },
            {
                keys: {  main_person: 1  }
            },
            {
                keys:{ participant: 1}
            },
            {
                keys:{ observer: 1}
            },
            {
                keys:{status: 1}
            },
            {
                keys:{from_date: 1, to_date: 1}
            },
            {
                keys:{source_id: 1}
            }
        ]
    }
];