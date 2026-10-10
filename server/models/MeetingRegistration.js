import mongoose from 'mongoose';

const meetingRegistrationSchema = new mongoose.Schema(
  {
    registrationId: {
      type: String,
      required: true,
      unique: true,
    },
    meetingId: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    organization: {
      type: String,
      default: '',
    },
    customAnswers: [
      {
        question: String,
        answer: String,
      }
    ],
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Approved',
    },
    registeredAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const MeetingRegistration = mongoose.models.MeetingRegistration || mongoose.model('MeetingRegistration', meetingRegistrationSchema);

export default MeetingRegistration;
