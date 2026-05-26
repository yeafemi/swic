import { generateReceiptPDF } from '../lib/receipt-generator';

async function testReceipt() {
  const dummyRecord = {
    donor_name: 'John Doe',
    email: 'john@example.com',
    phone: '+233123456789',
    amount: 150,
    giving_type: 'Offering',
    reference: 'SWIC-TEST-1234',
    created_at: new Date().toISOString(),
    channel: 'card',
  };
  try {
    await generateReceiptPDF(dummyRecord);
    console.log('Receipt PDF generation succeeded');
  } catch (err) {
    console.error('Receipt generation failed', err);
    process.exit(1);
  }
}

testReceipt();
