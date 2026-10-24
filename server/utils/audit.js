const { AdminEdit } = require("../models");

// Records an admin change (P2-1). Call after the change succeeds, from resolvers that already passed
// requireAdmin. `before`/`after` are plain snapshots of the changed record (or part of it).
const plain = (value) => (value && typeof value.toObject === "function" ? value.toObject() : value ?? null);

const recordAdminEdit = (context, { action, targetType, targetId, before = null, after = null }) =>
  AdminEdit.create({ admin: context.user._id, action, targetType, targetId, before: plain(before), after: plain(after) });

module.exports = { recordAdminEdit };
