const puppeteer = require("puppeteer");

const generatePDF = async (htmlString) => {
  try {
    const browser = await puppeteer.launch({
      args: ["--no-sandbox"],
    });
    const page = await browser.newPage();

    await page.setContent(htmlString);
    const pdf = await page.pdf({ format: "A4", printBackground: true });

    await browser.close();
    return pdf;
  } catch (error) {
    throw new Error(`Erro ao gerar PDF: ${error.stack}`);
  }
};

module.exports = { generatePDF };
