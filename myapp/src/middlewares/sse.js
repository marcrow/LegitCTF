// Stocker les connexions SSE
let connections = [];

const sseMiddleware = function (req, res, next) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Ajouter cette connexion à la liste
  connections.push(res);

  // Nettoyer lors de la fermeture de la connexion
  req.on('close', () => {
    connections = connections.filter(conn => conn !== res);
  });

  next();
};

module.exports = {sseMiddleware, connections};