const fs = require('fs');
const path = require('path');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

async function buildOfficial13PageCatalogue() {
  console.log('Building polished 13-page official catalogue with pdf-lib...');
  const pdfDoc = await PDFDocument.create();

  // A4 Portrait dimensions in points (72 points per inch)
  const W = 595.28;
  const H = 841.89;
  const M = 32;
  const CW = W - M * 2; // 531.28 pt

  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  // Exact Brand Palette
  const NAVY    = rgb(11/255, 45/255, 85/255);       // #0b2d55
  const NAVYDK  = rgb(7/255, 28/255, 54/255);        // #071c36
  const RED     = rgb(220/255, 38/255, 38/255);      // #dc2626 Johntech Red
  const BLUE    = rgb(2/255, 132/255, 199/255);      // #0284c7 Water Blue
  const CYAN    = rgb(14/255, 165/255, 233/255);     // #0ea5e9
  const GREEN   = rgb(16/255, 185/255, 129/255);     // #10b981
  const WHITE   = rgb(1, 1, 1);
  const MUTED   = rgb(100/255, 116/255, 139/255);
  const LINE    = rgb(226/255, 232/255, 240/255);
  const LIGHTBG = rgb(248/255, 250/255, 252/255);
  const SOFT    = rgb(240/255, 247/255, 253/255);
  const TEXTDK  = rgb(15/255, 23/255, 42/255);

  // Official address as required
  const OFFICIAL_ADDRESS = "Thika Road, Ruiru, Ihunguro, behind Shell Petrol Station.";

  // Read productsData from index.html
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const match = html.match(/const productsData = (\[[\s\S]*?\]);\s*\/\/ Categories/);
  if (!match) throw new Error('Could not parse productsData from index.html');
  const products = eval(match[1]);

  // Embed logo
  let embeddedLogo = null;
  const logoPath = path.join(__dirname, 'images', 'logo.png');
  if (fs.existsSync(logoPath)) {
    try {
      embeddedLogo = await pdfDoc.embedPng(fs.readFileSync(logoPath));
    } catch (e) {
      console.warn('Logo embed warning:', e.message);
    }
  }

  // Embed QR code
  let embeddedQR = null;
  const qrPath = path.join(__dirname, 'images', 'image.png');
  if (fs.existsSync(qrPath)) {
    try {
      embeddedQR = await pdfDoc.embedPng(fs.readFileSync(qrPath));
    } catch (e) {
      console.warn('QR code embed warning:', e.message);
    }
  }

  // Embed Cover Banner
  let embeddedCover = null;
  const coverPath = path.join(__dirname, 'images', 'Johntech Water Solutions Catalogue (1).png');
  if (fs.existsSync(coverPath)) {
    try {
      embeddedCover = await pdfDoc.embedPng(fs.readFileSync(coverPath));
    } catch (e) {
      console.warn('Cover image embed warning:', e.message);
    }
  }

  // Pre-embed all product images
  const imageCache = new Map();
  for (const p of products) {
    const imgPath = path.join(__dirname, p.image);
    if (fs.existsSync(imgPath) && !imageCache.has(p.image)) {
      try {
        const bytes = fs.readFileSync(imgPath);
        let embedded = null;
        if (p.image.toLowerCase().endsWith('.png')) {
          embedded = await pdfDoc.embedPng(bytes);
        } else {
          embedded = await pdfDoc.embedJpg(bytes);
        }
        imageCache.set(p.image, embedded);
      } catch (err) {
        console.warn(`Could not embed image ${p.image}:`, err.message);
      }
    }
  }

  function addHeader(page, title, subtitle) {
    page.drawRectangle({ x: 0, y: H - 56, width: W, height: 56, color: NAVYDK });
    page.drawRectangle({ x: 0, y: H - 56, width: 6, height: 56, color: RED });
    page.drawRectangle({ x: 0, y: H - 56, width: W, height: 2.5, color: CYAN });

    if (embeddedLogo) {
      page.drawImage(embeddedLogo, {
        x: W - M - 40,
        y: H - 48,
        width: 38,
        height: 38
      });
    }

    page.drawText(title, {
      x: M,
      y: H - 28,
      size: 14,
      font: fontBold,
      color: WHITE
    });
    page.drawText(subtitle, {
      x: M,
      y: H - 44,
      size: 8.5,
      font: fontRegular,
      color: rgb(186/255, 230/255, 253/255)
    });
  }

  function addFooter(page, pageNum) {
    page.drawRectangle({ x: 0, y: 0, width: W, height: 24, color: NAVYDK });
    page.drawRectangle({ x: 0, y: 0, width: 6, height: 24, color: RED });
    page.drawRectangle({ x: 6, y: 22, width: W - 6, height: 2, color: BLUE });

    page.drawText('Johntech Vendors Limited  |  Thika Road, Ruiru  |  0790 825 018  |  johntechvendorsltd.co.ke', {
      x: M,
      y: 8,
      size: 7.5,
      font: fontRegular,
      color: WHITE
    });
    page.drawText(`Page ${pageNum} of 13`, {
      x: W - M - 52,
      y: 8,
      size: 7.5,
      font: fontBold,
      color: CYAN
    });
  }

  function drawProductCard(page, p, x, y, width, height) {
    // Card Container
    page.drawRectangle({
      x, y,
      width, height,
      color: WHITE,
      borderColor: LINE,
      borderWidth: 1
    });
    // Left brand accent line
    page.drawRectangle({
      x, y,
      width: 3.5,
      height,
      color: BLUE
    });

    // Image Area
    const imgAreaH = Math.min(height * 0.44, 135);
    page.drawRectangle({
      x: x + 8,
      y: y + height - 8 - imgAreaH,
      width: width - 16,
      height: imgAreaH,
      color: LIGHTBG,
      borderColor: rgb(241/255, 245/255, 249/255),
      borderWidth: 0.5
    });

    const pImg = imageCache.get(p.image);
    if (pImg) {
      const dims = pImg.scaleToFit(width - 24, imgAreaH - 8);
      page.drawImage(pImg, {
        x: x + 8 + (width - 16 - dims.width) / 2,
        y: y + height - 8 - imgAreaH + (imgAreaH - dims.height) / 2,
        width: dims.width,
        height: dims.height
      });
    }

    // Category tag
    const shortCat = p.category.replace('Ultrafiltration', 'UF').replace('Reverse Osmosis', 'RO');
    page.drawRectangle({
      x: x + 8,
      y: y + height - imgAreaH - 22,
      width: Math.min(fontBold.widthOfTextAtSize(shortCat.toUpperCase(), 6.5) + 8, width - 16),
      height: 11,
      color: SOFT
    });
    page.drawText(shortCat.toUpperCase(), {
      x: x + 12,
      y: y + height - imgAreaH - 19,
      size: 6.5,
      font: fontBold,
      color: BLUE
    });

    // Product Title (with smart wrapping)
    let curY = y + height - imgAreaH - 34;
    const words = p.name.split(' ');
    let l1 = '', l2 = '';
    for (const w of words) {
      if (fontBold.widthOfTextAtSize(l1 + ' ' + w, 8.5) < width - 18) {
        l1 = (l1 + ' ' + w).trim();
      } else {
        l2 = (l2 + ' ' + w).trim();
      }
    }
    page.drawText(l1, { x: x + 8, y: curY, size: 8.5, font: fontBold, color: NAVY });
    if (l2) {
      curY -= 10;
      page.drawText(l2, { x: x + 8, y: curY, size: 8.5, font: fontBold, color: NAVY });
    }

    // Description (cleanly wrapped to 2 lines max)
    curY -= 12;
    const dWords = p.desc.split(' ');
    let dl1 = '', dl2 = '';
    for (const dw of dWords) {
      if (fontRegular.widthOfTextAtSize(dl1 + ' ' + dw, 7) < width - 18) {
        dl1 = (dl1 + ' ' + dw).trim();
      } else if (fontRegular.widthOfTextAtSize(dl2 + ' ' + dw, 7) < width - 18) {
        dl2 = (dl2 + ' ' + dw).trim();
      }
    }
    page.drawText(dl1, { x: x + 8, y: curY, size: 7, font: fontRegular, color: MUTED });
    if (dl2) {
      curY -= 8.5;
      page.drawText(dl2, { x: x + 8, y: curY, size: 7, font: fontRegular, color: MUTED });
    }

    // Specs pills
    curY -= 11;
    let sX = x + 8;
    for (let si = 0; si < Math.min(p.specs.length, 3); si++) {
      const sp = p.specs[si];
      const spW = fontRegular.widthOfTextAtSize(sp, 6) + 6;
      if (sX + spW > x + width - 8) break;
      page.drawRectangle({
        x: sX,
        y: curY - 2,
        width: spW,
        height: 9.5,
        color: LIGHTBG,
        borderColor: LINE,
        borderWidth: 0.5
      });
      page.drawText(sp, { x: sX + 3, y: curY, size: 6, font: fontRegular, color: rgb(50/255, 80/255, 130/255) });
      sX += spW + 3;
    }

    // Price Bar (Anchored at the bottom of the card)
    page.drawRectangle({
      x: x + 3.5,
      y: y,
      width: width - 3.5,
      height: 28,
      color: NAVY
    });
    // Current Price in Bold
    page.drawText(p.price, {
      x: x + 8,
      y: y + 9.5,
      size: 10.5,
      font: fontBold,
      color: CYAN
    });
    // Old price crossed out if present
    if (p.oldPrice) {
      const oldW = fontRegular.widthOfTextAtSize(p.oldPrice, 7.5);
      const oldX = x + width - 10 - oldW;
      page.drawText(p.oldPrice, {
        x: oldX,
        y: y + 16,
        size: 7.5,
        font: fontRegular,
        color: rgb(148/255, 163/255, 184/255)
      });
      // strike through line
      page.drawLine({
        start: { x: oldX - 1, y: y + 18.5 },
        end: { x: oldX + oldW + 1, y: y + 18.5 },
        thickness: 0.7,
        color: RED
      });
    }
    // WhatsApp Enquiry Callout
    const waText = "WhatsApp: 0790 825 018";
    page.drawText(waText, {
      x: x + width - 10 - fontRegular.widthOfTextAtSize(waText, 6.5),
      y: y + 5.5,
      size: 6.5,
      font: fontBold,
      color: GREEN
    });
  }

  function drawShowcasePage(page, pageNum, catHeader, p, bullets, businessBox) {
    addHeader(page, catHeader, "Verified Commercial Equipment  |  Johntech Vendors Limited");
    addFooter(page, pageNum);

    const contentTop = H - 70;
    const contentH = contentTop - 34; // available height

    // Left Column: Large Image Box
    const leftW = CW * 0.46;
    const rightW = CW - leftW - 14;
    const leftX = M;
    const rightX = M + leftW + 14;
    const boxH = 390;

    // Left Photo Frame
    page.drawRectangle({
      x: leftX,
      y: contentTop - boxH,
      width: leftW,
      height: boxH,
      color: WHITE,
      borderColor: LINE,
      borderWidth: 1
    });
    page.drawRectangle({
      x: leftX,
      y: contentTop - boxH,
      width: 4,
      height: boxH,
      color: RED
    });

    const pImg = imageCache.get(p.image);
    if (pImg) {
      const dims = pImg.scaleToFit(leftW - 24, boxH - 24);
      page.drawImage(pImg, {
        x: leftX + (leftW - dims.width) / 2,
        y: contentTop - boxH + (boxH - dims.height) / 2,
        width: dims.width,
        height: dims.height
      });
    }

    // Right Column: Details & Pricing
    page.drawRectangle({
      x: rightX,
      y: contentTop - boxH,
      width: rightW,
      height: boxH,
      color: WHITE,
      borderColor: LINE,
      borderWidth: 1
    });
    page.drawRectangle({
      x: rightX,
      y: contentTop - boxH,
      width: 4,
      height: boxH,
      color: BLUE
    });

    // Tag
    page.drawRectangle({
      x: rightX + 16,
      y: contentTop - 32,
      width: 140,
      height: 15,
      color: SOFT
    });
    page.drawText(p.category.toUpperCase(), {
      x: rightX + 22,
      y: contentTop - 28,
      size: 8,
      font: fontBold,
      color: BLUE
    });

    // Title
    page.drawText(p.name, {
      x: rightX + 16,
      y: contentTop - 52,
      size: 13,
      font: fontBold,
      color: NAVY
    });

    // Price Banner
    page.drawRectangle({
      x: rightX + 16,
      y: contentTop - 95,
      width: rightW - 32,
      height: 34,
      color: NAVY
    });
    page.drawRectangle({
      x: rightX + 16,
      y: contentTop - 95,
      width: 4,
      height: 34,
      color: CYAN
    });
    page.drawText('PRICE:', {
      x: rightX + 28,
      y: contentTop - 78,
      size: 8,
      font: fontBold,
      color: rgb(186/255, 230/255, 253/255)
    });
    page.drawText(p.price, {
      x: rightX + 68,
      y: contentTop - 81,
      size: 15,
      font: fontBold,
      color: CYAN
    });

    // Description
    page.drawText(p.desc, {
      x: rightX + 16,
      y: contentTop - 114,
      size: 8.5,
      font: fontRegular,
      color: TEXTDK
    });

    // Key Features Bullets
    let bY = contentTop - 138;
    page.drawText('Key Commercial Features & Engineering:', {
      x: rightX + 16,
      y: bY,
      size: 9.5,
      font: fontBold,
      color: NAVY
    });
    bY -= 16;

    for (const b of bullets) {
      page.drawRectangle({ x: rightX + 16, y: bY + 1, width: 4, height: 4, color: BLUE });
      page.drawText(b, {
        x: rightX + 26,
        y: bY,
        size: 8,
        font: fontRegular,
        color: rgb(30/255, 41/255, 59/255)
      });
      bY -= 15;
    }

    // Specifications Tags
    bY -= 4;
    page.drawText('Verified Specifications:', {
      x: rightX + 16,
      y: bY,
      size: 9,
      font: fontBold,
      color: NAVY
    });
    bY -= 14;
    let sX = rightX + 16;
    for (const s of p.specs) {
      const sW = fontBold.widthOfTextAtSize(s, 7) + 10;
      if (sX + sW > rightX + rightW - 16) {
        sX = rightX + 16;
        bY -= 13;
      }
      page.drawRectangle({
        x: sX,
        y: bY - 2,
        width: sW,
        height: 12,
        color: LIGHTBG,
        borderColor: LINE,
        borderWidth: 0.5
      });
      page.drawText(s, { x: sX + 5, y: bY + 1.5, size: 7, font: fontBold, color: BLUE });
      sX += sW + 4;
    }

    // WhatsApp Action Button
    bY -= 26;
    page.drawRectangle({
      x: rightX + 16,
      y: bY,
      width: rightW - 32,
      height: 26,
      color: GREEN
    });
    const waText = "Enquire on WhatsApp: +254 790 825 018 (Direct Response)";
    const waW = fontBold.widthOfTextAtSize(waText, 8.5);
    page.drawText(waText, {
      x: rightX + 16 + (rightW - 32 - waW) / 2,
      y: bY + 8.5,
      size: 8.5,
      font: fontBold,
      color: WHITE
    });

    // Bottom Box: Commercial Advisory / Business Value
    const bottomY = contentTop - boxH - 12;
    const bottomH = bottomY - 32; // height down to above footer
    page.drawRectangle({
      x: M,
      y: bottomY - bottomH,
      width: CW,
      height: bottomH,
      color: SOFT,
      borderColor: rgb(186/255, 230/255, 253/255),
      borderWidth: 1
    });
    page.drawRectangle({
      x: M,
      y: bottomY - bottomH,
      width: 4,
      height: bottomH,
      color: NAVY
    });

    page.drawText(businessBox.title, {
      x: M + 16,
      y: bottomY - 20,
      size: 11,
      font: fontBold,
      color: NAVY
    });
    page.drawText(businessBox.desc, {
      x: M + 16,
      y: bottomY - 36,
      size: 8.5,
      font: fontRegular,
      color: TEXTDK
    });
    page.drawText(businessBox.note, {
      x: M + 16,
      y: bottomY - 52,
      size: 8,
      font: fontOblique,
      color: BLUE
    });
  }

  /* ══════════════════════════════════════════════════════════
     PAGE 1 — COVER PAGE
     ══════════════════════════════════════════════════════════ */
  const p1 = pdfDoc.addPage([W, H]);
  p1.drawRectangle({ x: 0, y: 0, width: W, height: H, color: NAVYDK });
  p1.drawRectangle({ x: 0, y: H - 6, width: W, height: 6, color: RED });
  p1.drawRectangle({ x: 0, y: 0, width: W, height: 6, color: RED });
  p1.drawRectangle({ x: 0, y: 6, width: 8, height: H - 12, color: NAVY });
  p1.drawRectangle({ x: 0, y: 6, width: 4, height: H - 12, color: CYAN });

  // Logo in center top
  if (embeddedLogo) {
    p1.drawImage(embeddedLogo, {
      x: W / 2 - 40,
      y: H - 110,
      width: 80,
      height: 80
    });
  }

  // Company Name
  const cName1 = "JOHNTECH ";
  const cName2 = "VENDORS LIMITED";
  const cn1W = fontBold.widthOfTextAtSize(cName1, 24);
  const cn2W = fontBold.widthOfTextAtSize(cName2, 24);
  const cnTotal = cn1W + cn2W;
  p1.drawText(cName1, { x: (W - cnTotal) / 2, y: H - 138, size: 24, font: fontBold, color: RED });
  p1.drawText(cName2, { x: (W - cnTotal) / 2 + cn1W, y: H - 138, size: 24, font: fontBold, color: WHITE });

  const coverSub = "P R O D U C T   C A T A L O G U E";
  const csW = fontBold.widthOfTextAtSize(coverSub, 13);
  p1.drawText(coverSub, { x: (W - csW) / 2, y: H - 158, size: 13, font: fontBold, color: CYAN });

  const tag = '"Innovative Water Solutions for a Sustainable Future."';
  const tagW = fontOblique.widthOfTextAtSize(tag, 10.5);
  p1.drawText(tag, { x: (W - tagW) / 2, y: H - 176, size: 10.5, font: fontOblique, color: rgb(186/255, 230/255, 253/255) });

  // Hero Cover Image
  if (embeddedCover) {
    const cImgW = CW - 20;
    const cImgH = 260;
    p1.drawRectangle({
      x: (W - cImgW) / 2,
      y: H - 455,
      width: cImgW,
      height: cImgH,
      color: WHITE,
      borderColor: BLUE,
      borderWidth: 1.5
    });
    p1.drawImage(embeddedCover, {
      x: (W - cImgW) / 2 + 2,
      y: H - 455 + 2,
      width: cImgW - 4,
      height: cImgH - 4
    });
  }

  // Equipment Range Chips
  const rangeTxt = "Water Vending  •  Milk ATMs  •  Salad ATMs  •  UF Plants  •  RO Systems  •  Chillers  •  Pasteurizers";
  const rW = fontBold.widthOfTextAtSize(rangeTxt, 9);
  p1.drawRectangle({
    x: (W - rW - 20) / 2,
    y: H - 485,
    width: rW + 20,
    height: 18,
    color: NAVY,
    borderColor: CYAN,
    borderWidth: 0.5
  });
  p1.drawText(rangeTxt, {
    x: (W - rW) / 2,
    y: H - 473,
    size: 9,
    font: fontBold,
    color: WHITE
  });

  // Location & Contact Box
  p1.drawRectangle({
    x: M + 10,
    y: H - 655,
    width: CW - 20,
    height: 150,
    color: NAVY,
    borderColor: BLUE,
    borderWidth: 1
  });
  p1.drawRectangle({ x: M + 10, y: H - 655, width: 5, height: 150, color: RED });

  p1.drawText("DIRECT EQUIPMENT SALES & INQUIRIES", {
    x: M + 28,
    y: H - 525,
    size: 13,
    font: fontBold,
    color: CYAN
  });
  p1.drawText("Physical Location:", { x: M + 28, y: H - 550, size: 10, font: fontBold, color: rgb(186/255, 230/255, 253/255) });
  p1.drawText(OFFICIAL_ADDRESS, { x: M + 130, y: H - 550, size: 10, font: fontBold, color: WHITE });

  p1.drawText("Telephone Call:", { x: M + 28, y: H - 572, size: 10, font: fontBold, color: rgb(186/255, 230/255, 253/255) });
  p1.drawText("0790 825 018", { x: M + 130, y: H - 572, size: 11, font: fontBold, color: WHITE });

  p1.drawText("WhatsApp Direct:", { x: M + 28, y: H - 594, size: 10, font: fontBold, color: rgb(186/255, 230/255, 253/255) });
  p1.drawText("+254 790 825 018", { x: M + 130, y: H - 594, size: 11, font: fontBold, color: GREEN });

  p1.drawText("Website Portal:", { x: M + 28, y: H - 616, size: 10, font: fontBold, color: rgb(186/255, 230/255, 253/255) });
  p1.drawText("johntechvendorsltd.co.ke", { x: M + 130, y: H - 616, size: 10.5, font: fontBold, color: CYAN });

  p1.drawText("Working Hours:", { x: M + 28, y: H - 638, size: 9.5, font: fontRegular, color: rgb(186/255, 230/255, 253/255) });
  p1.drawText("Monday - Saturday: 8:00 AM - 6:00 PM", { x: M + 130, y: H - 638, size: 9.5, font: fontRegular, color: WHITE });

  // Complimentary Banner on Cover
  p1.drawRectangle({
    x: M + 10,
    y: 35,
    width: CW - 20,
    height: 32,
    color: GREEN
  });
  const freeCover = "FREE INSTALLATION  •  FREE DELIVERY (NAIROBI & METRO)  •  FREE OPERATOR TRAINING";
  const fcW = fontBold.widthOfTextAtSize(freeCover, 8.5);
  p1.drawText(freeCover, {
    x: (W - fcW) / 2,
    y: 47,
    size: 8.5,
    font: fontBold,
    color: WHITE
  });

  /* ══════════════════════════════════════════════════════════
     PAGE 2 — WATER VENDING MACHINES (PART 1: 4 Products)
     ══════════════════════════════════════════════════════════ */
  const p2 = pdfDoc.addPage([W, H]);
  addHeader(p2, "WATER VENDING MACHINES (PART 1)", "Table & Upright Cabinet Automated Dispensing Systems");
  addFooter(p2, 2);

  const wvProds = products.filter(p => p.category === "Water Vending Machines");
  const cardW2 = (CW - 14) / 2;
  const cardH2 = 360;

  // 2x2 grid for products 1, 2, 3, 4
  drawProductCard(p2, wvProds[0], M, H - 68 - cardH2, cardW2, cardH2);
  drawProductCard(p2, wvProds[1], M + cardW2 + 14, H - 68 - cardH2, cardW2, cardH2);
  drawProductCard(p2, wvProds[2], M, H - 68 - cardH2 * 2 - 12, cardW2, cardH2);
  drawProductCard(p2, wvProds[3], M + cardW2 + 14, H - 68 - cardH2 * 2 - 12, cardW2, cardH2);

  /* ══════════════════════════════════════════════════════════
     PAGE 3 — WATER VENDING MACHINES (PART 2: 3 Products + Advisory)
     ══════════════════════════════════════════════════════════ */
  const p3 = pdfDoc.addPage([W, H]);
  addHeader(p3, "WATER VENDING MACHINES (PART 2)", "Integrated Storage Tank Stations & High-Capacity Dispensing");
  addFooter(p3, 3);

  // Top row: 2 products (5, 6)
  drawProductCard(p3, wvProds[4], M, H - 68 - cardH2, cardW2, cardH2);
  drawProductCard(p3, wvProds[5], M + cardW2 + 14, H - 68 - cardH2, cardW2, cardH2);

  // Bottom row: Left product 7, Right: Commercial Water Refill Advisory Box
  drawProductCard(p3, wvProds[6], M, H - 68 - cardH2 * 2 - 12, cardW2, cardH2);

  const advBoxX = M + cardW2 + 14;
  const advBoxY = H - 68 - cardH2 * 2 - 12;
  p3.drawRectangle({
    x: advBoxX,
    y: advBoxY,
    width: cardW2,
    height: cardH2,
    color: SOFT,
    borderColor: rgb(186/255, 230/255, 253/255),
    borderWidth: 1
  });
  p3.drawRectangle({ x: advBoxX, y: advBoxY, width: 4, height: cardH2, color: RED });

  p3.drawText("COMMERCIAL REFILL STATION GUIDE", {
    x: advBoxX + 16,
    y: advBoxY + cardH2 - 24,
    size: 11,
    font: fontBold,
    color: NAVY
  });

  const refillTips = [
    "High Return on Investment: Commercial water refilling generates stable daily cash flow with low operational overhead.",
    "Dual Micro-Controllers: Multi-tap machines allow simultaneous dispensing without flow rate drops or metering inaccuracy.",
    "Built-in Bottle Rinse Sinks: Sanitary stainless rinse stations allow customers to sanitize bottles prior to filling.",
    "Accurate Volume Metering: Precision digital flow sensors dispense exact preset volumes (1L, 5L, 10L, 20L).",
    "Food Grade Materials: All piping, valves, and contact parts use food-grade stainless steel 304.",
    "Comprehensive Free Perks: Johntech provides free professional setup, delivery in Nairobi, and full operator training."
  ];

  let tipY = advBoxY + cardH2 - 50;
  for (const tip of refillTips) {
    p3.drawRectangle({ x: advBoxX + 16, y: tipY + 2, width: 4, height: 4, color: BLUE });
    const tipWords = tip.split(' ');
    let tl1 = '', tl2 = '';
    for (const tw of tipWords) {
      if (fontRegular.widthOfTextAtSize(tl1 + ' ' + tw, 7.5) < cardW2 - 32) {
        tl1 = (tl1 + ' ' + tw).trim();
      } else {
        tl2 = (tl2 + ' ' + tw).trim();
      }
    }
    p3.drawText(tl1, { x: advBoxX + 26, y: tipY, size: 7.5, font: fontRegular, color: TEXTDK });
    if (tl2) {
      tipY -= 9.5;
      p3.drawText(tl2, { x: advBoxX + 26, y: tipY, size: 7.5, font: fontRegular, color: TEXTDK });
    }
    tipY -= 17;
  }

  /* ══════════════════════════════════════════════════════════
     PAGE 4 — MILK ATMS (FEATURED SHOWCASE)
     ══════════════════════════════════════════════════════════ */
  const p4 = pdfDoc.addPage([W, H]);
  const milkProd = products.find(p => p.category === "Milk ATMs");
  drawShowcasePage(
    p4,
    4,
    "MILK ATMS — AUTOMATED DAIRY VENDING MACHINES",
    milkProd,
    [
      "Food-grade stainless steel 304 sanitary interior and cabinet.",
      "Digital micro-controller with volumetric precision calibration.",
      "Dispenses milk by monetary value (from KES 10, 20, 50 upwards).",
      "Integrated cooling preservation keeps milk safely at 4 deg C.",
      "Password-protected sales tracker for complete audit control.",
      "Anti-drip dispensing nozzle with automated peristaltic clean cycle.",
      "Available from 50L capacity up to high-volume commercial sizes."
    ],
    {
      title: "Commercial Dairy Vending Benefits",
      desc: "Milk ATMs enable retail kiosks, dairies, and supermarkets to sell fresh pasteurized milk at accessible prices while eliminating single-use plastic packaging costs. Accurate digital sales logs prevent staff shrinkage.",
      note: "Fully compliant with Kenya Dairy Board (KDB) hygiene standards and KEBS food-contact regulations."
    }
  );

  /* ══════════════════════════════════════════════════════════
     PAGE 5 — SALAD ATMS (COOKING OIL DISPENSERS — FEATURED SHOWCASE)
     ══════════════════════════════════════════════════════════ */
  const p5 = pdfDoc.addPage([W, H]);
  const saladProd = products.find(p => p.category === "Salad ATMs");
  drawShowcasePage(
    p5,
    5,
    "SALAD ATMS — AUTOMATED COOKING OIL DISPENSERS",
    saladProd,
    [
      "Starting from 20-litre capacity suitable for busy retail kiosks.",
      "Positive displacement gear pump calibrated specifically for oil viscosity.",
      "PLC digital keypad allows customers to buy cooking oil by any shilling amount.",
      "Hygienic stainless steel nozzle with instant shutoff prevents oil dripping.",
      "Compact upright footprint easily fits inside shop counters or kiosks.",
      "Digital audit memory records total volume and monetary revenue dispensed.",
      "Food-grade internal reservoir and piping maintain oil clarity and aroma."
    ],
    {
      title: "Retail Cooking Oil Opportunity",
      desc: "Salad ATMs cater to everyday consumers purchasing cooking oil in custom flexible quantities. High repeat customer demand makes this one of the highest margin commercial vending investments.",
      note: "Easy daily cleaning cycle. Complete operator training provided free of charge by Johntech technicians."
    }
  );

  /* ══════════════════════════════════════════════════════════
     PAGE 6 — ULTRAFILTRATION (UF) MACHINES (PART 1: STANDALONE)
     ══════════════════════════════════════════════════════════ */
  const p6 = pdfDoc.addPage([W, H]);
  addHeader(p6, "ULTRAFILTRATION (UF) MACHINES (PART 1)", "Standalone Commercial Skid Systems for Municipal / Tap Water");
  addFooter(p6, 6);

  const ufProds = products.filter(p => p.category === "Ultrafiltration (UF) Machines");
  // Page 6: Products 10, 11 (2 large cards) + Technical UF Guide
  const cardH_UF = 350;
  drawProductCard(p6, ufProds[0], M, H - 68 - cardH_UF, cardW2, cardH_UF);
  drawProductCard(p6, ufProds[1], M + cardW2 + 14, H - 68 - cardH_UF, cardW2, cardH_UF);

  // Bottom Box: Technical UF Membrane Guide
  const ufGuideY = H - 68 - cardH_UF * 2 - 12;
  p6.drawRectangle({
    x: M,
    y: ufGuideY,
    width: CW,
    height: cardH_UF,
    color: SOFT,
    borderColor: rgb(186/255, 230/255, 253/255),
    borderWidth: 1
  });
  p6.drawRectangle({ x: M, y: ufGuideY, width: 4, height: cardH_UF, color: BLUE });

  p6.drawText("UNDERSTANDING ULTRAFILTRATION (UF) TECHNOLOGY", {
    x: M + 16,
    y: ufGuideY + cardH_UF - 24,
    size: 11,
    font: fontBold,
    color: NAVY
  });
  const ufNotes = [
    "Ideal Water Sources: Ultrafiltration is specially engineered for municipal tap water, fresh water, and low-salinity supplies.",
    "0.01 Micron Filtration: Membrane pores are 0.01 micron fine, physically blocking 99.9% of bacteria, viruses, suspended solids, and turbidity.",
    "Mineral Retention: Unlike Reverse Osmosis, UF retains beneficial natural minerals (calcium, magnesium) giving water a fresh, natural taste.",
    "Low Operating Energy: Operates under low feed water pressure without requiring high-power energy consumption.",
    "Complete Pre-Treatment: Includes sediment filtration, activated carbon media, and backwashable pressure vessels.",
    "Free Source Water Testing: Johntech tests your water TDS and salinity free of charge before confirming equipment specifications."
  ];
  let uY = ufGuideY + cardH_UF - 48;
  for (const un of ufNotes) {
    p6.drawRectangle({ x: M + 16, y: uY + 2, width: 4, height: 4, color: RED });
    p6.drawText(un, { x: M + 26, y: uY, size: 8, font: fontRegular, color: TEXTDK });
    uY -= 17;
  }

  /* ══════════════════════════════════════════════════════════
     PAGE 7 — ULTRAFILTRATION (UF) MACHINES (PART 2: INTEGRATED STATIONS)
     ══════════════════════════════════════════════════════════ */
  const p7 = pdfDoc.addPage([W, H]);
  addHeader(p7, "ULTRAFILTRATION (UF) MACHINES (PART 2)", "Integrated Tank Stations & Complete Turnkey Packages");
  addFooter(p7, 7);

  // Products 12, 13 on top row, Product 14 on bottom row + Station Benefits
  drawProductCard(p7, ufProds[2], M, H - 68 - cardH2, cardW2, cardH2);
  drawProductCard(p7, ufProds[3], M + cardW2 + 14, H - 68 - cardH2, cardW2, cardH2);

  drawProductCard(p7, ufProds[4], M, H - 68 - cardH2 * 2 - 12, cardW2, cardH2);

  // Turnkey 3-in-1 Station Feature Box
  const tBoxX = M + cardW2 + 14;
  const tBoxY = H - 68 - cardH2 * 2 - 12;
  p7.drawRectangle({
    x: tBoxX,
    y: tBoxY,
    width: cardW2,
    height: cardH2,
    color: WHITE,
    borderColor: LINE,
    borderWidth: 1
  });
  p7.drawRectangle({ x: tBoxX, y: tBoxY, width: 4, height: cardH2, color: GREEN });

  p7.drawText("TURNKEY 3-IN-1 UF PURIFICATION PACKAGE", {
    x: tBoxX + 16,
    y: tBoxY + cardH2 - 24,
    size: 10,
    font: fontBold,
    color: NAVY
  });

  const tFeatures = [
    "All-in-One Solution: Combines multi-stage UF purification skid, overhead holding tank, and bottle rinser station.",
    "Zero Guesswork Setup: Delivered ready to connect to your water line and power supply.",
    "Integrated Overhead Tank: Food-grade stainless steel storage ensures continuous gravity dispensing pressure.",
    "Attached Bottle Rinser: Dedicated wash sink allows operators to rinse bottles with purified water before filling.",
    "Compact Commercial Footprint: Fits neatly into retail storefronts, malls, and neighborhood water stations.",
    "Full Complimentary Package: Includes free delivery within Nairobi, free installation, heat gun, caps, and training."
  ];

  let tY = tBoxY + cardH2 - 50;
  for (const tf of tFeatures) {
    p7.drawRectangle({ x: tBoxX + 16, y: tY + 2, width: 4, height: 4, color: BLUE });
    const tfWords = tf.split(' ');
    let tfl1 = '', tfl2 = '';
    for (const tfw of tfWords) {
      if (fontRegular.widthOfTextAtSize(tfl1 + ' ' + tfw, 7.5) < cardW2 - 32) {
        tfl1 = (tfl1 + ' ' + tfw).trim();
      } else {
        tfl2 = (tfl2 + ' ' + tfw).trim();
      }
    }
    p7.drawText(tfl1, { x: tBoxX + 26, y: tY, size: 7.5, font: fontRegular, color: TEXTDK });
    if (tfl2) {
      tY -= 9.5;
      p7.drawText(tfl2, { x: tBoxX + 26, y: tY, size: 7.5, font: fontRegular, color: TEXTDK });
    }
    tY -= 17;
  }

  /* ══════════════════════════════════════════════════════════
     PAGE 8 — REVERSE OSMOSIS (RO) MACHINES (PART 1: 500 & 1000 LPH)
     ══════════════════════════════════════════════════════════ */
  const p8 = pdfDoc.addPage([W, H]);
  addHeader(p8, "REVERSE OSMOSIS (RO) MACHINES (PART 1)", "Commercial Desalination Plants for Salty Borehole & Hard Water");
  addFooter(p8, 8);

  const roProds = products.filter(p => p.category === "Reverse Osmosis (RO) Machines");
  // Products 15, 16 on top row, Product 17 on bottom row + RO Guide
  drawProductCard(p8, roProds[0], M, H - 68 - cardH2, cardW2, cardH2);
  drawProductCard(p8, roProds[1], M + cardW2 + 14, H - 68 - cardH2, cardW2, cardH2);

  drawProductCard(p8, roProds[2], M, H - 68 - cardH2 * 2 - 12, cardW2, cardH2);

  // RO Borehole Guide Box
  p8.drawRectangle({
    x: tBoxX,
    y: tBoxY,
    width: cardW2,
    height: cardH2,
    color: SOFT,
    borderColor: rgb(186/255, 230/255, 253/255),
    borderWidth: 1
  });
  p8.drawRectangle({ x: tBoxX, y: tBoxY, width: 4, height: cardH2, color: RED });

  p8.drawText("BOREHOLE WATER DESALINATION", {
    x: tBoxX + 16,
    y: tBoxY + cardH2 - 24,
    size: 11,
    font: fontBold,
    color: NAVY
  });

  const roNotes = [
    "High Salt & Mineral Removal: RO semi-permeable membranes reject up to 99% of dissolved salts, heavy metals, and fluoride.",
    "Borehole Water Specialist: Transforms salty, bitter, or mineral-heavy well water into crisp, clean drinking water.",
    "Multi-Stage Pre-Treatment: Includes sand media filter, activated carbon filter, and micron cartridge filters to protect membranes.",
    "Stainless Steel High-Pressure Pump: Vertical multistage centrifugal pump delivers sustained operating pressure.",
    "Digital Conductivity / TDS Monitoring: Real-time digital water purity readouts on the control panel.",
    "Pre-Delivery Water Testing: Johntech tests your borehole water free of charge to configure exact membrane arrays."
  ];

  let roY = tBoxY + cardH2 - 50;
  for (const ron of roNotes) {
    p8.drawRectangle({ x: tBoxX + 16, y: roY + 2, width: 4, height: 4, color: BLUE });
    const ronWords = ron.split(' ');
    let rl1 = '', rl2 = '';
    for (const rw of ronWords) {
      if (fontRegular.widthOfTextAtSize(rl1 + ' ' + rw, 7.5) < cardW2 - 32) {
        rl1 = (rl1 + ' ' + rw).trim();
      } else {
        rl2 = (rl2 + ' ' + rw).trim();
      }
    }
    p8.drawText(rl1, { x: tBoxX + 26, y: roY, size: 7.5, font: fontRegular, color: TEXTDK });
    if (rl2) {
      roY -= 9.5;
      p8.drawText(rl2, { x: tBoxX + 26, y: roY, size: 7.5, font: fontRegular, color: TEXTDK });
    }
    roY -= 17;
  }

  /* ══════════════════════════════════════════════════════════
     PAGE 9 — REVERSE OSMOSIS (RO) MACHINES (PART 2: 250, 750 & 3000 LPH)
     ══════════════════════════════════════════════════════════ */
  const p9 = pdfDoc.addPage([W, H]);
  addHeader(p9, "REVERSE OSMOSIS (RO) MACHINES (PART 2)", "From Compact Commercial 250 LPH to Industrial 3000 LPH Plants");
  addFooter(p9, 9);

  // Products 18, 19 on top row, Product 20 (3000 LPH Industrial) on bottom row + Industrial Box
  drawProductCard(p9, roProds[3], M, H - 68 - cardH2, cardW2, cardH2);
  drawProductCard(p9, roProds[4], M + cardW2 + 14, H - 68 - cardH2, cardW2, cardH2);

  drawProductCard(p9, roProds[5], M, H - 68 - cardH2 * 2 - 12, cardW2, cardH2);

  // Industrial Plant Advisory Box
  p9.drawRectangle({
    x: tBoxX,
    y: tBoxY,
    width: cardW2,
    height: cardH2,
    color: WHITE,
    borderColor: LINE,
    borderWidth: 1
  });
  p9.drawRectangle({ x: tBoxX, y: tBoxY, width: 4, height: cardH2, color: NAVY });

  p9.drawText("INDUSTRIAL WATER TREATMENT (3000 LPH)", {
    x: tBoxX + 16,
    y: tBoxY + cardH2 - 24,
    size: 10,
    font: fontBold,
    color: NAVY
  });

  const indNotes = [
    "High Capacity Volume: 3,000 litres per hour continuous purification engineered for water bottling plants and factories.",
    "Multi-Vessel Pre-Filtration: Heavy-duty FRP vessels with automated control valves for effortless automated backwashing.",
    "Industrial Pressure Vessels: Stainless steel or high-spec fiberglass membrane housings for continuous industrial duty.",
    "Comprehensive Control Skid: Complete with flow rotameters, pressure gauges, automatic low-pressure cut-off, and high-pressure protection.",
    "Custom Machine Engineering: Sized and configured specifically according to site water lab analysis results.",
    "Commissioning Support: Certified technicians perform complete plumbing, electrical setup, and staff commissioning."
  ];

  let indY = tBoxY + cardH2 - 50;
  for (const inote of indNotes) {
    p9.drawRectangle({ x: tBoxX + 16, y: indY + 2, width: 4, height: 4, color: BLUE });
    const inWords = inote.split(' ');
    let inl1 = '', inl2 = '';
    for (const inw of inWords) {
      if (fontRegular.widthOfTextAtSize(inl1 + ' ' + inw, 7.5) < cardW2 - 32) {
        inl1 = (inl1 + ' ' + inw).trim();
      } else {
        inl2 = (inl2 + ' ' + inw).trim();
      }
    }
    p9.drawText(inl1, { x: tBoxX + 26, y: indY, size: 7.5, font: fontRegular, color: TEXTDK });
    if (inl2) {
      indY -= 9.5;
      p9.drawText(inl2, { x: tBoxX + 26, y: indY, size: 7.5, font: fontRegular, color: TEXTDK });
    }
    indY -= 17;
  }

  /* ══════════════════════════════════════════════════════════
     PAGE 10 — MILK CHILLERS (FEATURED SHOWCASE)
     ══════════════════════════════════════════════════════════ */
  const p10 = pdfDoc.addPage([W, H]);
  const chillerProd = products.find(p => p.category === "Milk Chillers");
  drawShowcasePage(
    p10,
    10,
    "MILK CHILLERS — RAPID TEMPERATURE REDUCTION SYSTEMS",
    chillerProd,
    [
      "Available from 100-litre capacity up to large dairy collection sizes.",
      "Rapid pull-down cooling quickly reduces milk to 4 deg C to arrest bacterial growth.",
      "Food-grade stainless steel 304 sanitary interior tank and outer jacket.",
      "Top-mounted electric reduction motor with stainless agitator blades.",
      "High-efficiency condensing refrigeration unit mounted on rigid steel base.",
      "High-density injected polyurethane foam insulation preserves low temperature.",
      "Sanitary butterfly drain valve ensures complete hygiene during cleaning."
    ],
    {
      title: "Essential Equipment for Milk Quality & Yield",
      desc: "Milk cooling is critical immediately after milking to prevent acidity spike and spoilage. Johntech chillers maintain farm-fresh quality for cooperatives, dairy farmers, and distribution hubs.",
      note: "Engineered for harsh operating environments with robust compressor protection."
    }
  );

  /* ══════════════════════════════════════════════════════════
     PAGE 11 — MILK PASTEURIZERS (FEATURED SHOWCASE)
     ══════════════════════════════════════════════════════════ */
  const p11 = pdfDoc.addPage([W, H]);
  const pastProd = products.find(p => p.category === "Milk Pasteurizers");
  drawShowcasePage(
    p11,
    11,
    "MILK PASTEURIZERS — COMMERCIAL BATCH PROCESSING",
    pastProd,
    [
      "Batch capacities starting from 100 litres up to 1,000 litres.",
      "High-grade stainless steel immersion heating elements with automated digital PID controller.",
      "Uniform heating jacket prevents milk scorching and preserves nutritional profile.",
      "Top-mounted electric motor with slow-speed agitator ensures uniform heat distribution.",
      "Digital temperature display with process timer for accurate pasteurization cycles.",
      "Sanitary food-grade butterfly drain valve for easy decanting into chillers or dispensers.",
      "Meets all Kenya Dairy Board and Ministry of Health commercial processing standards."
    ],
    {
      title: "Value Addition & Commercial Milk Processing",
      desc: "Batch pasteurizers enable dairy enterprises to add significant value to raw milk, ensuring pathogen destruction and extending shelf life for safe commercial distribution.",
      note: "Backed by Johntech's free installation, on-site commissioning, and staff operator training."
    }
  );

  /* ══════════════════════════════════════════════════════════
     PAGE 12 — THE JOHNTECH ADVANTAGE & TECHNICAL PREREQUISITES
     (CRITICAL FIX: Zero overlap, generous spacing, perfect layout!)
     ══════════════════════════════════════════════════════════ */
  const p12 = pdfDoc.addPage([W, H]);
  addHeader(p12, "THE JOHNTECH ADVANTAGE & TECHNICAL PREREQUISITES", "Complimentary Services Included with Every Purchase  |  Site Preparation Guide");
  addFooter(p12, 12);

  // Available height: from H - 68 down to 34 pt (total 740 pt available!)
  let cur12Y = H - 75;

  p12.drawText("The JohnTech Advantage — Complimentary Value Services", {
    x: M,
    y: cur12Y,
    size: 13,
    font: fontBold,
    color: NAVY
  });
  cur12Y -= 15;
  p12.drawText("We support your investment from day one with hands-on technical services at no extra charge.", {
    x: M,
    y: cur12Y,
    size: 9,
    font: fontRegular,
    color: BLUE
  });
  cur12Y -= 20;

  // 5 Complimentary Services in a clean grid
  const freeServices = [
    { title: "Free Professional Installation", desc: "Certified Johntech technicians perform complete on-site piping, plumbing, electrical connections, and machine calibration." },
    { title: "Free Delivery (Nairobi Metropolitan)", desc: "Complimentary, safe transportation of your machinery anywhere within Nairobi and surrounding metropolitan areas." },
    { title: "Free Commercial Heat Gun", desc: "Commercial high-temperature industrial heat gun provided for heat-shrinking tamper-proof safety seals on bottle necks." },
    { title: "Free Starting Tops & Security Seals", desc: "Complimentary starter pack of hygienic bottle caps and tamper-evident neck security seals to launch your operations immediately." },
    { title: "Free Operator Training & Commissioning", desc: "Comprehensive on-site training for you and your staff covering machine operation, daily hygiene routines, filter replacement, and troubleshooting." }
  ];

  for (const s of freeServices) {
    p12.drawRectangle({
      x: M,
      y: cur12Y - 32,
      width: CW,
      height: 32,
      color: LIGHTBG,
      borderColor: LINE,
      borderWidth: 0.8
    });
    p12.drawRectangle({ x: M, y: cur12Y - 32, width: 4, height: 32, color: GREEN });

    p12.drawText(`+  ${s.title}`, {
      x: M + 14,
      y: cur12Y - 11,
      size: 9.5,
      font: fontBold,
      color: NAVY
    });
    p12.drawText(s.desc, {
      x: M + 14,
      y: cur12Y - 24,
      size: 7.8,
      font: fontRegular,
      color: TEXTDK
    });
    cur12Y -= 38;
  }

  // Section 2: Technical Prerequisites
  cur12Y -= 10;
  p12.drawText("Technical Prerequisites for Operating Equipment", {
    x: M,
    y: cur12Y,
    size: 13,
    font: fontBold,
    color: NAVY
  });
  cur12Y -= 15;
  p12.drawText("Please ensure site preparations meet these basic standards to guarantee pump durability and water quality.", {
    x: M,
    y: cur12Y,
    size: 9,
    font: fontRegular,
    color: MUTED
  });
  cur12Y -= 20;

  const prereqs = [
    { label: "Water Storage Requirement:", desc: "A minimum 2,000-litre raw water storage tank is required on site. This ensures steady inlet pressure and prevents dry-run pump damage." },
    { label: "Free Source Water Testing:", desc: "For all RO and UF installations, Johntech tests your source water for salt and Total Dissolved Solids (TDS) free of charge to match machine configuration." },
    { label: "Formal Laboratory Report:", desc: "Standard in-house water testing is free. A formal comprehensive printed laboratory report suitable for regulatory compliance is available for KES 5,500." }
  ];

  for (const pr of prereqs) {
    p12.drawRectangle({
      x: M,
      y: cur12Y - 34,
      width: CW,
      height: 34,
      color: SOFT,
      borderColor: rgb(186/255, 230/255, 253/255),
      borderWidth: 0.8
    });
    p12.drawRectangle({ x: M, y: cur12Y - 34, width: 4, height: 34, color: BLUE });

    p12.drawText(`*  ${pr.label}`, {
      x: M + 14,
      y: cur12Y - 12,
      size: 9,
      font: fontBold,
      color: NAVY
    });
    p12.drawText(pr.desc, {
      x: M + 14,
      y: cur12Y - 25,
      size: 7.8,
      font: fontRegular,
      color: TEXTDK
    });
    cur12Y -= 40;
  }

  // Technical Note Callout Box (Comfortably above footer at y >= 40)
  cur12Y -= 4;
  p12.drawRectangle({
    x: M,
    y: cur12Y - 32,
    width: CW,
    height: 32,
    color: WHITE,
    borderColor: CYAN,
    borderWidth: 1
  });
  p12.drawRectangle({ x: M, y: cur12Y - 32, width: 4, height: 32, color: RED });

  p12.drawText("IMPORTANT SITE NOTE:", {
    x: M + 14,
    y: cur12Y - 12,
    size: 8.5,
    font: fontBold,
    color: RED
  });
  p12.drawText("Please confirm your power supply (single-phase vs three-phase) and raw water source type prior to machine delivery.", {
    x: M + 14,
    y: cur12Y - 24,
    size: 8,
    font: fontRegular,
    color: TEXTDK
  });

  /* ══════════════════════════════════════════════════════════
     PAGE 13 — CONTACT & ORDERS (FINAL PAGE)
     ══════════════════════════════════════════════════════════ */
  const p13 = pdfDoc.addPage([W, H]);
  p13.drawRectangle({ x: 0, y: 0, width: W, height: H, color: NAVYDK });
  p13.drawRectangle({ x: 0, y: H - 6, width: W, height: 6, color: RED });
  p13.drawRectangle({ x: 0, y: 0, width: W, height: 6, color: RED });
  p13.drawRectangle({ x: 0, y: 6, width: 8, height: H - 12, color: NAVY });
  p13.drawRectangle({ x: 0, y: 6, width: 4, height: H - 12, color: CYAN });
  addFooter(p13, 13);

  if (embeddedLogo) {
    p13.drawImage(embeddedLogo, {
      x: W / 2 - 40,
      y: H - 110,
      width: 80,
      height: 80
    });
  }

  p13.drawText(cName1, { x: (W - cnTotal) / 2, y: H - 138, size: 24, font: fontBold, color: RED });
  p13.drawText(cName2, { x: (W - cnTotal) / 2 + cn1W, y: H - 138, size: 24, font: fontBold, color: WHITE });

  const c13Title = "EQUIPMENT ORDERS, QUOTATIONS & SITE CONSULTATIONS";
  const c13W = fontBold.widthOfTextAtSize(c13Title, 12);
  p13.drawText(c13Title, { x: (W - c13W) / 2, y: H - 162, size: 12, font: fontBold, color: CYAN });

  p13.drawText(tag, { x: (W - tagW) / 2, y: H - 180, size: 10.5, font: fontOblique, color: rgb(186/255, 230/255, 253/255) });

  // Main Verified Location and Contact Card
  const box13H = 260;
  p13.drawRectangle({
    x: M + 14,
    y: H - 465,
    width: CW - 28,
    height: box13H,
    color: NAVY,
    borderColor: BLUE,
    borderWidth: 1.2
  });
  p13.drawRectangle({ x: M + 14, y: H - 465, width: 5, height: box13H, color: RED });

  p13.drawText("CONTACT OUR TECHNICAL SALES TEAM", {
    x: M + 36,
    y: H - 232,
    size: 13,
    font: fontBold,
    color: CYAN
  });
  p13.drawText("Reach out for equipment inquiries, custom machine sizing, site visits, or quotations:", {
    x: M + 36,
    y: H - 250,
    size: 9,
    font: fontRegular,
    color: rgb(186/255, 230/255, 253/255)
  });

  const contactGrid = [
    ["Physical Location:", OFFICIAL_ADDRESS],
    ["Telephone Call:",   "0790 825 018"],
    ["WhatsApp Direct:",  "+254 790 825 018"],
    ["Official Website:", "johntechvendorsltd.co.ke"],
    ["Full Product Range:","Water Vending | Milk ATMs | Salad ATMs | UF | RO | Chillers | Pasteurizers"],
    ["Business Hours:",   "Monday to Saturday: 8:00 AM - 6:00 PM"]
  ];

  let cY13 = H - 285;
  for (const [lbl, val] of contactGrid) {
    p13.drawText(lbl, {
      x: M + 36,
      y: cY13,
      size: 10.5,
      font: fontBold,
      color: rgb(186/255, 230/255, 253/255)
    });
    p13.drawText(val, {
      x: M + 155,
      y: cY13,
      size: 10.5,
      font: fontBold,
      color: WHITE
    });
    cY13 -= 28;
  }

  // QR Code Center Box
  if (embeddedQR) {
    const qrBoxW = 120;
    const qrBoxH = 135;
    const qrX = (W - qrBoxW) / 2;
    const qrY = H - 625;

    p13.drawRectangle({
      x: qrX,
      y: qrY,
      width: qrBoxW,
      height: qrBoxH,
      color: WHITE,
      borderColor: CYAN,
      borderWidth: 1
    });

    p13.drawImage(embeddedQR, {
      x: qrX + 15,
      y: qrY + 25,
      width: 90,
      height: 90
    });

    p13.drawText("SCAN TO CONNECT", {
      x: qrX + 16,
      y: qrY + 12,
      size: 8,
      font: fontBold,
      color: NAVY
    });
  }

  // Call to Action Banner
  const ctaBanner = "Order Today  •  Free Delivery in Nairobi  •  Full Warranty  •  Dedicated After-Sales Service";
  const cbW = fontBold.widthOfTextAtSize(ctaBanner, 8.5);
  p13.drawRectangle({
    x: M + 14,
    y: 50,
    width: CW - 28,
    height: 32,
    color: GREEN
  });
  p13.drawText(ctaBanner, {
    x: (W - cbW) / 2,
    y: 62,
    size: 8.5,
    font: fontBold,
    color: WHITE
  });

  const pdfBytes = await pdfDoc.save();
  const dest1 = path.join(__dirname, 'Johntech-Vendors-Limited-Catalogue.pdf');
  const dest2 = path.join(__dirname, 'Catalogue.pdf');
  const dest3 = path.join(__dirname, 'Johntech-Catalogue.pdf');

  fs.writeFileSync(dest1, pdfBytes);
  fs.writeFileSync(dest2, pdfBytes);
  fs.writeFileSync(dest3, pdfBytes);

  console.log(`✅ Official 13-Page Catalogue PDF successfully generated! (${pdfBytes.length} bytes, ${pdfDoc.getPageCount()} pages)`);
}

buildOfficial13PageCatalogue().catch(err => {
  console.error('Fatal error in PDF generation:', err);
  process.exit(1);
});
