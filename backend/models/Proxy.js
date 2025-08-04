import mongoose from 'mongoose';

const proxySchema = new mongoose.Schema({
  host: {
    type: String,
    required: [true, 'Host is required'],
    trim: true
  },
  port: {
    type: Number,
    required: [true, 'Port is required'],
    min: [1, 'Port must be at least 1'],
    max: [65535, 'Port cannot exceed 65535']
  },
  username: {
    type: String,
    default: null,
    trim: true
  },
  password: {
    type: String,
    default: null,
    trim: true
  },
  protocol: {
    type: String,
    enum: ['http', 'https', 'socks4', 'socks5'],
    default: 'http'
  },
  country: {
    type: String,
    default: 'Unknown',
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastUsed: {
    type: Date,
    default: null
  },
  successCount: {
    type: Number,
    default: 0
  },
  failCount: {
    type: Number,
    default: 0
  },
  successRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  responseTime: {
    type: Number,
    default: 0 // in milliseconds
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Method to get proxy URL
proxySchema.methods.getProxyUrl = function() {
  if (this.username && this.password) {
    return `${this.protocol}://${this.username}:${this.password}@${this.host}:${this.port}`;
  }
  return `${this.protocol}://${this.host}:${this.port}`;
};

// Method to get proxy object for axios
proxySchema.methods.getProxyObject = function() {
  const proxyConfig = {
    host: this.host,
    port: this.port,
    protocol: this.protocol
  };

  if (this.username && this.password) {
    proxyConfig.auth = {
      username: this.username,
      password: this.password
    };
  }

  return proxyConfig;
};

// Method to update success rate
proxySchema.methods.updateSuccessRate = function() {
  const total = this.successCount + this.failCount;
  this.successRate = total > 0 ? Math.round((this.successCount / total) * 100) : 0;
  return this.successRate;
};

// Index for better query performance
proxySchema.index({ isActive: 1, successRate: -1 });
proxySchema.index({ lastUsed: 1 });
proxySchema.index({ country: 1 });

const Proxy = mongoose.model('Proxy', proxySchema);

export default Proxy; 