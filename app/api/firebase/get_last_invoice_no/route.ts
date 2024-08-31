import { NextResponse } from 'next/server';
import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/db/firebaseAdmin';

export async function GET(request: Request) {
  try {
    // Query Firestore to get the most recent document
    const invoicesRef = db.collection('invoices');
    const querySnapshot = await invoicesRef
      .orderBy('createdAt', 'desc') // Sort by 'createdAt' field in descending order
      .limit(1) // Get the most recent document
      .get();

    if (querySnapshot.empty) {
      return NextResponse.json({ error: 'No invoices found' }, { status: 404 });
    }

    const lastInvoiceDoc = querySnapshot.docs[0];
    const lastInvoiceData = lastInvoiceDoc.data();
    const lastInvoiceNumber = lastInvoiceData.invoice_no; // Assuming 'invoice_no' is the field for the invoice number

    return NextResponse.json({ lastInvoiceNumber });
  } catch (err) {
    console.error('Error fetching last invoice number: ', err);
    return NextResponse.json(
      { error: 'Failed to fetch last invoice number from Firestore' },
      { status: 500 },
    );
  }
}
