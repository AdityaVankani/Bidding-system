// utils/invoiceGenerator.js
import PDFDocument from "pdfkit";
import fs from "fs";

export const generateInvoice = (payment, user, product, outputPath) => {
  const doc = new PDFDocument();

  doc.pipe(fs.createWriteStream(outputPath));

  doc.fontSize(20).text("Jewelry Auction - Payment Invoice", { align: "center" });
  doc.moveDown();

  doc.fontSize(12).text(`Date: ${new Date().toLocaleString()}`);
  doc.text(`Invoice ID: ${payment._id}`);
  doc.text(`Razorpay Order ID: ${payment.razorpayOrderId}`);
  doc.text(`Payment ID: ${payment.razorpayPaymentId}`);
  doc.moveDown();

  doc.text(`Customer: ${user.name}`);
  doc.text(`Email: ${user.email}`);
  doc.moveDown();

  doc.text(`Product: ${product.title}`);
  doc.text(`Auction Price: ₹${payment.amount}`);
  doc.text(`Payment Status: ${payment.status}`);

  doc.end();
};