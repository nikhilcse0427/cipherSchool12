import mongoose from 'mongoose';

const attemptSchema = new mongoose.Schema(
  {
    assignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assignment',
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    query: {
      type: String,
      required: true
    },
    result: {
      success: Boolean,
      error: String,
      columns: [String],
      rows: [mongoose.Schema.Types.Mixed],
      rowCount: Number
    },
    isCorrect: {
      type: Boolean,
      default: false
    }
  },
  {timestamps: true}
);
export const Attempt = mongoose.model('Attempt', attemptSchema);

