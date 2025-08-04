import mongoose from 'mongoose';

const amazonRegionalCookieSchema = new mongoose.Schema({
  user_id: {
    type: String,
    required: true,
    index: true
  },
  cookie: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the timestamp when document is updated
amazonRegionalCookieSchema.pre('updateOne', function() {
  this.set({ updatedAt: new Date() });
});

const AmazonRegionalCookie = mongoose.model('AmazonRegionalCookie', amazonRegionalCookieSchema);

export default AmazonRegionalCookie;