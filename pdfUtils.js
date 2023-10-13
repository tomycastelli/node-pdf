const ghostscript = require('ghostscript-node');

async function compressPdf(pdfBuffer) {
  const options = [
    '-dNOPAUSE',
    '-dBATCH',
    '-sDEVICE=pdfwrite',
    '-dCompatibilityLevel=1.4',
    '-dPDFSETTINGS=/ebook',
    '-sOutputFile=-', // Output to stdout
  ];

  return new Promise((resolve, reject) => {
    ghostscript()
      .batch()
      .nopause()
      .device('pdfwrite')
      .option(options)
      .execute(pdfBuffer, (error, stdout) => {
        if (error) {
          reject(error);
        } else {
          resolve(Buffer.from(stdout));
        }
      });
  });
}

module.exports = {
  compressPdf,
};
