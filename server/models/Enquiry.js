import mongoose from 'mongoose';

const enquirySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Business email is required'],
      trim: true,
      lowercase: true,
      match: [
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        'Please provide a valid email address',
      ],
      maxlength: [120, 'Email cannot exceed 120 characters'],
    },
    company: {
      type: String,
      required: [true, 'Company or organization name is required'],
      trim: true,
      maxlength: [120, 'Company name cannot exceed 120 characters'],
    },
    teamSize: {
      type: String,
      enum: ['1-10', '11-50', '51-200', '201-1000', '1000+'],
      default: '1-10',
    },
    enquiryType: {
      type: String,
      required: [true, 'Enquiry type is required'],
      enum: [
        'Enterprise Deployment',
        'Custom AI & Security Requirements',
        'Volume Pricing & Licensing',
        'Technical Integration / API',
        'Other',
      ],
      default: 'Enterprise Deployment',
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
      minlength: [10, 'Message must be at least 10 characters long'],
      maxlength: [2000, 'Message cannot exceed 2000 characters'],
    },
    ipAddress: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ['new', 'contacted', 'resolved'],
      default: 'new',
    },
  },
  {
    timestamps: true,
  }
);

// Index for sorting queries by creation date
enquirySchema.index({ createdAt: -1 });

export default mongoose.models.Enquiry || mongoose.model('Enquiry', enquirySchema);
