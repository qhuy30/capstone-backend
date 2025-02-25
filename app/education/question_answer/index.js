module.exports = [
    {
        nameCollection: 'frequently_questions',
        items: [
            {
                keys: { question: 'text' },
                type:{ language_override: "dummy",name: "tosearch_frequently_questions" }
            },
            {
                keys: { create_date: 1 },
            },
        ],
    },
    {
        nameCollection: 'types_question',
        items: [
            {
                keys: { title_vi: 'text', title_en: 'text' },
                type:{ language_override: "dummy", name: "tosearch_types_question" }
            },
            {
                keys: { create_date: 1 },
            },
        ],
    },
];
