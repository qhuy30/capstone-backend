module.exports = {
    name: "outgoing_dispatch_book_type",
    items: [
        {
            "title" : {
                "vi-VN":"Loại sổ giành cho văn bản là công văn",
                "en-US":"Type of book for documents is official dispatch",
            },
            "value" : "sogianhchovanbanlacongvan",
            "ordernumber":1,
            "isactive" : true
        },
        {
            "title" : {
                "vi-VN":"Loại sổ riêng cho từng loại văn bản được phát hành số lượng lớn",
                "en-US":"A separate register for each type of document issued in large quantities",
            },
            "value" : "loaisoriengchotungloaivanbanduocphathanhsoluonglon",
            "ordernumber":2,
            "isactive" : true
        },
        {
            "title" : {
                "vi-VN":"Loại sổ chung cho các loại văn bản không phải là công văn và được phát hành số lượng nhỏ",
                "en-US":"A general register for types of documents that are not official dispatches and are issued in small quantities",
            },
            "value" : "loaisochungchocacloaivanbankhongphailacongvanvaduocphathanhsoluongnho",
            "ordernumber":3,
            "isactive" : true
        }
    ]
}