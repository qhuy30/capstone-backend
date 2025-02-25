module.exports = {
    name: "master_directory",
    items: [
        {
            ordernumber: 1,
            title: {
                "vi-VN": "Quốc gia",
                "en-US": "Country"
            },
            key: "country",
            title_to_search: "quoc gia"
        },
        {
            ordernumber: 2,
            title: {
                "vi-VN": "Thành phố",
                "en-US": "City"
            },
            key: "city",
            extend: [
                {
                    "name": "parent",
                    "control": "pick_modal",
                    "master_key": "country",
                    "load_details_column": "value"
                }
            ],
            title_to_search: "thanh pho"
        },
        {
            ordernumber: 3,
            title: {
                "vi-VN": "Quận",
                "en-US": "District"
            },
            key: "district",
            extend: [
                {
                    "name": "parent",
                    "control": "pick_modal",
                    "master_key": "city",
                    "load_details_column": "value"
                }
            ],
            title_to_search: "quan"
        },
        {
            ordernumber: 4,
            title: {
                "vi-VN": "Phường",
                "en-US": "Ward"
            },
            key: "ward",
            extend: [
                {
                    "name": "parent",
                    "control": "pick_modal",
                    "master_key": "district",
                    "load_details_column": "value"
                }
            ],
            title_to_search: "phuong"
        },
        {
            ordernumber: 5,
            title: {
                "vi-VN": "Thôn, Làng",
                "en-US": "Village"
            },
            key: "ward",
            extend: [
                {
                    "name": "parent",
                    "control": "pick_modal",
                    "master_key": "ward",
                    "load_details_column": "value"
                }
            ],
            title_to_search: "thon lang"
        },

        {
            ordernumber: 6,
            title: {
                "vi-VN": "Chức vụ",
                "en-US": "Competence"
            },
            key: "competence",
            title_to_search: "chuc vu",
            extend: [
                {
                    "name": "level",
                    "control": "number"
                }
            ],
        },
        {
            ordernumber: 7,
            title: {
                "vi-VN": "Loại hợp đồng lao động",
                "en-US": "Larbor contract type"
            },
            key: "larbor_contract_type",
            title_to_search: "loai hop dong lao dong"
        },
        {
            ordernumber: 8,
            title: {
                "vi-VN": "Trường đào tạo",
                "en-US": "School"
            },
            key: "school",
            title_to_search: "truong dao tao"
        },
        {
            ordernumber: 9,
            title: {
                "vi-VN": "Loại hình cư trú",
                "en-US": "Type of residence"
            },
            key: "type_of_residence",
            title_to_search: "loai hinh cu tru"
        },
        {
            ordernumber: 10,
            title: {
                "vi-VN": "Chuyên ngành",
                "en-US": "Specialized"
            },
            key: "specialized",
            title_to_search: "chuyen nganh"
        },
        {
            ordernumber: 11,
            title: {
                "vi-VN": "Quốc tịch",
                "en-US": "Nationality"
            },
            key: "nationality",
            title_to_search: "quoc tich"
        },
        {
            ordernumber: 12,
            title: {
                "vi-VN": "Tôn giáo",
                "en-US": "Religion"
            },
            key: "religion",
            title_to_search: "ton giao"
        },
        {
            ordernumber: 13,
            title: {
                "vi-VN": "Học vấn",
                "en-US": "Education"
            },
            key: "education",
            title_to_search: "hoc van"
        },
        {
            ordernumber: 14,
            title: {
                "vi-VN": "Trình độ",
                "en-US": "Degree"
            },
            key: "degree",
            title_to_search: "trinh do"
        },
        {
            ordernumber: 15,
            title: {
                "vi-VN": "Quản lý nhà nước",
                "en-US": "State management"
            },
            key: "state_management",
            title_to_search: "quan ly nha nuoc"
        },
        {
            ordernumber: 16,
            title: {
                "vi-VN": "Trình độ tin học",
                "en-US": "computer skills"
            },
            key: "computer_skills",
            title_to_search: "trinh do tin hoc"
        },
        {
            ordernumber: 17,
            title: {
                "vi-VN": "Trình độ anh văn",
                "en-US": "English level"
            },
            key: "english_level",
            title_to_search: "trinh do anh van"
        },
        {
            ordernumber: 18,
            title: {
                "vi-VN": "Lý luận chính trị",
                "en-US": "Political theory"
            },
            key: "political_theory",
            title_to_search: "ly luan chinh tri"
        },
        {
            ordernumber: 19,
            title: {
                "vi-VN": "Dân tộc",
                "en-US": "Folk"
            },
            key: "folk",
            title_to_search: "dan toc"
        },
        {
            ordernumber: 20,
            title: {
                "vi-VN": "Mối quan hệ gia đình",
                "en-US": "Family relationship"
            },
            key: "family_relationship",
            title_to_search: "moi quan he gia dinh"
        },
        {
            ordernumber: 21,
            title: {
                "vi-VN": "Nghề nghiệp",
                "en-US": "Job"
            },
            key: "job",
            title_to_search: "nghe nghiep"
        },
        {
            ordernumber: 22,
            title: {
                "vi-VN": "Nhóm thông báo",
                "en-US": "Notify Group"
            },
            key: "notify_group",
            title_to_search: "nhom thong bao"
        },
        {
            ordernumber: 23,
            title: {
                "vi-VN": "Loại công văn",
                "en-US": "Kind of dispatch to"
            },
            key: "kind_of_dispatch_to",
            title_to_search: "loai cong van",
            extend: [
                {
                    "name": "abbreviation",
                    "control": "text_box",
                }
            ]
        },
        {
            ordernumber: 24,
            title: {
                "vi-VN": "Sổ công văn đến",
                "en-US": "Incomming Dispatch book"
            },
            key: "incomming_dispatch_book",
            title_to_search: "so cong van den"
        },
        {
            ordernumber: 25,
            title: {
                "vi-VN": "Loại đơn nghỉ phép",
                "en-US": "Leave form type"
            },
            key: "leave_form_type",
            title_to_search: "loai don nghi phep"
        },
        {
            ordernumber: 26,
            title: {
                "vi-VN": "Loại quy trình trình ký",
                "en-US": "Workflow type"
            },
            key: "document_type",
            title_to_search: "loai quy trinh trinh ky",
            extend: [
                {
                    "name": "abbreviation",
                    "control": "text_box",
                }
            ]
        },
        {
            ordernumber: 27,
            title: {
                "vi-VN": "Trình trạng việc trình ký",
                "en-US": "Status of signing"
            },
            key: "status_of_signing",
            title_to_search: "tinh trang viec trinh ky"
        },
        {
            ordernumber: 28,
            title: {
                "vi-VN": "Phương thức gửi công văn đến",
                "en-US": "method of sending dispatch to"
            },
            key: "method_of_sending_dispatch_to",
            title_to_search: "phuong thuc gui cong van den"
        },
        {
            ordernumber: 29,
            title: {
                "vi-VN": "Độ ưu tiên công văn đến",
                "en-US": "Incomming dispatch priority"
            },
            key: "incomming_dispatch_priority",
            title_to_search: "Độ ưu tiên công văn đến"
        },
        {
            ordernumber: 30,
            title: {
                "vi-VN": "Trạng thái phê duyệt đơn nghỉ phép",
                "en-US": "Leaving form approval status"
            },
            key: "leaving_form_approval_status",
            title_to_search: "trang thai phe duyet don nghi phep"
        },
        {
            ordernumber: 31,
            title: {
                "vi-VN": "Vai trò",
                "en-US": "Role"
            },
            key: "role",
            title_to_search: "vai tro"
        },
        {
            ordernumber: 32,
            title: {
                "vi-VN": "Biểu tượng",
                "en-US": "Icon"
            },
            key: "icon",
            title_to_search: "bieu tuong"
        },
        {
            ordernumber: 33,
            title: {
                "vi-VN": "Độ ưu tiên",
                "en-US": "Priority"
            },
            key: "task_priority",
            title_to_search: "do uu tien"
        },
        {
            ordernumber: 34,
            title: {
                "vi-VN": "Sổ công văn đi",
                "en-US": "Going Dispatch book"
            },
            key: "outgoing_dispatch_book",
            title_to_search: "so cong van di",
            extend: [
                {
                    "name": "number_and_notation",
                    "label": "NumberAndNotation",
                    "control": "text_box"
                },
                {
                    "name": "document_type",
                    "label": "Document type",
                    "control": "pick_modal_directory_multi",
                    "master_key": "document_type",
                    "load_details_column": "value",
                    "required": false
                },
                {
                    "name": "year",
                    "label": "Year",
                    "control": "year"
                },
                {
                    "name": "outgoing_dispatch_book_type",
                    "label": "Going dispatch book type",
                    "control": "pick_modal",
                    "master_key": "outgoing_dispatch_book_type",
                    "load_details_column": "value"
                }
            ],
        },
        {
            ordernumber: 36,
            title: {
                "vi-VN": "Loại công việc",
                "en-US": "Task type"
            },
            key: "task_type",
            title_to_search: "loai cong viec"
        },
        {
            ordernumber: 37,
            title: {
                "vi-VN": "Kho lưu trữ",
                "en-US": "Archive"
            },
            key: "storage_name",
            title_to_search: "kho luu tru"
        },
        {
            ordernumber: 38,
            title: {
                "vi-VN": "Loại sổ công văn đi",
                "en-US": "Going dispatch book type"
            },
            key: "outgoing_dispatch_book_type",
            title_to_search: "loai so cong van di"
        },
        {
            ordernumber: 39,
            title: {
                "vi-VN": "Chức năng áp dụng",
                "en-US": "Function apply"
            },
            key: "function_apply",
            title_to_search: "chuc nang ap dung"
        },
        {
            ordernumber: 39,
            title: {
                "vi-VN": "Giá trị gợi ý",
                "en-US": "Suggest value"
            },
            key: "suggest_value",
            title_to_search: "gia tri goi y",
            extend: [
                {
                    "name": "function_apply",
                    "label": "functionApply",
                    "control": "pick_modal_directory_multi",
                    "master_key": "function_apply",
                    "load_details_column": "value"
                },
                {
                    "name": "choose_color",
                    "label": "chooseColor",
                    "control": "color_input",
                }
            ],
        },
        {
            ordernumber: 40,
            title: {
                "vi-VN": "Phòng họp",
                "en-US": "Meeting room"
            },
            key: "meeting_room",
            title_to_search: "phong hop",
            extend: [
                { "name": "description", "label": "Description", "control": "text_box", "required": true },
                { "name": "code", "label": "RoomCode", "control": "text_box", "required": true },
                { "name": "size", "label": "Size", "control": "number", "required": true },
                {
                    "name": "room_type",
                    "label": "RoomType",
                    "control": "pick_modal",
                    "master_key": "room_type",
                    "load_details_column": "value",
                    "required": true
                }
            ]
        },
        {
            ordernumber: 41,
            title: {
                "vi-VN": "Loại phòng họp",
                "en-US": "Meeting room type"
            },
            key: "room_type",
            title_to_search: "loai phong hop"
        },
        {
            ordernumber: 42,
            title: {
                "vi-VN": "Danh sách xe",
                "en-US": "Car list"
            },
            key: "vehicle_list",
            title_to_search: "danh sach xe"
        },
        {
            ordernumber: 43,
            title: {
                "vi-VN": "Danh sách địa điểm",
                "en-US": "Location list"
            },
            key: "location_list",
            title_to_search: "danh sach dia diem"
        },
        {
            ordernumber: 44,
            title: {
                "vi-VN": "Danh sách thẻ tín dụng",
                "en-US": "Credit card list"
            },
            key: "card_list",
            title_to_search: "danh sach thẻ tin dung",
            extend: [
                { "name": "status", "control": "boolean", "label": "Status" },
                { "name": "number_card", "control": "number", "label": "NumberCard" }
            ]
        },
        {
            ordernumber: 45,
            title: {
                "vi-VN": "Danh sách tài xế",
                "en-US": "Driver list"
            },
            key: "driver_list",
            title_to_search: "danh sach the tin dung",
            extend: [
                { name: 'drivername', control: 'text_box' },
                { name: 'phonenumber', control: 'number' },
            ]
        },
        {
            ordernumber: 46,
            title: {
                "vi-VN": "Trạng thái lưu trữ",
                "en-US": "Storage state"
            },
            key: "storage_state",
            title_to_search: "trang thai luu tru",
            extend: []
        },
        {
            ordernumber: 47,
            title: {
                "vi-VN": "Danh mục hồ sơ lưu trữ năm 2024",
                "en-US": "Archives catalog 2024"
            },
            key: "archives_catalog_2024",
            title_to_search: "dang muc ho so luu tru nam 2024",
            extend: []
        },
        {
            ordernumber: 48,
            title: {
                "vi-VN": "Lĩnh vực",
                "en-US": "Field"
            },
            key: "field",
            title_to_search: "linh vuc",
            extend: []
        },
    ]
};
