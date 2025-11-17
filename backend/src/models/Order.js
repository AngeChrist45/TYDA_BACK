const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    negotiatedPrice: {
      type: Number
    },
    negotiationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Negotiation'
    }
  }],
  totals: {
    subtotal: { type: Number, required: true },
    shipping: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true }
  },
  shippingAddress: {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    phone: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    region: { type: String, required: true },
    country: { type: String, default: "Côte d'Ivoire" },
    postalCode: { type: String }
  },
  status: {
    type: String,
    enum: ['en_attente', 'confirme', 'prepare', 'expedie', 'livre', 'annule'],
    default: 'en_attente'
  },
  paymentMethod: {
    type: String,
    enum: ['mobile_money', 'card', 'bank_transfer', 'cash_on_delivery'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['en_attente', 'paye', 'echec', 'rembourse'],
    default: 'en_attente'
  },
  paymentDetails: {
    transactionId: { type: String },
    paymentDate: { type: Date },
    amount: { type: Number },
    currency: { type: String, default: 'XOF' }
  },
  trackingNumber: { type: String },
  notes: { type: String },
  statusHistory: [{
    status: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    note: { type: String },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

orderSchema.virtual('itemCount').get(function() {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

module.exports = mongoose.model('Order', orderSchema);
