function escapeLike(value) {
  if (value === null || value === undefined) return '';
  return String(value).replace(/[\\%_]/g, (char) => `\\${char}`);
}

module.exports = { escapeLike };