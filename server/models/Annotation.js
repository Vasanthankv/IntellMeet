import mongoose from 'mongoose';

const annotationSchema = new mongoose.Schema(
  {
    annotationId: {
      type: String,
      required: true,
      index: true,
    },
    meetingId: {
      type: String,
      required: true,
      index: true,
    },
    shareSessionId: {
      type: String,
      default: 'current',
    },
    userId: {
      type: String,
      required: true,
    },
    userName: {
      type: String,
      default: 'Participant',
    },
    userRole: {
      type: String,
      enum: ['host', 'co-host', 'presenter', 'participant'],
      default: 'participant',
    },
    type: {
      type: String,
      enum: [
        'DRAW',
        'HIGHLIGHT',
        'TEXT',
        'ARROW',
        'RECTANGLE',
        'CIRCLE',
        'LINE',
        'STAMP',
        'SPOTLIGHT',
        'VANISHING',
      ],
      default: 'DRAW',
    },
    points: [
      {
        x: Number,
        y: Number,
      },
    ],
    position: {
      x: Number,
      y: Number,
    },
    dimensions: {
      width: Number,
      height: Number,
    },
    text: {
      type: String,
      default: '',
    },
    stampType: {
      type: String,
      default: '',
    },
    color: {
      type: String,
      default: '#EF4444',
    },
    lineWidth: {
      type: Number,
      default: 3,
    },
    fontSize: {
      type: Number,
      default: 16,
    },
    isVanishing: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Annotation', annotationSchema);
