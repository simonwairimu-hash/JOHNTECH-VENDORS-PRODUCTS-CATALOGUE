const fs = require('fs');
const path = require('path');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

async function createCataloguePDF() {
  console.log('Starting PDF generation...');
  const pdfDoc = await PDFDocument.create();
  
  // Standard A4 landscape dimensions: 841.89 x 595.28 points
  const pageWidth = 841.89;
  const pageHeight = 595.28;

  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Embed official JVL logo
  const logoPath = path.join(__dirname, 'images', 'logo.png');
  let embeddedLogo = null;
  if (fs.existsSync(logoPath)) {
    const logoBytes = fs.readFileSync(logoPath);
    embeddedLogo = await pdfDoc.embedPng(logoBytes);
  }

  // 1. Add all 23 catalogue slides
  for (let i = 1; i <= 23; i++) {
    const imgPath = path.join(__dirname, `${i}.jpg`);
    if (!fs.existsSync(imgPath)) {
      console.warn(`File ${imgPath} not found, skipping.`);
      continue;
    }

    const imgBytes = fs.readFileSync(imgPath);
    const embeddedImg = await pdfDoc.embedJpg(imgBytes);

    const page = pdfDoc.addPage([pageWidth, pageHeight]);

    // Draw the slide full-bleed onto the page
    page.drawImage(embeddedImg, {
      x: 0,
      y: 0,
      width: pageWidth,
      height: pageHeight
    });
    console.log(`Added slide ${i}.jpg`);
  }

  // 2. Add Supplementary Page: The JohnTech Advantage & Technical Prerequisites
  const pageAdvantage = pdfDoc.addPage([pageWidth, pageHeight]);

  // Navy header banner
  pageAdvantage.drawRectangle({
    x: 0,
    y: pageHeight - 90,
    width: pageWidth,
    height: 90,
    color: rgb(0.043, 0.176, 0.333) // #0b2d55
  });

  if (embeddedLogo) {
    pageAdvantage.drawImage(embeddedLogo, {
      x: pageWidth - 105,
      y: pageHeight - 78,
      width: 65,
      height: 65
    });
  }

  pageAdvantage.drawText('THE JOHNTECH ADVANTAGE & TECHNICAL PREREQUISITES', {
    x: 40,
    y: pageHeight - 48,
    size: 20,
    font: fontBold,
    color: rgb(1, 1, 1)
  });

  pageAdvantage.drawText('Quality Equipment. Reliable Solutions. - Johntech Vendors Limited', {
    x: 40,
    y: pageHeight - 72,
    size: 11,
    font: fontRegular,
    color: rgb(0.576, 0.773, 0.992)
  });

  // Section 1: The JohnTech Advantage
  pageAdvantage.drawText('The JohnTech Advantage - Complimentary Services', {
    x: 40,
    y: pageHeight - 125,
    size: 15,
    font: fontBold,
    color: rgb(0.043, 0.176, 0.333)
  });

  pageAdvantage.drawText('We support your business from day one. Your investment, enhanced.', {
    x: 40,
    y: pageHeight - 145,
    size: 11,
    font: fontRegular,
    color: rgb(0.008, 0.518, 0.78)
  });

  const advantages = [
    { title: 'Free Professional Installation', desc: 'Expert on-site piping, plumbing and electrical setup by certified technicians.' },
    { title: 'Free Delivery', desc: 'Complimentary safe delivery within Nairobi and surrounding metropolitan areas.' },
    { title: 'Free Heat Gun', desc: 'Commercial high-temperature heat gun for sealing bottle neck shrink seals.' },
    { title: 'Free Starting Top & Security Seals', desc: 'Complimentary starter pack of hygienic bottle caps and security seals.' },
    { title: 'Free Operator Training & Commissioning', desc: 'Comprehensive staff training on operation, daily hygiene, filter maintenance, and commissioning.' }
  ];

  let advY = pageHeight - 180;
  for (const adv of advantages) {
    // bullet icon box
    pageAdvantage.drawRectangle({
      x: 40,
      y: advY - 4,
      width: 16,
      height: 16,
      color: rgb(0.878, 0.949, 0.996),
      borderColor: rgb(0.008, 0.518, 0.78),
      borderWidth: 1
    });

    pageAdvantage.drawText('+', {
      x: 44,
      y: advY,
      size: 11,
      font: fontBold,
      color: rgb(0.008, 0.518, 0.78)
    });

    pageAdvantage.drawText(adv.title, {
      x: 68,
      y: advY + 2,
      size: 11,
      font: fontBold,
      color: rgb(0.043, 0.176, 0.333)
    });

    pageAdvantage.drawText(`- ${adv.desc}`, {
      x: 290,
      y: advY + 2,
      size: 10,
      font: fontRegular,
      color: rgb(0.25, 0.3, 0.36)
    });

    advY -= 32;
  }

  // Section 2: Technical Prerequisites
  const prereqStartY = advY - 20;
  pageAdvantage.drawText('Technical Prerequisites for Operating Equipment', {
    x: 40,
    y: prereqStartY,
    size: 15,
    font: fontBold,
    color: rgb(0.043, 0.176, 0.333)
  });

  const prereqs = [
    {
      title: 'Water Storage Requirement',
      desc: 'A minimum 2,000-litre water storage tank is required for optimal operation and continuous booster pump pressure.'
    },
    {
      title: 'Free Source Water Testing',
      desc: 'For RO and UF machines, Johntech tests the source water for salt and TDS levels free of charge to help customize the machine configuration.'
    },
    {
      title: 'Formal Laboratory Report',
      desc: 'A formal printed laboratory report suitable for regulatory compliance is available upon request for KES 5,500.'
    }
  ];

  let preY = prereqStartY - 30;
  for (const pr of prereqs) {
    pageAdvantage.drawText(`*  ${pr.title}:`, {
      x: 40,
      y: preY,
      size: 11,
      font: fontBold,
      color: rgb(0.043, 0.176, 0.333)
    });

    pageAdvantage.drawText(pr.desc, {
      x: 230,
      y: preY,
      size: 10,
      font: fontRegular,
      color: rgb(0.25, 0.3, 0.36)
    });

    preY -= 26;
  }

  // Bottom footer on page 24
  pageAdvantage.drawRectangle({
    x: 0,
    y: 0,
    width: pageWidth,
    height: 35,
    color: rgb(0.96, 0.97, 0.98)
  });

  pageAdvantage.drawText('Johntech Vendors Limited - Page 24', {
    x: 40,
    y: 12,
    size: 9,
    font: fontRegular,
    color: rgb(0.4, 0.45, 0.5)
  });

  pageAdvantage.drawText('Call / WhatsApp: 0790 825 018 | Web: johntechvendorsltd.co.ke', {
    x: pageWidth - 320,
    y: 12,
    size: 9,
    font: fontBold,
    color: rgb(0.043, 0.176, 0.333)
  });

  // 3. Add Final Contact Page
  const pageContact = pdfDoc.addPage([pageWidth, pageHeight]);

  // Top header banner
  pageContact.drawRectangle({
    x: 0,
    y: pageHeight - 90,
    width: pageWidth,
    height: 90,
    color: rgb(0.043, 0.176, 0.333)
  });

  if (embeddedLogo) {
    pageContact.drawImage(embeddedLogo, {
      x: pageWidth - 105,
      y: pageHeight - 78,
      width: 65,
      height: 65
    });
  }

  pageContact.drawText('JOHNTECH VENDORS LIMITED - CONTACT & ORDERS', {
    x: 40,
    y: pageHeight - 48,
    size: 20,
    font: fontBold,
    color: rgb(1, 1, 1)
  });

  pageContact.drawText('"Innovative Water Solutions for a Sustainable Future."', {
    x: 40,
    y: pageHeight - 72,
    size: 11,
    font: fontRegular,
    color: rgb(0.576, 0.773, 0.992)
  });

  // Contact details box
  pageContact.drawRectangle({
    x: 40,
    y: 120,
    width: pageWidth - 80,
    height: 340,
    color: rgb(0.97, 0.98, 1),
    borderColor: rgb(0.8, 0.88, 0.96),
    borderWidth: 1
  });

  pageContact.drawText('EQUIPMENT ORDERS & CONSULTATIONS', {
    x: 70,
    y: 410,
    size: 18,
    font: fontBold,
    color: rgb(0.043, 0.176, 0.333)
  });

  pageContact.drawText('Contact our technical sales team for quotations, custom machine sizing, or site visits:', {
    x: 70,
    y: 380,
    size: 12,
    font: fontRegular,
    color: rgb(0.3, 0.35, 0.4)
  });

  pageContact.drawText('Telephone Call:', {
    x: 70,
    y: 330,
    size: 13,
    font: fontBold,
    color: rgb(0.043, 0.176, 0.333)
  });
  pageContact.drawText('0790 825 018', {
    x: 210,
    y: 330,
    size: 14,
    font: fontBold,
    color: rgb(0.008, 0.518, 0.78)
  });

  pageContact.drawText('WhatsApp Direct:', {
    x: 70,
    y: 290,
    size: 13,
    font: fontBold,
    color: rgb(0.043, 0.176, 0.333)
  });
  pageContact.drawText('+254 790 825 018', {
    x: 210,
    y: 290,
    size: 14,
    font: fontBold,
    color: rgb(0.145, 0.827, 0.4)
  });

  pageContact.drawText('Website Portal:', {
    x: 70,
    y: 250,
    size: 13,
    font: fontBold,
    color: rgb(0.043, 0.176, 0.333)
  });
  pageContact.drawText('johntechvendorsltd.co.ke', {
    x: 210,
    y: 250,
    size: 14,
    font: fontBold,
    color: rgb(0.008, 0.518, 0.78)
  });

  pageContact.drawText('Products Range:', {
    x: 70,
    y: 210,
    size: 13,
    font: fontBold,
    color: rgb(0.043, 0.176, 0.333)
  });
  pageContact.drawText('Water Vending | Milk ATMs | Salad ATMs | UF Plants | RO Systems | Milk Chillers | Pasteurizers', {
    x: 210,
    y: 210,
    size: 11,
    font: fontRegular,
    color: rgb(0.3, 0.35, 0.4)
  });

  // QR Code embed
  const qrPath = path.join(__dirname, 'images', 'image.png');
  if (fs.existsSync(qrPath)) {
    const qrBytes = fs.readFileSync(qrPath);
    const qrImg = await pdfDoc.embedPng(qrBytes);
    pageContact.drawImage(qrImg, {
      x: pageWidth - 230,
      y: 230,
      width: 140,
      height: 140
    });

    pageContact.drawText('Scan to Connect on Phone', {
      x: pageWidth - 230,
      y: 205,
      size: 9,
      font: fontBold,
      color: rgb(0.043, 0.176, 0.333)
    });
  }

  // Footer bar on final page
  pageContact.drawRectangle({
    x: 0,
    y: 0,
    width: pageWidth,
    height: 35,
    color: rgb(0.96, 0.97, 0.98)
  });

  pageContact.drawText('(c) Johntech Vendors Limited - Quality Reliability Service', {
    x: 40,
    y: 12,
    size: 9,
    font: fontRegular,
    color: rgb(0.4, 0.45, 0.5)
  });

  pageContact.drawText('Page 25 - Complete Catalogue', {
    x: pageWidth - 180,
    y: 12,
    size: 9,
    font: fontBold,
    color: rgb(0.043, 0.176, 0.333)
  });

  // Save the complete document
  const pdfBytes = await pdfDoc.save();
  const outputPath = path.join(__dirname, 'Johntech-Vendors-Limited-Catalogue.pdf');
  fs.writeFileSync(outputPath, pdfBytes);
  console.log(`Successfully generated PDF catalogue at: ${outputPath} (${(pdfBytes.length / 1024 / 1024).toFixed(2)} MB)`);
}

createCataloguePDF().catch(err => {
  console.error('Error generating PDF:', err);
});
