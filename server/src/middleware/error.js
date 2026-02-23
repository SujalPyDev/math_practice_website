export const notFoundHandler = (req, res) => {
  res.status(404).json({ error: 'Route not found.' });
};

export const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'Origin is not allowed by CORS.' });
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation error.',
      details: Object.values(err.errors || {}).map((item) => item.message),
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ error: 'Invalid identifier.' });
  }

  console.error(err);
  return res.status(500).json({ error: 'Internal server error.' });
};
