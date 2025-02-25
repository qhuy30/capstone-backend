
const crypto = require('crypto');
const NodeRSA = require('node-rsa');
const pepper = "chuchimnon"
const fs = require('fs');
const forge = require('node-forge');
const path = require('path');
const { SignPdf } = require('node-signpdf');

var plainAddPlaceholder = require('@signpdf/placeholder-plain').plainAddPlaceholder;
var signpdf = require('@signpdf/signpdf').default;
var P12Signer = require('@signpdf/signer-p12').P12Signer;

// Tổng hợp các bước ( chỉ mới tạo ra chữ ký và ký nhiều chữ ký trên 1 file, chưa thêm hình chữ ký vào)
// 1) tạo cặp key
// 2) tạo file pfx từ key
// 3) tạo cert từ pfx 
// 4) ký bằng pfx 



const signer = new SignPdf();
// Tạo cặp khóa RSA
function generateKeyPair(userInfo) {
  const key = new NodeRSA({ b: 2048 });
  return {
    publicKey: key.exportKey('public'),
    privateKey: key.exportKey('private'),
    userInfo
  };
}

function generateSalt() {
  return crypto.randomBytes(16).toString('hex');
}

function createDigitalSignature(data, privateKey) {
  const salt = generateSalt();
  const sign = crypto.createSign('SHA256');
  const dataToSign = `${salt}${data}${pepper}`;
  sign.update(dataToSign);
  return sign.sign(privateKey, 'base64');

}

function verifyDigitalSignature(salt, data, signature, publicKey) {
  const verify = crypto.createVerify('SHA256');
  const dataToSign = `${salt}${data}${pepper}`;
  verify.update(dataToSign);
  return verify.verify(publicKey, signature, 'base64');
}

const key = generateKeyPair({ full_name: "Trịnh Quốc Văn", "username": "tqvspo" });
// const userKey = createDigitalSignature(JSON.stringify({ full_name: "Trịnh Quốc Văn", "username": "tqvspo" }), key.privateKey);


function createPfx(
  commonName,
  countryName,
  stateOrProvinceName,
  localityName,
  organizationName,
  organizationalUnitName,
  emailAddress,
  password,
  outputPath,

) {
  const keys = forge.pki.rsa.generateKeyPair(2048);
  // Tạo chứng chỉ
  const cert = forge.pki.createCertificate();
  cert.publicKey = keys.publicKey;
  cert.serialNumber = '01';
  cert.validity.notBefore = new Date();
  cert.validity.notAfter = new Date();
  cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);

  const attrs = [{
    name: 'commonName',
    value: commonName
  }, {
    name: 'countryName',
    value: countryName
  }, {
    shortName: 'ST',
    value: stateOrProvinceName
  }, {
    name: 'localityName',
    value: localityName
  }, {
    name: 'organizationName',
    value: organizationName
  }, {
    shortName: 'OU',
    value: organizationalUnitName
  }];

  cert.setSubject(attrs);
  cert.setIssuer(attrs);

  // Thiết lập các thuộc tính mở rộng
  cert.setExtensions([{
    name: 'basicConstraints',
    cA: true
  }, {
    name: 'keyUsage',
    keyCertSign: true,
    digitalSignature: true,
    nonRepudiation: true,
    keyEncipherment: true,
    dataEncipherment: true
  }, {
    name: 'extKeyUsage',
    serverAuth: true,
    clientAuth: true,
    codeSigning: true,
    emailProtection: true,
    timeStamping: true
  }, {
    name: 'nsCertType',
    client: true,
    server: true,
    email: true,
    objsign: true,
    sslCA: true,
    emailCA: true,
    objCA: true
  }, {
    name: 'subjectAltName',
    altNames: [{
      type: 6, // URI
      value: 'http://example.org/webid#me'
    }, {
      type: 7, // IP
      ip: '127.0.0.1'
    }]
  }]);

  // Tự ký chứng chỉ
  cert.sign(keys.privateKey, forge.md.sha256.create());

  // Tạo PKCS12 (PFX)
  const pkcs12Asn1 = forge.pkcs12.toPkcs12Asn1(
    keys.privateKey,
    cert,
    password,
    {
      friendlyName: 'My Self-Signed Certificate',
      generateLocalKeyId: true,
      algorithm: '3des'
    }
  );

  const pkcs12Der = forge.asn1.toDer(pkcs12Asn1).getBytes();

  // Ghi file PFX
  fs.writeFileSync(outputPath, Buffer.from(pkcs12Der, 'binary'));

  console.log(`File PFX đã được tạo tại: ${outputPath}`);
}

