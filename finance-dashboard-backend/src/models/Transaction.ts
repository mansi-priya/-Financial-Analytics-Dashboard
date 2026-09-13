import mongoose, { Document, Schema } from 'mongoose';
 
export interface ITransaction extends Document {
  date: Date;
  amount: number;
  type: 'revenue' | 'expense';
  category: string;
  status: 'completed' | 'pending' | 'failed';
  user: string;
  description: string;
}
 
const TransactionSchema: Schema = new Schema(
  {
    date: { type: Date, required: true },
    amount: { type: Number, required: true },
    type: { type: String, enum: ['revenue', 'expense'], required: true },
    category: {
      type: String,
      required: true,
      enum: [
        'Sales',
        'Marketing',
        'Utilities',
        'Salaries',
        'Rent',
        'Software',
        'Travel',
        'Consulting',
        'Other',
      ],
    },
    status: {
      type: String,
      enum: ['completed', 'pending', 'failed'],
      default: 'completed',
    },
    user: { type: String, required: true },
    description: { type: String, default: '' },
  },
  { timestamps: true }
);
 
// Indexes for fast filtering/sorting/searching
TransactionSchema.index({ date: 1 });
TransactionSchema.index({ category: 1 });
TransactionSchema.index({ status: 1 });
TransactionSchema.index({ user: 1 });
TransactionSchema.index({ amount: 1 });
TransactionSchema.index({ description: 'text' });
 
export default mongoose.model<ITransaction>('Transaction', TransactionSchema);
 