import mongoose from 'mongoose';

const assignmentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true
    },
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard'],
      required: true
    },
    question: {
      type: String,
      required: true
    },
    expectedColumns: {
      type: [String],
      default: []
    },
    sampleData: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    }
  },
  {
    timestamps: true
  }
);

export const Assignment = mongoose.model('Assignment', assignmentSchema);

