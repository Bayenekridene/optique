const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },

    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true
        },

        quantite: {
          type: Number,
          required: true,
          default: 1,
          min: 1,
          max: 100
        }
      }
    ]
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Cart', cartSchema);