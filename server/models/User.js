const { Schema, model } = require("mongoose");
const bcrypt = require("bcrypt");

//Schema for user model
const userSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    match: [/.+@.+\..+/, "Must match an email address!"],
  },
  password: {
    type: String,
    required: true,
    minlength: 5,
  },
  color: {
    type: String,
  },
  ratings: [
    {
      type: Schema.Types.ObjectId,
      ref: "Rating",
    },
  ],
  reviews: [
    {
      type: Schema.Types.ObjectId,
      ref: "Review",
    },
  ],
  likedReviews: [
    {
      type: Schema.Types.ObjectId,
      ref: "Review",
    },
  ],
  isVerified: {
    type: Boolean,
    default: false,
  },
  emailVerificationToken: String,
  passwordResetToken: String,
  passwordResetExpires: Date,
});

// bcrypt cost for new hashes. Older hashes (cost 10) stay valid and are upgraded on the next successful
// login (upgradePasswordHash), so nobody has to reset their password.
const PASSWORD_COST = 12;

// set up pre-save middleware to create password
userSchema.pre("save", async function (next) {
  if (this.isNew || this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, PASSWORD_COST);
  }

  next();
});

// compare the incoming password with the hashed password
userSchema.methods.isCorrectPassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

// Call after a successful login with the password that was just checked: rehashes at PASSWORD_COST if the
// stored hash is weaker. Writes only the hash (no other validation), and a failure never blocks the login.
userSchema.methods.upgradePasswordHash = async function (password) {
  try {
    if (bcrypt.getRounds(this.password) >= PASSWORD_COST) return false;
    const hash = await bcrypt.hash(password, PASSWORD_COST);
    await this.constructor.updateOne({ _id: this._id }, { $set: { password: hash } });
    this.password = hash;
    return true;
  } catch (error) {
    console.error("Couldn't upgrade password hash:", error.message);
    return false;
  }
};

userSchema.statics.PASSWORD_COST = PASSWORD_COST;

//Initialize user model
const User = model("User", userSchema);

module.exports = User;