function extractCertFromPfx(pfxPath, pfxPassword, outputPath) {
  // Đọc file PFX
  const pfxDer = fs.readFileSync(pfxPath);
  const pfxAsn1 = forge.asn1.fromDer(pfxDer.toString('binary'));
  
  // Giải mã PKCS#12 (PFX)
  const pfx = forge.pkcs12.pkcs12FromAsn1(pfxAsn1, pfxPassword);
  
  // Lấy chứng chỉ
  const certBags = pfx.getBags({ bagType: forge.pki.oids.certBag });
  const cert = certBags[forge.pki.oids.certBag][0].cert;
  
  // Chuyển đổi chứng chỉ sang PEM
  const pemCert = forge.pki.certificateToPem(cert);
  
  // Ghi ra file
  fs.writeFileSync(outputPath, pemCert);
  
  console.log(`Certificate extracted and saved to ${outputPath}`);
}




// Sử dụng hàm
// const inputPdf = path.resolve(__dirname, 'a.pdf');
// const outputPdf = path.resolve(__dirname, 'signed_output.pdf');
// const pfxPath = path.resolve(__dirname, 'output.pfx');
// const pfxPassword = 'your_strong_password';




// Sử dụng hàm để ký file Word
// const privateKey = key.privateKey;
// const inputPath = path.resolve(__dirname, 'a.docx');
// const outputPath = path.resolve(__dirname, 'signed_output.docx');

// createPfx(
//   'Trinh Quoc Van 3',               // commonName
//   'VN',                         // countryName
//   'Ho Chi Minh',                // stateOrProvinceName
//   'Ho Chi Minh City',           // localityName
//   'PNT University',        // organizationName
//   'IT Department',              // organizationalUnitName
//   'vantrinh@pnt.edu.com',          // emailAddress
//   'your_strong_password',       // password for PFX
//   'tqv3.pfx'                  // output file pat
// );
// extractCertFromPfx('tqv3.pfx','your_strong_password','tqv3.crt');


function buyerSign(pdfBuffer, targetPath) {
  // Add a placeholder for John Doe - the customer
  var pdfWithPlaceholder = plainAddPlaceholder({
      pdfBuffer: pdfBuffer,
      reason: 'Agrees to buy the truck trailer.',
      contactInfo: 'vantrinh1@pnt.edu.vn',
      name: 'John Doe',
      location: 'Free Text Str., Free World',
      widgetRect:[100,100,200,200]
  });

  // John signs the PDF
  // certificate.p12 is the certificate that is going to be used to sign
  var certificateBuffer = fs.readFileSync(path.join(__dirname, '/tqv.pfx'));
  var signer = new P12Signer(certificateBuffer,{
    passphrase: "your_strong_password",
    asn1StrictParsing: true,
    reason: 'Document Verification',
    contactInfo: 'vantrinh1@pnt.edu.vn',
    location: 'Ho Chi Minh City, Vietnam'
    
  });
  return signpdf
      .sign(pdfWithPlaceholder, signer)
      .then(function (signedPdf) {
          // signedPdf is a Buffer of an electronically signed PDF. Store it.
          fs.writeFileSync(targetPath, signedPdf);

          return signedPdf;
      })
}

function sellerSign(pdfBuffer, targetPath) {
  // Add a placeholder for John Doe - the customer
  var pdfWithPlaceholder = plainAddPlaceholder({
      pdfBuffer: pdfBuffer,
      reason: 'Agrees to sell a truck trailer to John Doe.',
      contactInfo: 'vantrinh2@pnt.edu.vn',
      name: 'Thug Dealer',
      location: 'Automotive Str., Free World',
      widgetRect:[300,300,400,400]
  });

  // The seller signs the PDF
  // bundle.p12 is the certificate bundle that is going to be used to sign
  var certificateBuffer = fs.readFileSync(path.join(__dirname, '/tqv2.pfx'));
  var signer = new P12Signer(certificateBuffer,{
    passphrase: "your_strong_password",
    asn1StrictParsing: true,
    reason: 'Document Verification',
    contactInfo: 'vantrinh2@pnt.edu.vn',
    location: 'Ho Chi Minh City, Vietnam',
  });
  return signpdf
      .sign(pdfWithPlaceholder, signer)
      .then(function (signedPdf) {
          // signedPdf is a Buffer of an electronically signed PDF. Store it.
          fs.writeFileSync(targetPath, signedPdf);

          return signedPdf;
      })
}


function work() {
  // contributing.pdf is the "contract" they are going to sign.
  var pdfBuffer = fs.readFileSync(path.join(__dirname, '/a.pdf'));

  // A copy of the PDF is signed by the buyer and then by the seller.
  buyerSign(
      pdfBuffer,
      path.join(__dirname, '/output/multiple-signatures-buyer-seller-1.pdf'
  ))
      .then(function (signedByCustomer) {
          return sellerSign(
              signedByCustomer,
              path.join(__dirname, '/output/multiple-signatures-buyer-seller-2.pdf')
          );
      });

  // A copy of the PDF is signed by the seller and then by the buyer.
  sellerSign(
      pdfBuffer,
      path.join(__dirname, '/output/multiple-signatures-seller-buyer-1.pdf'
  ))
      .then(function (signedBySeller) {
          return buyerSign(
              signedBySeller,
              path.join(__dirname, '/output/multiple-signatures-seller-buyer-2.pdf')
          );
      });
}

work();
