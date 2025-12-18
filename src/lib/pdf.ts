import jsPDF from 'jspdf';

export const EXCAVATION_RATES = [
    { max: 2, rate: 160 },
    { max: 3, rate: 85 },
    { max: 4, rate: 60 },
    { max: 6, rate: 45 },
    { max: 8, rate: 28 },
    { max: 11, rate: 24 },
    { max: 21, rate: 20 },
    { max: 41, rate: 19 },
    { max: 61, rate: 18 },
    { max: 101, rate: 17 },
    { max: 201, rate: 16 },
    { max: 2001, rate: 13 },
];

export const STABILIZATION_RATES = [
    { max: 2, rate: 180 },
    { max: 3, rate: 90 },
    { max: 4, rate: 60 },
    { max: 5, rate: 47 },
    { max: 6, rate: 38 },
    { max: 7, rate: 32 },
    { max: 8, rate: 28 },
    { max: 9, rate: 25 },
    { max: 10, rate: 25 },
    { max: 21, rate: 25 },
    { max: 41, rate: 19 },
    { max: 61, rate: 18 },
    { max: 101, rate: 17 },
    { max: 201, rate: 16 },
    { max: 401, rate: 15 },
    { max: 2001, rate: 14 },
];

export function getExcavationRate(area: number): number {
    const tier = EXCAVATION_RATES.find(t => area <= t.max);
    return tier ? tier.rate : 13;
}

export function getStabilizationRate(area: number): number {
    const tier = STABILIZATION_RATES.find(t => area <= t.max);
    return tier ? tier.rate : 14;
}

