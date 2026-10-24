const { z } = require("zod");
const { GraphQLError } = require("graphql");
const { offerInput } = require("./offerSchema");

// Argument rules for every resolver that takes input. Each resolver gets its arguments only after they
// pass (trimmed where noted); otherwise the request fails with BAD_USER_INPUT and a readable message.
// Rules for new accounts and new passwords only apply when they're created, so existing users can always
// log in (CLAUDE.md rule 4).

const id = (name) => z.string().regex(/^[a-f\d]{24}$/i, `${name} isn't a valid id`);
const optionalId = (name) => id(name).nullish();
const text = (name, max = 100) => z.string().trim().max(max, `${name} is too long (max ${max} characters)`);
const RATING_RULE = "Rating must be between 0.5 and 5 in half steps";
const rating = z
  .number()
  .min(0.5, RATING_RULE)
  .max(5, RATING_RULE)
  .refine((n) => Number.isInteger(n * 2), RATING_RULE);
const flavors = z.array(text("A flavor", 50)).max(20, "Too many flavors").nullish();
// bcrypt only uses the first 72 bytes of a password
const loginPassword = z.string().min(1, "Enter your password").max(200, "That password is too long");
const newPassword = z
  .string()
  .min(8, "Passwords need at least 8 characters")
  .refine((p) => Buffer.byteLength(p) <= 72, "Passwords can be at most 72 characters");
const lookupEmail = text("Email", 254).pipe(z.string().min(1, "Enter your email"));
const newEmail = lookupEmail.pipe(z.email("That doesn't look like an email address"));
const token = z.string().min(1, "Missing token").max(200, "That link isn't valid");
// "start-end", e.g. "1-20": which slice of a user's ratings/reviews to show
const numRange = z
  .string()
  .regex(/^\d{1,6}-\d{1,6}$/, "Range must look like 1-20")
  .refine((r) => {
    const [start, end] = r.split("-").map(Number);
    // The profile page links to "1-<all of them>", and "1-0" when there are none
    return start >= 1 && end >= start - 1 && end - start < 5000;
  }, "That range isn't valid");

const args = (shape) => z.looseObject(shape);

// A product as admins enter it (P2-2). Brand and flavor values are slugs ("la-croix", "blood-orange"); they're
// checked against the brands/flavors collections once those exist (P2-4b).
const slug = (name) =>
  z
    .string()
    .trim()
    .toLowerCase()
    .min(1, `${name} is required`)
    .max(60)
    .regex(/^[a-z0-9&'.]+(-[a-z0-9&'.]+)*$/, `${name} must be lowercase words joined by dashes`);
const productInput = z.object({
  productName: z.string().trim().min(1, "Name is required").max(100),
  brandName: slug("Brand"),
  flavor: z.array(slug("Flavor")).min(1, "Pick at least one flavor").max(10),
  isCaffeinated: z.boolean().default(false),
  hasCBD: z.boolean().default(false),
  tags: z.array(z.string().trim().toLowerCase().min(1).max(40)).max(20).default([]),
});

