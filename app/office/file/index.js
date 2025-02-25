module.exports = [
    {
        nameCollection: 'file',
        items: [
            {
                keys: { name: 'text', name_search: 'text' },
                type: { language_override: 'dummy', name: 'tosearch_file' },
            },
            {
                keys: { username: 1, employee: 1 },
            },
            {
                keys: { from_date: 1, last_update_date: 1 },
            },
            {
                keys: { path: 1 },
            },
            {
                keys: { type: 1 },
            },
            {
                keys: { share: 1 },
            },
        ],
    },
];
