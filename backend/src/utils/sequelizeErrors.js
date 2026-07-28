function rethrowFriendlyForeignKeyError(err, message) {
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    const friendly = new Error(message);
    friendly.status = 409;
    friendly.expose = true;
    throw friendly;
  }
  throw err;
}

module.exports = { rethrowFriendlyForeignKeyError };