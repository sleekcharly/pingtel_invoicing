// Invoice creation code for firebase

import { NextResponse } from 'next/server';
import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/db/firebaseAdmin';

// add invoice
export async function POST(request: Request) {
  try {
    const formData = await request.json();

    // Add the current timestamp to formData
    formData.createdAt = new Date().toISOString();

    // Add the form data to firestore
    const docRef = await db.collection('invoices').add(formData);

    return NextResponse.json({
      message: 'Document successfully written!',
      id: docRef.id,
    });
  } catch (err) {
    console.error('Error writing document: ', err);
    return NextResponse.json({
      error: 'Failed to write document to Firestore',
    });
  }
}

// get invoice by Id
export async function GET(request: Request) {
  try {
    // retrieve invoice id
    const { searchParams } = new URL(request.url);
    const invoiceId = searchParams.get('id');

    if (!invoiceId) {
      return NextResponse.json(
        { error: 'Invoice ID is required' },
        { status: 400 },
      );
    }

    // Fetch the document from Firestore
    const docRef = db.collection('invoices').doc(invoiceId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    return NextResponse.json(doc.data());
  } catch (err) {
    console.error('Error fetching document: ', err);
    return NextResponse.json(
      { Error: 'Failed to fetch document from Firestore' },
      { status: 500 },
    );
  }
}
