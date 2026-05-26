import logoUrl from "@/assets/swic-logo.jpg";
import { jsPDF } from "jspdf";

export function generateReceiptPDF(record: {
  donor_name: string;
  email: string;
  phone?: string | null;
  amount: number;
  giving_type: string;
  reference: string;
  created_at: string;
  channel?: string | null;
}): Promise<void> {
  return new Promise((resolve, reject) => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const img = new Image();
    img.src = logoUrl;
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        // Draw Header background banner (Primary Red)
        doc.setFillColor(175, 22, 15); // #af160f
        doc.rect(0, 0, 210, 45, "F");

        // Draw logo (centered or left-aligned)
        doc.addImage(img, "JPEG", 15, 10, 25, 25);

        // Header Text (White)
        doc.setTextColor(255, 255, 255);
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(22);
        doc.text("SOUL WINNERS", 48, 20);
        
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(10);
        doc.text("INTERNATIONAL CHURCH", 48, 25);
        
        doc.setFontSize(9);
        doc.setTextColor(230, 230, 230);
        doc.text("Camp Elim Africa, North Legon, Ghana", 48, 30);
        doc.text("Phone: +233 20 533 7531 | Email: soulwinnersincorporated@gmail.com", 48, 35);

        // Gold line separator
        doc.setDrawColor(197, 168, 128); // #c5a880
        doc.setLineWidth(1);
        doc.line(0, 45, 210, 45);

        // Content Area
        // Title
        doc.setTextColor(175, 22, 15);
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(20);
        doc.text("OFFICIAL GIVING RECEIPT", 15, 60);

        // Receipt Info (Right aligned)
        doc.setTextColor(80, 80, 80);
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(10);
        doc.text(`Receipt No: ${record.reference}`, 130, 58);
        doc.text(`Date: ${new Date(record.created_at).toLocaleDateString("en-US", {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}`, 130, 64);

        // Thin separator line
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.5);
        doc.line(15, 70, 195, 70);

        // Donor Section
        doc.setTextColor(175, 22, 15);
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(12);
        doc.text("DONOR DETAILS", 15, 80);

        doc.setTextColor(26, 26, 26);
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(10);
        doc.text(`Name: ${record.donor_name}`, 15, 88);
        doc.text(`Email: ${record.email}`, 15, 94);
        if (record.phone) {
          doc.text(`Phone: ${record.phone}`, 15, 100);
        }

        // Donation Particulars Table
        doc.setFillColor(248, 248, 248);
        doc.rect(15, 112, 180, 50, "F");
        doc.setDrawColor(220, 220, 220);
        doc.rect(15, 112, 180, 50, "S");

        // Table Header
        doc.setFillColor(235, 235, 235);
        doc.rect(15, 112, 180, 10, "F");
        
        doc.setFont("Helvetica", "bold");
        doc.text("Description / Giving Type", 20, 118);
        doc.text("Payment Method", 110, 118);
        doc.text("Amount (GHS)", 160, 118);

        // Table Content
        doc.setFont("Helvetica", "normal");
        doc.text(record.giving_type, 20, 130);
        doc.text(record.channel ? record.channel.toUpperCase().replace('_', ' ') : "ONLINE", 110, 130);
        doc.text(`GHS ${Number(record.amount).toFixed(2)}`, 160, 130);

        // Total Row
        doc.line(15, 145, 195, 145);
        doc.setFont("Helvetica", "bold");
        doc.text("Total Paid:", 110, 153);
        doc.setTextColor(175, 22, 15);
        doc.setFontSize(12);
        doc.text(`GHS ${Number(record.amount).toFixed(2)}`, 160, 153);

        // Payment status badge
        doc.setFillColor(220, 245, 225); // Light green background
        doc.roundedRect(15, 175, 35, 10, 1, 1, "F");
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(30, 130, 50); // Green text
        doc.text("STATUS: PAID", 20, 181.5);

        // Note / Signature
        doc.setTextColor(80, 80, 80);
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(10);
        doc.text("Authorized Signature", 145, 205);
        
        doc.setDrawColor(150, 150, 150);
        doc.line(135, 198, 195, 198); // Signature line
        
        doc.setTextColor(175, 22, 15);
        doc.setFont("Courier", "italic");
        doc.setFontSize(11);
        doc.text("SWIC Finance Office", 142, 194);

        // Footer block
        doc.setDrawColor(220, 220, 220);
        doc.line(15, 225, 195, 225);

        doc.setTextColor(100, 100, 100);
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(9);
        const footerText1 = "Thank you for partnering with Soul Winners International Church.";
        const footerText2 = "Your giving fuels the propagation of the Gospel and discipling of nations.";
        const footerText3 = "\"Give, and it will be given to you. A good measure, pressed down, shaken together...\" — Luke 6:38";
        
        doc.text(footerText1, 105, 235, { align: "center" });
        doc.text(footerText2, 105, 240, { align: "center" });
        doc.setFont("Helvetica", "oblique");
        doc.text(footerText3, 105, 248, { align: "center" });

        // Save PDF
        doc.save(`Receipt-${record.reference}.pdf`);
        resolve();
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = (err) => {
      try {
        doc.setTextColor(175, 22, 15);
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(22);
        doc.text("SOUL WINNERS INT. CHURCH", 15, 20);
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text("Camp Elim Africa, North Legon, Ghana", 15, 25);
        
        // Receipt Info
        doc.setTextColor(175, 22, 15);
        doc.setFontSize(20);
        doc.text("OFFICIAL GIVING RECEIPT", 15, 60);

        doc.setTextColor(80, 80, 80);
        doc.setFontSize(10);
        doc.text(`Receipt No: ${record.reference}`, 130, 58);
        doc.text(`Date: ${new Date(record.created_at).toLocaleDateString()}`, 130, 64);
        
        // Particulars Table
        doc.setFillColor(248, 248, 248);
        doc.rect(15, 112, 180, 50, "F");
        doc.rect(15, 112, 180, 50, "S");
        doc.setFont("Helvetica", "bold");
        doc.text("Description / Giving Type", 20, 118);
        doc.text("Amount (GHS)", 160, 118);
        doc.setFont("Helvetica", "normal");
        doc.text(record.giving_type, 20, 130);
        doc.text(`GHS ${Number(record.amount).toFixed(2)}`, 160, 130);
        
        doc.save(`Receipt-${record.reference}.pdf`);
        resolve();
      } catch (innerErr) {
        reject(innerErr);
      }
    };
  });
}