export function generateQuotePDF(
    image: string,
    area: number,
    grassName: string,
    grassPricePerSqm: number
) {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPos = 0;

    // --- BRANDING UTILS ---
    const COLORS = {
        primary: [19, 44, 69],    // #132c45 (Dark Blue Header)
        accent: [140, 198, 63],   // #8cc63f (Lime Green Logo)
        secondary: [118, 165, 147], // #76a593 (Sage/Teal Buttons)
        text: [40, 40, 40],
        lightGrey: [245, 247, 250]
    };

    // --- HEADER ---
    // Dark Blue Background for top
    doc.setFillColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
    doc.rect(0, 0, pageWidth, 40, 'F');

    // Lime Green Accent Line
    doc.setDrawColor(COLORS.accent[0], COLORS.accent[1], COLORS.accent[2]);
    doc.setLineWidth(1.5);
    doc.line(0, 39, pageWidth, 39);

    // "Logo" Simulation (Text based since we don't have the asset)
    // Circle Icon
    doc.setFillColor(COLORS.accent[0], COLORS.accent[1], COLORS.accent[2]);
    doc.circle(25, 20, 8, 'F');
    // Leaf/Grass simulation (white lines inside circle)
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(1);
    doc.line(22, 22, 25, 15);
    doc.line(25, 15, 28, 22);
    doc.line(25, 24, 25, 15);

    // Brand Name
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.setTextColor(255, 255, 255);
    doc.text("KUNSTGRAS", 38, 22);
    doc.setFont("helvetica", "normal"); // lighter weight for second part? standard jsPDF helvetica only has normal/bold
    doc.text("CENTRUM", 38 + doc.getTextWidth("KUNSTGRAS") + 2, 22);

    // Subtitle / Tagline
    doc.setFontSize(8);
    doc.setTextColor(200, 200, 200);
    doc.text("BY THE JOLLY ARK", 38, 28);


    // Date in Header (Right aligned)
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    const dateStr = new Date().toLocaleDateString('nl-BE', { day: '2-digit', month: 'long', year: 'numeric' });
    doc.text(dateStr, pageWidth - 20, 25, { align: 'right' });

    yPos = 55;

    // --- TITLE ---
    doc.setFontSize(20);
    doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
    doc.setFont("helvetica", "bold");
    doc.text("Offerte Op Maat", 20, yPos);

    yPos += 15;

    // --- IMAGE ---
    if (image) {
        try {
            const imgProps = doc.getImageProperties(image);
            // Calculate width to fit half page width or similar, maintaining aspect
            // Let's make it a nice banner size if wide, or side-by-side? 
            // Stick to full width but limited height for cleanliness
            const maxImgHeight = 80;
            const maxImgWidth = 100;

            let imgWidth = maxImgWidth;
            let imgHeight = (imgProps.height * imgWidth) / imgProps.width;

            if (imgHeight > maxImgHeight) {
                imgHeight = maxImgHeight;
                imgWidth = (imgProps.width * imgHeight) / imgProps.height;
            }

            // Check page bounds
            if (yPos + imgHeight > pageHeight - 40) {
                doc.addPage();
                yPos = 30;
            }

            // Draw a subtle border/shadow effect?
            doc.setDrawColor(230);
            doc.rect(20 - 1, yPos - 1, imgWidth + 2, imgHeight + 2);
            doc.addImage(image, 'JPEG', 20, yPos, imgWidth, imgHeight);

            // Add a label next to image? (Optional)
            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text("Uw situatie", 20 + imgWidth + 10, yPos + 10);
            doc.text(`Oppervlakte: ${area.toFixed(2)} m²`, 20 + imgWidth + 10, yPos + 20);
            doc.text(`Type: ${grassName}`, 20 + imgWidth + 10, yPos + 26);

            yPos += imgHeight + 20;

        } catch (e) {
            console.error("Could not add image to PDF", e);
        }
    } else {
        // Just show text details if no image
        doc.setFontSize(12);
        doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
        doc.text(`Oppervlakte: ${area.toFixed(2)} m²`, 20, yPos);
        doc.text(`Gekozen type: ${grassName}`, 20, yPos + 7);
        yPos += 20;
    }

    // --- CALCULATIONS ---
    const grassTotal = area * grassPricePerSqm;
    const cuttingLossTotal = (area * 0.10) * grassPricePerSqm;
    const excavationRate = getExcavationRate(area);
    const excavationTotal = area * excavationRate;
    const stabilizationRate = getStabilizationRate(area);
    const stabilizationTotal = area * stabilizationRate;
    const planningCost = 69.00;
    const materialsCost = area * 2.75;

    const subTotal = grassTotal + cuttingLossTotal + excavationTotal + stabilizationTotal + planningCost + materialsCost;
    const vatAmount = subTotal * 0.21;
    const grandTotal = subTotal + vatAmount;

    // --- TABLE ---
    if (yPos > pageHeight - 100) {
        doc.addPage();
        yPos = 40;
    }

    // Table Header
    const col2 = pageWidth - 25; // Price right aligned

    doc.setFillColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]); // Primary Blue
    doc.rect(20, yPos, pageWidth - 40, 10, 'F');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.text("Omschrijving", 25, yPos + 7);
    doc.text("Totaal", col2, yPos + 7, { align: 'right' });
    yPos += 10;

    // Rows
    let isEven = false;
    const addItem = (name: string, price: number, detail?: string) => {
        if (yPos > pageHeight - 40) {
            doc.addPage();
            yPos = 30; // Reset
            // Re-draw header? mostly unnecessary for simple quotes
        }

        // Stripe Row
        if (isEven) {
            doc.setFillColor(COLORS.lightGrey[0], COLORS.lightGrey[1], COLORS.lightGrey[2]);
            doc.rect(20, yPos, pageWidth - 40, detail ? 14 : 9, 'F'); // Adjust height based on content
        }

        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);

        doc.text(name, 25, yPos + 6);
        doc.text(`€ ${price.toFixed(2).replace('.', ',')}`, col2, yPos + 6, { align: 'right' });

        if (detail) {
            doc.setFontSize(9);
            doc.setTextColor(120);
            doc.text(detail, 25, yPos + 11);
            yPos += 14;
        } else {
            yPos += 9;
        }
        isEven = !isEven;
    };

    addItem(`${grassName} (${area.toFixed(2)} m²)`, grassTotal, `Prijs per m²: € ${grassPricePerSqm.toFixed(2)}`);
    addItem(`Snijverlies (10%)`, cuttingLossTotal);
    addItem(`Afgraven en afvoeren`, excavationTotal, `Tarief: € ${excavationRate.toFixed(2)}/m²`);
    addItem(`Stabilisatie ondergrond`, stabilizationTotal, `Tarief: € ${stabilizationRate.toFixed(2)}/m²`);
    addItem(`Versnijden en legplan`, planningCost);
    addItem(`Lijmband en bevestigingsmateriaal`, materialsCost, `€ 2,75 per m²`);

    // --- TOTALS ---
    yPos += 5;

    // Line separator
    doc.setDrawColor(COLORS.secondary[0], COLORS.secondary[1], COLORS.secondary[2]);
    doc.setLineWidth(0.5);
    doc.line(20, yPos, pageWidth - 20, yPos);
    yPos += 10;

    // Subtotal
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
    doc.text("Totaal (excl. BTW)", pageWidth - 80, yPos); // Label aligned left of value
    doc.text(`€ ${subTotal.toFixed(2).replace('.', ',')}`, col2, yPos, { align: 'right' });
    yPos += 7;

    // VAT
    doc.text("BTW (21%)", pageWidth - 80, yPos);
    doc.text(`€ ${vatAmount.toFixed(2).replace('.', ',')}`, col2, yPos, { align: 'right' });
    yPos += 10;

    // Grand Total Box
    doc.setFillColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
    doc.roundedRect(pageWidth - 90, yPos - 7, 70, 12, 1, 1, 'F');

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    doc.text("Totaal (incl. BTW)", pageWidth - 85, yPos);
    doc.text(`€ ${grandTotal.toFixed(2).replace('.', ',')}`, col2 - 2, yPos, { align: 'right' });

    // Footer with Contact Info (Simulated)
    const footerY = pageHeight - 20;
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text("Kunstgrascentrum | The Jolly Ark", pageWidth / 2, footerY, { align: 'center' });
    doc.text("www.kunstgrascentrum.be", pageWidth / 2, footerY + 4, { align: 'center' });


    // Generate Blob and Open in New Tab
    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    window.open(pdfUrl, '_blank');
}
