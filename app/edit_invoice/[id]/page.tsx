'use client';

import Image from 'next/image';
import PingLogo from '/public/images/pinglogo.png';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { formSchema } from '@/schema/formShema';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent } from '@/components/ui/popover';
import { PopoverTrigger } from '@radix-ui/react-popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import {
  ChangeEvent,
  MouseEvent,
  useEffect,
  useState,
  CSSProperties,
} from 'react';
import numeral from 'numeral';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/db/firebase';
import RingLoader from 'react-spinners/RingLoader';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useParams, useRouter } from 'next/navigation';

export default function Home() {
  // form state
  const [invoiceDescription, setInvoiceDescription] = useState([
    { details: '', amount: 0, quantity: 1 },
  ]);
  const [subtotal, setSubtotal] = useState(0);
  const [total, setTotal] = useState(0);
  const [vatTax, setVatTax] = useState(false);
  const [vatTaxValue, setVatTaxValue] = useState(0);
  const [taxDescription, setTaxDescription] = useState('');
  const [taxPercent, setTaxPercent] = useState<number | string>(0);
  const [signatureURL, setSignatureURL] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [color, setColor] = useState('#ffffff');
  const [currency, setCurrency] = useState('NGN');
  const [invoiceNo, setInvoiceNo] = useState(1000);
  const [error, setError] = useState(false);
  const [exchange_rate, setExchangeRate] = useState(0);

  const params = useParams<{ id: string }>();
  const invoiceId = params.id;

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

        // extractData
        const {
          bill_to,
          contract_details,
          currency,
          invoiceDescription,
          invoice_date,
          invoice_no,
          note,
          po_number,
          signatureURL,
          subtotal,
          taxDescription,
          taxPercent,
          title,
          total,
          vatTax,
          vatTaxValue,
        } = data;

        // populate state data
        setSubtotal(subtotal);
        setTotal(total);
        setVatTax(vatTax);
        setVatTaxValue(vatTaxValue);
        setTaxDescription(taxDescription);
        setTaxPercent(taxPercent);
        setCurrency(currency);
        setSignatureURL(signatureURL);
        setInvoiceDescription(invoiceDescription);

        // populate form state
        form.setValue('bill_to', bill_to);
        form.setValue('title', title);
        form.setValue('po_number', po_number);
        form.setValue('invoice_no', invoice_no);
        form.setValue('contract_details', contract_details);
        form.setValue('note', note);
        form.setValue('invoice_date', new Date(invoice_date));
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoiceData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceId]);

  // initialize router
  const router = useRouter();

  // format invoice descriptions and tax information on page load
  useEffect(() => {
    const formattedDescriptions = invoiceDescription.map((item) => ({
      ...item,
      amount: Number(parseFloat(item.amount.toString()).toString()),
    }));

    const formattedTaxValue = Number(
      parseFloat(vatTaxValue.toString()),
    ).toString();

    setInvoiceDescription(formattedDescriptions);
    // eslint-disable-next-line react-hooks/exhaustive-deps

    setVatTaxValue(Number(formattedTaxValue));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // recalculate total on subtotal and vatTaxValue updates
  useEffect(() => {
    if (vatTax) {
      setVatTaxValue(subtotal * (Number(taxPercent) / 100));
      setTotal(subtotal + vatTaxValue);
    } else {
      setTotal(subtotal);
    }
  }, [subtotal, taxPercent, vatTax, vatTaxValue, invoiceDescription]);

  //Define the form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      bill_to: '',
      po_number: '',
      invoice_no: 1000,
      contract_details: 'PROFESSIONAL SERVICES CONTRACT SCM-2022-CW1910659',
      note: '',
      invoice_date: new Date(),
      exchange_rate: 0,
      //   invoiceDescription: [{ details: '', amount: 0, quantity: 1 }],
    },
  });

  //   description builder
  const addDescription = () => {
    setInvoiceDescription((prevData) => [
      ...prevData,
      { details: '', amount: 0, quantity: 1 },
    ]);
  };

  // remove description
  const removeDescription = (index: number) => {
    setInvoiceDescription((prevData) => prevData.filter((_, i) => i !== index));
  };

  // Calculate subtotal
  const calculateSubtotal = (e: any) => {
    e.preventDefault();
    const newSubtotal = invoiceDescription.reduce((acc, item) => {
      // Ensure item.amount is a number
      const itemAmount = (item.amount && item.amount * item.quantity) || 0;
      return acc + itemAmount;
    }, 0);
    setSubtotal(newSubtotal);

    if (vatTax) {
      const newVatTaxValue = newSubtotal * (Number(taxPercent) / 100);
      setVatTaxValue(newVatTaxValue);
      setTotal(newSubtotal + vatTaxValue);
    } else {
      setTotal(newSubtotal);
    }
  };

  // form description items change
  const handleItemChange = (
    index: number,
    e: ChangeEvent<HTMLTextAreaElement> | ChangeEvent<HTMLInputElement>,
  ) => {
    const { name, value } = e.target;

    // remove trailing zeros for numeric fields
    let processedValue = value;

    if (name === 'amount' || name === 'quantity') {
      // Allow the value if it is a valid number or a number with a trailing decimal
      if (value === '' || value === '.' || /^[0-9]*\.?[0-9]*$/.test(value)) {
        processedValue = value;
      } else {
        // If not valid, set to '0' or handle according to your requirements
        processedValue = '0';
      }
    }

    const newItems = [...invoiceDescription];
    newItems[index] = { ...newItems[index], [name]: processedValue };

    setInvoiceDescription(newItems);
    // calculateSubtotal();
  };

  // handle tax amount change
  const handleTaxValueChange = (
    e: ChangeEvent<HTMLTextAreaElement> | ChangeEvent<HTMLInputElement>,
  ) => {
    const { value } = e.target;

    // remove trailing zeros for numeric fields
    let processedValue = value;

    // Allow the value if it is a valid number or a number with a trailing decimal
    if (value === '' || value === '.' || /^[0-9]*\.?[0-9]*$/.test(value)) {
      processedValue = value;
    } else {
      // If not valid, set to '0' or handle according to your requirements
      processedValue = '0';
    }

    setTaxPercent(processedValue);
  };

  //   Handle deleting tax information
  const handleDeleteTax = (
    e: MouseEvent<HTMLButtonElement, globalThis.MouseEvent>,
  ) => {
    e.preventDefault();

    setVatTax(false);
    setTaxDescription('');
    setTaxPercent(0);
    setVatTaxValue(0);
  };

  //   Handle form submission
  const {
    handleSubmit,
    formState: { errors },
  } = form;

  //    populate tax
  const populateTax = () => {
    if (taxDescription && taxPercent) {
      setVatTax(true);
      const value = subtotal * (Number(taxPercent) / 100);
      setVatTaxValue(value);
    }
    return;
  };

  //   handle signature image upload
  const handleSignatureUpload = async (event: { target: { files: any[] } }) => {
    const file = event.target.files[0];
    if (!file) return;

    const storageRef = ref(storage, `images/signatures/${file.name}`);
    await uploadBytes(storageRef, file);

    const downloadURL = await getDownloadURL(storageRef);

    setSignatureURL(downloadURL);
  };

  //   css override for react spinner
  const override: CSSProperties = {
    display: 'block',
    margin: '0 auto',
    borderColor: 'red',
  };

  // handle select value change
  const handleSelectChange = (value: string) => {
    setCurrency(value);
  };

  console.log(form.getValues());

  //   Submit handler for form
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    console.log('I am here');
    // set loading state
    setLoading(true);

    //extract data from values
    const {
      bill_to,
      invoice_date,
      invoice_no,
      po_number,
      title,
      note,
      contract_details,
      exchange_rate,
    } = values;

    // form data for database
    const formData = {
      bill_to,
      invoice_date,
      invoice_no,
      po_number,
      title,
      note,
      contract_details,
      subtotal,
      total,
      invoiceDescription,
      vatTax,
      taxPercent,
      vatTaxValue,
      signatureURL,
      taxDescription,
      currency,
      exchange_rate,
    };

    // make API call to firebase backend route
    try {
      const res = await fetch(`/api/firebase/update?id=${invoiceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      // Check for response status and parse JSON response
      if (!res.ok) {
        throw new Error('Failed to update invoice data');
      }

      // Parse the JSON response
      const data = await res.json();

      setLoading(false);

      console.log('data received', data);

      // Push to display page
      router.push(`/invoice/${invoiceId}`);
    } catch (err) {
      setLoading(false);

      console.error(err);
    }
  };

  return (
    <div>
      {/* form */}
      <div className="p-5 max-w-5xl mx-auto mt-10 ">
        <h2 className="ml-3 p-3 bg-red-100 w-full max-w-[200px] uppercase font-semibold leading-3 tracking-wider rounded-t-md">
          Update Invoice
        </h2>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="ml-3 p-8 bg-red-100 space-y-8"
          >
            {/* Bill and Logo */}
            <div className="flex items-center justify-between gap-3">
              <FormField
                control={form.control}
                name="bill_to"
                render={({ field }) => (
                  <FormItem className="w-full max-w-sm">
                    <FormLabel className="uppercase font-semibold">
                      Bill to:
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Cost center 2900PLE41D USD"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-red-500">
                      {errors.bill_to?.message}
                    </FormMessage>
                  </FormItem>
                )}
              />

              <div className="relative w-[100px] h-[100px]">
                <Image
                  src={PingLogo}
                  alt="Pingtel logo"
                  className="object-cover"
                  fill
                />
              </div>
            </div>

            {/* optional contract details */}
            <FormField
              control={form.control}
              name="contract_details"
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2 w-full">
                  <FormLabel className="uppercase font-semibold">
                    Contract Details:
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="(optional contract details)"
                      {...field}
                      className="w-full flex-1"
                      rows={2}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Title, instructions, purchase order no, invoice no and date */}
            <div className="flex items-center justify-between gap-3">
              {/* title and instructions*/}
              <div className="w-full flex flex-col gap-5">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem className="w-full max-w-lg">
                      <FormLabel className="uppercase font-semibold">
                        Title:
                      </FormLabel>
                      <FormControl>
                        <Textarea placeholder="Invoice Title" {...field} />
                      </FormControl>
                      <FormMessage className="text-red-500">
                        {errors.title?.message}
                      </FormMessage>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="note"
                  render={({ field }) => (
                    <FormItem className="w-full max-w-lg">
                      <FormLabel className="uppercase font-semibold">
                        Note:
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="(optional additional instructions)"
                          {...field}
                          className="w-full"
                          rows={2}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {/* invoice no and date */}
              <div className="flex flex-col items-center gap-5">
                {/* invoice no */}
                <FormField
                  control={form.control}
                  name="invoice_no"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="uppercase font-semibold">
                        Invoice #:
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="1000"
                          {...field}
                          className="w-[240px]"
                          onChange={(e) => {
                            setInvoiceNo(Number(e.target.value));
                            form.setValue('invoice_no', Number(e.target.value));
                          }}
                        />
                      </FormControl>
                      <FormMessage>{errors.invoice_no?.message}</FormMessage>
                    </FormItem>
                  )}
                />

                {/* date */}
                <FormField
                  control={form.control}
                  name="invoice_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="uppercase font-semibold">
                        Invoice Date:
                      </FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={'outline'}
                              className={cn(
                                'w-[240px] pl-3 text-left font-normal bg-gray-100',
                                !field.value && 'text-muted-foreground',
                              )}
                            >
                              {field.value ? (
                                format(field.value, 'PPP')
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-auto p-0 bg-gray-100"
                          align="start"
                        >
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date > new Date() || date < new Date('1900-01-01')
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </FormItem>
                  )}
                />

                {/* optional po number */}
                <FormField
                  control={form.control}
                  name="po_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="uppercase font-semibold">
                        Purchase Order #:
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="(optional)"
                          {...field}
                          className="w-[240px]"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* line break */}
            <div className="h-[2px] bg-gray-300" />

            {/* Invoice description */}
            <div>
              {/* currency switch and exchange rate */}
              <div className="flex items-center gap-5 ml-auto mb-8 w-[250px]">
                {/* currency selector */}
                <div className="flex flex-col gap-2 w-[100px]">
                  <h4 className="bg-gray-500 text-white p-1 text-xs font-semibold text-center">
                    Currency
                  </h4>
                  <Select
                    onValueChange={handleSelectChange}
                    defaultValue={currency}
                  >
                    <SelectTrigger className="w-[100px] border border-gray-500">
                      <SelectValue
                        placeholder="NGN"
                        className="font-semibold"
                      />
                    </SelectTrigger>
                    <SelectContent className="font-semibold">
                      <SelectItem
                        value="NGN"
                        className="cursor-pointer bg-gray-500 hover:bg-gray-200 "
                      >
                        NGN
                      </SelectItem>
                      <SelectItem
                        value="USD"
                        className="cursor-pointer bg-gray-500 hover:bg-gray-200 "
                      >
                        USD
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* exchange rate input */}
                <div className="w-[200px] flex flex-col gap2 space-x-2">
                  <FormField
                    control={form.control}
                    name="exchange_rate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="bg-gray-500 text-white p-1 text-xs font-semibold text-center">
                          Exchange Rate
                        </FormLabel>
                        <div className="flex items-center space-x-2">
                          <FormControl>
                            <Input
                              placeholder="0.0 (optional)"
                              {...field}
                              onChange={(e) => {
                                setExchangeRate(Number(e.target.value));
                                form.setValue(
                                  'exchange_rate',
                                  Number(e.target.value),
                                );
                              }}
                              className="w-[90px]"
                            />
                          </FormControl>
                          <p>/ $</p>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="flex items-center gap-8 mb-2 font-semibold">
                <h4 className="w-full max-w-sm">Description</h4>
                <h4 className="w-full max-w-[100px]">Amount</h4>
                <h4>Qty</h4>
              </div>

              <div className="space-y-5 mb-10">
                {invoiceDescription.map((item, index) => (
                  <div key={index} className="flex gap-8">
                    {/* description */}
                    <div className="w-full max-w-sm">
                      <Textarea
                        placeholder="Description"
                        required
                        value={item.details}
                        name="details"
                        onChange={(e) => handleItemChange(index, e)}
                      />
                      {/* {errors.invoiceDescription?.[index]?.details && (
                        <span className="text-red-500">
                          {errors.invoiceDescription[index].details?.message}
                        </span>
                      )} */}
                    </div>

                    {/* amount */}
                    <div className="max-w-[100px]">
                      <Input
                        placeholder="0.0"
                        required
                        value={item.amount || ''}
                        name="amount"
                        onChange={(e) => handleItemChange(index, e)}
                      />
                      {/* {errors.invoiceDescription?.[index]?.amount && (
                        <span className="text-red-500">
                          {errors.invoiceDescription[index].amount?.message}
                        </span>
                      )} */}
                    </div>

                    {/* quantity */}
                    <div>
                      <Input
                        placeholder="0"
                        required
                        value={item.quantity}
                        name="quantity"
                        className="max-w-28 text-center"
                        onChange={(e) => handleItemChange(index, e)}
                      />
                      {/* {errors.invoiceDescription?.[index]?.quantity && (
                        <span className="text-red-500">
                          {errors.invoiceDescription[index].quantity?.message}
                        </span>
                      )} */}
                    </div>

                    {/* remove Items */}
                    <Button
                      className="bg-red-400 rounded-full font-semibold uppercase hover:bg-opacity-50"
                      onClick={() => removeDescription(index)}
                    >
                      X
                    </Button>
                  </div>
                ))}
              </div>

              {/* Tax Information*/}
              {vatTaxValue !== 0 && (
                <div className="flex flex-col gap-2 w-full max-w-md mb-5">
                  <h4 className="font-semibold">Tax Details</h4>
                  <div className="flex items-center space-x-5 border border-gray-400 p-2">
                    <div className="flex items-center space-x-5 w-full max-w-sm text-wrap leading-3">
                      <p>{taxDescription}</p>
                      <p>%{taxPercent}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button className="bg-red-400 px-2 py-1 text-xs font-semibold hover:bg-opacity-50">
                            Update
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-blue-200">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-xl uppercase">
                              Update Tax
                            </AlertDialogTitle>
                          </AlertDialogHeader>
                          <AlertDialogDescription>
                            <span className="flex  gap-5">
                              <Textarea
                                placeholder="Tax Name"
                                value={taxDescription}
                                onChange={(e) =>
                                  setTaxDescription(e.target.value)
                                }
                              />
                              <span className="flex flex-col gap-1">
                                <p className="flex font-semibold">% Tax</p>
                                <Input
                                  placeholder="% tax"
                                  value={taxPercent}
                                  onChange={(e) => handleTaxValueChange(e)}
                                  className="w-24 text-center"
                                />
                              </span>
                            </span>
                          </AlertDialogDescription>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="border border-gray-600 hover:bg-red-300 font-semibold">
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-red-400 hover:bg-opacity-50 font-semibold"
                              onClick={() => populateTax()}
                            >
                              Update
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      <Button
                        className="bg-red-400 px-4 py-1 text-xs font-semibold rounded-full hover:bg-opacity-50"
                        onClick={(e) => {
                          handleDeleteTax(e);
                        }}
                      >
                        X
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Add tax and add new item buttons */}
              <div className="w-full flex items-center gap-3">
                {!vatTaxValue && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button className="w-full bg-red-400 capitalize font-semibold hover:bg-opacity-50">
                        Add Tax
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-blue-200">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl uppercase">
                          Add a Tax
                        </AlertDialogTitle>
                      </AlertDialogHeader>
                      <AlertDialogDescription>
                        <span className="flex  gap-5">
                          <Textarea
                            placeholder="Tax Name"
                            value={taxDescription}
                            onChange={(e) => setTaxDescription(e.target.value)}
                          />
                          <span className="flex flex-col gap-1">
                            <p className="flex font-semibold">% Tax</p>
                            <Input
                              placeholder="% tax"
                              value={taxPercent}
                              onChange={(e) => handleTaxValueChange(e)}
                              className="w-24 text-center"
                            />
                          </span>
                        </span>
                      </AlertDialogDescription>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="border border-gray-600 hover:bg-red-300 font-semibold">
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-red-400 hover:bg-opacity-50 font-semibold"
                          onClick={() => populateTax()}
                        >
                          Set Tax
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}

                <Button
                  className="w-full bg-red-400 capitalize font-semibold hover:bg-opacity-50"
                  onClick={() => {
                    addDescription();
                  }}
                >
                  + Add New Item
                </Button>
              </div>
            </div>

            {/* Invoice summary */}
            <div className="flex flex-col gap-5 w-full max-w-xl ml-auto border border-gray-400 p-5 rounded-md">
              {/* subtotal validation button */}
              <Button
                onClick={(e) => {
                  calculateSubtotal(e);
                }}
                className="bg-red-400 font-semibold w-[150px] rounded-md shadow-md ml-auto hover:bg-opacity-50"
              >
                Validate (=)
              </Button>
              {/* subtotal */}
              <div className="flex items-center justify-between text-lg tracking-wider font-semibold">
                <h4>Subtotal</h4>
                <p>
                  {currency === 'NGN' ? '₦' : '$'}
                  {numeral(subtotal).format('0,0.000')}
                </p>
              </div>

              {/* Vat section */}
              {vatTax && (
                <div className="flex items-center justify-between font-semibold tracking-wider">
                  <h5 className="text-sm">
                    {taxDescription} <span>{taxPercent}%</span>
                  </h5>
                  <p>
                    {currency === 'NGN' ? '₦' : '$'}
                    {numeral(vatTaxValue).format('0,0.000')}
                  </p>
                </div>
              )}

              {/* Total section */}
              <div className="flex items-center justify-between font-semibold tracking-wider">
                <div className="flex items-center space-x-3">
                  <h3>TOTAL</h3>
                  <p>{currency === 'NGN' ? 'NGN' : 'USD'}</p>
                </div>

                <h3>
                  {currency === 'NGN' ? '₦' : '$'}
                  {numeral(total).format('0,0.000')}
                </h3>
              </div>
            </div>

            {/* signature upload */}
            <section className="flex items-center gap-3 max-w-xs ml-auto mr-8">
              <Button
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('signatureInput')?.click();
                }}
                className="bg-red-400"
              >
                {signatureURL ? 'change Signature' : 'Insert Signature'}
              </Button>
              <input
                id="signatureInput"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleSignatureUpload(e)}
              />
              <div className="bg-gray-50 p-3 flex-1 h-auto">
                {/* display signature image */}
                <div>
                  {signatureURL ? (
                    <div className="relative w-[180px] h-[90px]">
                      <Image
                        src={signatureURL}
                        alt="user signature"
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <p>No signature uploaded</p>
                  )}
                </div>
              </div>
            </section>

            {/* Create Invoice Button */}
            <div className="flex items-center p-8">
              <Button
                type="submit"
                className="w-full max-w-md bg-red-400 text-2xl font-bold  tracking-wider mx-auto"
                disabled={!signatureURL}
              >
                Update Invoice{' '}
                <span className="ml-2">
                  <RingLoader
                    color={color}
                    loading={loading}
                    cssOverride={override}
                    size={30}
                    aria-label="Loading Spinner"
                    data-testid="loader"
                  />
                </span>
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
