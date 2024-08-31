import { nullable, z } from 'zod';

export const formSchema = z.object({
  bill_to: z.string().min(1, { message: 'Bill address is required' }),
  title: z.string().min(1, { message: 'Title is required' }),
  po_number: z.string().optional(),
  invoice_no: z.number().min(1, { message: 'Invoice number is required' }),
  invoice_date: z.date(),
  contract_details: z.string().optional(),
  note: z.string().optional(),
  exchange_rate: z.number().optional(),
  //   invoiceDescription: z.array(
  //     z.object({
  //       details: z.string().min(1, { message: 'Description is required' }),
  //       amount: z
  //         .number()
  //         .min(0, 'Amount must be a non-negative number')
  //         .nullable(),
  //       quantity: z.number().min(1, 'Quantity must be at least 1'),
  //     }),
  //   ),
});
