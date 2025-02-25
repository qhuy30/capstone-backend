module.exports = [
    { path: "/utilities_tools/pdf_to_excel", router: require('./pdf_to_excel/router') },
    { path: "/utilities_tools/remove_pdf", router: require('./remove_pdf/router') },
    { path: "/utilities_tools/calculate_dimensions", router: require('./calculate_dimensions/router') },
]