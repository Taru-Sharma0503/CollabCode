/**
 * Mongoose schema transform plugin to normalize _id to id and remove __v
 */
function normalizeIdPlugin(schema) {
  const transform = (doc, ret) => {
    if (ret._id) {
      ret.id = ret._id.toString();
      delete ret._id;
    }
    delete ret.__v;
    return ret;
  };

  schema.set('toJSON', {
    virtuals: true,
    transform
  });

  schema.set('toObject', {
    virtuals: true,
    transform
  });
}

function normalizeDoc(doc) {
  if (!doc) return null;
  const obj = typeof doc.toObject === 'function' ? doc.toObject() : { ...doc };
  if (obj._id) {
    obj.id = obj._id.toString();
    delete obj._id;
  }
  delete obj.__v;
  return obj;
}

module.exports = {
  normalizeIdPlugin,
  normalizeDoc
};
