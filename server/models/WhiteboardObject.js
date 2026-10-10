import mongoose from 'mongoose';

const PointSchema = new mongoose.Schema({
  x: { type: Number, required: true },
  y: { type: Number, required: true }
}, { _id: false });

const WhiteboardObjectSchema = new mongoose.Schema({
  objectId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  whiteboardId: {
    type: String,
    required: true,
    index: true,
  },
  pageNumber: {
    type: Number,
    default: 1,
    index: true,
  },
  type: {
    type: String,
    required: true,
    enum: ['TEXT', 'SHAPE', 'DRAWING', 'STICKY_NOTE', 'CONNECTOR', 'IMAGE'],
  },
  content: {
    type: String,
    default: '',
  },
  position: {
    x: { type: Number, default: 100 },
    y: { type: Number, default: 100 },
  },
  size: {
    width: { type: Number, default: 180 },
    height: { type: Number, default: 140 },
  },
  rotation: {
    type: Number,
    default: 0,
  },
  points: [PointSchema], // Freehand drawing strokes
  style: {
    color: { type: String, default: '#FFFFFF' },
    fill: { type: String, default: 'transparent' },
    strokeWidth: { type: Number, default: 3 },
    fontSize: { type: Number, default: 16 },
    shapeType: { 
      type: String, 
      enum: ['RECTANGLE', 'CIRCLE', 'TRIANGLE', 'DIAMOND', 'STAR', 'LINE', 'ARROW'],
      default: 'RECTANGLE' 
    },
    stickyColor: { 
      type: String, 
      enum: ['yellow', 'blue', 'green', 'pink', 'purple', 'orange'],
      default: 'yellow' 
    },
    isPrivate: { type: Boolean, default: false } // Private Brainstorming mode (17.6)
  },
  connectorData: {
    fromObjectId: { type: String },
    toObjectId: { type: String },
    label: { type: String, default: '' },
    arrowStart: { type: Boolean, default: false },
    arrowEnd: { type: Boolean, default: true },
    startPoint: PointSchema,
    endPoint: PointSchema
  },
  createdBy: {
    userId: { type: String, default: 'anonymous' },
    userName: { type: String, default: 'Participant' },
  },
  zIndex: {
    type: Number,
    default: 1,
  },
  isDeleted: {
    type: Boolean,
    default: false,
    index: true,
  }
}, {
  timestamps: true,
});

export default mongoose.model('WhiteboardObject', WhiteboardObjectSchema);
