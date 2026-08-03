function buildOrder(sortBy, sortDir, allowedFields, fallbackField) {
  const field = allowedFields.includes(sortBy) ? sortBy : fallbackField;
  const dir = String(sortDir).toLowerCase() === 'asc' ? 'ASC' : 'DESC';
  return [[field, dir]];
}

module.exports = { buildOrder };
