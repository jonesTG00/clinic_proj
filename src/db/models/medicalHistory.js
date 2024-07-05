const MONGOOSE = require("mongoose");

const requiredMessage = [true, "Must provide complete information"];

const medicalHistorySchema = new MONGOOSE.Schema({
  studentId: {
    type: Number,
    required: requiredMessage,
    unique: true,
  },
  familyMedicalHistory: {
    asthma: {
      type: Boolean,
      required: requiredMessage,
    },
    diabetes: {
      type1: {
        type: Boolean,
        required: requiredMessage,
      },
      type2: {
        type: Boolean,
        required: requiredMessage,
      },
    },
    mental: {
      depression: {
        type: Boolean,
        required: requiredMessage,
      },
      anxiety: {
        type: Boolean,
        required: requiredMessage,
      },
      bipolar: {
        type: Boolean,
        required: requiredMessage,
      },
    },
    heartDisease: {
      type: Boolean,
      required: requiredMessage,
    },
    STDs: {
      type: Boolean,
      required: requiredMessage,
    },
    allergies: { type: [String] },
  },
  personalMedicalHistory: {
    asthma: {
      type: Boolean,
      required: requiredMessage,
    },
    diabetes: {
      type1: {
        type: Boolean,
        required: requiredMessage,
      },
      type2: {
        type: Boolean,
        required: requiredMessage,
      },
    },
    mental: {
      depression: {
        type: Boolean,
        required: requiredMessage,
      },
      anxiety: {
        type: Boolean,
        required: requiredMessage,
      },
      bipolar: {
        type: Boolean,
        required: requiredMessage,
      },
    },
    heartDisease: {
      type: Boolean,
      required: requiredMessage,
    },
    STDs: {
      type: Boolean,
      required: requiredMessage,
    },
    smoker: {
      type: Boolean,
      required: requiredMessage,
    },
    alcohol: {
      type: Boolean,
      required: requiredMessage,
    },
    allergies: { type: [String] },
  },
  hospitalization: [
    {
      hospital: {
        type: String,
        required: requiredMessage,
        maxLength: 50,
      },
      reason: {
        type: String,
        required: requiredMessage,
        maxLength: 150,
      },
      doctor: {
        type: String,
        required: requiredMessage,
        maxLength: 50,
      },
      yearStarted: {
        type: Number,
        required: requiredMessage,
      },
      yearEnded: {
        type: Number,
        required: requiredMessage,
      },
    },
  ],
  operation: [
    {
      hospital: {
        type: String,
        required: requiredMessage,
        maxLength: 50,
      },
      reason: {
        type: String,
        required: requiredMessage,
        maxLength: 150,
      },
      doctor: {
        type: String,
        required: requiredMessage,
        maxLength: 50,
      },
      year: {
        type: Number,
        required: requiredMessage,
      },
    },
  ],
  trauma: [
    {
      trauma: {
        type: String,
        required: requiredMessage,
        maxLength: 50,
      },
      doctor: {
        type: String,
        required: requiredMessage,
        maxLength: 50,
      },
      year: {
        type: Number,
        required: requiredMessage,
      },
    },
  ],
  vitalSigns: {
    weight: {
      type: Number,
      required: requiredMessage,
    },
    height: {
      type: Number,
      required: requiredMessage,
    },
    bloodtype: {
      type: String,
      required: requiredMessage,
    },
  },
});

module.exports = MONGOOSE.model("medicalHistory", medicalHistorySchema);