const RULES = {
  Query: {
    search: args({
      q: text("Search").nullish(),
      flavor: flavors,
      brand: text("Brand", 60).nullish(),
      caffeine: z.boolean().nullish(),
      cbd: z.boolean().nullish(),
      page: z.number().int().min(1, "Pages start at 1").max(1000).nullish(),
      pageSize: z.number().int().min(1).max(50, "At most 50 results per page").nullish(),
      includeArchived: z.boolean().nullish(),
    }),
    user: args({ userId: id("userId") }),
    usersRatings: args({ userId: id("userId"), numRange }),
    usersReviews: args({ userId: id("userId"), numRange }),
    simpleRatings: args({ userId: id("userId") }),
    bubblyWater: args({ bubblyWaterId: optionalId("bubblyWaterId") }),
    rating: args({ ratingId: optionalId("ratingId") }),
    flavors: args({ flavor: flavors }),
    brand: args({ brandName: text("Brand").nullish() }),
    searchUsers: args({ username: text("Username").nullish() }),
    queryUserRatingsOfGivenNumber: args({ userId: id("userId"), rating: rating.nullish() }),
    adminOffers: args({ bubblyWaterId: id("bubblyWaterId") }),
    adminEdits: args({ targetId: optionalId("targetId"), limit: z.number().int().min(1).max(200).nullish() }),
    myRatings: args({ bubblyWaterIds: z.array(id("bubblyWaterId")).max(100, "At most 100 products at a time") }),
  },
  Mutation: {
    addUser: args({
      username: z
        .string()
        .trim()
        .min(3, "Usernames need at least 3 characters")
        .max(30, "Usernames can be at most 30 characters")
        .regex(/^[A-Za-z0-9_.-]+$/, "Usernames can only use letters, numbers, dots, dashes and underscores"),
      email: newEmail,
      password: newPassword,
      website: z.string().max(200).nullish(),
      turnstileToken: z.string().max(2048).nullish(),
    }),
    removeUser: args({ userId: id("userId") }),
    editUserColor: args({
      userId: id("userId"),
      color: z.string().regex(/^user-[a-z]{2,12}$/, "That color isn't available").nullish(),
    }),
    login: args({ email: lookupEmail, password: loginPassword }),
    addRating: args({ bubblyWaterId: id("bubblyWaterId"), userId: optionalId("userId"), rating }),
    editRating: args({ ratingId: id("ratingId"), rating, bubblyWaterId: optionalId("bubblyWaterId") }),
    removeRating: args({ ratingId: id("ratingId") }),
    addReview: args({
      bubblyWaterId: id("bubblyWaterId"),
      userId: optionalId("userId"),
      reviewText: text("Your review", 500).pipe(z.string().min(1, "Write something first")),
    }),
    editReview: args({
      reviewId: id("reviewId"),
      reviewText: text("Your review", 500).pipe(z.string().min(1, "Write something first")),
    }),
    removeReview: args({ reviewId: id("reviewId") }),
    verifyEmail: args({ token, userId: id("userId") }),
    forgotPassword: args({ email: lookupEmail }),
    resendEmailVerification: args({ email: lookupEmail }),
    resetPassword: args({ token, email: lookupEmail, newPassword }),
    addOffer: args({ bubblyWaterId: id("bubblyWaterId"), offer: offerInput }),
    editOffer: args({ bubblyWaterId: id("bubblyWaterId"), offerId: id("offerId"), offer: offerInput }),
    setOfferActive: args({ bubblyWaterId: id("bubblyWaterId"), offerId: id("offerId"), active: z.boolean() }),
    createProduct: args({ product: productInput }),
    updateProduct: args({ bubblyWaterId: id("bubblyWaterId"), product: productInput }),
    bulkEditProducts: args({
      bubblyWaterIds: z.array(id("bubblyWaterId")).min(1, "Select at least one product").max(100),
      addFlavors: z.array(slug("Flavor")).max(10).nullish(),
      removeFlavors: z.array(slug("Flavor")).max(10).nullish(),
      addTags: z.array(z.string().trim().toLowerCase().min(1).max(40)).max(20).nullish(),
      removeTags: z.array(z.string().trim().toLowerCase().min(1).max(40)).max(20).nullish(),
    }),
    archiveProduct: args({ bubblyWaterId: id("bubblyWaterId") }),
    restoreProduct: args({ bubblyWaterId: id("bubblyWaterId") }),
    addLikeToReview: args({ userId: optionalId("userId"), reviewId: id("reviewId") }),
    removeLikeFromReview: args({ userId: optionalId("userId"), reviewId: id("reviewId") }),
  },
};

const badInput = (issue) =>
  new GraphQLError(issue.message, {
    extensions: { code: "BAD_USER_INPUT", field: issue.path.join(".") || undefined },
  });

// Returns a copy of the resolver map where each listed resolver validates its arguments first
const withValidation = (resolvers, rules = RULES) => {
  const wrapped = { ...resolvers };
  for (const [type, fields] of Object.entries(rules)) {
    wrapped[type] = { ...resolvers[type] };
    for (const [field, schema] of Object.entries(fields)) {
      const resolve = resolvers[type][field];
      if (!resolve) throw new Error(`Validation rule for missing resolver ${type}.${field}`);
      wrapped[type][field] = (parent, input, context, info) => {
        const result = schema.safeParse(input);
        if (!result.success) throw badInput(result.error.issues[0]);
        return resolve(parent, result.data, context, info);
      };
    }
  }
  return wrapped;
};

module.exports = { withValidation, RULES };
