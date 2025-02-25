module.exports = [
    {
        nameCollection: "notify",
        items: [
            {
                keys: { title: "text",title_search: "text"},
                type: { language_override: "dummy" ,name: "tosearch_notify"}
            },
            {
                keys: { type: 1, status: 1, watched: 1 }
            },
            {
                keys: { type: 1, watched: 1 }
            },
            {
                keys: { type: 1, receiver: 1 }
            }
        ]
    }
];