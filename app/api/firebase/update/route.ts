//  update invoice

import { NextResponse } from 'next/server';
import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/db/firebaseAdmin';

export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const invoiceId = searchParams.get('id');

    if (!invoiceId) {
      return NextResponse.json(
        { error: 'Invoice ID is required' },
        { status: 400 },
      );
    }

    const updateData = await request.json();

    // Update the document in Firestore
    const docRef = db.collection('invoices').doc(invoiceId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    await docRef.update(updateData);

    return NextResponse.json({
      message: 'Invoice successfully updated!',
      id: invoiceId,
    });
  } catch (err) {
    console.error('Error updating document: ', err);
    return NextResponse.json(
      { error: 'Failed to update document in Firestore' },
      { status: 500 },
    );
  }
}
