'use client';

import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { CSSProperties, Key, useEffect, useState } from 'react';
import PingLogo from '/public/images/pinglogo.png';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import numeral from 'numeral';
import { Button } from '@/components/ui/button';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import RingLoader from 'react-spinners/RingLoader';

const Invoice = () => {
  const params = useParams<{ id: string }>();
  const invoiceId = params.id;

  // initiate router function
  const router = useRouter();

  //   set state
  const [invoiceData, setInvoiceData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [color, setColor] = useState('#ffffff');

  useEffect(() => {
    if (!invoiceId) return; // Return early if no ID is found

    console.log(`Fetching invoice with ID: ${invoiceId}`);

    // Fetch invoice data from the server or local storage
    // make API call to firebase backend route
    const fetchInvoiceData = async () => {
      try {
        const response = await fetch(`/api/firebase/create?id=${invoiceId}`);

        if (!response.ok) {
          throw new Error('Failed to fetch invoice data');
        }

        const data = await response.json();
        setInvoiceData(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoiceData();
  }, [invoiceId]);

  //   css override for react spinner
  const override: CSSProperties = {
    display: 'block',
    margin: '0 auto',
    borderColor: 'red',
  };

  // download pdf function
  const downloadPDF = async () => {
    setLoadingPdf(true);

    // get the invoice page by id
    const invoiceElement = document.getElementById('invoice');
    if (!invoiceElement) {
      setLoadingPdf(false);
      return;
    }

    // Use html2canvas to capture the element
    const canvas = await html2canvas(invoiceElement);
    const imgData = canvas.toDataURL('image/png');

    // Create s new PDF document
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    // Add the image to the PDF
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${invoiceData?.title}_${invoiceId}.pdf`);

    setLoadingPdf(false);
  };

  console.log(invoiceData);
  return (
    <div className="p-10">
      <div
        id="invoice"
        className="border border-gray-300 p-5 w-full max-w-5xl mx-auto flex flex-col gap-8"
      >
        {/* header */}
        <div className="flex space-x-5 justify-center">
          <div className="relative w-[100px] h-[100px]">
            <Image
              src={PingLogo}
              alt="Pingtel logo"
              fill
              className="object-cover"
            />
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-xs ml-auto font-bold">RC: 785910</p>
            <h1 className="text-2xl font-bold text-center">
              Ping Telecommunications Resources Limited
            </h1>
            <h2 className="text-base text-center">
              ICT/TELECOMS | NETWORK SERVICES | CONSULTANTS/TRAINERS
            </h2>
            <div className="flex flex-col items-center justify-center text-sm text-center">
              <p>
                58B, Awoniyi Elemo Street, off Lateef Ajao, off Airport Road,
                Ajao Estate, Lagos.
              </p>
              <p>Tel: 08062221782, 08131387005</p>
            </div>
            <p className="text-xs text-center">
              E-mail: info@pingtelecoms.net, p.ptrltd@gmail.com,
              URL:www.pingtelecoms.net
            </p>
          </div>
        </div>

        {/* invoice content */}
        <div className="w-full max-w-3xl mx-auto mt-4">
          {/* contract and invoice number */}
          <div className="flex flex-col gap-3">
            <p className="text-sm ml-auto">
              <span className="font-bold text-red-500 mr-2">INVOICE NO:</span>{' '}
              <span className="font-bold text-lg">
                {invoiceData?.invoice_no}
              </span>
            </p>
            {/* contract details */}
            {invoiceData?.contract_details && (
              <h2 className="w-full text-wrap font-semibold text-right text-sm">
                Contract: <span>{invoiceData?.contract_details}</span>
              </h2>
            )}
          </div>
        </div>

        {/* Invoice Metadata */}
        {/* divider */}
        <Separator className="bg-red-400  h-1" />
        <div className="w-full max-w-3xl mx-auto flex justify-between -mt-2 mb-2">
          <div className="flex flex-col gap-5">
            {/* Billing information */}
            <div className="flex flex-col">
              <p className="font-semibold text-red-400">Bill To</p>
              <p
                className="max-w-sm text-wrap text-sm"
                style={{ whiteSpace: 'pre-line' }}
              >
                {invoiceData?.bill_to}
              </p>
            </div>

            {/* title */}
            <div className="flex flex-col">
              <p className="font-semibold text-red-400">Title</p>
              <p
                className="max-w-sm text-wrap text-sm"
                style={{ whiteSpace: 'pre-line' }}
              >
                {invoiceData?.title}
              </p>
            </div>
          </div>

          {/* invoice info */}
          <div className="flex flex-col gap-8">
            {/* Date */}
            <div className="flex space-x-8">
              <p className="font-semibold text-red-400">Invoice Date</p>
              <p className="text-sm">
                {invoiceData && format(invoiceData?.invoice_date, 'PPP')}
              </p>
            </div>

            {/* PO Number */}
            {invoiceData?.po_number && (
              <div className="flex space-x-8">
                <p className="font-semibold text-red-400">PO No:</p>
                <p className="text-sm">{invoiceData?.po_number}</p>
              </div>
            )}
          </div>
        </div>

        {/* Invoice description */}
        {/* Exchange rate used */}
        {invoiceData?.exchange_rate && (
          <div className="flex items-center space-x-2 text-sm w-full max-w-3xl mx-auto justify-end -mb-5">
            <p>Exchange Rate:</p>
            <p className="bg-red-500 p-2 text-white font-semibold rounded-md ">
              ₦{numeral(invoiceData?.exchange_rate).format('0,0.00')} / $
            </p>
          </div>
        )}
        <div className="flex flex-col w-full max-w-3xl mx-auto">
          <div className="flex items-center bg-red-600 text-white font-bold">
            <p className="p-1 flex items-center justify-center border border-x-gray-500 w-[40px]">
              S/N
            </p>
            <p className="p-1 flex items-center justify-center flex-1 border border-x-gray-500">
              Description
            </p>
            <p className="p-1 flex items-center justify-center w-[120px] border border-x-gray-500">
              Unit Price
            </p>
            <p className="p-1 flex items-center justify-center w-[80px] border border-x-gray-500">
              Qty
            </p>
            <p className="p-1 flex items-center justify-center w-[120px] border border-x-gray-500">
              Amount
            </p>
          </div>

          {invoiceData?.invoiceDescription.map(
            (item: any, i: Key | null | undefined) => (
              <div className="flex text-sm" key={i}>
                <p className="p-1 flex items-center justify-center border border-gray-500 w-[40px]">
                  {Number(i) + 1}
                </p>
                <p className="p-1 flex items-center  flex-1 text-wrap border border-gray-500">
                  {item.details}
                </p>
                <p className="p-1 flex items-center justify-end w-[120px] border border-gray-500">
                  {numeral(Number(item.amount)).format('0,0.00')}
                </p>
                <p className="p-1 flex items-center justify-center w-[80px] border border-gray-500">
                  {item.quantity}
                </p>
                <p className="p-1 flex items-center justify-end w-[120px] border border-gray-500">
                  {numeral(Number(item.amount) * Number(item.quantity)).format(
                    '0,0.00',
                  )}
                </p>
              </div>
            ),
          )}
        </div>

        {/* invoice instruction */}
        {invoiceData?.note && (
          <div className="w-full max-w-3xl mx-auto">
            <p
              className="w-full max-w-xs text-xs p-1 border border-gray-400 rounded-md text-wrap"
              style={{ whiteSpace: 'pre-line' }}
            >
              {invoiceData?.note}
            </p>
          </div>
        )}

        {/* INvoice summary */}
        <div className="w-full max-w-3xl mx-auto flex flex-col gap-3">
          <div className="max-w-lg flex flex-col gap-5 ml-auto">
            {/* subtotal */}
            <div className="flex items-center space-x-28 justify-end ">
              <p>Subtotal</p>
              <p>{numeral(invoiceData?.subtotal).format('0,0.000')}</p>
            </div>

            {/* vat info */}
            <div className="flex items-center space-x-28 justify-end ">
              <p className="mx-w-sm text-wrap">
                {invoiceData?.taxDescription} {invoiceData?.taxPercent}%
              </p>
              <p>{numeral(invoiceData?.vatTaxValue).format('0,0.000')}</p>
            </div>

            {/* total amount */}
            <div className="flex items-center space-x-28 justify-end">
              <h4 className="text-lg font-bold tracking-wider">Total</h4>
              <h4 className="text-lg font-bold tracking-wider">
                {invoiceData?.currency === 'NGN' ? '₦' : '$'}
                {numeral(invoiceData?.total).format('0,0.000')}
              </h4>
            </div>
          </div>

          {/* signatures */}
          <div className="mt-5 flex items-center justify-between">
            <div className="flex flex-col items-center">
              <div className="w-[140px] h-[50px]" />
              <p className="text-sm font-semibold border border-t-red-500 border-x-white border-b-white">
                Customer&apos;s Signature
              </p>
            </div>
            <div className="flex flex-col items-center">
              <div className="relative w-[140px] h-[50px]">
                <Image
                  src={invoiceData?.signatureURL}
                  alt="Pingtel rep Signature"
                  fill
                  className="object-cover"
                />
              </div>
              <p className="text-sm font-semibold border border-t-red-500 border-x-white border-b-white">
                For Ping Telecommunications Resources Limited
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 w-full max-w-5xl mx-auto">
        <div className="p-2 flex items-center justify-between">
          <Button
            className="bg-red-500 hover:bg-opacity-50 hover:text-gray-900 font-bold text-white"
            onClick={() => router.push(`/edit_invoice/${invoiceId}`)}
          >
            Edit Invoice
          </Button>
          <Button
            className="bg-red-500 hover:bg-opacity-50 hover:text-gray-900 font-bold text-white"
            onClick={() => router.push(`/`)}
          >
            Create New Invoice
          </Button>
        </div>

        <Button
          className="w-full uppercase text-lg bg-red-500 hover:bg-opacity-50 hover:text-gray-900 font-bold text-white"
          onClick={downloadPDF}
        >
          Download PDF{' '}
          <span className="ml-2">
            <RingLoader
              color={color}
              loading={loadingPdf}
              cssOverride={override}
              size={30}
              aria-label="Loading Spinner"
              data-testid="loader"
            />
          </span>
        </Button>
      </div>
    </div>
  );
};

export default Invoice;
