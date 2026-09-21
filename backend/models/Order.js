const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    // =========================
    // CLIENT
    // =========================
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },

    customerEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },

    // =========================
    // PRODUITS COMMANDÉS
    // =========================
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true
        },

        name: {
          type: String,
          required: true
        },

        price: {
          type: Number,
          required: true
        },

        quantity: {
          type: Number,
          required: true,
          min: 1
        },

        image: {
          type: String,
          default: ''
        }
      }
    ],

    // =========================
    // MONTANTS
    // =========================
    subtotal: {
      type: Number,
      required: true
    },

    shipping: {
      type: Number,
      required: true,
      default: 0
    },

    total: {
      type: Number,
      required: true
    },

    // =========================
    // STRIPE
    // =========================
    stripeSessionId: {
      type: String,
      required: true,
      unique: true
    },

    paymentStatus: {
      type: String,
      enum: [
        'paid',
        'pending',
        'failed'
      ],
      default: 'pending'
    },

    // =========================
    // DATE
    // =========================
    createdAt: {
      type: Date,
      default: Date.now
    }
  }
);

module.exports = mongoose.model(
  'Order',
  orderSchema
);